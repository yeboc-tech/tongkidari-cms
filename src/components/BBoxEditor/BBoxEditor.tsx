import { useState, useRef, useEffect } from 'react';
import { type BBox } from '../../api/Api';

interface BBoxEditorProps {
  imageUrl: string;
  bbox: BBox;
  onClose: () => void;
  onConfirm: (file: File, bbox: BBox) => void;
  problemId: string;
}

function BBoxEditor({ imageUrl, bbox, onClose, onConfirm, problemId }: BBoxEditorProps) {
  // pt to px 변환 (200 DPI)
  const PT_TO_PX_SCALE = 200 / 72; // 2.777778

  // 소수점 두 자리로 반올림
  const roundToTwo = (num: number): number => {
    return Math.round(num * 100) / 100;
  };

  // bbox를 px 단위로 변환 (소수점 2자리)
  const bboxInPx: BBox = {
    page: bbox.page,
    x0: roundToTwo(bbox.x0 * PT_TO_PX_SCALE),
    y0: roundToTwo(bbox.y0 * PT_TO_PX_SCALE),
    x1: roundToTwo(bbox.x1 * PT_TO_PX_SCALE),
    y1: roundToTwo(bbox.y1 * PT_TO_PX_SCALE),
  };

  const [currentBBox, setCurrentBBox] = useState<BBox>(bboxInPx);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [croppedBBox, setCroppedBBox] = useState<BBox | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 이미지 로드 후 크기 가져오기
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      setLoadError('이미지를 불러올 수 없습니다: ' + imageUrl);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // 이미지 로드 후 bbox 위치로 스크롤
  useEffect(() => {
    if (!imageSize || !containerRef.current || !imageRef.current) return;

    // DOM 렌더링 완료 후 스크롤 실행
    setTimeout(() => {
      const container = containerRef.current;
      const img = imageRef.current;
      if (!container || !img) return;

      // bbox 중앙 위치 계산 (이미지 좌표계)
      const bboxCenterX = (currentBBox.x0 + currentBBox.x1) / 2;
      const bboxCenterY = (currentBBox.y0 + currentBBox.y1) / 2;

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
  }, [imageSize, currentBBox]);

  useEffect(() => {
    // ESC 키로 모달 닫기
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !imageSize) return;

    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = imageSize.width / rect.width;
    const scaleY = imageSize.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // bbox 내부 클릭인지 확인
    if (
      x >= currentBBox.x0 &&
      x <= currentBBox.x1 &&
      y >= currentBBox.y0 &&
      y <= currentBBox.y1
    ) {
      setIsDragging(true);
      setDragStart({ x, y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !imageSize || (!isDragging && !isResizing)) return;

    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = imageSize.width / rect.width;
    const scaleY = imageSize.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (isDragging && dragStart) {
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;

      setCurrentBBox({
        ...currentBBox,
        x0: roundToTwo(currentBBox.x0 + dx),
        x1: roundToTwo(currentBBox.x1 + dx),
        y0: roundToTwo(currentBBox.y0 + dy),
        y1: roundToTwo(currentBBox.y1 + dy),
      });
      setDragStart({ x, y });
    } else if (isResizing) {
      const newBBox = { ...currentBBox };

      if (isResizing.includes('left')) {
        newBBox.x0 = roundToTwo(Math.min(x, currentBBox.x1 - 10));
      }
      if (isResizing.includes('right')) {
        newBBox.x1 = roundToTwo(Math.max(x, currentBBox.x0 + 10));
      }
      if (isResizing.includes('top')) {
        newBBox.y0 = roundToTwo(Math.min(y, currentBBox.y1 - 10));
      }
      if (isResizing.includes('bottom')) {
        newBBox.y1 = roundToTwo(Math.max(y, currentBBox.y0 + 10));
      }

      setCurrentBBox(newBBox);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(null);
    setDragStart(null);
  };

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    setIsResizing(direction);
  };

  // 더블 클릭으로 bbox 영역 크롭하여 미리보기 표시
  const handleDoubleClick = async () => {
    if (!imageRef.current || !imageSize) return;

    try {
      // Canvas 생성
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 크롭할 영역 크기 설정
      const width = currentBBox.x1 - currentBBox.x0;
      const height = currentBBox.y1 - currentBBox.y0;
      canvas.width = width;
      canvas.height = height;

      // 이미지 로드
      const img = new Image();
      img.crossOrigin = 'anonymous'; // CORS 처리
      img.src = imageUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // bbox 영역만 크롭하여 그리기
      ctx.drawImage(img, currentBBox.x0, currentBBox.y0, width, height, 0, 0, width, height);

      // Canvas를 Blob으로 변환
      canvas.toBlob((blob) => {
        if (!blob) return;

        // Blob을 File로 변환
        const file = new File([blob], `${problemId}_cropped.png`, {
          type: 'image/png',
        });

        // pt 단위로 변환 (소수점 2자리)
        const bboxInPt: BBox = {
          page: currentBBox.page,
          x0: roundToTwo(currentBBox.x0 / PT_TO_PX_SCALE),
          y0: roundToTwo(currentBBox.y0 / PT_TO_PX_SCALE),
          x1: roundToTwo(currentBBox.x1 / PT_TO_PX_SCALE),
          y1: roundToTwo(currentBBox.y1 / PT_TO_PX_SCALE),
        };

        // 미리보기 URL 생성 및 확인 다이얼로그 표시
        const previewUrl = URL.createObjectURL(blob);
        setCroppedImageUrl(previewUrl);
        setCroppedFile(file);
        setCroppedBBox(bboxInPt);
        setShowConfirmDialog(true);
      }, 'image/png');
    } catch (error) {
      console.error('Failed to crop image:', error);
      alert('이미지 크롭에 실패했습니다.');
    }
  };

  // 확인 다이얼로그에서 확인 버튼 클릭
  const handleConfirmSave = () => {
    if (croppedFile && croppedBBox) {
      onConfirm(croppedFile, croppedBBox);
      onClose();
    }
  };

  // 확인 다이얼로그 취소
  const handleCancelSave = () => {
    if (croppedImageUrl) {
      URL.revokeObjectURL(croppedImageUrl);
    }
    setCroppedImageUrl(null);
    setCroppedFile(null);
    setCroppedBBox(null);
    setShowConfirmDialog(false);
  };

  if (loadError) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-4 rounded-lg max-w-md">
          <h3 className="text-lg font-bold text-red-600 mb-2">오류</h3>
          <p className="text-sm text-gray-700 mb-4">{loadError}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
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
          <p className="text-xs text-gray-500 mt-2">{imageUrl}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* BBox Editor */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">BBox Editor - {problemId}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">
              ×
            </button>
          </div>

        <div
          ref={containerRef}
          className="relative overflow-auto flex-1"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="relative inline-block">
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Problem"
              className="max-w-full"
              draggable={false}
            />

            {/* BBox Overlay */}
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{
                width: '100%',
                height: '100%',
              }}
            >
              <rect
                x={`${(currentBBox.x0 / imageSize.width) * 100}%`}
                y={`${(currentBBox.y0 / imageSize.height) * 100}%`}
                width={`${((currentBBox.x1 - currentBBox.x0) / imageSize.width) * 100}%`}
                height={`${((currentBBox.y1 - currentBBox.y0) / imageSize.height) * 100}%`}
                fill="none"
                stroke="red"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            </svg>

            {/* Draggable Area */}
            <div
              className="absolute cursor-move"
              style={{
                left: `${(currentBBox.x0 / imageSize.width) * 100}%`,
                top: `${(currentBBox.y0 / imageSize.height) * 100}%`,
                width: `${((currentBBox.x1 - currentBBox.x0) / imageSize.width) * 100}%`,
                height: `${((currentBBox.y1 - currentBBox.y0) / imageSize.height) * 100}%`,
              }}
              onMouseDown={handleImageClick}
              onDoubleClick={handleDoubleClick}
            />

            {/* Resize Handles */}
            {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((direction) => {
              const isTop = direction.startsWith('top');
              const isLeft = direction.endsWith('left');

              return (
                <div
                  key={direction}
                  className="absolute w-3 h-3 bg-red-500 cursor-nwse-resize"
                  style={{
                    left: isLeft
                      ? `calc(${(currentBBox.x0 / imageSize.width) * 100}% - 6px)`
                      : `calc(${(currentBBox.x1 / imageSize.width) * 100}% - 6px)`,
                    top: isTop
                      ? `calc(${(currentBBox.y0 / imageSize.height) * 100}% - 6px)`
                      : `calc(${(currentBBox.y1 / imageSize.height) * 100}% - 6px)`,
                  }}
                  onMouseDown={(e) => handleResizeStart(e, direction)}
                />
              );
            })}
          </div>
        </div>

          <div className="mt-4 text-sm text-gray-600">
            <p>
              Current BBox: {'{'}page: {currentBBox.page}, x0: {roundToTwo(currentBBox.x0)}, y0:{' '}
              {roundToTwo(currentBBox.y0)}, x1: {roundToTwo(currentBBox.x1)}, y1: {roundToTwo(currentBBox.y1)}
              {'}'}
            </p>
          </div>
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

            {/* BBox 정보 */}
            {croppedBBox && (
              <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                <p>
                  BBox (pt): {'{'}page: {croppedBBox.page}, x0: {croppedBBox.x0}, y0: {croppedBBox.y0}, x1:{' '}
                  {croppedBBox.x1}, y1: {croppedBBox.y1}
                  {'}'}
                </p>
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
    </>
  );
}

export default BBoxEditor;
