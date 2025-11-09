import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SUBJECTS, GRADE_OPTIONS, CURRICULUM_GROUPS, type CategoryName, type CurriculumName } from '../constants/tableConfig';
import { ExamHistoryTable, CurriculumOverview } from '../components';
import { getExamHistory, MOCK_EXAM_COLUMNS, type ExamColumn, type ExamDataRow } from '../api/Api';

// 연도 목록 생성 (2013 ~ 2024)
const YEAR_OPTIONS = Array.from({ length: 12 }, (_, i) => 2013 + i);

// 초기 로딩을 위한 빈 데이터 생성
const createEmptyYearData = (year: number): ExamDataRow => ({
  year,
  data: Array(7).fill(null),
});

function SubjectPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const curriculum = searchParams.get('curriculum') as CurriculumName | null;
  const target = searchParams.get('target');
  const year = searchParams.get('year');
  const category = searchParams.get('category') as CategoryName | null;
  const subjectFromUrl = searchParams.get('subject');

  // 과목 목록 가져오기
  const subjects =
    category && curriculum && category in SUBJECTS && curriculum in SUBJECTS[category]
      ? SUBJECTS[category][curriculum]
      : [];

  // 시험 통계 데이터 상태
  const [selectedSubject, setSelectedSubject] = useState<string | null>(subjectFromUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [examColumns, setExamColumns] = useState<readonly ExamColumn[]>(MOCK_EXAM_COLUMNS);
  const [examData, setExamData] = useState<readonly ExamDataRow[]>(
    // 2013년부터 2024년까지 빈 데이터 생성
    Array.from({ length: 12 }, (_, i) => createEmptyYearData(2013 + i))
  );

  // 다이얼로그 상태
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleGoBack = () => {
    navigate('/');
  };

  // 과목 선택 핸들러
  const handleSubjectClick = (subject: string) => {
    setSelectedSubject(subject);

    // URL에 subject 파라미터 추가
    const newParams = new URLSearchParams(searchParams);
    newParams.set('subject', subject);
    navigate(`/subject?${newParams.toString()}`, { replace: true });
  };

  // 학년 변경 핸들러
  const handleGradeChange = (newGrade: string) => {
    // URL에 target 파라미터 업데이트
    const newParams = new URLSearchParams(searchParams);
    newParams.set('target', newGrade);
    navigate(`/subject?${newParams.toString()}`, { replace: true });
  };

  // 교육과정 변경 핸들러
  const handleCurriculumChange = (newCurriculum: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('curriculum', newCurriculum);
    navigate(`/subject?${newParams.toString()}`, { replace: true });
  };

  // 연도 변경 핸들러
  const handleYearChange = (newYear: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('year', newYear);
    navigate(`/subject?${newParams.toString()}`, { replace: true });
  };

  // 첫 번째 과목 자동 선택
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      const firstSubject = subjects[0] as string;
      setSelectedSubject(firstSubject);

      // URL에 subject 파라미터 추가
      const newParams = new URLSearchParams(searchParams);
      newParams.set('subject', firstSubject);
      navigate(`/subject?${newParams.toString()}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects.length]);

  // 과목 선택 시 시험 통계 데이터 불러오기
  useEffect(() => {
    if (!selectedSubject || !target) return;

    const fetchExamHistory = async () => {
      setIsLoading(true);
      try {
        // 2013년부터 2024년까지의 데이터 요청
        const years = Array.from({ length: 12 }, (_, i) => 2013 + i);
        const response = await getExamHistory({
          years,
          subject: selectedSubject,
          target,
        });
        setExamColumns(response.columns);
        setExamData(response.data);
      } catch (error) {
        console.error('Failed to fetch exam history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExamHistory();
  }, [selectedSubject, target]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">과목 상세</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setIsDialogOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            📅 교육과정 보기
          </button>
          <button
            onClick={handleGoBack}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            ← 뒤로 가기
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-lg shadow">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">카테고리</h3>
              <p className="text-xl font-bold text-gray-900">{category || '-'}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">교육과정</h3>
              <select
                value={curriculum || ''}
                onChange={(e) => handleCurriculumChange(e.target.value)}
                className="w-full text-xl font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-2 py-1 cursor-pointer"
              >
                {!curriculum && <option value="">선택하세요</option>}
                {CURRICULUM_GROUPS.map((group) => (
                  <option key={group.name} value={group.name}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">연도</h3>
              <select
                value={year || ''}
                onChange={(e) => handleYearChange(e.target.value)}
                className="w-full text-xl font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-orange-500 rounded px-2 py-1 cursor-pointer"
              >
                {!year && <option value="">선택하세요</option>}
                {YEAR_OPTIONS.map((yearOption) => (
                  <option key={yearOption} value={yearOption}>
                    {yearOption}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">과목 목록</h3>
            {subjects.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {subjects.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => handleSubjectClick(subject)}
                    className={`px-4 py-3 bg-white border-2 rounded-lg text-gray-900 font-medium transition-colors text-center ${
                      selectedSubject === subject
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-gray-50 rounded-lg">
                <p className="text-gray-600 text-center">
                  해당 카테고리와 교육과정에 등록된 과목이 없습니다.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">학년 선택</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {GRADE_OPTIONS.map((grade) => (
                <button
                  key={grade}
                  onClick={() => handleGradeChange(grade)}
                  className={`px-4 py-3 bg-white border-2 rounded-lg text-gray-900 font-medium transition-colors text-center ${
                    target === grade
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                  }`}
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 시험 통계 테이블 */}
      {selectedSubject && (
        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            연도별 문항 수 - {selectedSubject}, {target}
          </h2>
          <ExamHistoryTable
            columns={examColumns}
            data={examData}
            isLoading={isLoading}
            subject={selectedSubject || undefined}
            target={target || undefined}
            category={category || undefined}
          />
        </div>
      )}

      {/* 교육과정 다이얼로그 */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* 배경 오버레이 */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={() => setIsDialogOpen(false)}
            ></div>

            {/* 중앙 정렬을 위한 트릭 */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* 모달 컨텐츠 */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-7xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900" id="modal-title">
                    교육과정 개요
                  </h3>
                  <button
                    onClick={() => setIsDialogOpen(false)}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <span className="text-2xl">×</span>
                  </button>
                </div>
                <div className="mt-2">
                  <CurriculumOverview category={category || '카테고리'} />
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubjectPage;
