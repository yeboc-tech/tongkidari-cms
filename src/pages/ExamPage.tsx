import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ExamId } from '../domain/examId';
import { getQuestionImageUrls, getSolutionImageUrls } from '../constants/apiConfig';
import { ExamMetaLinks } from '../components';
import { supabase } from '../lib/supabase';
import { AccuracyRate } from '../types/accuracyRate';
import { useAuth } from '../hooks/useAuth';

function ExamPage() {
  useAuth(); // 인증 체크

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [accuracyRates, setAccuracyRates] = useState<Map<number, AccuracyRate>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showSolution, setShowSolution] = useState(false);

  // exam_id 파싱
  const examInfo = id ? ExamId.parse(id) : null;

  // 문제 이미지 URL 목록 생성 (1-20번)
  const questionImageUrls = id ? getQuestionImageUrls(id, 20) : [];
  // 해설 이미지 URL 목록 생성 (1-20번)
  const solutionImageUrls = id ? getSolutionImageUrls(id, 20) : [];

  // 현재 표시할 이미지 URL 목록
  const currentImageUrls = showSolution ? solutionImageUrls : questionImageUrls;

  // 지역 제거 함수
  const removeRegion = (examIdWithRegion: string): string => {
    return examIdWithRegion.replace(/\([^)]+\)$/, '');
  };

  // accuracy_rate 데이터 가져오기
  useEffect(() => {
    if (!id) return;

    const fetchAccuracyRates = async () => {
      setLoading(true);
      const examIdWithoutRegion = removeRegion(id);

      // 1-20번 문제의 id 목록 생성
      const questionIds = Array.from(
        { length: 20 },
        (_, i) => `${examIdWithoutRegion}_${i + 1}_문제`
      );

      const { data, error } = await supabase
        .from('accuracy_rate')
        .select('*')
        .in('id', questionIds);

      if (error) {
        console.error('Error fetching accuracy rates:', error);
      } else if (data) {
        // 문제 번호를 키로 하는 Map 생성
        const ratesMap = new Map<number, AccuracyRate>();
        data.forEach((rate) => {
          // id에서 문제 번호 추출: "경제_고3_2024_03_학평_1_문제" -> 1
          const match = rate.id.match(/_(\d+)_문제$/);
          if (match) {
            const questionNumber = parseInt(match[1], 10);
            ratesMap.set(questionNumber, rate);
          }
        });
        setAccuracyRates(ratesMap);
      }
      setLoading(false);
    };

    fetchAccuracyRates();
  }, [id]);

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
        <ExamMetaLinks examId={id!} />
      </div>

      <div className="bg-white p-8 rounded-lg shadow">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {showSolution ? '해설 목록' : '문제 목록'}
          </h2>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${!showSolution ? 'text-blue-600' : 'text-gray-500'}`}>
              문제 보기
            </span>
            <button
              onClick={() => setShowSolution(!showSolution)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                showSolution ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showSolution ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${showSolution ? 'text-blue-600' : 'text-gray-500'}`}>
              해설 보기
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentImageUrls.map((url, index) => {
            const questionNumber = index + 1;
            const accuracyData = accuracyRates.get(questionNumber);

            return (
              <div
                key={`${showSolution ? 'solution' : 'question'}-${questionNumber}`}
                className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {showSolution ? '해설' : '문제'} {questionNumber}
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

                {/* 정확도 정보 */}
                {accuracyData && (
                  <div className="mb-3 grid grid-cols-4 gap-2 text-xs">
                    <div className="bg-blue-50 px-2 py-1 rounded">
                      <span className="text-gray-600">정답률</span>
                      <p className="font-semibold text-blue-700">
                        {accuracyData.accuracy_rate}%
                      </p>
                    </div>
                    <div className="bg-purple-50 px-2 py-1 rounded">
                      <span className="text-gray-600">난이도</span>
                      <p className="font-semibold text-purple-700">
                        {accuracyData.difficulty}
                      </p>
                    </div>
                    <div className="bg-green-50 px-2 py-1 rounded">
                      <span className="text-gray-600">점수</span>
                      <p className="font-semibold text-green-700">
                        {accuracyData.score}점
                      </p>
                    </div>
                    <div className="bg-orange-50 px-2 py-1 rounded">
                      <span className="text-gray-600">정답</span>
                      <p className="font-semibold text-orange-700">
                        {accuracyData.correct_answer}
                      </p>
                    </div>
                  </div>
                )}

                {loading && !accuracyData && (
                  <div className="mb-3 text-xs text-gray-500">
                    정확도 정보를 불러오는 중...
                  </div>
                )}

                <div className="bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={url}
                    alt={`${showSolution ? '해설' : '문제'} ${questionNumber}`}
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
