import { useState, useEffect } from 'react';
import { type BBox } from '../../../api/Api';

interface BBoxInteractiveOverlayProps {
  bbox: BBox;
  index: number;
  isSelected: boolean;
  imageSize: { width: number; height: number };
  onSelect: (index: number) => void;
  onDrag: (index: number, dx: number, dy: number) => void;
  onDoubleClick: () => void;
  onResizeStart: (e: React.MouseEvent, direction: string, index: number) => void;
}

function BBoxInteractiveOverlay({
  bbox,
  index,
  isSelected,
  imageSize,
  onSelect,
  onDrag,
  onDoubleClick,
  onResizeStart,
}: BBoxInteractiveOverlayProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onSelect(index);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // 전역 마우스 이벤트 리스너
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStart) return;

      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;

      // 화면 좌표를 이미지 좌표로 변환
      const imageDx = (dx / window.innerWidth) * imageSize.width;
      const imageDy = (dy / window.innerHeight) * imageSize.height;

      onDrag(index, imageDx, imageDy);
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragStart(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, imageSize, index, onDrag]);

  return (
    <>
      {/* Draggable Area */}
      <div
        className="absolute cursor-move"
        style={{
          left: `${(bbox.x0 / imageSize.width) * 100}%`,
          top: `${(bbox.y0 / imageSize.height) * 100}%`,
          width: `${((bbox.x1 - bbox.x0) / imageSize.width) * 100}%`,
          height: `${((bbox.y1 - bbox.y0) / imageSize.height) * 100}%`,
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={onDoubleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Move Handle - hover 시에만 표시 (선택 여부 무관) */}
        {isHovered && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-8 h-8 bg-white border-2 border-gray-600 rounded-full shadow-lg"></div>
          </div>
        )}
      </div>

      {/* Resize Handles */}
      {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((direction) => {
        const isTop = direction.startsWith('top');
        const isLeft = direction.endsWith('left');

        return (
          <div
            key={`${index}-${direction}`}
            className="absolute w-1.5 h-1.5 cursor-nwse-resize"
            style={{
              backgroundColor: isSelected ? 'red' : 'blue',
              left: isLeft
                ? `calc(${(bbox.x0 / imageSize.width) * 100}% - 3px)`
                : `calc(${(bbox.x1 / imageSize.width) * 100}% - 3px)`,
              top: isTop
                ? `calc(${(bbox.y0 / imageSize.height) * 100}% - 3px)`
                : `calc(${(bbox.y1 / imageSize.height) * 100}% - 3px)`,
            }}
            onMouseDown={(e) => onResizeStart(e, direction, index)}
          />
        );
      })}
    </>
  );
}

export default BBoxInteractiveOverlay;
