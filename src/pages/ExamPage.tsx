import { useParams, useNavigate } from 'react-router-dom';
import { ExamId } from '../domain/examId';
import { getQuestionImageUrls } from '../constants/apiConfig';

function ExamPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // exam_id 파싱
  const examInfo = id ? ExamId.parse(id) : null;

  // 문제 이미지 URL 목록 생성 (1-20번)
  const questionImageUrls = id ? getQuestionImageUrls(id, 20) : [];

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {questionImageUrls.map((url, index) => {
            const questionNumber = index + 1;
            return (
              <div
                key={questionNumber}
                className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    문제 {questionNumber}
                  </h3>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    새 탭에서 열기
                  </a>
                </div>
                <div className="bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={url}
                    alt={`문제 ${questionNumber}`}
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
