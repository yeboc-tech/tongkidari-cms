import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import SocialLeftLayout from '../components/template/SocialLeftLayout';
import { Supabase, type ProblemInfo } from '../api/Supabase';
import OneProblem from '../components/OneProblem';
import OneAnswer from '../components/OneAnswer';
import ErrorSnackbar from '../components/Snackbar/ErrorSnackbar';
import { SUBJECTS } from '../ssot/subjects';
import { 마더텅_단원_태그 } from '../ssot/마더텅_단원_태그';
import type { SelectedChapterItem } from '../components/ChapterTree/ChapterTree';
import type { ProblemFilterItem } from '../types/ProblemFilterItem';

type CategoryType = '통합사회' | '사회탐구';
type SubjectType = (typeof SUBJECTS.사회)['2015교육과정'][number];

function SocialPlayground() {
  useAuth(); // 인증 체크

  // 첫 번째 사용 가능한 과목을 기본값으로 설정
  const getFirstAvailableSubject = (): SubjectType => {
    const availableSubject = SUBJECTS.사회['2015교육과정'].find((subject) =>
      마더텅_단원_태그.some((book) => book.id === subject),
    );
    return (availableSubject || SUBJECTS.사회['2015교육과정'][0]) as SubjectType;
  };

  const [categoryType, setCategoryType] = useState<CategoryType>('사회탐구');
  const [selectedSubject, setSelectedSubject] = useState<SubjectType>(getFirstAvailableSubject());
  const [selectedYears, setSelectedYears] = useState<Set<string>>(
    new Set(['2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013']),
  );
  const selectedGrades = new Set(['고3']);
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<string>>(new Set(['상', '중', '하']));
  const [selectedChapterItems, setSelectedChapterItems] = useState<SelectedChapterItem[]>([]);
  const [accuracyMin, setAccuracyMin] = useState<string>('0');
  const [accuracyMax, setAccuracyMax] = useState<string>('100');
  const [searchResults, setSearchResults] = useState<ProblemInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFullViewDialog, setShowFullViewDialog] = useState(false);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ChapterTree에서 선택된 아이템들(id + tagType)을 받아 저장
  const handleSelectionChange = useCallback((selectedItems: SelectedChapterItem[]) => {
    setSelectedChapterItems(selectedItems);
  }, []);

  // 키보드 방향키로 문제 이동
  useEffect(() => {
    if (!showFullViewDialog) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        // 이전 문제
        setCurrentViewIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        // 다음 문제
        setCurrentViewIndex((prev) => Math.min(searchResults.length - 1, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFullViewDialog, searchResults.length]);

  // 필터 적용 버튼 클릭 시 검색 수행
  const handleApplyFilter = async () => {
    setIsLoading(true);
    try {
      // Early return: selectedChapterItems가 없으면 빈 결과 반환
      if (selectedChapterItems.length === 0) {
        setSearchResults([]);
        return;
      }

      // tagType별로 그룹화 (id에서 tagType 제거)
      const filterMap = new Map<string, string[]>();
      selectedChapterItems.forEach((item) => {
        // id는 "tagType.originalId" 형태이므로 tagType 부분을 제거
        const originalId = item.id.replace(`${item.tagType}.`, '');

        if (!filterMap.has(item.tagType)) {
          filterMap.set(item.tagType, []);
        }
        filterMap.get(item.tagType)!.push(originalId);
      });

      // 공통 필터 조건
      const commonYears = selectedYears.size > 0 ? Array.from(selectedYears) : undefined;
      const commonGrades = selectedGrades.size > 0 ? Array.from(selectedGrades) : undefined;
      const commonAccuracyMin = accuracyMin ? parseFloat(accuracyMin) : undefined;
      const commonAccuracyMax = accuracyMax ? parseFloat(accuracyMax) : undefined;

      // 필터 아이템 배열 생성
      const filters: ProblemFilterItem[] = Array.from(filterMap.entries()).map(([tagType, tagIds]) => ({
        type: tagType as any, // ProblemTagType으로 캐스팅 필요
        tagIds,
        grades: commonGrades,
        years: commonYears,
        accuracyMin: commonAccuracyMin,
        accuracyMax: commonAccuracyMax,
      }));

      filters.map((filter) => {
        // filter.type = '단원_사회탐구_경제';
        console.log(filter);
      });

      // 1. 다중 필터 조건으로 problem_id 목록 검색
      const problemIds = await Supabase.searchByFilterItems({ filters });

      // 2. problem_id로 모든 정보 가져오기 (accuracy_rate + problem_tags)
      const problemInfos = await Supabase.fetchProblemInfoByIds(problemIds);

      // 3. 편집된 콘텐츠를 한 번에 조회 (문제 + 답안) - base64 제외
      const allResourceIds = problemInfos.flatMap((info) => [info.problemId, info.problemId.replace('_문제', '_해설')]);
      const editedContents = await Supabase.EditedContent.fetchWithoutBase64ByIds(allResourceIds);

      // 4. Map으로 변환하여 빠른 조회
      const editedMap = new Map(editedContents.map((ec) => [ec.resource_id, ec]));

      // 5. problemInfos에 편집된 콘텐츠 추가
      const enrichedInfos = problemInfos.map((info) => ({
        ...info,
        hasEditedProblem: editedMap.has(info.problemId),
        editedBBox: editedMap.get(info.problemId)?.json,
        hasEditedAnswer: editedMap.has(info.problemId.replace('_문제', '_해설')),
        answerEditedBBox: editedMap.get(info.problemId.replace('_문제', '_해설'))?.json,
      }));

      // 6. tag_ids의 마지막 태그로 정렬
      const sortedInfos = enrichedInfos.sort((a, b) => {
        // categoryType에 따라 적절한 태그 선택
        const tagA = categoryType === '통합사회' ? a.integratedTag : a.motherTongTag;
        const tagB = categoryType === '통합사회' ? b.integratedTag : b.motherTongTag;

        // 태그가 없는 경우 처리
        if (!tagA?.tagIds.length && !tagB?.tagIds.length) return 0;
        if (!tagA?.tagIds.length) return 1; // a를 뒤로
        if (!tagB?.tagIds.length) return -1; // b를 뒤로

        // 마지막 tagId 가져오기
        const lastTagA = tagA.tagIds[tagA.tagIds.length - 1];
        const lastTagB = tagB.tagIds[tagB.tagIds.length - 1];

        // '-'로 split하여 숫자 배열로 변환
        const partsA = lastTagA.split('-').map((p) => parseInt(p, 10));
        const partsB = lastTagB.split('-').map((p) => parseInt(p, 10));

        // 각 파트를 순서대로 비교
        const maxLength = Math.max(partsA.length, partsB.length);
        for (let i = 0; i < maxLength; i++) {
          const numA = partsA[i] || 0;
          const numB = partsB[i] || 0;
          if (numA !== numB) {
            return numA - numB;
          }
        }

        return 0;
      });

      setSearchResults(sortedInfos);
    } catch (error) {
      console.error('검색 실패:', error);
      setSearchResults([]);

      // 에러 메시지 설정
      let errorMsg = '문제 검색 중 오류가 발생했습니다.';
      if (error instanceof Error) {
        errorMsg += `\n${error.message}`;
      } else if (typeof error === 'object' && error !== null) {
        const err = error as any;
        if (err.message) {
          errorMsg += `\n${err.message}`;
        }
        if (err.code) {
          errorMsg += `\n(오류 코드: ${err.code})`;
        }
      }
      setErrorMessage(errorMsg);
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
          selectedGrades={selectedGrades}
          selectedDifficulties={selectedDifficulties}
          setSelectedDifficulties={setSelectedDifficulties}
          accuracyMin={accuracyMin}
          setAccuracyMin={setAccuracyMin}
          accuracyMax={accuracyMax}
          setAccuracyMax={setAccuracyMax}
          onSelectionChange={handleSelectionChange}
          onApplyFilter={handleApplyFilter}
        />

        {/* 오른쪽: 결과 이미지 리스트 */}
        <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">문제 목록</h2>
              <div className="flex items-center gap-2">
                {searchResults.length > 0 && (
                  <button
                    onClick={() => {
                      setCurrentViewIndex(0);
                      setShowFullViewDialog(true);
                    }}
                    className="px-3 py-1 text-xs rounded border-2 transition-all hover:bg-pink-50"
                    style={{ borderColor: '#ff00a1', color: '#ff00a1' }}
                  >
                    해설보기
                  </button>
                )}
                <span className="text-sm text-gray-500">{searchResults.length}문제</span>
              </div>
            </div>
          </div>

          <div className="p-6 overflow-y-auto h-[calc(100%-4rem)]">
            {isLoading ? (
              /* 로딩 스피너 */
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div
                    className="animate-spin rounded-full h-12 w-12 border-b-2"
                    style={{ borderColor: '#ff00a1' }}
                  ></div>
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
                    saTamTag={problemInfo.saTamTag}
                    integratedTag={problemInfo.integratedTag}
                    customTags={problemInfo.customTags}
                    tagsLoading={false}
                    isEdited={problemInfo.hasEditedProblem}
                    editedBBox={problemInfo.editedBBox}
                    mode="view"
                    onMotherTongSelect={() => {}}
                    onSaTamSelect={() => {}}
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

      {/* 해설보기 다이얼로그 */}
      {showFullViewDialog && searchResults.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[95vw] h-[95vh] flex flex-col">
            {/* 헤더 */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                해설보기 ({currentViewIndex + 1} / {searchResults.length})
              </h2>
              <button
                onClick={() => setShowFullViewDialog(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* 네비게이션 */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-center gap-4">
              <button
                onClick={() => setCurrentViewIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentViewIndex === 0}
                className="px-4 py-2 text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: currentViewIndex === 0 ? '#e0e0e0' : '#ff00a1', color: 'white' }}
              >
                이전
              </button>
              <span className="text-sm text-gray-600">
                {currentViewIndex + 1} / {searchResults.length}
              </span>
              <button
                onClick={() => setCurrentViewIndex((prev) => Math.min(searchResults.length - 1, prev + 1))}
                disabled={currentViewIndex === searchResults.length - 1}
                className="px-4 py-2 text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: currentViewIndex === searchResults.length - 1 ? '#e0e0e0' : '#ff00a1',
                  color: 'white',
                }}
              >
                다음
              </button>
            </div>

            {/* 문제/답안 영역 */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* 왼쪽: 문제 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">문제</h3>
                  <OneProblem
                    questionNumber={searchResults[currentViewIndex].questionNumber}
                    title={`문제 ${searchResults[currentViewIndex].questionNumber}`}
                    problemId={searchResults[currentViewIndex].problemId}
                    accuracyData={searchResults[currentViewIndex].accuracyData}
                    accuracyLoading={false}
                    motherTongTag={searchResults[currentViewIndex].motherTongTag}
                    saTamTag={searchResults[currentViewIndex].saTamTag}
                    integratedTag={searchResults[currentViewIndex].integratedTag}
                    customTags={searchResults[currentViewIndex].customTags}
                    tagsLoading={false}
                    isEdited={searchResults[currentViewIndex].hasEditedProblem}
                    editedBBox={searchResults[currentViewIndex].editedBBox}
                    mode="view"
                    onMotherTongSelect={() => {}}
                    onSaTamSelect={() => {}}
                    onIntegratedSelect={() => {}}
                    onCustomTagsChange={() => {}}
                  />
                </div>

                {/* 오른쪽: 답안 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">답안</h3>
                  <OneAnswer
                    questionNumber={searchResults[currentViewIndex].questionNumber}
                    title={`답안 ${searchResults[currentViewIndex].questionNumber}`}
                    answerId={searchResults[currentViewIndex].problemId.replace('_문제', '_해설')}
                    isEdited={searchResults[currentViewIndex].hasEditedAnswer}
                    editedBBox={searchResults[currentViewIndex].answerEditedBBox}
                    mode="view"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 에러 스낵바 */}
      {errorMessage && <ErrorSnackbar message={errorMessage} onClose={() => setErrorMessage(null)} />}
    </div>
  );
}

export default SocialPlayground;
