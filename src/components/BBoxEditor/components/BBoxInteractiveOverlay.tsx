import { type BBox } from '../../../api/Api';

interface BBoxInteractiveOverlayProps {
  bbox: BBox;
  index: number;
  isSelected: boolean;
  imageSize: { width: number; height: number };
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>, index: number) => void;
  onDoubleClick: () => void;
  onResizeStart: (e: React.MouseEvent, direction: string, index: number) => void;
}

function BBoxInteractiveOverlay({
  bbox,
  index,
  isSelected,
  imageSize,
  onMouseDown,
  onDoubleClick,
  onResizeStart,
}: BBoxInteractiveOverlayProps) {
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
        onMouseDown={(e) => onMouseDown(e, index)}
        onDoubleClick={onDoubleClick}
      />

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
