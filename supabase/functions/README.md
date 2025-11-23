# Supabase Edge Functions

## 배포 명령어

### 특정 프로젝트에 배포

```bash
# 프로젝트 참조 ID를 명시적으로 지정
supabase functions deploy {function_name} --project-ref {project_id}
supabase functions deploy upload-edited-content-s3 --project-ref lezajqbwzhxkskullexz
```

## 배포 확인

### 배포된 Functions 목록 확인

```bash
supabase functions list
```
