import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { S3 } from 'https://deno.land/x/s3@0.5.0/mod.ts';

const TARGET_BUCKET = 'cdn.y3c.kr';
const TARGET_DIR = '/tongkidari/edited-contents/';
const TARGET_REGION = 'ap-northeast-2';
const CLOUDFRONT_DISTRIBUTION_ID = 'E124HBPNT0RV9V';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UploadRequest {
  resource_id: string;
  base64: string;
}

// CloudFront Invalidation 함수
async function createCloudFrontInvalidation(
  accessKeyId: string,
  secretAccessKey: string,
  objectKey: string,
): Promise<void> {
  const callerReference = `invalidation-${Date.now()}`;
  // URL encode the path for CloudFront
  const path = `/${encodeURI(objectKey)}`;

  // AWS Signature V4 생성
  const service = 'cloudfront';
  const host = 'cloudfront.amazonaws.com';
  const endpoint = `https://${host}/2020-05-31/distribution/${CLOUDFRONT_DISTRIBUTION_ID}/invalidation`;

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<InvalidationBatch>
  <Paths>
    <Quantity>1</Quantity>
    <Items>
      <Path>${path}</Path>
    </Items>
  </Paths>
  <CallerReference>${callerReference}</CallerReference>
</InvalidationBatch>`;

  const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = timestamp.slice(0, 8);

  // SHA256 해시 함수
  const encoder = new TextEncoder();
  async function sha256(message: string): Promise<ArrayBuffer> {
    return await crypto.subtle.digest('SHA-256', encoder.encode(message));
  }

  async function hmac(key: ArrayBuffer | Uint8Array, message: string): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    return await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  }

  function hexEncode(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Request body hash
  const payloadHash = hexEncode(await sha256(body));

  // Canonical request
  const canonicalRequest = [
    'POST',
    `/2020-05-31/distribution/${CLOUDFRONT_DISTRIBUTION_ID}/invalidation`,
    '',
    `host:${host}`,
    `x-amz-date:${timestamp}`,
    '',
    'host;x-amz-date',
    payloadHash,
  ].join('\n');

  // String to sign
  const credentialScope = `${dateStamp}/us-east-1/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    timestamp,
    credentialScope,
    hexEncode(await sha256(canonicalRequest)),
  ].join('\n');

  // Signing key
  const kDate = await hmac(encoder.encode(`AWS4${secretAccessKey}`), dateStamp);
  const kRegion = await hmac(kDate, 'us-east-1');
  const kService = await hmac(kRegion, service);
  const kSigning = await hmac(kService, 'aws4_request');

  // Signature
  const signature = hexEncode(await hmac(kSigning, stringToSign));

  // Authorization header
  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=host;x-amz-date, Signature=${signature}`;

  // CloudFront Invalidation 요청
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Host': host,
      'X-Amz-Date': timestamp,
      'Authorization': authorizationHeader,
      'Content-Type': 'application/xml',
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`CloudFront invalidation failed: ${response.status} - ${errorText}`);
  }

  console.log(`CloudFront cache invalidated for: ${path}`);
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
    const s3Client = new S3({
      accessKeyID: accessKeyId,
      secretKey: secretAccessKey,
      region: TARGET_REGION,
    });

    // base64 데이터에서 prefix 제거 (data:image/png;base64, 부분)
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;

    // base64를 Buffer로 변환
    const buffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    // S3 업로드 파라미터
    const key = `${TARGET_DIR.replace(/^\//, '')}${resource_id}.png`;

    // S3 버킷 가져오기
    const bucket = s3Client.getBucket(TARGET_BUCKET);

    // S3에 업로드
    let s3Url: string;
    try {
      await bucket.putObject(key, buffer, {
        contentType: 'image/png',
      });
      s3Url = `https://${TARGET_BUCKET}.s3.${TARGET_REGION}.amazonaws.com/${key}`;
    } catch (s3Error) {
      console.error('S3 upload failed:', s3Error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'S3 업로드 실패',
          details: s3Error instanceof Error ? s3Error.message : 'Unknown S3 error',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      );
    }

    // CloudFront Cache Invalidation
    try {
      await createCloudFrontInvalidation(accessKeyId, secretAccessKey, key);
    } catch (invalidationError) {
      console.error('CloudFront invalidation failed:', invalidationError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'CloudFront 캐시 무효화 실패',
          details: invalidationError instanceof Error ? invalidationError.message : 'Unknown invalidation error',
          s3_uploaded: true,
          url: s3Url,
          key,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        url: s3Url,
        key,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
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
      },
    );
  }
});
