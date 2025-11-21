import { type BBox } from '../../../api/Api';

interface BBoxSvgOverlayProps {
  bbox: BBox;
  index: number;
  isSelected: boolean;
  imageSize: { width: number; height: number };
}

function BBoxSvgOverlay({ bbox, index, isSelected, imageSize }: BBoxSvgOverlayProps) {
  // x0 > x1 또는 y0 > y1인 경우를 처리 (음수 width/height 방지)
  const x = Math.min(bbox.x0, bbox.x1);
  const y = Math.min(bbox.y0, bbox.y1);
  const width = Math.abs(bbox.x1 - bbox.x0);
  const height = Math.abs(bbox.y1 - bbox.y0);

  return (
    <g>
      <rect
        x={`${(x / imageSize.width) * 100}%`}
        y={`${(y / imageSize.height) * 100}%`}
        width={`${(width / imageSize.width) * 100}%`}
        height={`${(height / imageSize.height) * 100}%`}
        fill="none"
        stroke={isSelected ? 'red' : 'blue'}
        strokeWidth={isSelected ? '1.5' : '1'}
        strokeDasharray="5,5"
      />
      <text
        x={`${(x / imageSize.width) * 100}%`}
        y={`${(y / imageSize.height) * 100}%`}
        fill={isSelected ? 'red' : 'blue'}
        fontSize="14"
        fontWeight="bold"
        dx="-2"
        dy="-4"
      >
        {index + 1}
      </text>
    </g>
  );
}

export default BBoxSvgOverlay;
