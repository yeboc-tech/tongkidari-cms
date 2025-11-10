import { useAuth } from '../hooks/useAuth';

function TestPage() {
  useAuth(); // 인증 체크

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">테스트 페이지</h1>

      <div className="bg-white p-8 rounded-lg shadow">
        <p className="text-gray-600">테스트 페이지입니다.</p>
      </div>
    </div>
  );
}

export default TestPage;
