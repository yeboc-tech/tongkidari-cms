import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { fromIni } from '@aws-sdk/credential-providers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ESM에서 __dirname 사용하기
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env 파일 로드
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// 설정
const BATCH_SIZE = 10;
const TARGET_BUCKET = 'cdn.y3c.kr';
const TARGET_DIR = 'tongkidari/edited-contents/';
const LOCAL_OUTPUT_DIR = path.join(__dirname, 'temp-images');
const AWS_PROFILE = 'yeboc';
const AWS_REGION = 'ap-northeast-2';

// Supabase 클라이언트 생성
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// AWS S3 클라이언트 생성
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: fromIni({ profile: AWS_PROFILE }),
});

// 로컬 디렉토리 생성
if (!fs.existsSync(LOCAL_OUTPUT_DIR)) {
  fs.mkdirSync(LOCAL_OUTPUT_DIR, { recursive: true });
  console.log(`📁 Created local directory: ${LOCAL_OUTPUT_DIR}`);
}

// Base64를 이미지 파일로 저장
function saveBase64AsImage(resourceId, base64Data) {
  const filePath = path.join(LOCAL_OUTPUT_DIR, `${resourceId}.png`);

  // base64 데이터에서 prefix 제거
  const base64String = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

  // Buffer로 변환하여 파일 저장
  const buffer = Buffer.from(base64String, 'base64');
  fs.writeFileSync(filePath, buffer);

  return filePath;
}

// S3에 파일 업로드
async function uploadToS3(resourceId, filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const key = `${TARGET_DIR}${resourceId}.png`;

  const command = new PutObjectCommand({
    Bucket: TARGET_BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: 'image/png',
  });

  await s3Client.send(command);
  return key;
}

// 배치 처리
async function processBatch(offset, batchSize) {
  console.log(`\n📦 Processing batch: offset=${offset}, size=${batchSize}`);

  // Supabase에서 데이터 조회 (LIMIT와 OFFSET 사용)
  const { data, error } = await supabase
    .from('edited_contents')
    .select('resource_id, base64')
    .range(offset, offset + batchSize - 1);

  if (error) {
    console.error('❌ Error fetching data:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    return 0;
  }

  console.log(`   Retrieved ${data.length} items`);

  let successCount = 0;
  let failCount = 0;

  for (const item of data) {
    try {
      const { resource_id, base64 } = item;

      // 1. 로컬에 이미지 파일로 저장
      const localPath = saveBase64AsImage(resource_id, base64);
      console.log(`   💾 Saved locally: ${resource_id}.png`);

      // 2. S3에 업로드
      const s3Key = await uploadToS3(resource_id, localPath);
      console.log(`   ☁️  Uploaded to S3: ${s3Key}`);

      // 3. 로컬 파일 삭제 (선택사항)
      fs.unlinkSync(localPath);

      successCount++;
    } catch (error) {
      console.error(`   ❌ Failed to process ${item.resource_id}:`, error.message);
      failCount++;
    }
  }

  console.log(`   ✅ Success: ${successCount}, ❌ Failed: ${failCount}`);

  return data.length;
}

// 메인 함수
async function main() {
  console.log('🚀 Starting migration to S3...\n');
  console.log(`Configuration:`);
  console.log(`  - Supabase URL: ${supabaseUrl}`);
  console.log(`  - S3 Bucket: ${TARGET_BUCKET}`);
  console.log(`  - S3 Directory: ${TARGET_DIR}`);
  console.log(`  - AWS Profile: ${AWS_PROFILE}`);
  console.log(`  - Batch Size: ${BATCH_SIZE}`);
  console.log(`  - Local Output: ${LOCAL_OUTPUT_DIR}`);

  let offset = 0;
  let totalProcessed = 0;
  let batchNumber = 1;

  try {
    while (true) {
      console.log(`\n📋 Batch ${batchNumber}:`);

      const processedCount = await processBatch(offset, BATCH_SIZE);

      if (processedCount === 0) {
        console.log('\n✨ No more data to process');
        break;
      }

      totalProcessed += processedCount;
      offset += BATCH_SIZE;
      batchNumber++;

      // 잠시 대기 (API rate limit 방지)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n' + '='.repeat(50));
    console.log(`🎉 Migration completed!`);
    console.log(`   Total items processed: ${totalProcessed}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// 스크립트 실행
main();
