import { useState, useRef, useEffect } from 'react';
import { type BBox } from '../../api/Api';
import BBoxInfoFooter from './components/BBoxInfoFooter';
import BBoxSvgOverlay from './components/BBoxSvgOverlay';
import BBoxInteractiveOverlay from './components/BBoxInteractiveOverlay';

interface BBoxEditorProps {
  imageUrl: string;
  bbox: BBox[];
  onClose: () => void;
  onConfirm: (file: File, bboxes: BBox[]) => Promise<void>;
  problemId: string;
  getPageUrl: (page: number) => string;
}

function BBoxEditor({ imageUrl: initialImageUrl, bbox, onClose, onConfirm, problemId, getPageUrl }: BBoxEditorProps) {
  // pt to px 변환 (200 DPI)
  const PT_TO_PX_SCALE = 200 / 72; // 2.777778

  // 소수점 두 자리로 반올림
  const roundToTwo = (num: number): number => {
    return Math.round(num * 100) / 100;
  };

  // 모든 bbox를 px 단위로 변환
  const initialBBoxes: BBox[] =
    bbox.length > 0
      ? bbox.map((b) => ({
          page: b.page,
          x0: roundToTwo(b.x0 * PT_TO_PX_SCALE),
          y0: roundToTwo(b.y0 * PT_TO_PX_SCALE),
          x1: roundToTwo(b.x1 * PT_TO_PX_SCALE),
          y1: roundToTwo(b.y1 * PT_TO_PX_SCALE),
        }))
      : [{ page: 0, x0: 0, y0: 0, x1: 0, y1: 0 }];

  const [currentBBoxes, setCurrentBBoxes] = useState<BBox[]>(initialBBoxes);
  const [selectedBboxIndex, setSelectedBboxIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(initialBBoxes[0].page);
  const [currentImageUrl, setCurrentImageUrl] = useState(initialImageUrl);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [croppedBBoxes, setCroppedBBoxes] = useState<BBox[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 페이지 변경 핸들러
  const handlePrevPage = () => {
    if (currentPage > 0) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      setCurrentImageUrl(getPageUrl(newPage));
      // 선택된 bbox가 있으면 페이지 업데이트
      if (selectedBboxIndex !== null) {
        const updated = [...currentBBoxes];
        updated[selectedBboxIndex] = { ...updated[selectedBboxIndex], page: newPage };
        setCurrentBBoxes(updated);
      }
    }
  };

  const handleNextPage = () => {
    const newPage = currentPage + 1;
    setCurrentPage(newPage);
    setCurrentImageUrl(getPageUrl(newPage));
    // 선택된 bbox가 있으면 페이지 업데이트
    if (selectedBboxIndex !== null) {
      const updated = [...currentBBoxes];
      updated[selectedBboxIndex] = { ...updated[selectedBboxIndex], page: newPage };
      setCurrentBBoxes(updated);
    }
  };

  useEffect(() => {
    // 이미지 로드 후 크기 가져오기
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      setLoadError('이미지를 불러올 수 없습니다: ' + currentImageUrl);
    };
    img.src = currentImageUrl;
  }, [currentImageUrl]);

  // 이미지 로드 후 bbox 위치로 스크롤 (첫 번째 또는 선택된 bbox)
  useEffect(() => {
    if (!imageSize || !containerRef.current || !imageRef.current || currentBBoxes.length === 0) return;

    // DOM 렌더링 완료 후 스크롤 실행
    setTimeout(() => {
      const container = containerRef.current;
      const img = imageRef.current;
      if (!container || !img) return;

      // 스크롤할 bbox 선택 (선택된 것이 있으면 선택된 것, 없으면 첫 번째)
      const targetBBox = selectedBboxIndex !== null ? currentBBoxes[selectedBboxIndex] : currentBBoxes[0];

      // bbox 중앙 위치 계산 (이미지 좌표계)
      const bboxCenterX = (targetBBox.x0 + targetBBox.x1) / 2;
      const bboxCenterY = (targetBBox.y0 + targetBBox.y1) / 2;

      // 표시된 이미지 크기
      const displayedWidth = img.offsetWidth;
      const displayedHeight = img.offsetHeight;

      // 이미지 크기 대비 bbox 위치 비율
      const centerXRatio = bboxCenterX / imageSize.width;
      const centerYRatio = bboxCenterY / imageSize.height;

      // 스크롤 위치 계산 (bbox 중앙이 뷰포트 중앙에 오도록)
      const scrollX = displayedWidth * centerXRatio - container.clientWidth / 2;
      const scrollY = displayedHeight * centerYRatio - container.clientHeight / 2;

      container.scrollTop = Math.max(0, scrollY);
      container.scrollLeft = Math.max(0, scrollX);
    }, 100);
  }, [imageSize, currentBBoxes, selectedBboxIndex]);

  useEffect(() => {
    // ESC 키로 모달 닫기
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // 확인 다이얼로그가 열려있으면 다이얼로그만 닫기
        if (showConfirmDialog) {
          handleCancelSave();
        } else {
          // 확인 다이얼로그가 없으면 BBoxEditor 닫기
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, showConfirmDialog]);

  const handleSelect = (bboxIndex: number) => {
    setSelectedBboxIndex(bboxIndex);
  };

  const handleDrag = (bboxIndex: number, dx: number, dy: number) => {
    const updated = [...currentBBoxes];
    const bbox = updated[bboxIndex];

    updated[bboxIndex] = {
      ...bbox,
      x0: roundToTwo(bbox.x0 + dx),
      x1: roundToTwo(bbox.x1 + dx),
      y0: roundToTwo(bbox.y0 + dy),
      y1: roundToTwo(bbox.y1 + dy),
    };

    setCurrentBBoxes(updated);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !imageSize || (!isDragging && !isResizing) || selectedBboxIndex === null) return;

    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = imageSize.width / rect.width;
    const scaleY = imageSize.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const updated = [...currentBBoxes];
    const currentBBox = updated[selectedBboxIndex];

    if (isDragging && dragStart) {
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;

      updated[selectedBboxIndex] = {
        ...currentBBox,
        x0: roundToTwo(currentBBox.x0 + dx),
        x1: roundToTwo(currentBBox.x1 + dx),
        y0: roundToTwo(currentBBox.y0 + dy),
        y1: roundToTwo(currentBBox.y1 + dy),
      };
      setCurrentBBoxes(updated);
      setDragStart({ x, y });
    } else if (isResizing) {
      let newBBox = { ...currentBBox };

      if (isResizing.includes('left')) {
        newBBox.x0 = roundToTwo(x);
      }
      if (isResizing.includes('right')) {
        newBBox.x1 = roundToTwo(x);
      }
      if (isResizing.includes('top')) {
        newBBox.y0 = roundToTwo(y);
      }
      if (isResizing.includes('bottom')) {
        newBBox.y1 = roundToTwo(y);
      }

      updated[selectedBboxIndex] = newBBox;
      setCurrentBBoxes(updated);
    }
  };

  const handleMouseUp = () => {
    // 리사이즈 완료 후 좌표 정규화 (x0 > x1 또는 y0 > y1인 경우 스왑)
    if (isResizing && selectedBboxIndex !== null) {
      const updated = [...currentBBoxes];
      const bbox = updated[selectedBboxIndex];

      let needsUpdate = false;

      if (bbox.x0 > bbox.x1) {
        [bbox.x0, bbox.x1] = [bbox.x1, bbox.x0];
        needsUpdate = true;
      }
      if (bbox.y0 > bbox.y1) {
        [bbox.y0, bbox.y1] = [bbox.y1, bbox.y0];
        needsUpdate = true;
      }

      if (needsUpdate) {
        setCurrentBBoxes(updated);
      }
    }

    setIsDragging(false);
    setIsResizing(null);
    setDragStart(null);
  };

  const handleResizeStart = (e: React.MouseEvent, direction: string, bboxIndex: number) => {
    e.stopPropagation();
    setSelectedBboxIndex(bboxIndex);
    setIsResizing(direction);
  };

  // BBox 추가 핸들러
  const handleAddBBox = () => {
    if (!imageSize) return;

    // 새 BBox를 이미지 중앙에 작은 크기로 생성
    const centerX = imageSize.width / 2;
    const centerY = imageSize.height / 2;
    const defaultWidth = 200;
    const defaultHeight = 100;

    const newBBox: BBox = {
      page: currentPage,
      x0: roundToTwo(centerX - defaultWidth / 2),
      y0: roundToTwo(centerY - defaultHeight / 2),
      x1: roundToTwo(centerX + defaultWidth / 2),
      y1: roundToTwo(centerY + defaultHeight / 2),
    };

    const updatedBBoxes = [...currentBBoxes, newBBox];
    setCurrentBBoxes(updatedBBoxes);
    // 새로 추가된 BBox를 선택
    setSelectedBboxIndex(updatedBBoxes.length - 1);
  };

  // BBox 삭제 핸들러
  const handleRemoveBBox = (index: number) => {
    const updatedBBoxes = currentBBoxes.filter((_, i) => i !== index);
    setCurrentBBoxes(updatedBBoxes);

    // 선택된 인덱스 조정
    if (selectedBboxIndex === index) {
      setSelectedBboxIndex(null);
    } else if (selectedBboxIndex !== null && selectedBboxIndex > index) {
      setSelectedBboxIndex(selectedBboxIndex - 1);
    }
  };

  // 더블 클릭으로 bbox 영역들을 크롭하여 세로로 합친 후 저장
  const handleDoubleClick = async () => {
    if (!imageRef.current || !imageSize || currentBBoxes.length === 0) return;

    try {
      // 현재 수정된 bbox 배열 사용
      const sortedBBoxes = currentBBoxes;

      // 이미지 로드
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = currentImageUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // 각 bbox의 크기 계산 (PX 단위)
      const croppedImages = sortedBBoxes.map((bbox) => ({
        bbox,
        width: bbox.x1 - bbox.x0,
        height: bbox.y1 - bbox.y0,
      }));

      // 전체 캔버스 크기 계산
      const GAP = 2; // 이미지 간 간격
      const maxWidth = Math.max(...croppedImages.map((item) => item.width));
      const totalHeight = croppedImages.reduce((sum, item) => sum + item.height, 0) + GAP * (croppedImages.length - 1);

      // 합친 이미지를 그릴 캔버스 생성
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = maxWidth;
      canvas.height = totalHeight;

      // 배경을 흰색으로 채우기
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, maxWidth, totalHeight);

      // 각 bbox 영역을 크롭하여 세로로 합치기
      let currentY = 0;

      for (const item of croppedImages) {
        const { bbox, width, height } = item;

        // 임시 캔버스에 크롭된 이미지 그리기 (PX 단위로 크롭)
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) continue;

        tempCanvas.width = width;
        tempCanvas.height = height;
        // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
        // sx, sy는 원본 이미지에서 크롭할 시작 위치 (PX 단위)
        tempCtx.drawImage(img, bbox.x0, bbox.y0, width, height, 0, 0, width, height);

        // 메인 캔버스에 복사 (중앙 정렬)
        const offsetX = (maxWidth - width) / 2;
        ctx.drawImage(tempCanvas, offsetX, currentY);

        currentY += height + GAP;
      }

      // Canvas를 Blob으로 변환
      canvas.toBlob((blob) => {
        if (!blob) return;

        const file = new File([blob], `${problemId}_cropped.png`, {
          type: 'image/png',
        });

        // 미리보기 URL 생성 및 확인 다이얼로그 표시
        const previewUrl = URL.createObjectURL(blob);
        setCroppedImageUrl(previewUrl);
        setCroppedFile(file);
        // 원본 페이지에서의 bbox 위치를 그대로 사용 (PX 단위)
        setCroppedBBoxes(currentBBoxes);
        setShowConfirmDialog(true);
      }, 'image/png');
    } catch (error) {
      console.error('Failed to crop image:', error);
      alert('이미지 크롭에 실패했습니다.');
    }
  };

  // 확인 다이얼로그에서 확인 버튼 클릭
  const handleConfirmSave = async () => {
    if (croppedFile && croppedBBoxes) {
      // PX → PT 변환
      const PX_TO_PT_SCALE = 72 / 200;
      const bboxesInPT: BBox[] = croppedBBoxes.map((bbox) => ({
        page: bbox.page,
        x0: roundToTwo(bbox.x0 * PX_TO_PT_SCALE),
        y0: roundToTwo(bbox.y0 * PX_TO_PT_SCALE),
        x1: roundToTwo(bbox.x1 * PX_TO_PT_SCALE),
        y1: roundToTwo(bbox.y1 * PX_TO_PT_SCALE),
      }));

      setIsSaving(true);
      setShowConfirmDialog(false);

      try {
        await onConfirm(croppedFile, bboxesInPT);
        onClose();
      } catch (error) {
        console.error('Save failed:', error);
        setIsSaving(false);
        // 에러는 부모 컴포넌트에서 처리
      }
    }
  };

  // 확인 다이얼로그 취소
  const handleCancelSave = () => {
    if (croppedImageUrl) {
      URL.revokeObjectURL(croppedImageUrl);
    }
    setCroppedImageUrl(null);
    setCroppedFile(null);
    setCroppedBBoxes(null);
    setShowConfirmDialog(false);
  };

  if (loadError) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-4 rounded-lg max-w-md">
          <h3 className="text-lg font-bold text-red-600 mb-2">오류</h3>
          <p className="text-sm text-gray-700 mb-4">{loadError}</p>
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            닫기
          </button>
        </div>
      </div>
    );
  }

  if (!imageSize) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-4 rounded-lg">
          <p>Loading image...</p>
          <p className="text-xs text-gray-500 mt-2">{currentImageUrl}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* BBox Editor */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="relative bg-white rounded-lg p-6 max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">BBox Editor - {problemId}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">
              ×
            </button>
          </div>

          {/* Wrapper  */}
          <div
            ref={containerRef}
            className="relative overflow-auto flex-1"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Image Container */}
            <div className="relative inline-block">
              <img ref={imageRef} src={currentImageUrl} alt="Problem" className="max-w-full" draggable={false} />

              {/* BBox SVG 레이어 - 시각적 표시 */}
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{
                  width: '100%',
                  height: '100%',
                }}
              >
                {currentBBoxes.map((bbox, index) => (
                  <BBoxSvgOverlay
                    key={index}
                    bbox={bbox}
                    index={index}
                    isSelected={selectedBboxIndex === index}
                    imageSize={imageSize}
                  />
                ))}
              </svg>

              {/* BBox 인터랙션 레이어 - 드래그/리사이즈 */}
              {currentBBoxes.map((bbox, index) => (
                <BBoxInteractiveOverlay
                  key={index}
                  bbox={bbox}
                  index={index}
                  isSelected={selectedBboxIndex === index}
                  imageSize={imageSize}
                  onSelect={handleSelect}
                  onDrag={handleDrag}
                  onDoubleClick={handleDoubleClick}
                  onResizeStart={handleResizeStart}
                />
              ))}
            </div>
          </div>

          {/* Page Navigation Buttons */}
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-colors text-xl font-bold"
            title="이전 페이지"
          >
            ←
          </button>
          <button
            onClick={handleNextPage}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-colors text-xl font-bold"
            title="다음 페이지"
          >
            →
          </button>

          <BBoxInfoFooter
            bboxes={currentBBoxes}
            currentPage={currentPage}
            selectedBboxIndex={selectedBboxIndex}
            onAddBBox={handleAddBBox}
            onRemoveBBox={handleRemoveBBox}
          />
        </div>
      </div>

      {/* Confirm Dialog */}
      {showConfirmDialog && croppedImageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-3xl max-h-[90vh] overflow-auto flex flex-col">
            <h3 className="text-xl font-bold text-gray-900 mb-4">이대로 저장하시겠습니까?</h3>

            {/* 크롭된 이미지 미리보기 */}
            <div className="mb-4 flex justify-center bg-gray-100 rounded-lg p-4">
              <img src={croppedImageUrl} alt="Cropped preview" className="max-w-full max-h-[60vh] object-contain" />
            </div>

            {/* BBox 정보들 */}
            {croppedBBoxes && (
              <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
                <p className="font-semibold mb-2">BBoxes: {croppedBBoxes.length}개</p>
                {croppedBBoxes.map((bbox, index) => {
                  const PX_TO_PT_SCALE = 72 / 200;
                  const bboxPT = {
                    page: bbox.page,
                    x0: roundToTwo(bbox.x0 * PX_TO_PT_SCALE),
                    y0: roundToTwo(bbox.y0 * PX_TO_PT_SCALE),
                    x1: roundToTwo(bbox.x1 * PX_TO_PT_SCALE),
                    y1: roundToTwo(bbox.y1 * PX_TO_PT_SCALE),
                  };
                  return (
                    <div key={index} className="text-xs mb-2">
                      <p className="font-mono">
                        [{index + 1}] PX: {'{'}page: {bbox.page}, x0: {bbox.x0}, y0: {bbox.y0}, x1: {bbox.x1}, y1:{' '}
                        {bbox.y1}
                        {'}'}
                      </p>
                      <p className="font-mono text-blue-600 ml-5">
                        PT: {'{'}page: {bboxPT.page}, x0: {bboxPT.x0}, y0: {bboxPT.y0}, x1: {bboxPT.x1}, y1: {bboxPT.y1}
                        {'}'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 버튼 */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelSave}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saving Overlay */}
      {isSaving && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">이미지 저장 중...</p>
              <p className="text-sm text-gray-600 mt-1">S3 업로드 및 캐시 무효화 진행 중</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BBoxEditor;
