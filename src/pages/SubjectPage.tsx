import { useSearchParams, useNavigate } from 'react-router-dom';

function SubjectPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const curriculum = searchParams.get('curriculum');
  const target = searchParams.get('target');
  const year = searchParams.get('year');
  const category = searchParams.get('category');

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

          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">과목 정보</h3>
            <p className="text-gray-600">
              여기에 {target} {curriculum} ({year}년) 과목 정보가 표시됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubjectPage;
