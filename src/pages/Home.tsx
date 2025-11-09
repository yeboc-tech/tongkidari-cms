import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Auth from '../lib/Auth';

function Home() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 세션스토리지 체크 후 자동 리다이렉트
  useEffect(() => {
    if (Auth.isAuthenticated()) {
      navigate('/category/사회', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (Auth.login(password)) {
      setError('');
      navigate('/category/사회');
    } else {
      setError('비밀번호가 일치하지 않습니다.');
      setPassword('');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-gray-900">
          Yeboc Tongkidari CMS
        </h1>
        <p className="text-xl text-gray-500">
          Content Management System
        </p>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-8 space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}
          <button
            type="submit"
            className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            확인
          </button>
        </form>
      </div>
    </div>
  );
}

export default Home
