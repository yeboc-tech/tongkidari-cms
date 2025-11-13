import { useNavigate } from 'react-router-dom';
import { ExamId } from '../domain/examId';
import { type ExamCellData, type ExamDataRow } from '../api/Api';

interface ExamColumn {
  month: string;
  type: string;
  region: string;
}

interface ExamOverviewTableProps {
  columns: readonly ExamColumn[];
  data: readonly ExamDataRow[];
  isLoading?: boolean;
  subject?: string;
  target?: string;
  category?: string;
  showProblemPdf: boolean;
  showAnswerPdf: boolean;
}

function ExamOverviewTable({
  columns,
  data,
  isLoading = false,
  subject,
  target,
  category,
  showProblemPdf,
  showAnswerPdf,
}: ExamOverviewTableProps) {
  const navigate = useNavigate();

  // 각 연도의 합계 계산
  const calculateYearTotal = (rowData: readonly ExamCellData[]): { problem: number; answer: number } => {
    return rowData.reduce<{ problem: number; answer: number }>(
      (sum, cell) => {
        if (typeof cell.problem === 'number') {
          sum.problem += cell.problem;
        }
        if (typeof cell.answer === 'number') {
          sum.answer += cell.answer;
        }
        return sum;
      },
      { problem: 0, answer: 0 }
    );
  };

  // 전체 합계 계산
  const calculateGrandTotal = (): { problem: number; answer: number } => {
    return data.reduce<{ problem: number; answer: number }>(
      (total, row) => {
        const yearTotal = calculateYearTotal(row.data);
        total.problem += yearTotal.problem;
        total.answer += yearTotal.answer;
        return total;
      },
      { problem: 0, answer: 0 }
    );
  };

  // 셀 클릭 핸들러
  const handleCellClick = (year: number, month: string, type: string, region: string) => {
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
                  {row.data.map((cellData, colIndex) => {
                    const column = columns[colIndex];
                    const month = column?.month;
                    const type = column?.type;
                    const region = column?.region;
                    const isClickable = subject && target && category;

                    // 문제 카운트만 표시
                    const problemText =
                      cellData.problem === 'forbidden' ? 'x' : cellData.problem !== null ? String(cellData.problem) : '-';

                    const problemIsForbidden = cellData.problem === 'forbidden';

                    // 해설 카운트
                    const answerText =
                      cellData.answer === 'forbidden' ? 'x' : cellData.answer !== null ? String(cellData.answer) : '-';
                    const answerIsForbidden = cellData.answer === 'forbidden';

                    return (
                      <td
                        key={colIndex}
                        onClick={() => month && type && region && handleCellClick(row.year, month, type, region)}
                        className={`px-4 py-3 border-2 border-gray-400 text-center text-gray-900 ${
                          isClickable ? 'cursor-pointer hover:bg-blue-100 transition-colors' : ''
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className={problemIsForbidden || answerIsForbidden ? 'text-red-500' : ''}>
                            {problemText}/{answerText}
                          </span>
                          <div className="flex gap-1">
                            {showProblemPdf && cellData.hasProblemPdf && (
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" title="문제 PDF 있음" />
                            )}
                            {showAnswerPdf && cellData.hasAnswerPdf && (
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" title="해설 PDF 있음" />
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 border-2 border-gray-400 text-center font-bold text-gray-900">
                    {(() => {
                      const total = calculateYearTotal(row.data);
                      return `${total.problem}/${total.answer}`;
                    })()}
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
                (() => {
                  const grandTotal = calculateGrandTotal();
                  return `${grandTotal.problem}/${grandTotal.answer}`;
                })()
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default ExamOverviewTable;
