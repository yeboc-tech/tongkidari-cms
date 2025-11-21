import { type BBox } from '../../../api/Api';

interface BBoxSvgOverlayProps {
  bbox: BBox;
  index: number;
  isSelected: boolean;
  imageSize: { width: number; height: number };
}

function BBoxSvgOverlay({ bbox, index, isSelected, imageSize }: BBoxSvgOverlayProps) {
  return (
    <g>
      <rect
        x={`${(bbox.x0 / imageSize.width) * 100}%`}
        y={`${(bbox.y0 / imageSize.height) * 100}%`}
        width={`${((bbox.x1 - bbox.x0) / imageSize.width) * 100}%`}
        height={`${((bbox.y1 - bbox.y0) / imageSize.height) * 100}%`}
        fill="none"
        stroke={isSelected ? 'red' : 'blue'}
        strokeWidth={isSelected ? '1.5' : '1'}
        strokeDasharray="5,5"
      />
      <text
        x={`${(bbox.x0 / imageSize.width) * 100}%`}
        y={`${(bbox.y0 / imageSize.height) * 100}%`}
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
