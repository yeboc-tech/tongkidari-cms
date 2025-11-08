interface ExamColumn {
  month: string;
  type: string;
  organizer: string;
}

interface ExamDataRow {
  year: number;
  data: readonly (number | null)[];
}

interface ExamHistoryTableProps {
  columns: readonly ExamColumn[];
  data: readonly ExamDataRow[];
}

function ExamHistoryTable({ columns, data }: ExamHistoryTableProps) {
  // 각 연도의 합계 계산
  const calculateYearTotal = (rowData: readonly (number | null)[]): number => {
    return rowData.reduce((sum: number, val) => sum + (val ?? 0), 0);
  };

  // 전체 합계 계산
  const calculateGrandTotal = (): number => {
    return data.reduce((total: number, row) => {
      return total + calculateYearTotal(row.data);
    }, 0);
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
                {col.month}
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
          {/* 두 번째 헤더 행 - 주관 기관 */}
          <tr className="bg-yellow-100">
            {columns.map((col, index) => (
              <th key={index} className="px-4 py-2 border-2 border-gray-400 text-center text-sm text-gray-700">
                {col.organizer}
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
              {row.data.map((value, colIndex) => (
                <td
                  key={colIndex}
                  className="px-4 py-3 border-2 border-gray-400 text-center text-gray-900"
                >
                  {value !== null ? value : '-'}
                </td>
              ))}
              <td className="px-4 py-3 border-2 border-gray-400 text-center font-bold text-gray-900">
                {calculateYearTotal(row.data)}
              </td>
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
              {calculateGrandTotal()}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default ExamHistoryTable;
