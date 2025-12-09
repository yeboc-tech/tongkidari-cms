import { useState, useEffect } from 'react';
import MotherTongTagInput from '../molecules/MotherTongTagInput';
import DetailTongsaTagInput from '../molecules/DetailTongsaTagInput';
import SaTamTagInput from '../molecules/SaTamTagInput/SaTamTagInput';
import CustomTagInput from '../tag-input/CustomTagInput/CustomTagInput';
import BBoxEditor from '../BBoxEditor/BBoxEditor';
import ErrorSnackbar from '../Snackbar/ErrorSnackbar';
import SuccessSnackbar from '../Snackbar/SuccessSnackbar';
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
  saTamTag: SelectedTag | null;
  integratedTag: SelectedTag | null;
  customTags: TagWithId[];
  tagsLoading: boolean;

  // 모드 ('edit' | 'view')
  mode?: 'edit' | 'view';

  // 편집된 콘텐츠 여부
  isEdited?: boolean;
  // 편집된 BBox 배열
  editedBBox?: BBox[];

  // 이벤트 핸들러
  onMotherTongSelect: (tag: SelectedTag | null) => void;
  onSaTamSelect: (tag: SelectedTag | null) => void;
  onIntegratedSelect: (tag: SelectedTag | null) => void;
  onCustomTagsChange: (tags: TagWithId[]) => void;
  onAccuracyUpdate?: (data: AccuracyRate) => void;
}

// ========== Component ==========

function OneProblem({
  questionNumber,
  title,
  problemId,
  accuracyData,
  accuracyLoading,
  motherTongTag: motherTongTag,
  saTamTag,
  integratedTag,
  customTags,
  tagsLoading,
  mode = 'edit',
  isEdited = false,
  editedBBox,
  onMotherTongSelect: onMotherTongSelect,
  onSaTamSelect,
  onIntegratedSelect,
  onCustomTagsChange,
  onAccuracyUpdate,
}: OneProblemProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [showBBoxEditor, setShowBBoxEditor] = useState(false);
  const [problemMetadata, setProblemMetadata] = useState<ProblemMetadata | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [currentIsEdited, setCurrentIsEdited] = useState(isEdited);
  const [currentBBox, setCurrentBBox] = useState<BBox[] | undefined>(editedBBox);
  const [showDeleteSnackbar, setShowDeleteSnackbar] = useState(false);
  const [showSaveSnackbar, setShowSaveSnackbar] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedFile, setDraggedFile] = useState<File | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 정확도 입력 다이얼로그 상태
  const [showAccuracyDialog, setShowAccuracyDialog] = useState(false);
  const [currentAccuracyData, setCurrentAccuracyData] = useState<AccuracyRate | undefined>(accuracyData);
  const [accuracyForm, setAccuracyForm] = useState({
    accuracy_rate: '',
    difficulty: '',
    score: '',
    correct_answer: '',
  });
  const [isSavingAccuracy, setIsSavingAccuracy] = useState(false);

  // props 변경 시 state 업데이트
  useEffect(() => {
    setCurrentIsEdited(isEdited);
    setCurrentBBox(editedBBox);
    setImageError(false);
  }, [problemId, isEdited, editedBBox]);

  // accuracyData props 변경 시 state 업데이트
  useEffect(() => {
    setCurrentAccuracyData(accuracyData);
  }, [accuracyData]);

  // 정확도 입력 다이얼로그 열기
  const handleOpenAccuracyDialog = () => {
    // 기존 데이터가 있으면 폼에 채우기
    if (currentAccuracyData) {
      setAccuracyForm({
        accuracy_rate: currentAccuracyData.accuracy_rate.toString(),
        difficulty: currentAccuracyData.difficulty,
        score: currentAccuracyData.score.toString(),
        correct_answer: currentAccuracyData.correct_answer,
      });
    } else {
      setAccuracyForm({
        accuracy_rate: '',
        difficulty: '',
        score: '',
        correct_answer: '',
      });
    }
    setShowAccuracyDialog(true);
  };

  // 정확도 저장 핸들러
  const handleSaveAccuracy = async () => {
    // 유효성 검사 (정답률만 필수)
    const rate = parseFloat(accuracyForm.accuracy_rate);
    const score = accuracyForm.score ? parseInt(accuracyForm.score, 10) : 0;

    if (isNaN(rate) || rate < 0 || rate > 100) {
      setErrorMessage('정답률은 0~100 사이의 숫자여야 합니다.');
      return;
    }

    setIsSavingAccuracy(true);
    try {
      await Supabase.AccuracyRates.upsert({
        problem_id: problemId,
        accuracy_rate: rate,
        difficulty: accuracyForm.difficulty.trim() || '-',
        score: score,
        correct_answer: accuracyForm.correct_answer.trim() || '-',
      });

      // 저장 성공 후 상태 업데이트
      const newAccuracyData: AccuracyRate = {
        problem_id: problemId,
        accuracy_rate: rate,
        difficulty: accuracyForm.difficulty.trim() || '-',
        score: score,
        correct_answer: accuracyForm.correct_answer.trim() || '-',
        selection_rates: currentAccuracyData?.selection_rates || {},
        is_user_edited: true,
        created_at: currentAccuracyData?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setCurrentAccuracyData(newAccuracyData);
      onAccuracyUpdate?.(newAccuracyData);
      setShowAccuracyDialog(false);
      setShowSaveSnackbar(true);
    } catch (error) {
      console.error('Failed to save accuracy:', error);
      setErrorMessage(error instanceof Error ? error.message : '저장에 실패했습니다.');
    } finally {
      setIsSavingAccuracy(false);
    }
  };

  // problemId에서 examId 추출: "경제_고3_2024_03_학평_1_문제" -> "경제_고3_2024_03_학평"
  const examId = problemId.replace(/_\d+_문제$/, '');

  // problemId에서 subject 추출: "경제_고3_2024_03_학평_1_문제" -> "경제"
  const subject = problemId.split('_')[0];

  // 문제 이미지 URL 생성 (편집된 이미지가 있으면 edited CDN, 없으면 기본 CDN)
  const imageUrl = currentIsEdited
    ? `https://cdn.y3c.kr/tongkidari/edited-contents/${problemId}.png`
    : getQuestionImageUrl(examId, questionNumber);

  console.log(imageUrl);
  // 이미지 클릭 핸들러
  const handleImageClick = async () => {
    // currentBBox가 있으면 CSV 조회 없이 바로 에디터 열기
    if (currentBBox && currentBBox.length > 0) {
      setShowBBoxEditor(true);
      return;
    }

    // currentBBox가 없으면 CSV에서 메타데이터 가져오기
    setLoadingMetadata(true);
    try {
      const metadata = await Api.Meta.fetchProblemMetadata(problemId);
      if (metadata) {
        // bbox가 비어있으면 1번 페이지 기본값 설정
        if (metadata.bbox.length === 0) {
          metadata.bbox = [{ page: 0, x0: 50, y0: 50, x1: 100, y1: 100 }];
        }
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

  // BBox 확인 핸들러 (bbox 배열 받음)
  const handleBBoxConfirm = async (file: File, bboxes: BBox[]) => {
    try {
      // Supabase에 bboxes 배열과 file 저장 (S3에 업로드됨)
      await Supabase.EditedContent.upsertBBox(problemId, bboxes, file);

      // 저장 후 상태 업데이트
      setCurrentIsEdited(true);
      setCurrentBBox(bboxes);

      // Snackbar 표시
      setShowSaveSnackbar(true);
    } catch (error) {
      console.error('Save failed:', error);
      setErrorMessage(error instanceof Error ? error.message : '저장 실패');
      throw error; // 에러를 BBoxEditor로 전달
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

    setIsDeleting(true);

    try {
      await Supabase.EditedContent.delete(problemId);

      // 삭제 후 원본 이미지 및 bbox로 복원
      setCurrentIsEdited(false);
      setCurrentBBox(undefined);

      // Snackbar 표시
      setShowDeleteSnackbar(true);
    } catch (error) {
      console.error('Failed to delete edited image:', error);
      setErrorMessage(error instanceof Error ? error.message : '이미지 삭제 실패');
    } finally {
      setIsDeleting(false);
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (mode === 'edit') {
      setIsDragging(true);
    }
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

    if (mode !== 'edit') return;

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
      // Supabase에 file 저장 (S3에 업로드됨)
      await Supabase.EditedContent.upsertFileOnly(problemId, draggedFile);

      // 업로드 후 상태 업데이트
      setCurrentIsEdited(true);

      // 다이얼로그 닫기 및 정리
      setShowUploadDialog(false);
      if (uploadPreviewUrl) {
        URL.revokeObjectURL(uploadPreviewUrl);
      }
      setUploadPreviewUrl(null);
      setDraggedFile(null);

      // Snackbar 표시
      setShowSaveSnackbar(true);
    } catch (error) {
      console.error('Upload failed:', error);
      setErrorMessage(error instanceof Error ? error.message : '업로드 실패');
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

  // 클립보드 붙여넣기 핸들러
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (mode !== 'edit') return;

    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          setDraggedFile(file);
          const previewUrl = URL.createObjectURL(file);
          setUploadPreviewUrl(previewUrl);
          setShowUploadDialog(true);
        }
        break;
      }
    }
  };

  return (
    <div
      className={`border-2 rounded-lg p-4 transition-colors ${
        currentIsEdited ? 'border-yellow-200 hover:border-yellow-400' : 'border-gray-200 hover:border-blue-500'
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
      {currentAccuracyData ? (
        <div
          className="mb-3 grid grid-cols-4 gap-2 text-xs cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleOpenAccuracyDialog}
          title="클릭하여 수정"
        >
          <div className="bg-blue-50 px-2 py-1 rounded">
            <span className="text-gray-600">정답률</span>
            <p className="font-semibold text-blue-700">{currentAccuracyData.accuracy_rate}%</p>
          </div>
          <div className="bg-purple-50 px-2 py-1 rounded">
            <span className="text-gray-600">난이도</span>
            <p className="font-semibold text-purple-700">{currentAccuracyData.difficulty}</p>
          </div>
          <div className="bg-green-50 px-2 py-1 rounded">
            <span className="text-gray-600">점수</span>
            <p className="font-semibold text-green-700">{currentAccuracyData.score}점</p>
          </div>
          <div className="bg-orange-50 px-2 py-1 rounded">
            <span className="text-gray-600">정답</span>
            <p className="font-semibold text-orange-700">{currentAccuracyData.correct_answer}</p>
          </div>
        </div>
      ) : !accuracyLoading ? (
        <div
          className="mb-3 grid grid-cols-4 gap-2 text-xs cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={handleOpenAccuracyDialog}
        >
          <div className="bg-gray-50 px-2 py-1 rounded border border-dashed border-gray-300">
            <span className="text-gray-400">정답률</span>
            <p className="font-semibold text-gray-400">-</p>
          </div>
          <div className="bg-gray-50 px-2 py-1 rounded border border-dashed border-gray-300">
            <span className="text-gray-400">난이도</span>
            <p className="font-semibold text-gray-400">-</p>
          </div>
          <div className="bg-gray-50 px-2 py-1 rounded border border-dashed border-gray-300">
            <span className="text-gray-400">점수</span>
            <p className="font-semibold text-gray-400">-</p>
          </div>
          <div className="bg-gray-50 px-2 py-1 rounded border border-dashed border-gray-300">
            <span className="text-gray-400">정답</span>
            <p className="font-semibold text-gray-400">-</p>
          </div>
        </div>
      ) : null}

      {accuracyLoading && !currentAccuracyData && (
        <div className="mb-3 text-xs text-gray-500">정확도 정보를 불러오는 중...</div>
      )}

      {/* 태그 섹션 */}
      <div className="mb-4 space-y-3">
        {tagsLoading ? (
          <div className="text-xs text-gray-500 text-center py-2">태그 정보를 불러오는 중...</div>
        ) : mode === 'edit' ? (
          <>
            {/* Edit 모드: 태그 입력기 */}
            <SaTamTagInput subject={`사회탐구_${subject}`} onSelect={onSaTamSelect} value={saTamTag} />
            <DetailTongsaTagInput onSelect={onIntegratedSelect} value={integratedTag} />
            <CustomTagInput
              onTagsChange={onCustomTagsChange}
              placeholder="커스텀 태그"
              tags={customTags}
              subject={subject}
            />
          </>
        ) : (
          <>
            {/* View 모드: 태그 라벨만 표시 */}
            {/* 사탐 단원 태그 */}
            <div>
              <label className="text-xs text-gray-600 block mb-1.5">사회탐구_{subject} 단원 태그</label>
              <div className="flex flex-wrap gap-2">
                {saTamTag && saTamTag.tagLabels.length > 0 ? (
                  <span
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}
                  >
                    {saTamTag.tagLabels.join(' > ')}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">사탐 단원 태그가 없습니다</span>
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
      <div
        className="bg-gray-100 rounded-lg overflow-hidden relative"
        tabIndex={mode === 'edit' ? 0 : undefined}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onPaste={mode === 'edit' ? handlePaste : undefined}
      >
        {imageError ? (
          <div
            className={`flex items-center justify-center h-48 text-gray-500 ${mode === 'edit' ? 'cursor-pointer hover:bg-gray-200' : ''}`}
            onClick={mode === 'edit' ? handleImageClick : undefined}
          >
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-2 text-sm">이미지를 불러올 수 없습니다</p>
              {mode === 'edit' && <p className="mt-1 text-xs text-blue-500">클릭하여 이미지 편집</p>}
            </div>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={title}
            className={`w-full h-auto transition-opacity ${mode === 'edit' ? 'cursor-pointer hover:opacity-80' : ''}`}
            loading="lazy"
            onClick={mode === 'edit' ? handleImageClick : undefined}
            onError={() => setImageError(true)}
          />
        )}
        {/* 편집된 이미지 삭제 버튼 */}
        {currentIsEdited && (
          <button
            onClick={handleDeleteEditedImage}
            className="absolute bottom-1 right-1 bg-gray-600/40 hover:bg-gray-700/60 text-white rounded-full w-6 h-6 flex items-center justify-center transition-all shadow-md text-lg leading-none"
            title="편집된 이미지 삭제"
          >
            ×
          </button>
        )}

        {/* Drag Overlay */}
        {isDragging && mode === 'edit' && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-4 border-blue-500 border-dashed rounded-lg flex items-center justify-center z-40">
            <div className="bg-white px-6 py-4 rounded-lg shadow-lg">
              <svg
                className="w-12 h-12 mx-auto mb-2 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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

      {/* Loading Indicator */}
      {loadingMetadata && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">
            <p>메타데이터를 불러오는 중...</p>
          </div>
        </div>
      )}

      {/* BBox Editor Modal */}
      {showBBoxEditor && (currentBBox || (problemMetadata && problemMetadata.bbox.length > 0)) && (
        <BBoxEditor
          imageUrl={getProblemPageUrl((currentBBox?.[0] || problemMetadata!.bbox[0]).page)}
          bbox={currentBBox || problemMetadata!.bbox}
          onClose={() => setShowBBoxEditor(false)}
          onConfirm={handleBBoxConfirm}
          problemId={problemId}
          getPageUrl={getProblemPageUrl}
        />
      )}

      {/* Snackbars */}
      {showSaveSnackbar && (
        <SuccessSnackbar message="BBox와 이미지가 저장되었습니다" onClose={() => setShowSaveSnackbar(false)} />
      )}

      {showDeleteSnackbar && (
        <SuccessSnackbar message="편집된 이미지가 삭제되었습니다" onClose={() => setShowDeleteSnackbar(false)} />
      )}

      {errorMessage && <ErrorSnackbar message={errorMessage} onClose={() => setErrorMessage(null)} />}

      {/* Upload Confirmation Dialog */}
      {showUploadDialog && uploadPreviewUrl && (
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

      {/* Deleting Overlay */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">이미지 삭제 중...</p>
              <p className="text-sm text-gray-600 mt-1">S3 삭제 및 캐시 무효화 진행 중</p>
            </div>
          </div>
        </div>
      )}

      {/* 정확도 입력 다이얼로그 */}
      {showAccuracyDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">정확도 정보 입력</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">정답률 (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={accuracyForm.accuracy_rate}
                    onChange={(e) => setAccuracyForm({ ...accuracyForm, accuracy_rate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 75.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">난이도</label>
                  <select
                    value={accuracyForm.difficulty}
                    onChange={(e) => setAccuracyForm({ ...accuracyForm, difficulty: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택하세요</option>
                    <option value="상">상</option>
                    <option value="중">중</option>
                    <option value="하">하</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">점수</label>
                  <input
                    type="number"
                    min="0"
                    value={accuracyForm.score}
                    onChange={(e) => setAccuracyForm({ ...accuracyForm, score: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">정답</label>
                  <input
                    type="text"
                    value={accuracyForm.correct_answer}
                    onChange={(e) => setAccuracyForm({ ...accuracyForm, correct_answer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 3"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setShowAccuracyDialog(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                  disabled={isSavingAccuracy}
                >
                  취소
                </button>
                <button
                  onClick={handleSaveAccuracy}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  disabled={isSavingAccuracy}
                >
                  {isSavingAccuracy ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OneProblem;
