import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { S3 } from 'https://deno.land/x/s3@0.5.0/mod.ts';

const TARGET_BUCKET = 'cdn.y3c.kr';
const TARGET_DIR = '/tongkidari/edited-contents/';
const TARGET_REGION = 'ap-northeast-2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UploadRequest {
  resource_id: string;
  base64: string;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { resource_id, base64 }: UploadRequest = await req.json();

    if (!resource_id || !base64) {
      throw new Error('resource_id and base64 are required');
    }

    // AWS 자격 증명 확인
    const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials not configured');
    }

    // S3 클라이언트 생성
    const s3Client = new S3Client({
      region: TARGET_REGION,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // base64 데이터에서 prefix 제거 (data:image/png;base64, 부분)
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;

    // base64를 Buffer로 변환
    const buffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    // S3 업로드 파라미터
    const key = `${TARGET_DIR.replace(/^\//, '')}${resource_id}.png`;

    const command = new PutObjectCommand({
      Bucket: TARGET_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'image/png',
      ContentEncoding: 'base64',
    });

    // S3에 업로드
    await s3Client.send(command);

    const s3Url = `https://${TARGET_BUCKET}.s3.${TARGET_REGION}.amazonaws.com/${key}`;

    return new Response(
      JSON.stringify({
        success: true,
        url: s3Url,
        key,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
