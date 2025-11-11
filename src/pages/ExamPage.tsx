import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ExamId } from '../domain/examId';
import { getQuestionImageUrls, getSolutionImageUrls } from '../constants/apiConfig';
import { ExamMetaLinks } from '../components';
import { Supabase } from '../api/Supabase';
import { AccuracyRate } from '../types/accuracyRate';
import { useAuth } from '../hooks/useAuth';
import CurriculumTagInput from '../components/tag-input/CurriculumTagInput/CurriculumTagInput';
import CustomTagInput from '../components/tag-input/CustomTagInput/CustomTagInput';
import { 마더텅_단원_태그 } from '../ssot/마더텅_단원_태그';
import { 자세한통합사회_단원_태그 } from '../ssot/curriculumStructure';
import { getRegionByExamInfo } from '../ssot/EXAM_REGION';
import { type Grade } from '../constants/tableConfig';
import { PROBLEM_TAG_TYPES, type ProblemTagType } from '../ssot/PROBLEM_TAG_TYPES';

interface SelectedTag {
  tagIds: string[];
  tagLabels: string[];
}

interface TagWithId {
  id: string;
  label: string;
}

function ExamPage() {
  useAuth(); // 인증 체크

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [accuracyRates, setAccuracyRates] = useState<Map<number, AccuracyRate>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showSolution, setShowSolution] = useState(false);

  // 태그 입력기 상태 관리 (문제 번호별)
  const [madertongTags, setMadertongTags] = useState<Map<number, SelectedTag | null>>(new Map());
  const [integratedTags, setIntegratedTags] = useState<Map<number, SelectedTag | null>>(new Map());
  const [customTagsMap, setCustomTagsMap] = useState<Map<number, TagWithId[]>>(new Map());
  const [tagsLoading, setTagsLoading] = useState(true);
  const [copiedQuestionNumber, setCopiedQuestionNumber] = useState<number | null>(null);

  // exam_id 파싱
  const examInfo = id ? ExamId.parse(id) : null;

  // 지역 정보 가져오기
  const regionInfo = examInfo
    ? getRegionByExamInfo(examInfo.year, examInfo.target as Grade, examInfo.month, examInfo.type)
    : '-';

  // 문제 이미지 URL 목록 생성 (1-20번)
  const questionImageUrls = id ? getQuestionImageUrls(id, 20) : [];
  // 해설 이미지 URL 목록 생성 (1-20번)
  const solutionImageUrls = id ? getSolutionImageUrls(id, 20) : [];

  // 현재 표시할 이미지 URL 목록
  const currentImageUrls = showSolution ? solutionImageUrls : questionImageUrls;

  // 지역 제거 함수
  const removeRegion = (examIdWithRegion: string): string => {
    return examIdWithRegion.replace(/\([^)]+\)$/, '');
  };

  // 문제 ID 생성 (exam_id + 문제번호)
  const getProblemId = (questionNumber: number): string => {
    if (!id) return '';
    const examIdWithoutRegion = removeRegion(id);
    return `${examIdWithoutRegion}_${questionNumber}_문제`;
  };

  // 태그 저장 함수
  const saveTags = async (questionNumber: number, type: ProblemTagType, tagIds: string[], tagLabels: string[]) => {
    const problemId = getProblemId(questionNumber);
    if (!problemId) return;

    try {
      // 태그가 비어있으면 삭제, 그렇지 않으면 upsert
      if (tagIds.length === 0) {
        await Supabase.ProblemTags.delete(problemId, type);
      } else {
        await Supabase.ProblemTags.upsert({
          problem_id: problemId,
          type,
          tag_ids: tagIds,
          tag_labels: tagLabels,
        });
      }
    } catch (error) {
      console.error('Error saving tags:', error);
    }
  };

  // accuracy_rate 데이터 가져오기
  useEffect(() => {
    if (!id) return;

    const fetchAccuracyRates = async () => {
      setLoading(true);
      const examIdWithoutRegion = removeRegion(id);

      // 1-20번 문제의 id 목록 생성
      const questionIds = Array.from(
        { length: 20 },
        (_, i) => `${examIdWithoutRegion}_${i + 1}_문제`
      );

      try {
        const data = await Supabase.AccuracyRates.fetch(questionIds);

        // 문제 번호를 키로 하는 Map 생성
        const ratesMap = new Map<number, AccuracyRate>();
        data.forEach((rate) => {
          // id에서 문제 번호 추출: "경제_고3_2024_03_학평_1_문제" -> 1
          const match = rate.id.match(/_(\d+)_문제$/);
          if (match) {
            const questionNumber = parseInt(match[1], 10);
            ratesMap.set(questionNumber, rate);
          }
        });
        setAccuracyRates(ratesMap);
      } catch (error) {
        console.error('Error fetching accuracy rates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccuracyRates();
  }, [id]);

  // 태그 데이터 가져오기
  useEffect(() => {
    if (!id) return;

    const fetchTags = async () => {
      setTagsLoading(true);
      const examIdWithoutRegion = removeRegion(id);

      // 1-20번 문제의 id 목록 생성
      const questionIds = Array.from(
        { length: 20 },
        (_, i) => `${examIdWithoutRegion}_${i + 1}_문제`
      );

      try {
        const data = await Supabase.ProblemTags.fetch(questionIds);

        const madertongMap = new Map<number, SelectedTag | null>();
        const integratedMap = new Map<number, SelectedTag | null>();
        const customMap = new Map<number, TagWithId[]>();

        data.forEach((tag) => {
          // problem_id에서 문제 번호 추출
          const match = tag.problem_id.match(/_(\d+)_문제$/);
          if (!match) return;

          const questionNumber = parseInt(match[1], 10);

          if (tag.type === PROBLEM_TAG_TYPES.MADERTONG) {
            madertongMap.set(questionNumber, {
              tagIds: tag.tag_ids,
              tagLabels: tag.tag_labels,
            });
          } else if (tag.type === PROBLEM_TAG_TYPES.INTEGRATED) {
            integratedMap.set(questionNumber, {
              tagIds: tag.tag_ids,
              tagLabels: tag.tag_labels,
            });
          } else if (tag.type === PROBLEM_TAG_TYPES.CUSTOM) {
            const customTags = tag.tag_ids.map((id, index) => ({
              id,
              label: tag.tag_labels[index],
            }));
            customMap.set(questionNumber, customTags);
          }
        });

        setMadertongTags(madertongMap);
        setIntegratedTags(integratedMap);
        setCustomTagsMap(customMap);
      } catch (error) {
        console.error('Error fetching tags:', error);
      } finally {
        setTagsLoading(false);
      }
    };

    fetchTags();
  }, [id]);

  const handleGoBack = () => {
    navigate(-1);
  };

  // 문제 ID 복사 핸들러
  const handleCopyProblemId = async (questionNumber: number) => {
    const problemId = getProblemId(questionNumber);
    if (!problemId) return;

    try {
      await navigator.clipboard.writeText(problemId);
      setCopiedQuestionNumber(questionNumber);

      // 1초 후 복사 상태 초기화
      setTimeout(() => {
        setCopiedQuestionNumber(null);
      }, 1000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // 태그 입력기 핸들러 함수들
  const handleMadertongSelect = (questionNumber: number) => async (tag: SelectedTag | null) => {
    // 낙관적 업데이트: UI 먼저 업데이트
    setMadertongTags((prev) => {
      const newMap = new Map(prev);
      newMap.set(questionNumber, tag);
      return newMap;
    });

    // 서버에 저장 (null이면 빈 배열로 전달하여 삭제)
    if (tag) {
      await saveTags(questionNumber, PROBLEM_TAG_TYPES.MADERTONG, tag.tagIds, tag.tagLabels);
    } else {
      await saveTags(questionNumber, PROBLEM_TAG_TYPES.MADERTONG, [], []);
    }
  };

  const handleIntegratedSelect = (questionNumber: number) => async (tag: SelectedTag | null) => {
    // 낙관적 업데이트: UI 먼저 업데이트
    setIntegratedTags((prev) => {
      const newMap = new Map(prev);
      newMap.set(questionNumber, tag);
      return newMap;
    });

    // 서버에 저장 (null이면 빈 배열로 전달하여 삭제)
    if (tag) {
      await saveTags(questionNumber, PROBLEM_TAG_TYPES.INTEGRATED, tag.tagIds, tag.tagLabels);
    } else {
      await saveTags(questionNumber, PROBLEM_TAG_TYPES.INTEGRATED, [], []);
    }
  };

  const handleCustomTagsChange = (questionNumber: number) => async (tags: TagWithId[]) => {
    // 낙관적 업데이트: UI 먼저 업데이트
    setCustomTagsMap((prev) => {
      const newMap = new Map(prev);
      newMap.set(questionNumber, tags);
      return newMap;
    });

    // 서버에 저장 (빈 배열이면 삭제)
    const tagIds = tags.map(t => t.id);
    const tagLabels = tags.map(t => t.label);
    await saveTags(questionNumber, PROBLEM_TAG_TYPES.CUSTOM, tagIds, tagLabels);
  };

  if (!examInfo) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-lg shadow">
          <h1 className="text-3xl font-bold text-red-600 mb-4">잘못된 시험 ID</h1>
          <p className="text-gray-600 mb-4">
            시험 정보를 찾을 수 없습니다. ID 형식을 확인해주세요.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            홈으로 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">시험 상세</h1>
        <button
          onClick={handleGoBack}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          ← 뒤로 가기
        </button>
      </div>

      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">시험 정보</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-600 mb-1">과목</h3>
            <p className="text-xl font-bold text-gray-900">{examInfo.subject}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-600 mb-1">학년</h3>
            <p className="text-xl font-bold text-gray-900">{examInfo.target}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-600 mb-1">연도</h3>
            <p className="text-xl font-bold text-gray-900">{examInfo.year}년</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-600 mb-1">시험 월</h3>
            <p className="text-xl font-bold text-gray-900">{examInfo.month}</p>
          </div>
          <div className="p-4 bg-pink-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-600 mb-1">시험 유형</h3>
            <p className="text-xl font-bold text-gray-900">{examInfo.type}</p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-600 mb-1">주관 지역</h3>
            <p className="text-xl font-bold text-gray-900">{regionInfo}</p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-600 mb-1">시험 ID</h3>
          <p className="text-sm font-mono text-gray-700 break-all">{id}</p>
        </div>
        <ExamMetaLinks examId={id!} />
      </div>

      <div className="bg-white p-8 rounded-lg shadow">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {showSolution ? '해설 목록' : '문제 목록'}
          </h2>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${!showSolution ? 'text-blue-600' : 'text-gray-500'}`}>
              문제 보기
            </span>
            <button
              onClick={() => setShowSolution(!showSolution)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                showSolution ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showSolution ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${showSolution ? 'text-blue-600' : 'text-gray-500'}`}>
              해설 보기
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentImageUrls.map((url, index) => {
            const questionNumber = index + 1;
            const accuracyData = accuracyRates.get(questionNumber);

            return (
              <div
                key={`${showSolution ? 'solution' : 'question'}-${questionNumber}`}
                className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {showSolution ? '해설' : '문제'} {questionNumber}
                  </h3>
                  <button
                    onClick={() => handleCopyProblemId(questionNumber)}
                    className={`
                      relative overflow-hidden px-3 py-1.5 rounded-full text-xs font-medium
                      transition-all duration-200 cursor-pointer font-mono
                      ${copiedQuestionNumber === questionNumber
                        ? 'bg-green-100 text-green-700 border-2 border-green-300'
                        : 'bg-gray-50 text-gray-700 border-2 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                      }
                    `}
                  >
                    <span className="relative z-10 flex items-center gap-1.5">
                      {copiedQuestionNumber === questionNumber ? (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          복사됨!
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          {getProblemId(questionNumber)}
                        </>
                      )}
                    </span>
                    {copiedQuestionNumber === questionNumber && (
                      <span className="absolute inset-0 bg-green-200 animate-ping opacity-75 rounded-full" />
                    )}
                  </button>
                </div>

                {/* 정확도 정보 */}
                {accuracyData && (
                  <div className="mb-3 grid grid-cols-4 gap-2 text-xs">
                    <div className="bg-blue-50 px-2 py-1 rounded">
                      <span className="text-gray-600">정답률</span>
                      <p className="font-semibold text-blue-700">
                        {accuracyData.accuracy_rate}%
                      </p>
                    </div>
                    <div className="bg-purple-50 px-2 py-1 rounded">
                      <span className="text-gray-600">난이도</span>
                      <p className="font-semibold text-purple-700">
                        {accuracyData.difficulty}
                      </p>
                    </div>
                    <div className="bg-green-50 px-2 py-1 rounded">
                      <span className="text-gray-600">점수</span>
                      <p className="font-semibold text-green-700">
                        {accuracyData.score}점
                      </p>
                    </div>
                    <div className="bg-orange-50 px-2 py-1 rounded">
                      <span className="text-gray-600">정답</span>
                      <p className="font-semibold text-orange-700">
                        {accuracyData.correct_answer}
                      </p>
                    </div>
                  </div>
                )}

                {loading && !accuracyData && (
                  <div className="mb-3 text-xs text-gray-500">
                    정확도 정보를 불러오는 중...
                  </div>
                )}

                {/* 태그 입력기 섹션 */}
                <div className="mb-4 space-y-3">
                  {tagsLoading ? (
                    <div className="text-xs text-gray-500 text-center py-2">
                      태그 정보를 불러오는 중...
                    </div>
                  ) : (
                    <>
                      <div className="border border-gray-200 rounded-lg p-3">
                        <CurriculumTagInput
                          data={마더텅_단원_태그}
                          onSelect={handleMadertongSelect(questionNumber)}
                          placeholder="마더텅 경제 단원 태그"
                          value={madertongTags.get(questionNumber) || null}
                        />
                      </div>

                      <div className="border border-gray-200 rounded-lg p-3">
                        <CurriculumTagInput
                          data={자세한통합사회_단원_태그}
                          onSelect={handleIntegratedSelect(questionNumber)}
                          placeholder="자세한통사 단원 태그"
                          value={integratedTags.get(questionNumber) || null}
                        />
                      </div>

                      <div className="border border-gray-200 rounded-lg p-3">
                        <CustomTagInput
                          onTagsChange={handleCustomTagsChange(questionNumber)}
                          placeholder="커스텀 태그"
                          tags={customTagsMap.get(questionNumber) || []}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={url}
                    alt={`${showSolution ? '해설' : '문제'} ${questionNumber}`}
                    className="w-full h-auto"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="flex items-center justify-center h-48 text-gray-500">
                            <div class="text-center">
                              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p class="mt-2 text-sm">이미지를 불러올 수 없습니다</p>
                            </div>
                          </div>
                        `;
                      }
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ExamPage;
