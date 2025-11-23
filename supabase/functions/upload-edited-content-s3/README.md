# Upload Edited Content to S3 Edge Function

이 Edge Function은 편집된 콘텐츠의 base64 인코딩된 이미지를 AWS S3에 업로드합니다.

## 환경 변수 설정

Edge Function을 배포하기 전에 다음 환경 변수를 설정해야 합니다:

```bash
# Supabase 프로젝트에 환경 변수 설정
supabase secrets set AWS_ACCESS_KEY_ID=your_access_key
supabase secrets set AWS_SECRET_ACCESS_KEY=your_secret_key
```

## 설정 변수

### Edge Function 내부 설정 (고정값)
- `TARGET_BUCKET`: `cdn.y3c.kr`
- `TARGET_DIR`: `/tongkidari/edited-contents/`
- `TARGET_REGION`: `ap-northeast-2`

### 필수 환경 변수
- `AWS_ACCESS_KEY_ID`: AWS Access Key
- `AWS_SECRET_ACCESS_KEY`: AWS Secret Key

## 배포

```bash
# Edge Function 배포
supabase functions deploy upload-edited-content-s3
```

## 사용 방법

이 함수는 `Supabase.EditedContent.upsertBBox()` 및 `Supabase.EditedContent.upsertBase64Only()` 내부에서 자동으로 호출됩니다.

### 업로드 파일명 형식
`{resource_id}.png`

예: `경제_고3_2024_04_학평_1_문제.png`

### S3 경로
`s3://cdn.y3c.kr/tongkidari/edited-contents/{resource_id}.png`

## API 요청 형식

```typescript
{
  resource_id: string;  // 리소스 ID (파일명으로 사용됨)
  base64: string;       // base64 인코딩된 이미지 데이터
}
```

## API 응답 형식

### 성공
```typescript
{
  success: true,
  url: string,  // S3 URL
  key: string   // S3 객체 키
}
```

### 실패
```typescript
{
  success: false,
  error: string
}
```

## 에러 처리

S3 업로드가 실패하더라도 Supabase `edited_contents` 테이블에는 정상적으로 저장됩니다.
S3 업로드 실패는 콘솔에 로그로만 기록되며, 전체 작업을 중단하지 않습니다.
