import { useState, useRef, useEffect } from 'react';
import { type BBox } from '../../api/Api';

interface BBoxEditorProps {
  imageUrl: string;
  bbox: BBox[];
  onClose: () => void;
  onConfirm: (file: File, bboxes: BBox[]) => void;
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
  const initialBBoxes: BBox[] = bbox.length > 0
    ? bbox.map(b => ({
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
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>, bboxIndex: number) => {
    if (!imageRef.current || !imageSize) return;

    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = imageSize.width / rect.width;
    const scaleY = imageSize.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const bbox = currentBBoxes[bboxIndex];

    // bbox 내부 클릭인지 확인
    if (
      x >= bbox.x0 &&
      x <= bbox.x1 &&
      y >= bbox.y0 &&
      y <= bbox.y1
    ) {
      setSelectedBboxIndex(bboxIndex);
      setIsDragging(true);
      setDragStart({ x, y });
    }
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

      updated[selectedBboxIndex] = newBBox;
      setCurrentBBoxes(updated);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(null);
    setDragStart(null);
  };

  const handleResizeStart = (e: React.MouseEvent, direction: string, bboxIndex: number) => {
    e.stopPropagation();
    setSelectedBboxIndex(bboxIndex);
    setIsResizing(direction);
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
      const croppedImages = sortedBBoxes.map(bbox => ({
        bbox,
        width: bbox.x1 - bbox.x0,
        height: bbox.y1 - bbox.y0,
      }));

      // 전체 캔버스 크기 계산
      const GAP = 2; // 이미지 간 간격
      const maxWidth = Math.max(...croppedImages.map(item => item.width));
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
  const handleConfirmSave = () => {
    if (croppedFile && croppedBBoxes) {
      // PX → PT 변환
      const PX_TO_PT_SCALE = 72 / 200;
      const bboxesInPT: BBox[] = croppedBBoxes.map(bbox => ({
        page: bbox.page,
        x0: roundToTwo(bbox.x0 * PX_TO_PT_SCALE),
        y0: roundToTwo(bbox.y0 * PX_TO_PT_SCALE),
        x1: roundToTwo(bbox.x1 * PX_TO_PT_SCALE),
        y1: roundToTwo(bbox.y1 * PX_TO_PT_SCALE),
      }));

      onConfirm(croppedFile, bboxesInPT);
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
    setCroppedBBoxes(null);
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
              src={currentImageUrl}
              alt="Problem"
              className="max-w-full"
              draggable={false}
            />

            {/* BBox Overlays - 모든 bbox 표시 */}
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{
                width: '100%',
                height: '100%',
              }}
            >
              {currentBBoxes.map((bbox, index) => (
                <rect
                  key={index}
                  x={`${(bbox.x0 / imageSize.width) * 100}%`}
                  y={`${(bbox.y0 / imageSize.height) * 100}%`}
                  width={`${((bbox.x1 - bbox.x0) / imageSize.width) * 100}%`}
                  height={`${((bbox.y1 - bbox.y0) / imageSize.height) * 100}%`}
                  fill="none"
                  stroke={selectedBboxIndex === index ? 'blue' : 'red'}
                  strokeWidth={selectedBboxIndex === index ? '3' : '2'}
                  strokeDasharray="5,5"
                />
              ))}
            </svg>

            {/* Draggable Areas - 각 bbox마다 */}
            {currentBBoxes.map((bbox, index) => (
              <div
                key={`drag-${index}`}
                className="absolute cursor-move"
                style={{
                  left: `${(bbox.x0 / imageSize.width) * 100}%`,
                  top: `${(bbox.y0 / imageSize.height) * 100}%`,
                  width: `${((bbox.x1 - bbox.x0) / imageSize.width) * 100}%`,
                  height: `${((bbox.y1 - bbox.y0) / imageSize.height) * 100}%`,
                }}
                onMouseDown={(e) => handleImageClick(e, index)}
                onDoubleClick={handleDoubleClick}
              />
            ))}

            {/* Resize Handles - 각 bbox마다 */}
            {currentBBoxes.map((bbox, bboxIndex) =>
              ['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((direction) => {
                const isTop = direction.startsWith('top');
                const isLeft = direction.endsWith('left');

                return (
                  <div
                    key={`${bboxIndex}-${direction}`}
                    className="absolute w-3 h-3 cursor-nwse-resize"
                    style={{
                      backgroundColor: selectedBboxIndex === bboxIndex ? 'blue' : 'red',
                      left: isLeft
                        ? `calc(${(bbox.x0 / imageSize.width) * 100}% - 6px)`
                        : `calc(${(bbox.x1 / imageSize.width) * 100}% - 6px)`,
                      top: isTop
                        ? `calc(${(bbox.y0 / imageSize.height) * 100}% - 6px)`
                        : `calc(${(bbox.y1 / imageSize.height) * 100}% - 6px)`,
                    }}
                    onMouseDown={(e) => handleResizeStart(e, direction, bboxIndex)}
                  />
                );
              })
            )}
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

          <div className="mt-4 text-sm text-gray-600">
            <div className="flex justify-between items-center mb-2">
              <p className="font-semibold">
                BBox 개수: {currentBBoxes.length} | 페이지: {currentPage + 1}
                {selectedBboxIndex !== null && ` | 선택: ${selectedBboxIndex + 1}번째`}
              </p>
            </div>

            {/* 모든 BBox 정보 표시 */}
            <div className="max-h-32 overflow-y-auto bg-gray-50 rounded p-2 mb-2">
              {currentBBoxes.map((bbox, index) => (
                <p
                  key={index}
                  className={`text-xs font-mono mb-1 ${selectedBboxIndex === index ? 'text-blue-600 font-bold' : 'text-gray-700'}`}
                >
                  [{index + 1}] (PX) {'{'}page: {bbox.page}, x0: {roundToTwo(bbox.x0)}, y0: {roundToTwo(bbox.y0)}, x1: {roundToTwo(bbox.x1)}, y1: {roundToTwo(bbox.y1)}{'}'}
                </p>
              ))}
            </div>

            <p className="text-xs text-gray-500">
              💡 더블 클릭으로 저장 | 파란색: 선택된 BBox
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
                        [{index + 1}] PX: {'{'}page: {bbox.page}, x0: {bbox.x0}, y0: {bbox.y0}, x1: {bbox.x1}, y1: {bbox.y1}{'}'}
                      </p>
                      <p className="font-mono text-blue-600 ml-5">
                        PT: {'{'}page: {bboxPT.page}, x0: {bboxPT.x0}, y0: {bboxPT.y0}, x1: {bboxPT.x1}, y1: {bboxPT.y1}{'}'}
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
    </>
  );
}

export default BBoxEditor;
