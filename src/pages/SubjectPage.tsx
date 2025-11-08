import { useSearchParams, useNavigate } from 'react-router-dom';
import { SUBJECTS, type CategoryName, type CurriculumName } from '../constants/tableConfig';
import { EXAM_COLUMNS, EXAM_DATA } from '../constants/examData';
import { ExamHistoryTable } from '../components';

function SubjectPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const curriculum = searchParams.get('curriculum') as CurriculumName | null;
  const target = searchParams.get('target');
  const year = searchParams.get('year');
  const category = searchParams.get('category') as CategoryName | null;

  // 과목 목록 가져오기
  const subjects =
    category && curriculum && category in SUBJECTS && curriculum in SUBJECTS[category]
      ? SUBJECTS[category][curriculum]
      : [];

  const handleGoBack = () => {
    if (category) {
      navigate(`/category/${category}`);
    } else {
      navigate('/');
    }
  };

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
              <p className="text-xl font-bold text-gray-900">{target || '-'}</p>
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
                    className="px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-900 font-medium hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
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
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">연도별 문항 수</h2>
        <ExamHistoryTable columns={EXAM_COLUMNS} data={EXAM_DATA} />
      </div>
    </div>
  );
}

export default SubjectPage;
