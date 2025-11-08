import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CURRICULUM_GROUPS, GRADES } from '../constants/tableConfig';

function CategoryPage() {
  const { categoryName } = useParams<{ categoryName: string }>();
  const navigate = useNavigate();

  // 모든 연도 배열 생성
  const allYears = CURRICULUM_GROUPS.flatMap((group) =>
    Array.from({ length: group.endYear - group.startYear + 1 }, (_, i) => group.startYear + i),
  );

  // 특정 연도가 어느 교육과정에 속하는지 찾기
  const getCurriculumGroup = (year: number) => {
    return CURRICULUM_GROUPS.find((group) => year >= group.startYear && year <= group.endYear);
  };

  const [selectedCell, setSelectedCell] = useState<{ grade: string; year: number } | null>(null);

  const handleCellClick = (grade: string, year: number) => {
    setSelectedCell({ grade, year });

    const curriculum = getCurriculumGroup(year);
    const queryParams = new URLSearchParams({
      curriculum: curriculum?.name || '',
      target: grade,
      year: year.toString(),
      category: categoryName || '',
    });

    navigate(`/subject?${queryParams.toString()}`);
  };

  const isCellSelected = (grade: string, year: number) => {
    return selectedCell?.grade === grade && selectedCell?.year === year;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">{categoryName || '카테고리'}</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
          <thead className="bg-gray-50">
            {/* 교육과정 그룹 헤더 */}
            <tr>
              <th
                rowSpan={2}
                className="px-6 py-3 text-left text-sm font-semibold text-gray-900 border-b border-r border-gray-200 bg-gray-100"
              >
                구분
              </th>
              {CURRICULUM_GROUPS.map((group) => (
                <th
                  key={group.name}
                  colSpan={group.endYear - group.startYear + 1}
                  className={`px-6 py-3 text-center text-sm font-semibold text-gray-900 border-b border-gray-200 ${group.bgColor}`}
                >
                  {group.name}
                </th>
              ))}
            </tr>
            {/* 연도 헤더 */}
            <tr>
              {allYears.map((year) => {
                const group = getCurriculumGroup(year);
                return (
                  <th
                    key={year}
                    className={`px-6 py-3 text-center text-sm font-semibold text-gray-900 border-b border-gray-200 ${
                      group?.bgColor || 'bg-gray-50'
                    }`}
                  >
                    {year}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {GRADES.map((grade) => (
              <tr key={grade} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 border-b border-r border-gray-200 bg-gray-50">
                  {grade}
                </td>
                {allYears.map((year) => (
                  <td
                    key={year}
                    onClick={() => handleCellClick(grade, year)}
                    className={`px-6 py-4 text-sm text-center border-b border-gray-200 cursor-pointer transition-colors ${
                      isCellSelected(grade, year)
                        ? 'bg-blue-200 text-gray-900 font-semibold'
                        : 'text-gray-700 hover:bg-blue-100'
                    }`}
                  >
                    -
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CategoryPage;
