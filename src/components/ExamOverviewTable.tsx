import { useNavigate } from 'react-router-dom';
import { ExamId } from '../domain/examId';

interface ExamColumn {
  month: string;
  type: string;
  region: string;
}

interface ExamDataRow {
  year: number;
  data: readonly (number | null | 'forbidden')[];
}

interface ExamOverviewTableProps {
  columns: readonly ExamColumn[];
  data: readonly ExamDataRow[];
  isLoading?: boolean;
  subject?: string;
  target?: string;
  category?: string;
}

function ExamOverviewTable({
  columns,
  data,
  isLoading = false,
  subject,
  target,
  category,
}: ExamOverviewTableProps) {
  const navigate = useNavigate();

  // 각 연도의 합계 계산
  const calculateYearTotal = (rowData: readonly (number | null | 'forbidden')[]): number => {
    return rowData.reduce((sum: number, val) => {
      if (typeof val === 'number') {
        return sum + val;
      }
      return sum;
    }, 0);
  };

  // 전체 합계 계산
  const calculateGrandTotal = (): number => {
    return data.reduce((total: number, row) => {
      return total + calculateYearTotal(row.data);
    }, 0);
  };

  // 셀 클릭 핸들러
  const handleCellClick = (
    year: number,
    month: string,
    type: string,
    region: string,
    _value: number | null | 'forbidden'
  ) => {
    // 필수 정보가 없으면 클릭 불가
    if (!subject || !target || !category) return;

    // ExamId를 사용하여 exam_id 생성
    const examId = ExamId.generate({
      subject,
      target,
      year,
      month,
      type,
      region,
    });

    // /exam/:id 페이지로 이동
    navigate(`/exam/${examId}`);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border-2 border-gray-400">
        <thead>
          {/* 첫 번째 헤더 행 - 월 */}
          <tr className="bg-yellow-100">
            <th
              rowSpan={2}
              className="px-4 py-3 border-2 border-gray-400 text-center font-bold text-gray-900"
            >
              시행
              <br />
              년도
            </th>
            {columns.map((col, index) => (
              <th
                key={index}
                className="px-4 py-3 border-2 border-gray-400 text-center font-bold text-gray-900"
              >
                {col.month}월
                <br />
                {col.type}
              </th>
            ))}
            <th
              rowSpan={2}
              className="px-4 py-3 border-2 border-gray-400 text-center font-bold text-pink-600"
            >
              연도별
              <br />
              문항 수
            </th>
          </tr>
          {/* 두 번째 헤더 행 - 지역 */}
          <tr className="bg-yellow-100">
            {columns.map((col, index) => (
              <th key={index} className="px-4 py-2 border-2 border-gray-400 text-center text-sm text-gray-700">
                {col.region}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={row.year}
              className={rowIndex % 2 === 0 ? 'bg-purple-50' : 'bg-white'}
            >
              <td className="px-4 py-3 border-2 border-gray-400 text-center font-bold text-blue-600">
                {row.year}
              </td>
              {isLoading ? (
                <>
                  {Array.from({ length: columns.length }).map((_, colIndex) => (
                    <td
                      key={colIndex}
                      className="px-4 py-3 border-2 border-gray-400 text-center"
                    >
                      <div className="h-6 bg-gray-300 rounded animate-pulse mx-auto w-8"></div>
                    </td>
                  ))}
                  <td className="px-4 py-3 border-2 border-gray-400 text-center">
                    <div className="h-6 bg-gray-300 rounded animate-pulse mx-auto w-12"></div>
                  </td>
                </>
              ) : (
                <>
                  {row.data.map((value, colIndex) => {
                    const column = columns[colIndex];
                    const month = column?.month;
                    const type = column?.type;
                    const region = column?.region;
                    const isClickable = subject && target && category;

                    return (
                      <td
                        key={colIndex}
                        onClick={() =>
                          month && type && region && handleCellClick(row.year, month, type, region, value)
                        }
                        className={`px-4 py-3 border-2 border-gray-400 text-center ${
                          value === 'forbidden'
                            ? 'text-red-500'
                            : 'text-gray-900'
                        } ${
                          isClickable
                            ? 'cursor-pointer hover:bg-blue-100 transition-colors'
                            : ''
                        }`}
                      >
                        {value === 'forbidden' ? '🚫' : value !== null ? value : '-'}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 border-2 border-gray-400 text-center font-bold text-gray-900">
                    {calculateYearTotal(row.data)}
                  </td>
                </>
              )}
            </tr>
          ))}
          {/* 합계 행 */}
          <tr className="bg-yellow-100">
            <td
              colSpan={columns.length + 1}
              className="px-4 py-3 border-2 border-gray-400 text-center font-bold text-gray-900"
            >
              합계
            </td>
            <td className="px-4 py-3 border-2 border-gray-400 text-center font-bold text-gray-900">
              {isLoading ? (
                <div className="h-6 bg-gray-300 rounded animate-pulse mx-auto w-16"></div>
              ) : (
                calculateGrandTotal()
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default ExamOverviewTable;
