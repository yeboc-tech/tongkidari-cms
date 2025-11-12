import { useState, useRef, useEffect } from 'react';
import { type BBox } from '../../api/Api';

interface BBoxEditorProps {
  imageUrl: string;
  bbox: BBox;
  onClose: () => void;
  problemId: string;
}

function BBoxEditor({ imageUrl, bbox, onClose, problemId }: BBoxEditorProps) {
  // pt to px 변환 (200 DPI)
  const PT_TO_PX_SCALE = 200 / 72; // 2.777778

  // bbox를 px 단위로 변환
  const bboxInPx: BBox = {
    page: bbox.page,
    x0: bbox.x0 * PT_TO_PX_SCALE,
    y0: bbox.y0 * PT_TO_PX_SCALE,
    x1: bbox.x1 * PT_TO_PX_SCALE,
    y1: bbox.y1 * PT_TO_PX_SCALE,
  };

  const [currentBBox, setCurrentBBox] = useState<BBox>(bboxInPx);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
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
        x0: currentBBox.x0 + dx,
        x1: currentBBox.x1 + dx,
        y0: currentBBox.y0 + dy,
        y1: currentBBox.y1 + dy,
      });
      setDragStart({ x, y });
    } else if (isResizing) {
      const newBBox = { ...currentBBox };

      if (isResizing.includes('left')) {
        newBBox.x0 = Math.min(x, currentBBox.x1 - 10);
      }
      if (isResizing.includes('right')) {
        newBBox.x1 = Math.max(x, currentBBox.x0 + 10);
      }
      if (isResizing.includes('top')) {
        newBBox.y0 = Math.min(y, currentBBox.y1 - 10);
      }
      if (isResizing.includes('bottom')) {
        newBBox.y1 = Math.max(y, currentBBox.y0 + 10);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">BBox Editor - {problemId}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
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
          <p>Current BBox: {JSON.stringify(currentBBox)}</p>
        </div>
      </div>
    </div>
  );
}

export default BBoxEditor;
