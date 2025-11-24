# 다중 필터 검색 사용법

## 개요

여러 개의 `type`-`tagIds` 세트를 동시에 검색할 수 있는 기능입니다.

ChapterTree에서 여러 과목/교재의 단원을 선택하면, 각 단원의 tagType과 tagIds를 자동으로 그룹화하여 검색합니다.

## SQL 함수 등록

먼저 Supabase SQL Editor에서 다음 함수를 실행하세요:

```sql
-- supabase/rpc_function/search_problems_by_filter_items.sql 파일 내용 전체 실행
```

## TypeScript에서 사용

### 기본 사용법

```typescript
import { Supabase } from '@/api/Supabase';
import type { ProblemFilterItem } from '@/types/ProblemFilterItem';

// 여러 과목의 특정 단원 문제를 동시에 검색
const filters: ProblemFilterItem[] = [
  {
    type: '단원_사회탐구_경제',
    tagIds: ['1', '1-1', '1-2'],  // 특정 단원만
    grades: ['고3'],              // 학년 필터
    years: ['2024', '2023', '2022'],
    accuracyMin: 30,
    accuracyMax: 70
  },
  {
    type: '단원_사회탐구_사회문화',
    tagIds: null,                 // null이면 모든 단원
    grades: ['고3'],
    years: ['2024', '2023'],      // 다른 연도 조건
    accuracyMin: 50,              // 다른 정답률 조건
    accuracyMax: 100
  },
];

const problemIds = await Supabase.searchByMultiFilter({ filters });
console.log(`총 ${problemIds.length}개 문제 검색됨`);
```

### AND 조건 사용

```typescript
// 경제 1단원이면서 동시에 사회문화 2단원인 문제 (교집합)
const filters: ProblemFilterItem[] = [
  {
    type: '단원_사회탐구_경제',
    tagIds: ['1'],
    andProblemFilterItems: [
      { type: '단원_사회탐구_사회문화', tagIds: ['2'] }
    ],
    grades: ['고3'],
    years: ['2024'],
    accuracyMin: 0,
    accuracyMax: 100
  }
];

const problemIds = await Supabase.searchByMultiFilter({ filters });
```

## SocialPlayground 실제 구현

### ChapterTree에서 선택 항목 수집

```typescript
// ChapterTree는 SelectedChapterItem[] 반환
// 각 항목: { id: "tagType.originalId", tagType: "단원_사회탐구_경제" }
const handleSelectionChange = useCallback((selectedItems: SelectedChapterItem[]) => {
  setSelectedChapterItems(selectedItems);
}, []);
```

### 필터 검색 실행

```typescript
const handleApplyFilter = async () => {
  if (selectedChapterItems.length === 0) {
    setSearchResults([]);
    return;
  }

  // 1. tagType별로 그룹화 (id에서 tagType 제거)
  const filterMap = new Map<string, string[]>();
  selectedChapterItems.forEach((item) => {
    // id는 "tagType.originalId" 형태이므로 tagType 부분을 제거
    const originalId = item.id.replace(`${item.tagType}.`, '');

    if (!filterMap.has(item.tagType)) {
      filterMap.set(item.tagType, []);
    }
    filterMap.get(item.tagType)!.push(originalId);
  });

  // 2. 공통 필터 조건 설정
  const commonYears = selectedYears.size > 0 ? Array.from(selectedYears) : undefined;
  const commonGrades = selectedGrades.size > 0 ? Array.from(selectedGrades) : undefined;
  const commonAccuracyMin = accuracyMin ? parseFloat(accuracyMin) : undefined;
  const commonAccuracyMax = accuracyMax ? parseFloat(accuracyMax) : undefined;

  // 3. 필터 아이템 배열 생성
  const filters: ProblemFilterItem[] = Array.from(filterMap.entries()).map(([tagType, tagIds]) => ({
    type: tagType as any,
    tagIds,
    grades: commonGrades,
    years: commonYears,
    accuracyMin: commonAccuracyMin,
    accuracyMax: commonAccuracyMax,
  }));

  // 4. 다중 필터 검색
  const problemIds = await Supabase.searchByMultiFilter({ filters });

  // 5. 문제 정보 조회
  const problemInfos = await Supabase.fetchProblemInfoByIds(problemIds);
  setSearchResults(problemInfos);
};
```

## ChapterTree와 tagType 관리

### Chapter 데이터 변환

```typescript
// SocialLeftLayout.tsx
const transformChapter = (chapter: Chapter, tagType: string): Chapter => {
  const transformRecursive = (ch: Chapter): Chapter => ({
    ...ch,
    id: `${tagType}.${ch.id}`,  // 유니크한 id 생성
    tagType,                     // tagType 설정
    chapters: ch.chapters?.map(transformRecursive),
  });
  return transformRecursive(chapter);
};

// 통합사회 예시
const currentChapters = [
  transformChapter(chapter1, '단원_자세한통합사회_1'),
  transformChapter(chapter2, '단원_자세한통합사회_2'),
];
```

## 주요 기능

### 1. tagIds null 처리
- `tagIds: null`이면 해당 `type`의 모든 문제를 가져옵니다
- 과목 전체 문제를 검색할 때 유용

### 2. grades 필터
- `grades: ['고1', '고2', '고3']` 형태로 학년 필터링
- problem_id의 2번째 부분(언더스코어 기준)과 매칭
- 예: `"경제_고1_2024"` → grades: ['고1']

### 3. years 필터
- `years: ['2024', '2023']` 형태로 연도 필터링
- problem_id의 3번째 부분(언더스코어 기준)과 매칭
- 예: `"경제_고1_2024"` → years: ['2024']

### 4. AND 조건 (교집합)
- `andProblemFilterItems`를 사용하면 여러 태그 타입을 AND 조건으로 결합
- 예: 경제 1단원 **AND** 사회문화 2단원인 문제만 검색
- null 또는 빈 배열이면 AND 조건 무시

### 5. 독립적인 조건
- 각 필터는 독립적인 `tagIds`, `grades`, `years`, `accuracyMin`, `accuracyMax` 조건을 가질 수 있음
- 필터 간 OR 로직 (합집합)

### 6. 성능 최적화
- PostgreSQL 임시 테이블 사용 (`ON COMMIT DROP`)
- SQL 내부에서 `DISTINCT`로 중복 자동 제거
- 단일 RPC 호출로 네트워크 비용 최소화

## 테스트 예시

```typescript
// 테스트 1: 학년 필터 추가
const testWithGrades = async () => {
  const result = await Supabase.searchByMultiFilter({
    filters: [
      {
        type: '단원_사회탐구_경제',
        tagIds: ['1'],
        grades: ['고3'],          // 고3만
        years: ['2024', '2023'],
        accuracyMin: 0,
        accuracyMax: 100
      }
    ]
  });

  console.log('경제 1단원 (고3) 문제 수:', result.length);
};

// 테스트 2: 여러 과목 동시 검색
const testMultipleSubjects = async () => {
  const result = await Supabase.searchByMultiFilter({
    filters: [
      {
        type: '단원_사회탐구_경제',
        tagIds: ['1', '2'],
        grades: ['고3'],
        years: ['2024'],
        accuracyMin: 30,
        accuracyMax: 70
      },
      {
        type: '단원_사회탐구_사회문화',
        tagIds: ['1'],
        grades: ['고3'],
        years: ['2024'],
        accuracyMin: 50,
        accuracyMax: 100
      }
    ]
  });

  console.log('경제(1,2단원) + 사회문화(1단원) 문제 수:', result.length);
};

// 테스트 3: tagIds null로 전체 검색
const testAllChapters = async () => {
  const result = await Supabase.searchByMultiFilter({
    filters: [
      {
        type: '단원_사회탐구_경제',
        tagIds: null,  // 모든 단원
        grades: ['고3'],
        years: ['2024'],
        accuracyMin: 0,
        accuracyMax: 100
      }
    ]
  });

  console.log('경제 전체 단원 (고3, 2024) 문제 수:', result.length);
};

// 테스트 4: AND 조건 (교집합)
const testIntersection = async () => {
  const result = await Supabase.searchByMultiFilter({
    filters: [
      {
        type: '단원_사회탐구_경제',
        tagIds: ['1'],
        andProblemFilterItems: [
          { type: '단원_사회탐구_사회문화', tagIds: ['2'] }
        ],
        grades: ['고3'],
        years: ['2024'],
        accuracyMin: 0,
        accuracyMax: 100
      }
    ]
  });

  console.log('경제 1단원 AND 사회문화 2단원 교집합:', result.length);
};
```

## 문제 해결

### Chapter id 중복 문제
통합사회 1, 2가 동일한 id를 가질 수 있어 선택 시 충돌 발생

**해결**: Chapter 변환 시 id를 `tagType.originalId` 형태로 변경
```typescript
// Before: id = "1"
// After: id = "단원_자세한통합사회_1.1"
```

### tagType 누락 문제
SSOT에서 가져온 Chapter에 tagType 필드가 없음

**해결**: transformChapter 함수로 모든 노드에 tagType 설정
```typescript
const transformRecursive = (ch: Chapter): Chapter => ({
  ...ch,
  tagType,  // 모든 노드에 tagType 추가
  chapters: ch.chapters?.map(transformRecursive),
});
```
