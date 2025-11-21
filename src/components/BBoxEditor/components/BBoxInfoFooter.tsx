import { type BBox } from '../../../api/Api';

interface BBoxInfoFooterProps {
  bboxes: BBox[];
  currentPage: number;
  selectedBboxIndex: number | null;
  onAddBBox: () => void;
  onRemoveBBox: (index: number) => void;
}

function BBoxInfoFooter({ bboxes, currentPage, selectedBboxIndex, onAddBBox, onRemoveBBox }: BBoxInfoFooterProps) {
  // 소수점 두 자리로 반올림
  const roundToTwo = (num: number): number => {
    return Math.round(num * 100) / 100;
  };

  return (
    <div className="mt-4 text-sm text-gray-600">
      <div className="flex items-center gap-2 mb-2">
        <p className="font-semibold">
          BBox 개수: {bboxes.length} | 페이지: {currentPage + 1}
          {selectedBboxIndex !== null && ` | 선택: ${selectedBboxIndex + 1}번째`}
        </p>
        <button
          onClick={onAddBBox}
          className="px-2 py-1 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors text-xs"
          title="새 BBox 추가"
        >
          + 영역추가
        </button>
      </div>

      {/* 모든 BBox 정보 표시 */}
      <div className="max-h-32 overflow-y-auto bg-gray-50 rounded p-2 mb-2">
        {bboxes.map((bbox, index) => (
          <div
            key={index}
            className={`text-xs font-mono mb-1 ${selectedBboxIndex === index ? 'text-red-600 font-bold' : 'text-blue-600'}`}
          >
            [{index + 1}] (PX) {'{'}page: {bbox.page}, x0: {roundToTwo(bbox.x0)}, y0: {roundToTwo(bbox.y0)}, x1: {roundToTwo(bbox.x1)}, y1: {roundToTwo(bbox.y1)}{'}'}
            <button
              onClick={() => onRemoveBBox(index)}
              className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-600 hover:text-gray-800 transition-colors text-xs leading-none"
              title="BBox 삭제"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        💡 더블 클릭으로 저장 | 빨간색: 선택된 BBox
      </p>
    </div>
  );
}

export default BBoxInfoFooter;
