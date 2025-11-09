import { useState, useEffect } from 'react';
import { HOST_URL } from '../constants/apiConfig';
import {
  getProblemCsvFilename,
  getProblemPageFilename,
  getProblemDebugFilename,
  getAccuracyRateCsvFilename,
  getLabelCsvFilename,
  getHistoryCsvFilename,
} from '../ssot/examMetaUrl';

interface ExamMetaLinksProps {
  examId: string;
}

/**
 * 시험 관련 메타 데이터 링크 목록을 표시하는 컴포넌트
 */
function ExamMetaLinks({ examId }: ExamMetaLinksProps) {
  const [fileExists, setFileExists] = useState<Map<string, boolean>>(new Map());
  const [checking, setChecking] = useState(true);

  // URL 생성 헬퍼 함수
  const getResourceUrl = (normalizedFilename: string): string => {
    return `${HOST_URL}/tongkidari/meta/${normalizedFilename}`;
  };

  const getDisplayUrl = (originalFilename: string): string => {
    return `${HOST_URL}/tongkidari/meta/${originalFilename}`;
  };

  // 리소스 목록 생성
  const resources = {
    problemCsv: {
      originalFilename: `${examId}_문제.csv`,
      normalizedFilename: getProblemCsvFilename(examId),
    },
    problemPages: [1, 2, 3, 4].map((page) => ({
      originalFilename: `${examId}_문제_p${page}.png`,
      normalizedFilename: getProblemPageFilename(examId, page),
    })),
    problemDebug: [1, 2, 3, 4].map((page) => ({
      originalFilename: `${examId}_문제_p${page}_debug.png`,
      normalizedFilename: getProblemDebugFilename(examId, page),
    })),
    rateCsv: {
      originalFilename: `${examId.replace(/\([^)]+\)$/, '')}_accuracy_rate.csv`,
      normalizedFilename: getAccuracyRateCsvFilename(examId),
    },
    labelCsv: {
      originalFilename: `${examId}_label.csv`,
      normalizedFilename: getLabelCsvFilename(examId),
    },
    historyCsv: {
      originalFilename: `${examId}_히스토리.csv`,
      normalizedFilename: getHistoryCsvFilename(examId),
    },
  };

  // 파일 존재 여부 확인
  useEffect(() => {
    const checkFileExists = async (url: string): Promise<boolean> => {
      try {
        console.log('Checking URL:', url);
        const response = await fetch(url, { method: 'HEAD' });
        console.log(`URL: ${url}, Status: ${response.status}, OK: ${response.ok}`);
        return response.ok;
      } catch (error) {
        console.error('Fetch error for URL:', url, error);
        return false;
      }
    };

    const checkAllFiles = async () => {
      setChecking(true);
      const urlsToCheck: string[] = [];

      // 모든 파일 URL 수집
      urlsToCheck.push(getResourceUrl(resources.problemCsv.normalizedFilename));
      resources.problemPages.forEach((r) => urlsToCheck.push(getResourceUrl(r.normalizedFilename)));
      resources.problemDebug.forEach((r) => urlsToCheck.push(getResourceUrl(r.normalizedFilename)));
      urlsToCheck.push(getResourceUrl(resources.rateCsv.normalizedFilename));
      urlsToCheck.push(getResourceUrl(resources.labelCsv.normalizedFilename));
      urlsToCheck.push(getResourceUrl(resources.historyCsv.normalizedFilename));

      // 모든 파일 확인
      const results = await Promise.all(
        urlsToCheck.map(async (url) => ({
          url,
          exists: await checkFileExists(url),
        }))
      );

      // 결과를 Map으로 저장
      const existsMap = new Map<string, boolean>();
      results.forEach(({ url, exists }) => {
        existsMap.set(url, exists);
      });

      setFileExists(existsMap);
      setChecking(false);
    };

    checkAllFiles();
  }, [examId]);

  // 링크 렌더링 헬퍼 함수
  const renderLink = (originalFilename: string, normalizedFilename: string) => {
    const url = getResourceUrl(normalizedFilename);
    const exists = fileExists.get(url);
    const displayUrl = getDisplayUrl(originalFilename);

    return (
      <div className="flex items-center gap-2">
        {/* 상태 아이콘 */}
        {checking ? (
          <span className="text-gray-400">⏳</span>
        ) : exists ? (
          <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )}

        {/* 링크 */}
        {exists ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 font-mono text-xs break-all"
          >
            {displayUrl}
          </a>
        ) : (
          <span className="text-gray-400 font-mono text-xs break-all cursor-not-allowed">
            {displayUrl}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-sm font-semibold text-gray-600 mb-2">Exam Meta Links</h3>
      <div className="space-y-3 text-sm">
        {/* Problem CSV */}
        <div>
          <p className="font-semibold text-gray-700 mb-1">Problem CSV</p>
          {renderLink(resources.problemCsv.originalFilename, resources.problemCsv.normalizedFilename)}
        </div>

        {/* Problem Pages */}
        <div>
          <p className="font-semibold text-gray-700 mb-1">Problem Pages</p>
          <div className="space-y-1">
            {resources.problemPages.map((resource, index) => (
              <div key={index}>
                {renderLink(resource.originalFilename, resource.normalizedFilename)}
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
                {renderLink(resource.originalFilename, resource.normalizedFilename)}
              </div>
            ))}
          </div>
        </div>

        {/* Accuracy Rate CSV */}
        <div>
          <p className="font-semibold text-gray-700 mb-1">Accuracy Rate CSV</p>
          {renderLink(resources.rateCsv.originalFilename, resources.rateCsv.normalizedFilename)}
        </div>

        {/* Computed Label CSV */}
        <div>
          <p className="font-semibold text-gray-700 mb-1">Computed Label CSV</p>
          {renderLink(resources.labelCsv.originalFilename, resources.labelCsv.normalizedFilename)}
        </div>

        {/* History Data  */}
        <div>
          <p className="font-semibold text-gray-700 mb-1">History </p>
          {renderLink(resources.historyCsv.originalFilename, resources.historyCsv.normalizedFilename)}
        </div>
      </div>
    </div>
  );
}

export default ExamMetaLinks;
