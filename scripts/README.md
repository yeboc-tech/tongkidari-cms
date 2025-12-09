# Migration Scripts

## 1. S3 마이그레이션 스크립트 (migrate:s3)

edited_contents 테이블의 모든 데이터를 S3로 마이그레이션하는 Node.js 스크립트입니다.

### 사전 준비

1. **AWS CLI 설정 확인**

프로필 `yeboc`이 설정되어 있는지 확인:

```bash
aws configure list --profile yeboc
```

설정이 안되어 있다면:

```bash
aws configure --profile yeboc
# AWS Access Key ID, Secret Access Key, Region (ap-northeast-2) 입력
```

2. **의존성 설치**

```bash
npm install
```

### 실행

```bash
npm run migrate:s3
```

### 동작 방식

1. `.env` 파일에서 Supabase 설정 읽기
2. `edited_contents` 테이블에서 10개씩 배치로 데이터 조회
3. 각 항목의 base64 데이터를 로컬에 `.png` 파일로 저장
4. AWS S3 `cdn.y3c.kr` 버킷의 `tongkidari/edited-contents/` 디렉토리에 업로드
5. 업로드 후 로컬 파일 삭제
6. 다음 배치 처리 (모든 데이터 처리 완료까지)

### 설정

스크립트 파일(`migrate-to-s3.js`) 상단의 설정값:

```javascript
const BATCH_SIZE = 10;                           // 한 번에 처리할 항목 수
const TARGET_BUCKET = 'cdn.y3c.kr';             // S3 버킷 이름
const TARGET_DIR = 'tongkidari/edited-contents/'; // S3 디렉토리
const AWS_PROFILE = 'yeboc';                     // AWS CLI 프로필
const AWS_REGION = 'ap-northeast-2';            // AWS 리전
```

### 출력 예시

```
🚀 Starting migration to S3...

Configuration:
  - Supabase URL: https://lezajqbwzhxkskullexz.supabase.co
  - S3 Bucket: cdn.y3c.kr
  - S3 Directory: tongkidari/edited-contents/
  - AWS Profile: yeboc
  - Batch Size: 10
  - Local Output: /path/to/scripts/temp-images

📋 Batch 1:

📦 Processing batch: offset=0, size=10
   Retrieved 10 items
   💾 Saved locally: 경제_고3_2024_03_학평_1_문제.png
   ☁️  Uploaded to S3: tongkidari/edited-contents/경제_고3_2024_03_학평_1_문제.png
   ...
   ✅ Success: 10, ❌ Failed: 0

📋 Batch 2:
...

==================================================
🎉 Migration completed!
   Total items processed: 150
==================================================
```

### 문제 해결

**AWS Credentials 에러**
```
Error: Profile yeboc not found
```
→ `aws configure --profile yeboc` 실행

**Supabase 에러**
```
Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set
```
→ `.env` 파일 확인

**S3 업로드 에러**
```
AccessDenied: User is not authorized to perform: s3:PutObject
```
→ AWS IAM 권한 확인

---

## 2. Chapter 마이그레이션 스크립트 (migrate:chapters)

TypeScript 파일로 정의된 커리큘럼 구조를 Supabase SSOT 테이블로 마이그레이션하는 스크립트입니다.

### 사전 준비

1. **Supabase SSOT 테이블 생성**

`supabase/table/ssot_table.sql` 파일을 Supabase SQL Editor에서 실행하여 테이블을 생성합니다.

2. **의존성 설치**

```bash
npm install
```

### 실행

```bash
npm run migrate:chapters
```

### 동작 방식

1. 다음 디렉토리의 TypeScript 파일을 읽음:
   - `src/ssot/마더텅_단원_태그/`
   - `src/ssot/자세한통사_단원_태그/`

2. 각 파일에서 export된 Chapter 객체를 추출

3. Supabase `ssot` 테이블에 upsert (key 기준으로 업데이트 또는 삽입)

### Key 포맷

파일명을 기준으로 key가 생성됩니다:

- `사회탐구_경제.ts` → `CHAPTER_사회탐구_경제`
- `사회탐구_동아시아사.ts` → `CHAPTER_사회탐구_동아시아사`
- `자세한통사단원_1.ts` → `CHAPTER_자세한통사단원_1`

### 출력 예시

```
============================================================
SSOT Chapter Data Migration
============================================================

Processing directory: 마더텅_단원_태그
Found 5 TypeScript files
Uploading CHAPTER_사회탐구_경제...
✅ Successfully uploaded CHAPTER_사회탐구_경제
Uploading CHAPTER_사회탐구_동아시아사...
✅ Successfully uploaded CHAPTER_사회탐구_동아시아사
...

Directory 마더텅_단원_태그 complete:
  ✅ Success: 5
  ❌ Failed: 0

Processing directory: 자세한통사_단원_태그
Found 2 TypeScript files
Uploading CHAPTER_자세한통사단원_1...
✅ Successfully uploaded CHAPTER_자세한통사단원_1
...

Directory 자세한통사_단원_태그 complete:
  ✅ Success: 2
  ❌ Failed: 0

============================================================
Migration Summary
============================================================
Total Success: 7
Total Failed: 0
============================================================

✅ Migration completed
```

### 문제 해결

**Export를 찾을 수 없음**
```
Error: Could not find export in {file}
```
→ TypeScript 파일이 `export const name: Type = { ... };` 형식을 따르는지 확인

**Supabase 삽입 에러**
```
Error uploading CHAPTER_xxx
```
→ `.env` 파일의 Supabase 설정 확인
→ `ssot` 테이블이 생성되어 있는지 확인
→ ANON_KEY 권한 확인 (테이블이 unrestricted인지)
