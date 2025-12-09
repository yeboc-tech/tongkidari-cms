# 다중 Type-TagIds 검색 솔루션

## 문제 정의

현재 `searchByFilter`는 하나의 `type`과 `tagIds`만 지정 가능합니다.

**요구사항**: 여러 개의 세트를 동시에 검색하고 싶습니다.

```typescript
// 원하는 검색
type="단원_사회탐구_경제" + tagIds=["1", "1-1"]
type="단원_사회탐구_사회문화" + tagIds=["1", "1-2"]
```

## 해결 방법 비교

### ✅ 방법 1: 새로운 RPC 함수 `searchByMultiFilter` (권장)

**장점**:
- 단일 데이터베이스 호출
- 서버 사이드에서 병합 처리
- 네트워크 비용 최소화
- 성능 최적화 (임시 테이블 활용)

**단점**:
- 새 RPC 함수 등록 필요

**구현**:
1. SQL 함수: `/supabase/rpc_function/search_problems_by_filter_items.sql`
2. TypeScript API: `Supabase.searchByMultiFilter()`

**사용 예시**:
```typescript
const problemIds = await Supabase.searchByMultiFilter({
  filters: [
    {
      type: '단원_사회탐구_경제',
      tagIds: ['1', '1-1'],  // 특정 단원만
      years: ['2024', '2023'],
      accuracyMin: 30,
      accuracyMax: 70
    },
    {
      type: '단원_사회탐구_사회문화',
      tagIds: null,  // 모든 단원
      years: ['2024'],
      accuracyMin: 50,
      accuracyMax: 100
    }
  ]
});
```

---

### ⚠️ 방법 2: 기존 함수 여러 번 호출 후 병합

**장점**:
- 추가 설정 불필요
- 기존 함수 재사용

**단점**:
- 여러 번의 네트워크 요청
- 클라이언트에서 중복 제거 필요
- 성능 저하 가능성

**사용 예시**:
```typescript
const [ids1, ids2] = await Promise.all([
  Supabase.searchByFilter({ type: '단원_사회탐구_경제', tagIds: ['1', '1-1'], ... }),
  Supabase.searchByFilter({ type: '단원_사회탐구_사회문화', tagIds: ['1', '1-2'], ... })
]);

const allIds = [...new Set([...ids1, ...ids2])];
```

---

## 추천 방식

**방법 1: `searchByMultiFilter`를 사용하세요**

### 설치 단계

1. **SQL 함수 등록**

Supabase SQL Editor에서 실행:

```sql
-- supabase/rpc_function/search_problems_by_filter_items.sql 내용 복사/붙여넣기
CREATE OR REPLACE FUNCTION search_problems_by_filter_items(
  p_filters jsonb  -- [{"type": "...", "tag_ids": [...], "years": [...], "accuracy_min": n, "accuracy_max": n}, ...]
)
RETURNS TABLE (problem_id text) AS $$
-- ... (생략)
$$ LANGUAGE plpgsql;
```

2. **TypeScript에서 호출**

```typescript
import { Supabase } from '@/api/Supabase';

const problemIds = await Supabase.searchByMultiFilter({
  filters: [
    {
      type: '단원_사회탐구_경제',
      tagIds: ['1', '1-1'],  // 특정 단원
      years: ['2024', '2023'],
      accuracyMin: 30,
      accuracyMax: 70
    },
    {
      type: '단원_사회탐구_사회문화',
      tagIds: null,  // 모든 단원
      years: ['2024'],
      accuracyMin: 50,
      accuracyMax: 100
    }
  ]
});
```

## 기술 세부사항

### RPC 함수 동작 방식

1. JSONB 배열로 필터 세트 수신
2. 각 필터에 대해 반복:
   - `type`, `tag_ids`, `years`, `accuracy_min`, `accuracy_max` 추출
   - `tag_ids`가 NULL이면 해당 `type`의 모든 문제 검색
   - 각 필터의 독립적인 조건으로 `problem_id` 검색
   - 임시 테이블에 저장
3. 중복 제거 후 반환
4. 임시 테이블 자동 삭제

**핵심**:
- 각 필터는 완전히 독립적인 조건을 가질 수 있습니다
- `tagIds: null`로 특정 과목의 전체 문제를 가져올 수 있습니다

### 성능 최적화

- **임시 테이블**: `ON COMMIT DROP` 사용하여 트랜잭션 종료 시 자동 삭제
- **DISTINCT**: 중복 제거를 데이터베이스에서 처리
- **인덱스 활용**: 기존 `problem_tags` 인덱스 재사용

## 테스트 방법

```typescript
// 1. 단일 필터 (기존 방식과 동일한 결과)
const single = await Supabase.searchByMultiFilter({
  filters: [
    {
      type: '단원_사회탐구_경제',
      tagIds: ['1'],
      years: ['2024'],
      accuracyMin: 0,
      accuracyMax: 100
    }
  ]
});

// 2. 다중 필터 (동일한 조건)
const multi = await Supabase.searchByMultiFilter({
  filters: [
    {
      type: '단원_사회탐구_경제',
      tagIds: ['1'],
      years: ['2024'],
      accuracyMin: 0,
      accuracyMax: 100
    },
    {
      type: '단원_사회탐구_사회문화',
      tagIds: ['1'],
      years: ['2024'],
      accuracyMin: 0,
      accuracyMax: 100
    }
  ]
});

// 3. 다중 필터 (서로 다른 조건)
const multiDifferent = await Supabase.searchByMultiFilter({
  filters: [
    {
      type: '단원_사회탐구_경제',
      tagIds: ['1'],
      years: ['2024', '2023'],
      accuracyMin: 30,
      accuracyMax: 70
    },
    {
      type: '단원_사회탐구_사회문화',
      tagIds: ['1', '2'],
      years: ['2024'],
      accuracyMin: 50,
      accuracyMax: 100
    }
  ]
});

console.log('단일:', single.length);
console.log('다중 (동일 조건):', multi.length);
console.log('다중 (다른 조건):', multiDifferent.length);
console.log('다중 >= 단일:', multi.length >= single.length); // true
```

## 다음 단계

1. ✅ SQL 함수 생성 완료
2. ✅ TypeScript API 추가 완료
3. ⏳ Supabase에 SQL 함수 등록
4. ⏳ SocialPlayground에서 사용
5. ⏳ 테스트 및 검증
