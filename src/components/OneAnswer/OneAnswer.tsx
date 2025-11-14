import { useState, useEffect } from 'react';
import MotherTongTagInput from '../molecules/MotherTongTagInput';
import DetailTongsaTagInput from '../molecules/DetailTongsaTagInput';
import CustomTagInput from '../tag-input/CustomTagInput/CustomTagInput';
import BBoxEditor from '../BBoxEditor/BBoxEditor';
import { AccuracyRate } from '../../types/accuracyRate';
import { getSolutionImageUrl } from '../../constants/apiConfig';
import { Api, type BBox } from '../../api/Api';
import { type ProblemMetadata } from '../../api/Api';
import { Supabase } from '../../api/Supabase';
import { getAnswerPageFilename } from '../../ssot/examMetaUrl';
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

export interface OneAnswerProps {
  // 기본 정보
  questionNumber: number;
  title: string; // 예: "해설 1"
  problemId: string;
  answerId: string;

  // 모드
  mode?: 'edit' | 'view';

  // 정확도 데이터
  accuracyData?: AccuracyRate;
  accuracyLoading?: boolean;

  // 태그 데이터
  motherTongTag?: SelectedTag | null;
  integratedTag?: SelectedTag | null;
  customTags?: TagWithId[];
  tagsLoading?: boolean;

  // 편집된 이미지 (base64)
  editedBase64?: string;

  // 편집된 BBox
  editedBBox?: BBox;

  // 이벤트 핸들러
  onMotherTongSelect?: (tag: SelectedTag | null) => void;
  onIntegratedSelect?: (tag: SelectedTag | null) => void;
  onCustomTagsChange?: (tags: TagWithId[]) => void;
}

// ========== Component ==========

function OneAnswer({
  questionNumber,
  title,
  problemId,
  answerId,
  mode = 'edit',
  accuracyData,
  accuracyLoading = false,
  motherTongTag = null,
  integratedTag = null,
  customTags = [],
  tagsLoading = false,
  editedBase64,
  editedBBox,
  onMotherTongSelect = () => {},
  onIntegratedSelect = () => {},
  onCustomTagsChange = () => {},
}: OneAnswerProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [showBBoxEditor, setShowBBoxEditor] = useState(false);
  const [problemMetadata, setProblemMetadata] = useState<ProblemMetadata | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [currentBase64, setCurrentBase64] = useState<string | undefined>(editedBase64);
  const [currentBBox, setCurrentBBox] = useState<BBox | undefined>(editedBBox);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedFile, setDraggedFile] = useState<File | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);

  // editedBase64와 editedBBox prop 변경 시 state 업데이트
  useEffect(() => {
    setCurrentBase64(editedBase64);
  }, [editedBase64]);

  useEffect(() => {
    setCurrentBBox(editedBBox);
  }, [editedBBox]);

  // answerId에서 examId 추출: "경제_고3_2024_03_학평_1_해설" -> "경제_고3_2024_03_학평"
  const examId = answerId.replace(/_\d+_해설$/, '');

  // answerId에서 subject 추출: "경제_고3_2024_03_학평_1_해설" -> "경제"
  const subject = answerId.split('_')[0];

  // 해설 이미지 URL 생성 (base64가 있으면 우선 사용)
  const imageUrl = currentBase64
    ? `data:image/png;base64,${currentBase64}`
    : getSolutionImageUrl(examId, questionNumber);

  // 이미지 클릭 핸들러
  const handleImageClick = async () => {
    // view 모드에서는 이미지 클릭 불가
    if (mode === 'view') {
      return;
    }

    // editedBBox가 있으면 CSV 조회 없이 바로 에디터 열기
    if (currentBBox) {
      setShowBBoxEditor(true);
      return;
    }

    // editedBBox가 없으면 해설 CSV에서 메타데이터 가져오기
    setLoadingMetadata(true);
    try {
      const metadata = await Api.Meta.fetchAnswerMetadata(answerId);
      if (metadata) {
        // bbox가 비어있으면 1번 페이지 기본값 설정
        if (metadata.bbox.length === 0) {
          metadata.bbox = [{ page: 0, x0: 50, y0: 50, x1: 100, y1: 100 }];
        }
        setProblemMetadata(metadata);
        setShowBBoxEditor(true);
      } else {
        alert('해설 메타데이터를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('Failed to fetch answer metadata:', error);
      alert('해설 메타데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoadingMetadata(false);
    }
  };

  // Answer Page 이미지 URL 생성
  const getAnswerPageUrl = (page: number): string => {
    const filename = getAnswerPageFilename(examId, page + 1); // page는 0-indexed이므로 +1
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

      // Supabase에 bbox와 base64 저장 (answerId 사용)
      await Supabase.EditedContent.upsertBBox(answerId, bbox, base64);

      // 저장 후 즉시 이미지와 bbox 업데이트
      setCurrentBase64(base64);
      setCurrentBBox(bbox);

      alert('BBox와 이미지가 저장되었습니다.');
    } catch (error) {
      console.error('Failed to save bbox:', error);
      alert('BBox 저장에 실패했습니다.');
    }
  };

  // 복사 핸들러
  const handleCopyAnswerId = async () => {
    try {
      await navigator.clipboard.writeText(answerId);
      setIsCopied(true);

      // 1초 후 복사 상태 초기화
      setTimeout(() => {
        setIsCopied(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget;
    const relatedTarget = e.relatedTarget as Node | null;
    if (!target.contains(relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setDraggedFile(file);
        const previewUrl = URL.createObjectURL(file);
        setUploadPreviewUrl(previewUrl);
        setShowUploadDialog(true);
      } else {
        alert('이미지 파일만 업로드할 수 있습니다.');
      }
    }
  };

  const handleConfirmUpload = async () => {
    if (!draggedFile) return;

    try {
      // File을 base64로 변환
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64String = result.split(',')[1];
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(draggedFile);
      });

      // Supabase에 base64만 저장
      await Supabase.EditedContent.upsertBase64Only(answerId, base64);

      // 업로드 후 이미지 업데이트
      setCurrentBase64(base64);

      // 다이얼로그 닫기 및 정리
      setShowUploadDialog(false);
      if (uploadPreviewUrl) {
        URL.revokeObjectURL(uploadPreviewUrl);
      }
      setUploadPreviewUrl(null);
      setDraggedFile(null);

      alert('이미지가 업로드되었습니다.');
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('이미지 업로드에 실패했습니다.');
    }
  };

  const handleCancelUpload = () => {
    setShowUploadDialog(false);
    if (uploadPreviewUrl) {
      URL.revokeObjectURL(uploadPreviewUrl);
    }
    setUploadPreviewUrl(null);
    setDraggedFile(null);
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
          onClick={handleCopyAnswerId}
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
                {answerId}
              </>
            )}
          </span>
          {isCopied && <span className="absolute inset-0 bg-green-200 animate-ping opacity-75 rounded-full" />}
        </button>
      </div>

      {/* 정확도 정보 - edit 모드에서만 표시 */}
      {mode === 'edit' && accuracyData && (
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

      {mode === 'edit' && accuracyLoading && !accuracyData && (
        <div className="mb-3 text-xs text-gray-500">정확도 정보를 불러오는 중...</div>
      )}

      {/* 태그 입력기 섹션 - edit 모드에서만 표시 */}
      {mode === 'edit' && (
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
              <CustomTagInput onTagsChange={onCustomTagsChange} placeholder="커스텀 태그" tags={customTags} subject={subject} />
            </>
          )}
        </div>
      )}

      {/* 해설 이미지 */}
      <div
        className="bg-gray-100 rounded-lg overflow-hidden relative"
        onDragEnter={mode === 'edit' ? handleDragEnter : undefined}
        onDragLeave={mode === 'edit' ? handleDragLeave : undefined}
        onDragOver={mode === 'edit' ? handleDragOver : undefined}
        onDrop={mode === 'edit' ? handleDrop : undefined}
      >
        <img
          src={imageUrl}
          alt={title}
          className={`w-full h-auto transition-opacity ${mode === 'edit' ? 'cursor-pointer hover:opacity-80' : ''}`}
          loading="lazy"
          onClick={mode === 'edit' ? handleImageClick : undefined}
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

        {/* Drag Overlay - edit 모드에서만 표시 */}
        {mode === 'edit' && isDragging && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-4 border-blue-500 border-dashed rounded-lg flex items-center justify-center z-40">
            <div className="bg-white px-6 py-4 rounded-lg shadow-lg">
              <svg className="w-12 h-12 mx-auto mb-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-lg font-semibold text-gray-700">이미지를 여기에 놓으세요</p>
            </div>
          </div>
        )}
      </div>

      {/* Loading Indicator - edit 모드에서만 표시 */}
      {mode === 'edit' && loadingMetadata && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">
            <p>메타데이터를 불러오는 중...</p>
          </div>
        </div>
      )}

      {/* BBox Editor Modal - edit 모드에서만 표시 */}
      {mode === 'edit' && showBBoxEditor && (currentBBox || (problemMetadata && problemMetadata.bbox.length > 0)) && (
        <BBoxEditor
          imageUrl={getAnswerPageUrl((currentBBox || problemMetadata!.bbox[0]).page)}
          bbox={currentBBox ? [currentBBox] : problemMetadata!.bbox}
          onClose={() => setShowBBoxEditor(false)}
          onConfirm={handleBBoxConfirm}
          problemId={answerId}
          getPageUrl={getAnswerPageUrl}
        />
      )}

      {/* Upload Confirmation Dialog - edit 모드에서만 표시 */}
      {mode === 'edit' && showUploadDialog && uploadPreviewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">이미지 업로드 확인</h3>
              <div className="mb-4 bg-gray-100 rounded-lg overflow-hidden">
                <img src={uploadPreviewUrl} alt="Upload preview" className="w-full h-auto" />
              </div>
              <p className="text-gray-700 mb-6">해당 이미지로 업로드하시겠습니까?</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancelUpload}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmUpload}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  업로드
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OneAnswer;
