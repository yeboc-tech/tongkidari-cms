import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import SocialLeftLayout from '../components/template/SocialLeftLayout';
import { Supabase, type ProblemInfo } from '../api/Supabase';
import { PROBLEM_TAG_TYPES } from '../ssot/PROBLEM_TAG_TYPES';
import OneProblem from '../components/OneProblem';
import OneAnswer from '../components/OneAnswer';
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
  const [selectedYears, setSelectedYears] = useState<Set<string>>(
    new Set(['2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013'])
  );
  const selectedGrades = new Set(['고3']);
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<string>>(new Set(['상', '중', '하']));
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [accuracyMin, setAccuracyMin] = useState<string>('0');
  const [accuracyMax, setAccuracyMax] = useState<string>('100');
  const [searchResults, setSearchResults] = useState<ProblemInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFullViewDialog, setShowFullViewDialog] = useState(false);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);

  // ChapterTree에서 선택된 ID들을 받아 저장
  const handleSelectionChange = useCallback((selectedIds: string[]) => {
    setSelectedTagIds(selectedIds);
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
      // selectedTagIds가 있을 때만 검색
      if (selectedTagIds.length > 0) {
        // categoryType에 따라 적절한 태그 타입 선택
        const tagType = categoryType === '통합사회'
          ? PROBLEM_TAG_TYPES.DETAIL_TONGSA
          : PROBLEM_TAG_TYPES.MOTHER;

        // 1. 필터 조건으로 problem_id 목록 검색
        const problemIds = await Supabase.searchByFilter({
          type: tagType,
          tagIds: selectedTagIds,
          years: selectedYears.size > 0 ? Array.from(selectedYears) : undefined,
          grades: selectedGrades.size > 0 ? Array.from(selectedGrades) : undefined,
          accuracyMin: accuracyMin ? parseFloat(accuracyMin) : undefined,
          accuracyMax: accuracyMax ? parseFloat(accuracyMax) : undefined,
        });

        // 2. problem_id로 모든 정보 가져오기 (accuracy_rate + problem_tags)
        const problemInfos = await Supabase.fetchProblemInfoByIds(problemIds);

        // 3. 편집된 콘텐츠를 한 번에 조회 (문제 + 답안)
        const allResourceIds = problemInfos.flatMap(info => [
          info.problemId,
          info.problemId.replace('_문제', '_해설')
        ]);
        const editedContents = await Supabase.EditedContent.fetchByIds(allResourceIds);

        // 4. Map으로 변환하여 빠른 조회
        const editedMap = new Map(editedContents.map(ec => [ec.resource_id, ec]));

        // 5. problemInfos에 편집된 콘텐츠 추가
        const enrichedInfos = problemInfos.map(info => ({
          ...info,
          editedBase64: editedMap.get(info.problemId)?.base64,
          editedBBox: editedMap.get(info.problemId)?.json?.bbox,
          answerEditedBase64: editedMap.get(info.problemId.replace('_문제', '_해설'))?.base64,
          answerEditedBBox: editedMap.get(info.problemId.replace('_문제', '_해설'))?.json?.bbox,
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
          const partsA = lastTagA.split('-').map(p => parseInt(p, 10));
          const partsB = lastTagB.split('-').map(p => parseInt(p, 10));

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
                    editedBase64={problemInfo.editedBase64}
                    editedBBox={problemInfo.editedBBox}
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
                    integratedTag={searchResults[currentViewIndex].integratedTag}
                    customTags={searchResults[currentViewIndex].customTags}
                    tagsLoading={false}
                    editedBase64={searchResults[currentViewIndex].editedBase64}
                    editedBBox={searchResults[currentViewIndex].editedBBox}
                    mode="view"
                    onMotherTongSelect={() => {}}
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
                    editedBase64={searchResults[currentViewIndex].answerEditedBase64}
                    editedBBox={searchResults[currentViewIndex].answerEditedBBox}
                    mode="view"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SocialPlayground;
