import { useCallback, useMemo } from 'react';
import ChapterTree from '../ChapterTree/ChapterTree';
import { 자세한통합사회_단원_태그 } from '../../ssot/curriculumStructure';
import { 마더텅_단원_태그 } from '../../ssot/마더텅_단원_태그';
import type { Book } from '../../ssot/types';
import { SUBJECTS } from '../../ssot/subjects';

type CategoryType = '통합사회' | '사회탐구';
type SubjectType = (typeof SUBJECTS.사회['2015교육과정'])[number];

interface SocialLeftLayoutProps {
  categoryType: CategoryType;
  setCategoryType: (category: CategoryType) => void;
  selectedSubject: SubjectType;
  setSelectedSubject: (subject: SubjectType) => void;
  selectedYears: Set<string>;
  setSelectedYears: (years: Set<string>) => void;
  questionCount: number | null;
  setQuestionCount: (count: number | null) => void;
  customCount: string;
  setCustomCount: (count: string) => void;
  isCustomInput: boolean;
  setIsCustomInput: (isCustom: boolean) => void;
  accuracyMin: string;
  setAccuracyMin: (value: string) => void;
  accuracyMax: string;
  setAccuracyMax: (value: string) => void;
  onSelectionChange: (selectedIds: string[]) => void;
  onApplyFilter: () => void;
}

function SocialLeftLayout({
  categoryType,
  setCategoryType,
  selectedSubject,
  setSelectedSubject,
  selectedYears,
  setSelectedYears,
  questionCount,
  setQuestionCount,
  customCount,
  setCustomCount,
  isCustomInput,
  setIsCustomInput,
  accuracyMin,
  setAccuracyMin,
  accuracyMax,
  setAccuracyMax,
  onSelectionChange,
  onApplyFilter,
}: SocialLeftLayoutProps) {
  const years = ['2024', '2023', '2022', '2021', '2020', '2019', '2018'];
  const questionCounts = [20, 25, 30, 50, 100];

  const toggleYear = (year: string) => {
    const newSet = new Set(selectedYears);
    if (newSet.has(year)) {
      newSet.delete(year);
    } else {
      newSet.add(year);
    }
    setSelectedYears(newSet);
  };

  const selectAllYears = () => {
    setSelectedYears(new Set(years));
  };

  const clearAllYears = () => {
    setSelectedYears(new Set());
  };

  // 현재 선택된 카테고리에 따라 데이터 결정 (메모이제이션)
  const currentData = useMemo((): Book[] => {
    if (categoryType === '통합사회') {
      return 자세한통합사회_단원_태그;
    } else {
      // 사회탐구: 선택된 과목의 데이터 반환
      const subjectData = 마더텅_단원_태그.find((book) => book.id === selectedSubject);
      return subjectData ? [subjectData] : [];
    }
  }, [categoryType, selectedSubject]);

  // ChapterTree에서 선택된 ID들을 받아 저장
  const handleSelectionChange = useCallback(
    (selectedIds: string[]) => {
      onSelectionChange(selectedIds);
    },
    [onSelectionChange]
  );

  return (
    <div className="w-80 flex-shrink-0">
      <div className="bg-white rounded-lg shadow h-full flex flex-col">
        {/* 스크롤 가능한 필터 영역 */}
        <div className="flex-1 overflow-y-auto">
          {/* 문제 생성 버튼 - 스크롤해도 고정 */}
          <div className="sticky top-0 z-10 bg-white p-4 border-b border-gray-200 shadow-sm">
            <button
              onClick={onApplyFilter}
              className="w-full px-4 py-2 text-white rounded-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#ff00a1' }}
            >
              문제 생성
            </button>
          </div>

          <div className="p-4">
          {/* 카테고리 토글 */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">단원 선택</h3>
            <div className="flex items-center bg-gray-100 rounded-full p-0.5">
              <button
                onClick={() => setCategoryType('사회탐구')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  categoryType === '사회탐구' ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
                style={categoryType === '사회탐구' ? { color: '#ff00a1' } : {}}
              >
                사회탐구
              </button>
              <button
                onClick={() => setCategoryType('통합사회')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  categoryType === '통합사회' ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
                style={categoryType === '통합사회' ? { color: '#ff00a1' } : {}}
              >
                통합사회
              </button>
            </div>
          </div>

          {/* 사회탐구일 때 과목 선택 */}
          {categoryType === '사회탐구' && (
            <div className="mb-3">
              <label className="text-xs text-gray-600 block mb-1">과목</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value as SubjectType)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': '#ff00a1' } as React.CSSProperties}
              >
                {SUBJECTS.사회['2015교육과정'].map((subject) => {
                  // 마더텅_단원_태그에 해당 과목이 있는지 확인
                  const isAvailable = 마더텅_단원_태그.some((book) => book.id === subject);
                  return (
                    <option key={subject} value={subject} disabled={!isAvailable}>
                      {subject}
                      {!isAvailable && ' (준비 중)'}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {currentData.length > 0 ? (
            <ChapterTree data={currentData} onSelectionChange={handleSelectionChange} />
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">선택한 과목의 데이터가 준비 중입니다</div>
          )}
          </div>

          {/* 추가 필터들 */}
          <div className="p-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">추가 필터</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600">정답률 (%)</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="number"
                    placeholder="최소"
                    value={accuracyMin}
                    onChange={(e) => setAccuracyMin(e.target.value)}
                    min="0"
                    max="100"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                  <span className="text-gray-400">~</span>
                  <input
                    type="number"
                    placeholder="최대"
                    value={accuracyMax}
                    onChange={(e) => setAccuracyMax(e.target.value)}
                    min="0"
                    max="100"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-600">난이도</label>
                <select className="w-full px-2 py-1 text-sm border border-gray-300 rounded mt-1">
                  <option value="">전체</option>
                  <option value="easy">쉬움</option>
                  <option value="medium">보통</option>
                  <option value="hard">어려움</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-600 block mb-2">연도</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  <button
                    onClick={selectedYears.size === years.length ? clearAllYears : selectAllYears}
                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                      selectedYears.size === years.length
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={selectedYears.size === years.length ? { backgroundColor: '#ff00a1' } : {}}
                  >
                    모두
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {years.map((year) => (
                    <button
                      key={year}
                      onClick={() => toggleYear(year)}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                        selectedYears.has(year) ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      style={selectedYears.has(year) ? { backgroundColor: '#ff00a1' } : {}}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 문제수 */}
          <div className="p-4 border-t border-gray-200">
            <label className="text-xs text-gray-600 block mb-2">문제수</label>
            <div className="flex flex-wrap gap-2">
              {questionCounts.map((count) => (
                <button
                  key={count}
                  onClick={() => {
                    setQuestionCount(count);
                    setIsCustomInput(false);
                    setCustomCount('');
                  }}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    questionCount === count && !isCustomInput
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={questionCount === count && !isCustomInput ? { backgroundColor: '#ff00a1' } : {}}
                >
                  {count}
                </button>
              ))}
              <button
                onClick={() => {
                  setIsCustomInput(true);
                  setQuestionCount(null);
                }}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  isCustomInput ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={isCustomInput ? { backgroundColor: '#ff00a1' } : {}}
              >
                직접입력
              </button>
            </div>
            {isCustomInput && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  value={customCount}
                  onChange={(e) => setCustomCount(e.target.value)}
                  placeholder="숫자 입력"
                  className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': '#ff00a1' } as React.CSSProperties}
                  min="1"
                />
                <span className="text-xs text-gray-600">문제</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SocialLeftLayout;
