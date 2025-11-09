import { HOST_URL, decomposeHangul } from '../constants/apiConfig';

interface ExamResourcesProps {
  examId: string;
}

/**
 * 시험 관련 리소스 URL 목록을 표시하는 컴포넌트
 */
function ExamResources({ examId }: ExamResourcesProps) {
  // 지역 제거 함수 (rate.csv용)
  const removeRegion = (examIdWithRegion: string): string => {
    // "(지역)" 형식의 마지막 괄호 부분 제거
    return examIdWithRegion.replace(/\([^)]+\)$/, '');
  };

  // URL 생성 헬퍼 함수
  const getResourceUrl = (filename: string): string => {
    return `${HOST_URL}/tongkidari/meta/${decomposeHangul(filename)}`;
  };

  const getDisplayUrl = (filename: string): string => {
    return `${HOST_URL}/tongkidari/meta/${filename}`;
  };

  // 지역 제거된 examId (rate.csv용)
  const examIdWithoutRegion = removeRegion(examId);

  // 리소스 URL 목록 생성
  const resources = {
    problemCsv: {
      filename: `${examId}_문제.csv`,
    },
    problemPages: [1, 2, 3, 4].map((page) => ({
      filename: `${examId}_문제_p${page}.png`,
    })),
    problemDebug: [1, 2, 3, 4].map((page) => ({
      filename: `${examId}_문제_p${page}_debug.png`,
    })),
    rateCsv: {
      filename: `${examIdWithoutRegion}_accuracy_rate.csv`,
    },
    labelCsv: {
      filename: `${examId}_label.csv`,
    },
    historyCsv: {
      filename: `${examId}_히스토리.csv`,
    },
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-sm font-semibold text-gray-600 mb-2">Resources</h3>
      <div className="space-y-3 text-sm">
        {/* Problem CSV */}
        <div>
          <p className="font-semibold text-gray-700 mb-1">Problem CSV</p>
          <a
            href={getResourceUrl(resources.problemCsv.filename)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 font-mono text-xs break-all"
          >
            {getDisplayUrl(resources.problemCsv.filename)}
          </a>
        </div>

        {/* Problem Pages */}
        <div>
          <p className="font-semibold text-gray-700 mb-1">Problem Pages</p>
          <div className="space-y-1">
            {resources.problemPages.map((resource, index) => (
              <div key={index}>
                <a
                  href={getResourceUrl(resource.filename)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-mono text-xs break-all"
                >
                  {getDisplayUrl(resource.filename)}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Problem Debug */}
        <div>
          <p className="font-semibold text-gray-700 mb-1">Problem Debug</p>
          <div className="space-y-1">
            {resources.problemDebug.map((resource, index) => (
              <div key={index}>
                <a
                  href={getResourceUrl(resource.filename)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-mono text-xs break-all"
                >
                  {getDisplayUrl(resource.filename)}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Accuracy Rate CSV */}
        <div>
          <p className="font-semibold text-gray-700 mb-1">Accuracy Rate CSV</p>
          <a
            href={getResourceUrl(resources.rateCsv.filename)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 font-mono text-xs break-all"
          >
            {getDisplayUrl(resources.rateCsv.filename)}
          </a>
        </div>

        {/* Computed Label CSV */}
        <div>
          <p className="font-semibold text-gray-700 mb-1">Computed Label CSV</p>
          <a
            href={getResourceUrl(resources.labelCsv.filename)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 font-mono text-xs break-all"
          >
            {getDisplayUrl(resources.labelCsv.filename)}
          </a>
        </div>

        {/* History Data  */}
        <div>
          <p className="font-semibold text-gray-700 mb-1">History </p>
          <a
            href={getResourceUrl(resources.historyCsv.filename)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 font-mono text-xs break-all"
          >
            {getDisplayUrl(resources.historyCsv.filename)}
          </a>
        </div>
      </div>
    </div>
  );
}

export default ExamResources;
