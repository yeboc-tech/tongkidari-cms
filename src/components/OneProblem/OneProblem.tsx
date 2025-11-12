import { useState, useEffect } from 'react';
import MotherTongTagInput from '../molecules/MotherTongTagInput';
import DetailTongsaTagInput from '../molecules/DetailTongsaTagInput';
import CustomTagInput from '../tag-input/CustomTagInput/CustomTagInput';
import BBoxEditor from '../BBoxEditor/BBoxEditor';
import { AccuracyRate } from '../../types/accuracyRate';
import { getQuestionImageUrl } from '../../constants/apiConfig';
import { Api, type BBox } from '../../api/Api';
import { type ProblemMetadata } from '../../api/Api';
import { Supabase } from '../../api/Supabase';
import { getProblemPageFilename } from '../../ssot/examMetaUrl';
import { HOST_URL } from '../../constants/apiConfig';

// ========== Types ==========

export interface SelectedTag {
  tagIds: string[];
  tagLabels: string[];
}

export interface TagWithId {
  id: string;
  label: string;
}

export interface OneProblemProps {
  // 기본 정보
  questionNumber: number;
  title: string; // 예: "문제 1"
  problemId: string;

  // 정확도 데이터
  accuracyData?: AccuracyRate;
  accuracyLoading: boolean;

  // 태그 데이터
  motherTongTag: SelectedTag | null;
  integratedTag: SelectedTag | null;
  customTags: TagWithId[];
  tagsLoading: boolean;

  // 모드 ('edit' | 'view')
  mode?: 'edit' | 'view';

  // 편집된 이미지 (base64)
  editedBase64?: string;
  // 편집된 BBox
  editedBBox?: BBox;

  // 이벤트 핸들러
  onMotherTongSelect: (tag: SelectedTag | null) => void;
  onIntegratedSelect: (tag: SelectedTag | null) => void;
  onCustomTagsChange: (tags: TagWithId[]) => void;
}

// ========== Component ==========

function OneProblem({
  questionNumber,
  title,
  problemId,
  accuracyData,
  accuracyLoading,
  motherTongTag: motherTongTag,
  integratedTag,
  customTags,
  tagsLoading,
  mode = 'edit',
  editedBase64,
  editedBBox,
  onMotherTongSelect: onMotherTongSelect,
  onIntegratedSelect,
  onCustomTagsChange,
}: OneProblemProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [showBBoxEditor, setShowBBoxEditor] = useState(false);
  const [problemMetadata, setProblemMetadata] = useState<ProblemMetadata | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [currentBase64, setCurrentBase64] = useState<string | undefined>(editedBase64);
  const [currentBBox, setCurrentBBox] = useState<BBox | undefined>(editedBBox);
  const [showDeleteSnackbar, setShowDeleteSnackbar] = useState(false);
  const [showSaveSnackbar, setShowSaveSnackbar] = useState(false);

  // editedBase64와 editedBBox prop 변경 시 state 업데이트
  useEffect(() => {
    setCurrentBase64(editedBase64);
  }, [editedBase64]);

  useEffect(() => {
    setCurrentBBox(editedBBox);
  }, [editedBBox]);

  // problemId에서 examId 추출: "경제_고3_2024_03_학평_1_문제" -> "경제_고3_2024_03_학평"
  const examId = problemId.replace(/_\d+_문제$/, '');

  // problemId에서 subject 추출: "경제_고3_2024_03_학평_1_문제" -> "경제"
  const subject = problemId.split('_')[0];

  // 문제 이미지 URL 생성 (base64가 있으면 우선 사용)
  const imageUrl = currentBase64
    ? `data:image/png;base64,${currentBase64}`
    : getQuestionImageUrl(examId, questionNumber);

  // 이미지 클릭 핸들러
  const handleImageClick = async () => {
    // editedBBox가 있으면 CSV 조회 없이 바로 에디터 열기
    if (currentBBox) {
      setShowBBoxEditor(true);
      return;
    }

    // editedBBox가 없으면 CSV에서 메타데이터 가져오기
    setLoadingMetadata(true);
    try {
      const metadata = await Api.Meta.fetchProblemMetadata(problemId);
      if (metadata) {
        setProblemMetadata(metadata);
        setShowBBoxEditor(true);
      } else {
        alert('문제 메타데이터를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('Failed to fetch problem metadata:', error);
      alert('문제 메타데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoadingMetadata(false);
    }
  };

  // Problem Page 이미지 URL 생성
  const getProblemPageUrl = (page: number): string => {
    const filename = getProblemPageFilename(examId, page + 1); // page는 0-indexed이므로 +1
    return `${HOST_URL}/tongkidari/meta/${filename}`;
  };

  // BBox 확인 핸들러
  const handleBBoxConfirm = async (file: File, bbox: BBox) => {
    try {
      // File을 base64로 변환
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // data:image/png;base64, 부분 제거
          const base64String = result.split(',')[1];
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Supabase에 bbox와 base64 저장
      await Supabase.EditedContent.upsertBBox(problemId, bbox, base64);

      // 저장 후 즉시 이미지와 bbox 업데이트
      setCurrentBase64(base64);
      setCurrentBBox(bbox);

      // Snackbar 표시
      setShowSaveSnackbar(true);
      setTimeout(() => {
        setShowSaveSnackbar(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to save bbox:', error);
      alert('BBox 저장에 실패했습니다.');
    }
  };

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

  // 편집된 이미지 삭제 핸들러
  const handleDeleteEditedImage = async () => {
    if (!window.confirm('편집된 이미지를 지우시겠습니까?')) {
      return;
    }

    try {
      await Supabase.EditedContent.delete(problemId);

      // 삭제 후 원본 이미지로 복원
      setCurrentBase64(undefined);
      setCurrentBBox(undefined);

      // Snackbar 표시
      setShowDeleteSnackbar(true);
      setTimeout(() => {
        setShowDeleteSnackbar(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to delete edited image:', error);
      alert('이미지 삭제에 실패했습니다.');
    }
  };

  return (
    <div
      className={`border-2 rounded-lg p-4 transition-colors ${
        currentBase64 ? 'border-yellow-200 hover:border-yellow-400' : 'border-gray-200 hover:border-blue-500'
      }`}
    >
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

      {/* 태그 섹션 */}
      <div className="mb-4 space-y-3">
        {tagsLoading ? (
          <div className="text-xs text-gray-500 text-center py-2">태그 정보를 불러오는 중...</div>
        ) : mode === 'edit' ? (
          <>
            {/* Edit 모드: 태그 입력기 */}
            <MotherTongTagInput subject={subject} onSelect={onMotherTongSelect} value={motherTongTag} />
            <DetailTongsaTagInput onSelect={onIntegratedSelect} value={integratedTag} />
            <CustomTagInput onTagsChange={onCustomTagsChange} placeholder="커스텀 태그" tags={customTags} subject={subject} />
          </>
        ) : (
          <>
            {/* View 모드: 태그 라벨만 표시 */}
            {/* 마더텅 단원 태그 */}
            <div>
              <label className="text-xs text-gray-600 block mb-1.5">MT {subject} 단원 태그</label>
              <div className="flex flex-wrap gap-2">
                {motherTongTag && motherTongTag.tagLabels.length > 0 ? (
                  <span
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{ backgroundColor: '#fce7ec', color: '#e34f6e' }}
                  >
                    {motherTongTag.tagLabels.join(' > ')}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">MT 단원 태그가 없습니다</span>
                )}
              </div>
            </div>

            {/* 자세한통사 단원 태그 */}
            <div>
              <label className="text-xs text-gray-600 block mb-1.5">자세한통사 단원 태그</label>
              <div className="flex flex-wrap gap-2">
                {integratedTag && integratedTag.tagLabels.length > 0 ? (
                  <span
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{ backgroundColor: '#d1fae5', color: '#10b981' }}
                  >
                    {integratedTag.tagLabels.join(' > ')}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">자세한통사 단원 태그가 없습니다</span>
                )}
              </div>
            </div>

            {/* 커스텀 태그 */}
            <div>
              <label className="text-xs text-gray-600 block mb-1.5">커스텀 태그</label>
              <div className="flex flex-wrap gap-2">
                {customTags && customTags.length > 0 ? (
                  customTags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                    >
                      {tag.label}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">커스텀 태그가 없습니다</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 문제 이미지 */}
      <div className="bg-gray-100 rounded-lg overflow-hidden relative">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-auto cursor-pointer hover:opacity-80 transition-opacity"
          loading="lazy"
          onClick={handleImageClick}
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
        {/* 편집된 이미지 삭제 버튼 */}
        {currentBase64 && (
          <button
            onClick={handleDeleteEditedImage}
            className="absolute bottom-1 right-1 bg-gray-600/40 hover:bg-gray-700/60 text-white rounded-full w-6 h-6 flex items-center justify-center transition-all shadow-md text-lg leading-none"
            title="편집된 이미지 삭제"
          >
            ×
          </button>
        )}
      </div>

      {/* Loading Indicator */}
      {loadingMetadata && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">
            <p>메타데이터를 불러오는 중...</p>
          </div>
        </div>
      )}

      {/* BBox Editor Modal */}
      {showBBoxEditor && (currentBBox || problemMetadata) && (
        <BBoxEditor
          imageUrl={getProblemPageUrl((currentBBox || problemMetadata!.bbox).page)}
          bbox={currentBBox || problemMetadata!.bbox}
          onClose={() => setShowBBoxEditor(false)}
          onConfirm={handleBBoxConfirm}
          problemId={problemId}
        />
      )}

      {/* Save Success Snackbar */}
      {showSaveSnackbar && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>BBox와 이미지가 저장되었습니다</span>
          </div>
        </div>
      )}

      {/* Delete Success Snackbar */}
      {showDeleteSnackbar && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>편집된 이미지가 삭제되었습니다</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default OneProblem;
