import { useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import SocialLeftLayout from '../components/template/SocialLeftLayout';
import { Supabase, type ProblemInfo } from '../api/Supabase';
import { PROBLEM_TAG_TYPES } from '../ssot/PROBLEM_TAG_TYPES';
import OneProblem from '../components/OneProblem';
import { SUBJECTS } from '../ssot/subjects';
import { 마더텅_단원_태그 } from '../ssot/마더텅_단원_태그';

type CategoryType = '통합사회' | '사회탐구';
type SubjectType = (typeof SUBJECTS.사회['2015교육과정'])[number];

function SocialPlayground() {
  useAuth(); // 인증 체크

  // 첫 번째 사용 가능한 과목을 기본값으로 설정
  const getFirstAvailableSubject = (): SubjectType => {
    const availableSubject = SUBJECTS.사회['2015교육과정'].find((subject) =>
      마더텅_단원_태그.some((book) => book.id === subject)
    );
    return (availableSubject || SUBJECTS.사회['2015교육과정'][0]) as SubjectType;
  };

  const [categoryType, setCategoryType] = useState<CategoryType>('사회탐구');
  const [selectedSubject, setSelectedSubject] = useState<SubjectType>(getFirstAvailableSubject());
  const [selectedYears, setSelectedYears] = useState<Set<string>>(new Set());
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<string>>(new Set(['상', '중', '하']));
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [customCount, setCustomCount] = useState<string>('');
  const [isCustomInput, setIsCustomInput] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [accuracyMin, setAccuracyMin] = useState<string>('0');
  const [accuracyMax, setAccuracyMax] = useState<string>('100');
  const [includeAllTags, setIncludeAllTags] = useState(false);
  const [searchResults, setSearchResults] = useState<ProblemInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ChapterTree에서 선택된 ID들을 받아 저장
  const handleSelectionChange = useCallback((selectedIds: string[]) => {
    setSelectedTagIds(selectedIds);
  }, []);

  // 필터 적용 버튼 클릭 시 검색 수행
  const handleApplyFilter = async () => {
    setIsLoading(true);
    try {
      // 전체태그포함이 체크되었거나 selectedTagIds가 있을 때만 검색
      if (includeAllTags || selectedTagIds.length > 0) {
        // categoryType에 따라 적절한 태그 타입 선택
        const tagType = categoryType === '통합사회'
          ? PROBLEM_TAG_TYPES.DETAIL_TONGSA
          : PROBLEM_TAG_TYPES.MOTHER;

        // 1. 필터 조건으로 problem_id 목록 검색
        // 전체태그포함이면 null, 아니면 선택된 태그 ID 전달
        const problemIds = await Supabase.searchByFilter({
          type: tagType,
          tagIds: includeAllTags ? null : selectedTagIds,
          years: selectedYears.size > 0 ? Array.from(selectedYears) : undefined,
          accuracyMin: accuracyMin ? parseFloat(accuracyMin) : undefined,
          accuracyMax: accuracyMax ? parseFloat(accuracyMax) : undefined,
        });

        // 2. problem_id로 모든 정보 가져오기 (accuracy_rate + problem_tags)
        const problemInfos = await Supabase.fetchProblemInfoByIds(problemIds);

        setSearchResults(problemInfos);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('검색 실패:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)]">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">사회 Playground</h1>

      <div className="flex gap-6 h-full">
        {/* 왼쪽: 필터 패널 */}
        <SocialLeftLayout
          categoryType={categoryType}
          setCategoryType={setCategoryType}
          selectedSubject={selectedSubject}
          setSelectedSubject={setSelectedSubject}
          selectedYears={selectedYears}
          setSelectedYears={setSelectedYears}
          selectedDifficulties={selectedDifficulties}
          setSelectedDifficulties={setSelectedDifficulties}
          questionCount={questionCount}
          setQuestionCount={setQuestionCount}
          customCount={customCount}
          setCustomCount={setCustomCount}
          isCustomInput={isCustomInput}
          setIsCustomInput={setIsCustomInput}
          accuracyMin={accuracyMin}
          setAccuracyMin={setAccuracyMin}
          accuracyMax={accuracyMax}
          setAccuracyMax={setAccuracyMax}
          includeAllTags={includeAllTags}
          setIncludeAllTags={setIncludeAllTags}
          onSelectionChange={handleSelectionChange}
          onApplyFilter={handleApplyFilter}
        />

        {/* 오른쪽: 결과 이미지 리스트 */}
        <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">문제 목록</h2>
              <span className="text-sm text-gray-500">총 {searchResults.length}개</span>
            </div>
          </div>

          <div className="p-6 overflow-y-auto h-[calc(100%-4rem)]">
            {isLoading ? (
              /* 로딩 스피너 */
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#ff00a1' }}></div>
                  <p className="text-gray-600 text-sm">문제를 검색하고 있습니다...</p>
                </div>
              </div>
            ) : searchResults.length > 0 ? (
              /* 검색 결과 목록 */
              <div className="space-y-4">
                {searchResults.map((problemInfo) => (
                  <OneProblem
                    key={problemInfo.problemId}
                    questionNumber={problemInfo.questionNumber}
                    title={`문제 ${problemInfo.questionNumber}`}
                    problemId={problemInfo.problemId}
                    accuracyData={problemInfo.accuracyData}
                    accuracyLoading={false}
                    motherTongTag={problemInfo.motherTongTag}
                    integratedTag={problemInfo.integratedTag}
                    customTags={problemInfo.customTags}
                    tagsLoading={false}
                    mode="view"
                    onMotherTongSelect={() => {}}
                    onIntegratedSelect={() => {}}
                    onCustomTagsChange={() => {}}
                  />
                ))}
              </div>
            ) : (
              /* 결과 없음 상태 */
              <div className="text-center py-12">
                <p className="text-gray-400">필터를 적용하여 문제를 검색하세요</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SocialPlayground;
