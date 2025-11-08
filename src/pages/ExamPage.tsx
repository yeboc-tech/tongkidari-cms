import { useParams, useNavigate } from 'react-router-dom';
import { ID_SPECIFICATION } from '../constants/examIdConfig';

function ExamPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // exam_id 파싱
  const examInfo = id ? ID_SPECIFICATION.parse(id) : null;

  const handleGoBack = () => {
    navigate(-1);
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
            <p className="text-xl font-bold text-gray-900">{examInfo.region}</p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-600 mb-1">시험 ID</h3>
          <p className="text-sm font-mono text-gray-700 break-all">{id}</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">문제 목록</h2>
        <div className="p-6 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-center">
            문제 목록 기능은 준비 중입니다.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ExamPage;
