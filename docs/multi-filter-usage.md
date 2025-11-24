# 다중 필터 검색 사용법

## 개요

여러 개의 `type`-`tagIds` 세트를 동시에 검색할 수 있는 기능입니다.

## 방법 1: `searchByMultiFilter` 사용 (권장)

### SQL 함수 등록

먼저 Supabase SQL Editor에서 다음 함수를 실행하세요:

```sql
-- supabase/rpc_function/search_problems_by_filter_items.sql 파일 내용
```

### TypeScript에서 사용

```typescript
// 여러 과목의 특정 단원 문제를 동시에 검색 (각 필터마다 다른 조건 가능)
const problemIds = await Supabase.searchByMultiFilter({
  filters: [
    {
      type: '단원_사회탐구_경제',
      tagIds: ['1', '1-1', '1-2'],  // 특정 단원만
      years: ['2024', '2023', '2022'],
      accuracyMin: 30,
      accuracyMax: 70
    },
    {
      type: '단원_사회탐구_사회문화',
      tagIds: null,             // null이면 모든 단원
      years: ['2024', '2023'],  // 다른 연도 조건
      accuracyMin: 50,          // 다른 정답률 조건
      accuracyMax: 100
    },
    {
      type: '단원_사회탐구_정치와법',
      tagIds: ['3', '3-1'],
      years: ['2024'],          // 최근 연도만
      accuracyMin: 0,
      accuracyMax: 50           // 낮은 정답률만
    },
    {
      // AND 조건 사용 예시: 경제 1단원이면서 동시에 사회문화 2단원인 문제
      type: '단원_사회탐구_경제',
      tagIds: ['1'],
      andProblemFilterItems: [
        { type: '단원_사회탐구_사회문화', tagIds: ['2'] }
      ],
      years: ['2024'],
      accuracyMin: 0,
      accuracyMax: 100
    }
  ]
});

console.log(`총 ${problemIds.length}개 문제 검색됨`);
```

## 방법 2: 기존 `searchByFilter`를 여러 번 호출 후 병합

```typescript
// 각 type별로 검색 후 병합
const [economyIds, sociologyIds, politicsIds] = await Promise.all([
  Supabase.searchByFilter({
    type: '단원_사회탐구_경제',
    tagIds: ['1', '1-1', '1-2'],
    years: ['2024', '2023'],
    accuracyMin: 30,
    accuracyMax: 70
  }),
  Supabase.searchByFilter({
    type: '단원_사회탐구_사회문화',
    tagIds: ['1', '1-2', '2'],
    years: ['2024', '2023'],
    accuracyMin: 30,
    accuracyMax: 70
  }),
  Supabase.searchByFilter({
    type: '단원_사회탐구_정치와법',
    tagIds: ['3', '3-1'],
    years: ['2024', '2023'],
    accuracyMin: 30,
    accuracyMax: 70
  })
]);

// 중복 제거하여 병합
const allProblemIds = [...new Set([...economyIds, ...sociologyIds, ...politicsIds])];
```

## 성능 비교

| 방법 | 장점 | 단점 |
|------|------|------|
| `searchByMultiFilter` | - 단일 RPC 호출<br>- 서버에서 병합 처리<br>- 네트워크 비용 절감 | - 새 RPC 함수 등록 필요 |
| 여러 번 호출 후 병합 | - 기존 함수 재사용<br>- 추가 설정 불필요 | - 여러 번의 네트워크 요청<br>- 클라이언트에서 병합 처리 |

## 실제 사용 예시: SocialPlayground

```typescript
// 사용자가 여러 과목의 단원을 선택한 경우
const handleApplyFilter = async () => {
  // selectedTagIds: ["단원_사회탐구_경제.1", "단원_사회탐구_경제.1-1", "단원_사회탐구_사회문화.1"]

  // tagId를 type별로 그룹화
  const filterGroups = new Map<string, string[]>();

  selectedTagIds.forEach(fullTagId => {
    const [type, tagId] = fullTagId.split('.');
    if (!filterGroups.has(type)) {
      filterGroups.set(type, []);
    }
    filterGroups.get(type)!.push(tagId);
  });

  // Map을 배열로 변환 (각 필터에 개별 조건 추가)
  const filters = Array.from(filterGroups.entries()).map(([type, tagIds]) => ({
    type: type as ProblemTagType,
    tagIds,
    years: Array.from(selectedYears),     // 각 필터에 동일한 조건
    accuracyMin: parseFloat(accuracyMin),
    accuracyMax: parseFloat(accuracyMax)
  }));

  // 다중 필터 검색
  const problemIds = await Supabase.searchByMultiFilter({
    filters
  });

  // 이후 처리는 동일...
  const problemInfos = await Supabase.fetchProblemInfoByIds(problemIds);
};
```

## 주의사항

1. **tagIds null 처리**: `tagIds: null`이면 해당 `type`의 모든 문제를 가져옵니다.

2. **AND 조건**: `andProblemFilterItems`를 사용하면 여러 태그 타입을 AND 조건으로 결합할 수 있습니다.
   - 예: 경제 1단원 **AND** 사회문화 2단원인 문제만 검색

3. **독립적인 조건**: 각 필터는 독립적인 `tagIds`, `andProblemFilterItems`, `years`, `accuracyMin`, `accuracyMax` 조건을 가질 수 있습니다.

4. **JSONB 형식**: RPC 함수는 JSONB 배열을 받으므로, TypeScript에서 자동으로 변환됩니다.

5. **중복 제거**: SQL 함수 내부에서 `DISTINCT`로 중복을 자동 제거합니다.

6. **빈 배열 처리**: filters가 빈 배열이면 즉시 빈 배열을 반환합니다.

7. **임시 테이블**: PostgreSQL의 임시 테이블을 사용하여 성능을 최적화합니다.

8. **선택적 필드**: `andProblemFilterItems`, `years`, `accuracyMin`, `accuracyMax`는 각 필터에서 선택적(optional)입니다.

## 테스트

```typescript
// 테스트 케이스 1: 동일한 조건
const testMultiFilter = async () => {
  const result = await Supabase.searchByMultiFilter({
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

  console.log('검색된 문제 수:', result.length);
  console.log('문제 ID 샘플:', result.slice(0, 5));
};

// 테스트 케이스 2: 서로 다른 조건
const testDifferentConditions = async () => {
  const result = await Supabase.searchByMultiFilter({
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

  console.log('검색된 문제 수:', result.length);
};

// 테스트 케이스 3: tagIds null (모든 단원)
const testAllTags = async () => {
  const result = await Supabase.searchByMultiFilter({
    filters: [
      {
        type: '단원_사회탐구_경제',
        tagIds: null,  // 경제 과목의 모든 단원
        years: ['2024'],
        accuracyMin: 0,
        accuracyMax: 100
      }
    ]
  });

  console.log('경제 전체 문제 수:', result.length);
};

// 테스트 케이스 4: AND 조건 (교집합)
const testAndCondition = async () => {
  const result = await Supabase.searchByMultiFilter({
    filters: [
      {
        type: '단원_사회탐구_경제',
        tagIds: ['1'],
        andProblemFilterItems: [
          { type: '단원_사회탐구_사회문화', tagIds: ['2'] }
        ],
        years: ['2024'],
        accuracyMin: 0,
        accuracyMax: 100
      }
    ]
  });

  console.log('경제 1단원 AND 사회문화 2단원 문제 수:', result.length);
};
```
