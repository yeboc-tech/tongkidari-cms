import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { ExamId } from '../domain/examId';
import { ExamMetaLinks } from '../components';
import { Supabase } from '../api/Supabase';
import { Api, type BBox } from '../api/Api';
import { type PdfListMap } from '../api/Api';
import { AccuracyRate } from '../types/accuracyRate';
import { useAuth } from '../hooks/useAuth';
import OneProblem, { type SelectedTag, type TagWithId } from '../components/OneProblem/OneProblem';
import OneAnswer from '../components/OneAnswer/OneAnswer';
import FixedButton from '../components/FixedButton/FixedButton';
import { getRegionByExamInfo } from '../ssot/EXAM_REGION';
import { type Grade } from '../constants/tableConfig';
import { PROBLEM_TAG_TYPES, type ProblemTagType } from '../ssot/PROBLEM_TAG_TYPES';

function ExamPage() {
  useAuth(); // 인증 체크

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const problemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [accuracyRates, setAccuracyRates] = useState<Map<number, AccuracyRate>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showSolution, setShowSolution] = useState(false);
  const [pdfListMap, setPdfListMap] = useState<PdfListMap>({});

  // 태그 입력기 상태 관리 (문제 번호별)
  const [madertongTags, setMtTags] = useState<Map<number, SelectedTag | null>>(new Map());
  const [saTamTags, setSaTamTags] = useState<Map<number, SelectedTag | null>>(new Map());
  const [integratedTags, setIntegratedTags] = useState<Map<number, SelectedTag | null>>(new Map());
  const [customTagsMap, setCustomTagsMap] = useState<Map<number, TagWithId[]>>(new Map());
  const [tagsLoading, setTagsLoading] = useState(true);

  // 편집된 콘텐츠 상태 (문제 ID별 base64와 bbox 맵)
  const [editedProblemBase64Map, setEditedProblemBase64Map] = useState<Map<string, string>>(new Map());
  const [editedProblemBBoxMap, setEditedProblemBBoxMap] = useState<Map<string, BBox[]>>(new Map());

  // 편집된 해설 콘텐츠 상태 (해설 ID별 base64와 bbox 맵)
  const [editedAnswerBase64Map, setEditedAnswerBase64Map] = useState<Map<string, string>>(new Map());
  const [editedAnswerBBoxMap, setEditedAnswerBBoxMap] = useState<Map<string, BBox[]>>(new Map());

  // exam_id 파싱
  const examInfo = id ? ExamId.parse(id) : null;

  // 지역 정보 가져오기
  const regionInfo = examInfo
    ? getRegionByExamInfo(examInfo.year, examInfo.target as Grade, examInfo.month, examInfo.type)
    : '-';

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

  // 해설 ID 생성 (exam_id + 문제번호)
  const getAnswerId = (questionNumber: number): string => {
    if (!id) return '';
    const examIdWithoutRegion = removeRegion(id);
    return `${examIdWithoutRegion}_${questionNumber}_해설`;
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
      const questionIds = Array.from({ length: 20 }, (_, i) => `${examIdWithoutRegion}_${i + 1}_문제`);

      try {
        const data = await Supabase.AccuracyRates.fetch(questionIds);

        // 문제 번호를 키로 하는 Map 생성
        const ratesMap = new Map<number, AccuracyRate>();
        data.forEach((rate) => {
          // problem_id에서 문제 번호 추출: "경제_고3_2024_03_학평_1_문제" -> 1
          const match = rate.problem_id.match(/_(\d+)_문제$/);
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

  // PDF 목록 가져오기
  useEffect(() => {
    const fetchPdfList = async () => {
      try {
        const pdfMap = await Api.Pdf.generatePdfFileMap();
        setPdfListMap(pdfMap);
      } catch (error) {
        console.error('Error fetching PDF list:', error);
      }
    };

    fetchPdfList();
  }, []);

  // 태그 데이터 가져오기
  useEffect(() => {
    if (!id) return;

    const fetchTags = async () => {
      setTagsLoading(true);
      const examIdWithoutRegion = removeRegion(id);

      // 1-20번 문제의 id 목록 생성
      const questionIds = Array.from({ length: 20 }, (_, i) => `${examIdWithoutRegion}_${i + 1}_문제`);

      try {
        const data = await Supabase.ProblemTags.fetch(questionIds);

        const mtTagMap = new Map<number, SelectedTag | null>();
        const saTamMap = new Map<number, SelectedTag | null>();
        const integratedMap = new Map<number, SelectedTag | null>();
        const customMap = new Map<number, TagWithId[]>();

        // examInfo에서 subject 추출
        const subject = examInfo?.subject;
        const saTamType = subject ? `단원_사회탐구_${subject}` : null;

        data.forEach((tag) => {
          // problem_id에서 문제 번호 추출
          const match = tag.problem_id.match(/_(\d+)_문제$/);
          if (!match) return;

          const questionNumber = parseInt(match[1], 10);

          if (tag.type === PROBLEM_TAG_TYPES.MOTHER) {
            mtTagMap.set(questionNumber, {
              tagIds: tag.tag_ids,
              tagLabels: tag.tag_labels,
            });
          } else if (saTamType && tag.type === saTamType) {
            saTamMap.set(questionNumber, {
              tagIds: tag.tag_ids,
              tagLabels: tag.tag_labels,
            });
          } else if (tag.type === PROBLEM_TAG_TYPES.DETAIL_TONGSA) {
            integratedMap.set(questionNumber, {
              tagIds: tag.tag_ids,
              tagLabels: tag.tag_labels,
            });
          } else if (tag.type === PROBLEM_TAG_TYPES.CUSTOM_TONGSA) {
            const customTags = tag.tag_ids.map((id, index) => ({
              id,
              label: tag.tag_labels[index],
            }));
            customMap.set(questionNumber, customTags);
          }
        });

        setMtTags(mtTagMap);
        setSaTamTags(saTamMap);
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

  // 편집된 문제 + 해설 콘텐츠 한 번에 조회
  useEffect(() => {
    if (!id) return;

    const fetchEditedContents = async () => {
      const examIdWithoutRegion = removeRegion(id);

      // 1-20번 문제 + 해설의 id 목록 생성 (총 40개)
      const allResourceIds = Array.from({ length: 20 }, (_, i) => {
        const num = i + 1;
        return [
          `${examIdWithoutRegion}_${num}_문제`,
          `${examIdWithoutRegion}_${num}_해설`,
        ];
      }).flat();

      try {
        const editedContents = await Supabase.EditedContent.fetchWithoutBase64ByIds(allResourceIds);

        const problemHasEditedMap = new Map<string, boolean>();
        const problemBBoxMap = new Map<string, BBox[]>();
        const answerHasEditedMap = new Map<string, boolean>();
        const answerBBoxMap = new Map<string, BBox[]>();

        editedContents.forEach((ec) => {
          const isProblem = ec.resource_id.endsWith('_문제');

          if (isProblem) {
            problemHasEditedMap.set(ec.resource_id, true);
            if (ec.json) {
              problemBBoxMap.set(ec.resource_id, ec.json);
            }
          } else {
            answerHasEditedMap.set(ec.resource_id, true);
            if (ec.json) {
              answerBBoxMap.set(ec.resource_id, ec.json);
            }
          }
        });

        // base64 Map은 CDN URL을 저장하도록 변경
        const problemBase64Map = new Map<string, string>();
        const answerBase64Map = new Map<string, string>();

        // 모든 리소스에 대해 CDN URL 생성
        allResourceIds.forEach((resourceId) => {
          const isProblem = resourceId.endsWith('_문제');
          const hasEdited = isProblem
            ? problemHasEditedMap.has(resourceId)
            : answerHasEditedMap.has(resourceId);

          const cdnUrl = `https://cdn.y3c.kr/tongkidari/${hasEdited ? 'edited-contents' : 'contents'}/${resourceId}.png`;

          if (isProblem) {
            problemBase64Map.set(resourceId, cdnUrl);
          } else {
            answerBase64Map.set(resourceId, cdnUrl);
          }
        });

        setEditedProblemBase64Map(problemBase64Map);
        setEditedProblemBBoxMap(problemBBoxMap);
        setEditedAnswerBase64Map(answerBase64Map);
        setEditedAnswerBBoxMap(answerBBoxMap);
      } catch (error) {
        console.error('Error fetching edited contents:', error);
      }
    };

    fetchEditedContents();
  }, [id]);

  // problem_number 쿼리 파라미터로 특정 문제로 스크롤
  useEffect(() => {
    const problemNumber = searchParams.get('problem_number');
    if (!problemNumber || tagsLoading || loading) return;

    const targetProblemNumber = parseInt(problemNumber, 10);
    if (isNaN(targetProblemNumber) || targetProblemNumber < 1 || targetProblemNumber > 20) return;

    // 문제 ref가 설정될 때까지 약간의 지연
    const timer = setTimeout(() => {
      const element = problemRefs.current.get(targetProblemNumber);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // 스크롤 후 쿼리 파라미터 제거
        setSearchParams({});
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [searchParams, tagsLoading, loading, setSearchParams]);

  const handleGoBack = () => {
    navigate(-1);
  };

  // 태그 입력기 핸들러 함수들
  const handleMadertongSelect = (questionNumber: number) => async (tag: SelectedTag | null) => {
    // 낙관적 업데이트: UI 먼저 업데이트
    setMtTags((prev) => {
      const newMap = new Map(prev);
      newMap.set(questionNumber, tag);
      return newMap;
    });

    // 서버에 저장 (null이면 빈 배열로 전달하여 삭제)
    if (tag) {
      await saveTags(questionNumber, PROBLEM_TAG_TYPES.MOTHER, tag.tagIds, tag.tagLabels);
    } else {
      await saveTags(questionNumber, PROBLEM_TAG_TYPES.MOTHER, [], []);
    }
  };

  const handleSaTamSelect = (questionNumber: number) => async (tag: SelectedTag | null) => {
    // 낙관적 업데이트: UI 먼저 업데이트
    setSaTamTags((prev) => {
      const newMap = new Map(prev);
      newMap.set(questionNumber, tag);
      return newMap;
    });

    // subject로 tagType 생성
    const subject = examInfo?.subject;
    if (!subject) return;
    const saTamType = `단원_사회탐구_${subject}` as ProblemTagType;

    // 서버에 저장 (null이면 빈 배열로 전달하여 삭제)
    if (tag) {
      await saveTags(questionNumber, saTamType, tag.tagIds, tag.tagLabels);
    } else {
      await saveTags(questionNumber, saTamType, [], []);
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
      await saveTags(questionNumber, PROBLEM_TAG_TYPES.DETAIL_TONGSA, tag.tagIds, tag.tagLabels);
    } else {
      await saveTags(questionNumber, PROBLEM_TAG_TYPES.DETAIL_TONGSA, [], []);
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
    const tagIds = tags.map((t) => t.id);
    const tagLabels = tags.map((t) => t.label);
    await saveTags(questionNumber, PROBLEM_TAG_TYPES.CUSTOM_TONGSA, tagIds, tagLabels);
  };

  if (!examInfo) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-lg shadow">
          <h1 className="text-3xl font-bold text-red-600 mb-4">잘못된 시험 ID</h1>
          <p className="text-gray-600 mb-4">시험 정보를 찾을 수 없습니다. ID 형식을 확인해주세요.</p>
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
        <ExamMetaLinks examId={id!} pdfInfo={id ? pdfListMap[removeRegion(id)] || null : null} />
      </div>

      <div className="bg-white p-8 rounded-lg shadow">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{showSolution ? '해설 목록' : '문제 목록'}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 20 }, (_, index) => {
            const questionNumber = index + 1;
            const accuracyData = accuracyRates.get(questionNumber);
            const problemId = getProblemId(questionNumber);
            const answerId = getAnswerId(questionNumber);

            // 공통 props (편집 관련 제외)
            const commonProps = {
              questionNumber,
              problemId,
              answerId,
              accuracyData,
              accuracyLoading: loading,
              motherTongTag: madertongTags.get(questionNumber) || null,
              saTamTag: saTamTags.get(questionNumber) || null,
              integratedTag: integratedTags.get(questionNumber) || null,
              customTags: customTagsMap.get(questionNumber) || [],
              tagsLoading,
              onMotherTongSelect: handleMadertongSelect(questionNumber),
              onSaTamSelect: handleSaTamSelect(questionNumber),
              onIntegratedSelect: handleIntegratedSelect(questionNumber),
              onCustomTagsChange: handleCustomTagsChange(questionNumber),
            };

            // OneProblem에만 전달되는 편집 관련 props
            const problemEditProps = {
              editedBase64: editedProblemBase64Map.get(problemId),
              editedBBox: editedProblemBBoxMap.get(problemId),
            };

            // OneAnswer에만 전달되는 편집 관련 props
            const answerEditProps = {
              editedBase64: editedAnswerBase64Map.get(answerId),
              editedBBox: editedAnswerBBoxMap.get(answerId),
            };

            return (
              <div
                key={`${showSolution ? 'solution' : 'question'}-${questionNumber}`}
                ref={(el) => {
                  if (el) {
                    problemRefs.current.set(questionNumber, el);
                  }
                }}
              >
                {showSolution ? (
                  <OneAnswer {...commonProps} {...answerEditProps} title={`해설 ${questionNumber}`} />
                ) : (
                  <OneProblem {...commonProps} {...problemEditProps} title={`문제 ${questionNumber}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fixed Toggle Button */}
      <FixedButton
        isToggled={showSolution}
        onToggle={() => setShowSolution(!showSolution)}
        leftLabel="문제"
        rightLabel="해설"
      />
    </div>
  );
}

export default ExamPage;
