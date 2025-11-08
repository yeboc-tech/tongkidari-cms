import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SUBJECTS, GRADE_OPTIONS, type CategoryName, type CurriculumName } from '../constants/tableConfig';
import { ExamHistoryTable } from '../components';
import { getExamHistory, MOCK_EXAM_COLUMNS, type ExamColumn, type ExamDataRow } from '../api/Api';

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

  const handleGoBack = () => {
    if (category) {
      navigate(`/category/${category}`);
    } else {
      navigate('/');
    }
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
        <button
          onClick={handleGoBack}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          ← 뒤로 가기
        </button>
      </div>

      <div className="bg-white p-8 rounded-lg shadow">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">카테고리</h3>
              <p className="text-xl font-bold text-gray-900">{category || '-'}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">교육과정</h3>
              <p className="text-xl font-bold text-gray-900">{curriculum || '-'}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">학년</h3>
              <select
                value={target || ''}
                onChange={(e) => handleGradeChange(e.target.value)}
                className="w-full text-xl font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-2 py-1 cursor-pointer"
              >
                {!target && <option value="">선택하세요</option>}
                {GRADE_OPTIONS.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">연도</h3>
              <p className="text-xl font-bold text-gray-900">{year || '-'}</p>
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
        </div>
      </div>

      {/* 시험 통계 테이블 */}
      {selectedSubject && (
        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            연도별 문항 수 - {selectedSubject}
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
    </div>
  );
}

export default SubjectPage;
