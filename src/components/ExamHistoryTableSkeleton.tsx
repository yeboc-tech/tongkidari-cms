function ExamHistoryTableSkeleton() {
  const skeletonRows = 11; // 2013-2024년도
  const skeletonCols = 7; // 7개 시험 (3월~11월)

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border-2 border-gray-400">
        <thead>
          {/* 첫 번째 헤더 행 */}
          <tr className="bg-yellow-100">
            <th
              rowSpan={2}
              className="px-4 py-3 border-2 border-gray-400 text-center"
            >
              <div className="h-6 bg-gray-300 rounded animate-pulse"></div>
            </th>
            {Array.from({ length: skeletonCols }).map((_, index) => (
              <th
                key={index}
                className="px-4 py-3 border-2 border-gray-400 text-center"
              >
                <div className="h-6 bg-gray-300 rounded animate-pulse mb-1"></div>
                <div className="h-6 bg-gray-300 rounded animate-pulse"></div>
              </th>
            ))}
            <th
              rowSpan={2}
              className="px-4 py-3 border-2 border-gray-400 text-center"
            >
              <div className="h-6 bg-gray-300 rounded animate-pulse"></div>
            </th>
          </tr>
          {/* 두 번째 헤더 행 */}
          <tr className="bg-yellow-100">
            {Array.from({ length: skeletonCols }).map((_, index) => (
              <th key={index} className="px-4 py-2 border-2 border-gray-400 text-center">
                <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: skeletonRows }).map((_, rowIndex) => (
            <tr
              key={rowIndex}
              className={rowIndex % 2 === 0 ? 'bg-purple-50' : 'bg-white'}
            >
              <td className="px-4 py-3 border-2 border-gray-400 text-center">
                <div className="h-6 bg-gray-300 rounded animate-pulse mx-auto w-16"></div>
              </td>
              {Array.from({ length: skeletonCols }).map((_, colIndex) => (
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
            </tr>
          ))}
          {/* 합계 행 */}
          <tr className="bg-yellow-100">
            <td
              colSpan={skeletonCols + 1}
              className="px-4 py-3 border-2 border-gray-400 text-center"
            >
              <div className="h-6 bg-gray-300 rounded animate-pulse mx-auto w-16"></div>
            </td>
            <td className="px-4 py-3 border-2 border-gray-400 text-center">
              <div className="h-6 bg-gray-300 rounded animate-pulse mx-auto w-16"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default ExamHistoryTableSkeleton;
