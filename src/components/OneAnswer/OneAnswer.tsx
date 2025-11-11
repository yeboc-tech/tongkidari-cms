import { useState } from 'react';
import MotherTongTagInput from '../molecules/MotherTongTagInput';
import DetailTongsaTagInput from '../molecules/DetailTongsaTagInput';
import CustomTagInput from '../tag-input/CustomTagInput/CustomTagInput';
import { AccuracyRate } from '../../types/accuracyRate';
import { getSolutionImageUrl } from '../../constants/apiConfig';

// ========== Types ==========

export interface SelectedTag {
  tagIds: string[];
  tagLabels: string[];
}

export interface TagWithId {
  id: string;
  label: string;
}

export interface OneAnswerProps {
  // 기본 정보
  questionNumber: number;
  title: string; // 예: "해설 1"
  problemId: string;

  // 정확도 데이터
  accuracyData?: AccuracyRate;
  accuracyLoading: boolean;

  // 태그 데이터
  motherTongTag: SelectedTag | null;
  integratedTag: SelectedTag | null;
  customTags: TagWithId[];
  tagsLoading: boolean;

  // 이벤트 핸들러
  onMotherTongSelect: (tag: SelectedTag | null) => void;
  onIntegratedSelect: (tag: SelectedTag | null) => void;
  onCustomTagsChange: (tags: TagWithId[]) => void;
}

// ========== Component ==========

function OneAnswer({
  questionNumber,
  title,
  problemId,
  accuracyData,
  accuracyLoading,
  motherTongTag: motherTongTag,
  integratedTag,
  customTags,
  tagsLoading,
  onMotherTongSelect: onMotherTongSelect,
  onIntegratedSelect,
  onCustomTagsChange,
}: OneAnswerProps) {
  const [isCopied, setIsCopied] = useState(false);

  // problemId에서 examId 추출: "경제_고3_2024_03_학평_1_문제" -> "경제_고3_2024_03_학평"
  const examId = problemId.replace(/_\d+_문제$/, '');

  // problemId에서 subject 추출: "경제_고3_2024_03_학평_1_문제" -> "경제"
  const subject = problemId.split('_')[0];

  // 해설 이미지 URL 생성
  const imageUrl = getSolutionImageUrl(examId, questionNumber);

  // 복사 핸들러
  const handleCopyProblemId = async () => {
    try {
      await navigator.clipboard.writeText(problemId);
      setIsCopied(true);

      // 1초 후 복사 상태 초기화
      setTimeout(() => {
        setIsCopied(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors">
      {/* 헤더: 제목과 복사 버튼 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button
          onClick={handleCopyProblemId}
          className={`
            relative overflow-hidden px-3 py-1.5 rounded-full text-xs font-medium
            transition-all duration-200 cursor-pointer font-mono
            ${
              isCopied
                ? 'bg-green-100 text-green-700 border-2 border-green-300'
                : 'bg-gray-50 text-gray-700 border-2 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
            }
          `}
        >
          <span className="relative z-10 flex items-center gap-1.5">
            {isCopied ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                복사됨!
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                {problemId}
              </>
            )}
          </span>
          {isCopied && <span className="absolute inset-0 bg-green-200 animate-ping opacity-75 rounded-full" />}
        </button>
      </div>

      {/* 정확도 정보 */}
      {accuracyData && (
        <div className="mb-3 grid grid-cols-4 gap-2 text-xs">
          <div className="bg-blue-50 px-2 py-1 rounded">
            <span className="text-gray-600">정답률</span>
            <p className="font-semibold text-blue-700">{accuracyData.accuracy_rate}%</p>
          </div>
          <div className="bg-purple-50 px-2 py-1 rounded">
            <span className="text-gray-600">난이도</span>
            <p className="font-semibold text-purple-700">{accuracyData.difficulty}</p>
          </div>
          <div className="bg-green-50 px-2 py-1 rounded">
            <span className="text-gray-600">점수</span>
            <p className="font-semibold text-green-700">{accuracyData.score}점</p>
          </div>
          <div className="bg-orange-50 px-2 py-1 rounded">
            <span className="text-gray-600">정답</span>
            <p className="font-semibold text-orange-700">{accuracyData.correct_answer}</p>
          </div>
        </div>
      )}

      {accuracyLoading && !accuracyData && (
        <div className="mb-3 text-xs text-gray-500">정확도 정보를 불러오는 중...</div>
      )}

      {/* 태그 입력기 섹션 */}
      <div className="mb-4 space-y-3">
        {tagsLoading ? (
          <div className="text-xs text-gray-500 text-center py-2">태그 정보를 불러오는 중...</div>
        ) : (
          <>
            {/* 마더텅 단원 태그 */}
            <MotherTongTagInput subject={subject} onSelect={onMotherTongSelect} value={motherTongTag} />

            {/* 자세한통사 단원 태그 */}
            <DetailTongsaTagInput onSelect={onIntegratedSelect} value={integratedTag} />

            {/* 커스텀 태그 */}
            <CustomTagInput onTagsChange={onCustomTagsChange} placeholder="커스텀 태그" tags={customTags} />
          </>
        )}
      </div>

      {/* 해설 이미지 */}
      <div className="bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
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
}

export default OneAnswer;
