import { useAuth } from '../hooks/useAuth';

function SciencePlayground() {
  useAuth(); // 인증 체크

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">과학 Playground</h1>

      <div className="bg-white p-8 rounded-lg shadow">
        <p className="text-gray-600">
          과학 과목 관련 실험 및 테스트 공간입니다.
        </p>
      </div>
    </div>
  );
}

export default SciencePlayground;
