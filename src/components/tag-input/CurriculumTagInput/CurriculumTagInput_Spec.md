# CurriculumTagInput 컴포넌트 스펙

## 개요
교육과정 단원을 검색하고 선택할 수 있는 자동완성 입력 컴포넌트입니다. 실시간 검색, 초성 검색, 키보드 네비게이션을 지원합니다.

## 주요 기능

### 1. 실시간 검색
- 입력과 동시에 `자세한통합사회_단원_태그` 데이터에서 검색
- Book, Chapter, Topic 전체를 대상으로 검색
- 매칭되는 결과를 드롭다운으로 표시

### 2. 초성 검색
- 한글 초성으로 검색 가능 (예: "ㅌㅎㅅㅎ" → "통합사회")
- 띄어쓰기와 쉼표(,)를 자동으로 무시하고 검색
- 초성과 일반 텍스트 검색 모두 지원

### 3. 하이라이트
- 매칭된 텍스트를 파란색으로 하이라이트
- 초성 검색 시에도 매칭된 실제 한글 텍스트를 하이라이트

### 4. 계층 구조 표시
- 선택된 태그를 전체 경로로 표시
- 형식: `통합사회 1 > I. 통합적 관점 > 01. 인간, 사회, 환경을 바라보는 다양한 관점`

### 5. 단일 선택 모드
- 한 번에 하나의 태그만 선택 가능
- 새로운 태그 선택 시 기존 태그 자동 교체

### 6. 키보드 네비게이션
| 키 | 동작 |
|---|---|
| `ArrowDown` | 드롭다운에서 다음 항목으로 이동 |
| `ArrowUp` | 드롭다운에서 이전 항목으로 이동 |
| `Enter` | 하이라이트된 항목 선택 |
| `Tab` | 하이라이트된 항목 선택 |
| `Backspace` | 입력이 비어있을 때 선택된 태그 제거 |
| `Escape` | 드롭다운 닫기 |

### 7. 중복 이벤트 방지
- 10ms 이내 중복 키 이벤트 자동 차단
- 두 개 이상의 컴포넌트 사용 시에도 안정적 동작

## Props 인터페이스

```typescript
interface SelectedTag {
  tagIds: string[];      // ['1', '1-1', '1-1-1']
  tagLabels: string[];   // ['통합사회 1', 'I. 통합적 관점', '01. 인간, 사회, ...']
}

interface CurriculumTagInputProps {
  onSelect: (tag: SelectedTag | null) => void;
}
```

## 사용 예시

```tsx
import CurriculumTagInput from './components/tag-input/CurriculumTagInput/CurriculumTagInput';

function MyComponent() {
  const [selectedTag, setSelectedTag] = useState<SelectedTag | null>(null);

  const handleSelect = (tag: SelectedTag | null) => {
    setSelectedTag(tag);
    console.log('Selected:', tag);
  };

  return (
    <div>
      <CurriculumTagInput onSelect={handleSelect} />

      {selectedTag && (
        <div>
          <p>Tag IDs: {selectedTag.tagIds.join(', ')}</p>
          <p>Tag Labels: {selectedTag.tagLabels.join(' > ')}</p>
        </div>
      )}
    </div>
  );
}
```

## 데이터 구조

### 입력 데이터
`자세한통합사회_단원_태그` (from `src/ssot/curriculumStructure.ts`)

```typescript
interface Topic {
  id: string;    // "1-1-1"
  title: string; // "01. 인간, 사회, 환경을 바라보는 다양한 관점"
}

interface Chapter {
  id: string;       // "1-1"
  title: string;    // "I. 통합적 관점"
  topics: Topic[];
}

interface Book {
  id: string;          // "1"
  title: string;       // "통합사회 1"
  chapters: Chapter[];
}

const 자세한통합사회_단원_태그: Book[];
```

### 출력 데이터
선택 시 `onSelect` 콜백으로 전달:
```typescript
{
  tagIds: ['1', '1-1', '1-1-1'],
  tagLabels: [
    '통합사회 1',
    'I. 통합적 관점',
    '01. 인간, 사회, 환경을 바라보는 다양한 관점'
  ]
}
```

제거 시: `null`

## 기술적 세부사항

### 초성 검색 알고리즘
```typescript
// 한글 초성 추출
const getChosung = (text: string): string => {
  // 한글 유니코드 범위: 0xAC00 ~ 0xD7A3
  // 초성 인덱스 = Math.floor((charCode - 0xAC00) / 588)
  // 초성 목록: ㄱ ㄲ ㄴ ㄷ ㄸ ㄹ ㅁ ㅂ ㅃ ㅅ ㅆ ㅇ ㅈ ㅉ ㅊ ㅋ ㅌ ㅍ ㅎ
};

// 초성 매칭
const matchesChosung = (text: string, query: string): boolean => {
  // 1. 띄어쓰기와 쉼표 제거
  // 2. 검색어가 초성인지 확인
  // 3. 초성이면 초성 비교, 아니면 일반 텍스트 비교
};
```

### 하이라이트 구현
```typescript
const highlightText = (text: string, query: string) => {
  // 일반 검색: 직접 매칭 위치 찾기
  // 초성 검색:
  //   1. 원본 텍스트의 인덱스 매핑 생성 (공백/쉼표 제외)
  //   2. 정규화된 텍스트에서 초성 추출
  //   3. 초성에서 매칭 위치 찾기
  //   4. 원본 텍스트 인덱스로 변환하여 하이라이트
};
```

### 중복 이벤트 방지
```typescript
const lastKeyTimeRef = useRef<number>(0);

const handleKeyDown = (e) => {
  const now = Date.now();
  if (now - lastKeyTimeRef.current < 10) {
    return; // 10ms 이내 중복 이벤트 차단
  }
  lastKeyTimeRef.current = now;
  // ... 키 처리 로직
};
```

## 스타일링

### Chip (선택된 태그)
- 배경: `bg-blue-100`
- 텍스트: `text-blue-800`
- 형태: `rounded-full`
- X 버튼: hover 시 `bg-blue-200`

### 드롭다운
- 최대 높이: `max-h-96`
- 하이라이트된 항목: `bg-blue-100`
- Hover 항목: `hover:bg-blue-50`

### 입력 필드
- 포커스 시: `focus-within:ring-2 focus-within:ring-blue-500`
- 최소 너비: `min-w-[120px]`

## 접근성

### 키보드 접근성
- 모든 기능을 키보드로 조작 가능
- Tab 키로 포커스 이동
- 방향키로 항목 선택
- Enter/Tab으로 확정

### 시각적 피드백
- 하이라이트된 항목에 배경색 표시
- 자동 스크롤로 하이라이트된 항목 가시성 보장
- 텍스트 매칭 부분 색상 강조

## 제약사항

1. **단일 선택**: 한 번에 하나의 태그만 선택 가능
2. **데이터 소스**: `자세한통합사회_단원_태그`에만 의존
3. **초성 검색**: 한글 초성만 지원 (영문/숫자는 일반 검색)

## 향후 개선 가능 사항

- [ ] 멀티 선택 모드 옵션
- [ ] 커스텀 스타일링 prop
- [ ] 외부 데이터 소스 지원
- [ ] 검색 결과 개수 제한 옵션
- [ ] 로딩 상태 표시
- [ ] 에러 처리
- [ ] 선택된 태그 순서 조정 (멀티 선택 시)

## 버전 히스토리

### v1.0.0 (2025-11-10)
- 초기 구현
- 실시간 검색, 초성 검색, 키보드 네비게이션
- 단일 선택 모드
- 전체 계층 구조 표시
- 중복 이벤트 방지
