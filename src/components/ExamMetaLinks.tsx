import { useState, useEffect } from 'react';
import { HOST_URL } from '../constants/apiConfig';
import { CDN_BASE_URL } from '../env';
import {
  getProblemCsvFilename,
  getProblemPageFilename,
  getProblemDebugFilename,
  getAnswerCsvFilename,
  getAnswerPageFilename,
  getAnswerDebugFilename,
  getAccuracyRateCsvFilename,
  getLabelCsvFilename,
  getHistoryCsvFilename,
} from '../ssot/examMetaUrl';
import { type PdfInfo } from '../api/Api';

interface ExamMetaLinksProps {
  examId: string;
  pdfInfo?: PdfInfo | null;
}

/**
 * 시험 관련 메타 데이터 링크 목록을 표시하는 컴포넌트
 */
function ExamMetaLinks({ examId, pdfInfo }: ExamMetaLinksProps) {
  const [fileExists, setFileExists] = useState<Map<string, boolean>>(new Map());
  const [checking, setChecking] = useState(true);
  const [showProblem, setShowProblem] = useState(true);

  // URL 생성 헬퍼 함수
  const getResourceUrl = (normalizedFilename: string): string => {
    return `${HOST_URL}/tongkidari/meta/${normalizedFilename}`;
  };

  const getDisplayUrl = (originalFilename: string): string => {
    return `${HOST_URL}/tongkidari/meta/${originalFilename}`;
  };

  const getPdfResourceUrl = (filename: string): string => {
    return `${CDN_BASE_URL}pdfs/${filename}`;
  };

  // 리소스 목록 생성
  const resources = {
    problemPdf: pdfInfo?.problemPdf ? {
      url: getPdfResourceUrl(pdfInfo.problemPdf),
    } : null,
    answerPdf: pdfInfo?.answerPdf ? {
      url: getPdfResourceUrl(pdfInfo.answerPdf),
    } : null,
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
    answerCsv: {
      originalFilename: `${examId}_해설.csv`,
      normalizedFilename: getAnswerCsvFilename(examId),
    },
    answerPages: [1, 2, 3, 4].map((page) => ({
      originalFilename: `${examId}_해설_p${page}.png`,
      normalizedFilename: getAnswerPageFilename(examId, page),
    })),
    answerDebug: [1, 2, 3, 4].map((page) => ({
      originalFilename: `${examId}_해설_p${page}_debug.png`,
      normalizedFilename: getAnswerDebugFilename(examId, page),
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
        const response = await fetch(url, { method: 'HEAD' });
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
      if (resources.problemPdf) {
        urlsToCheck.push(resources.problemPdf.url);
      }
      if (resources.answerPdf) {
        urlsToCheck.push(resources.answerPdf.url);
      }
      urlsToCheck.push(getResourceUrl(resources.problemCsv.normalizedFilename));
      resources.problemPages.forEach((r) => urlsToCheck.push(getResourceUrl(r.normalizedFilename)));
      resources.problemDebug.forEach((r) => urlsToCheck.push(getResourceUrl(r.normalizedFilename)));
      urlsToCheck.push(getResourceUrl(resources.answerCsv.normalizedFilename));
      resources.answerPages.forEach((r) => urlsToCheck.push(getResourceUrl(r.normalizedFilename)));
      resources.answerDebug.forEach((r) => urlsToCheck.push(getResourceUrl(r.normalizedFilename)));
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
  }, [examId, pdfInfo]);

  // PDF 링크 렌더링 함수
  const renderPdfLink = (url: string) => {
    const exists = fileExists.get(url);

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
            {url}
          </a>
        ) : (
          <span className="text-gray-400 font-mono text-xs break-all cursor-not-allowed">
            {url}
          </span>
        )}
      </div>
    );
  };

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
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-600">Exam Meta Links</h3>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium ${showProblem ? 'text-blue-600' : 'text-gray-500'}`}>
            문제
          </span>
          <button
            onClick={() => setShowProblem(!showProblem)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              showProblem ? 'bg-gray-300' : 'bg-blue-600'
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                showProblem ? 'translate-x-1' : 'translate-x-5'
              }`}
            />
          </button>
          <span className={`text-xs font-medium ${!showProblem ? 'text-blue-600' : 'text-gray-500'}`}>해설</span>
        </div>
      </div>
      <div className="space-y-3 text-sm">
        {showProblem ? (
          <>
            {/* Problem PDF */}
            <div>
              <p className="font-semibold text-gray-700 mb-1">Problem PDF</p>
              {resources.problemPdf ? (
                renderPdfLink(resources.problemPdf.url)
              ) : (
                <span className="text-gray-400 text-xs">확인된 경로 없음</span>
              )}
            </div>

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
          </>
        ) : (
          <>
            {/* Answer PDF */}
            <div>
              <p className="font-semibold text-gray-700 mb-1">Answer PDF</p>
              {resources.answerPdf ? (
                renderPdfLink(resources.answerPdf.url)
              ) : (
                <span className="text-gray-400 text-xs">확인된 경로 없음</span>
              )}
            </div>

            {/* Answer CSV */}
            <div>
              <p className="font-semibold text-gray-700 mb-1">Answer CSV</p>
              {renderLink(resources.answerCsv.originalFilename, resources.answerCsv.normalizedFilename)}
            </div>

            {/* Answer Pages */}
            <div>
              <p className="font-semibold text-gray-700 mb-1">Answer Pages</p>
              <div className="space-y-1">
                {resources.answerPages.map((resource, index) => (
                  <div key={index}>
                    {renderLink(resource.originalFilename, resource.normalizedFilename)}
                  </div>
                ))}
              </div>
            </div>

            {/* Answer Debug */}
            <div>
              <p className="font-semibold text-gray-700 mb-1">Answer Debug</p>
              <div className="space-y-1">
                {resources.answerDebug.map((resource, index) => (
                  <div key={index}>
                    {renderLink(resource.originalFilename, resource.normalizedFilename)}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Accuracy Rate CSV - 항상 표시 */}
        <div>
          <p className="font-semibold text-gray-700 mb-1">Accuracy Rate CSV</p>
          {renderLink(resources.rateCsv.originalFilename, resources.rateCsv.normalizedFilename)}
        </div>

        {/* Computed Label CSV - 항상 표시 */}
        <div>
          <p className="font-semibold text-gray-700 mb-1">Computed Label CSV</p>
          {renderLink(resources.labelCsv.originalFilename, resources.labelCsv.normalizedFilename)}
        </div>

        {/* History Data - 항상 표시 */}
        <div>
          <p className="font-semibold text-gray-700 mb-1">History </p>
          {renderLink(resources.historyCsv.originalFilename, resources.historyCsv.normalizedFilename)}
        </div>
      </div>
    </div>
  );
}

export default ExamMetaLinks;
