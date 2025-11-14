// API 클래스 정의

import { countTrueValues } from '../utils/csvParser';
import { getProblemCsvUrl, getAnswerCsvUrl, getPdfListCsvUrl } from '../ssot/examMetaUrl';

// Type definitions
export interface ExamColumn {
  month: string;
  type: string;
  region: string;
}

export interface ExamCellData {
  problem: number | null | 'forbidden';
  answer: number | null | 'forbidden';
  hasProblemPdf: boolean;
  hasAnswerPdf: boolean;
}

export interface PdfInfo {
  problemPdf: string | null;
  answerPdf: string | null;
  _isProblemNFC?: boolean; // 문제 PDF 파일명에 NFC 정규화 이슈가 있는 경우 true
  _isAnswerNFC?: boolean; // 해설 PDF 파일명에 NFC 정규화 이슈가 있는 경우 true
}

export type PdfListMap = Record<string, PdfInfo>;

export interface BBox {
  page: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface ProblemMetadata {
  doc_type: string;
  id: string;
  subject: string;
  year: string;
  month: string;
  target: string;
  problem_number: string;
  has_image: string;
  image_path: string;
  source_pdf: string;
  page: string;
  bbox: BBox[];
  exam_id: string;
  conversion_error: string;
}

export interface ExamDataRow {
  year: number;
  data: ExamCellData[];
}

export interface ExamHistoryResponse {
  data: ExamDataRow[];
}

export interface FetchExamHistoryParams {
  years: number[];
  subject: string;
  target: string;
}

const MOCK_EXAM_DATA: ExamDataRow[] = [
  {
    year: 2024,
    data: [
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
    ],
  },
  {
    year: 2023,
    data: [
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
    ],
  },
  {
    year: 2022,
    data: [
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
    ],
  },
  {
    year: 2021,
    data: [
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
    ],
  },
  {
    year: 2020,
    data: [
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 20, answer: 20, hasProblemPdf: false, hasAnswerPdf: false },
    ],
  },
  {
    year: 2019,
    data: [
      { problem: 11, answer: 11, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 13, answer: 13, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 16, answer: 16, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 10, answer: 10, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 15, answer: 15, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 9, answer: 9, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 16, answer: 16, hasProblemPdf: false, hasAnswerPdf: false },
    ],
  },
  {
    year: 2018,
    data: [
      { problem: 5, answer: 5, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 5, answer: 5, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 8, answer: 8, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 4, answer: 4, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 5, answer: 5, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 5, answer: 5, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 6, answer: 6, hasProblemPdf: false, hasAnswerPdf: false },
    ],
  },
  {
    year: 2017,
    data: [
      { problem: 2, answer: 2, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 2, answer: 2, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 4, answer: 4, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 2, answer: 2, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 5, answer: 5, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 1, answer: 1, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 1, answer: 1, hasProblemPdf: false, hasAnswerPdf: false },
    ],
  },
  {
    year: 2016,
    data: [
      { problem: 2, answer: 2, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 1, answer: 1, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 2, answer: 2, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 2, answer: 2, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 3, answer: 3, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: null, answer: null, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 1, answer: 1, hasProblemPdf: false, hasAnswerPdf: false },
    ],
  },
  {
    year: 2014,
    data: [
      { problem: null, answer: null, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: null, answer: null, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: null, answer: null, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 1, answer: 1, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: null, answer: null, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: null, answer: null, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: null, answer: null, hasProblemPdf: false, hasAnswerPdf: false },
    ],
  },
  {
    year: 2013,
    data: [
      { problem: null, answer: null, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: null, answer: null, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: null, answer: null, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: null, answer: null, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: null, answer: null, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: null, answer: null, hasProblemPdf: false, hasAnswerPdf: false },
      { problem: 1, answer: 1, hasProblemPdf: false, hasAnswerPdf: false },
    ],
  },
];

/**
 * API 요청을 처리하는 객체
 * Supabase와 동일한 패턴으로 inner class를 통해 구조화
 */
export const Api = {
  /**
   * Meta 정보 관련 API (CSV 파일 기반)
   */
  Meta: {
    /**
     * exam_id로부터 CSV 파일에서 has_image가 True인 문항 개수를 가져옵니다
     * @param examId - 시험 ID (예: "경제_고3_2024_03_학평(서울)")
     * @returns has_image가 True인 문항 개수, 403일 경우 'forbidden', 파일이 없거나 에러 시 null
     */
    async fetchQuestionCount(examId: string): Promise<number | null | 'forbidden'> {
      try {
        const url = getProblemCsvUrl(examId);
        const response = await fetch(url);

        if (!response.ok) {
          // 403 Forbidden 체크
          if (response.status === 403) {
            return 'forbidden';
          }
          // 404나 다른 에러인 경우 null 반환
          return null;
        }

        const csvText = await response.text();
        const count = countTrueValues(csvText, 'has_image');
        return count;
      } catch (error) {
        console.error(`Failed to fetch exam question count for ${examId}:`, error);
        return null;
      }
    },

    /**
     * exam_id로부터 해설 CSV 파일에서 has_image가 True인 해설 개수를 가져옵니다
     * @param examId - 시험 ID (예: "경제_고3_2024_03_학평(서울)")
     * @returns has_image가 True인 해설 개수, 403일 경우 'forbidden', 파일이 없거나 에러 시 null
     */
    async fetchAnswerCount(examId: string): Promise<number | null | 'forbidden'> {
      try {
        const url = getAnswerCsvUrl(examId);
        const response = await fetch(url);

        if (!response.ok) {
          // 403 Forbidden 체크
          if (response.status === 403) {
            return 'forbidden';
          }
          // 404나 다른 에러인 경우 null 반환
          return null;
        }

        const csvText = await response.text();
        const count = countTrueValues(csvText, 'has_image');
        return count;
      } catch (error) {
        console.error(`Failed to fetch exam answer count for ${examId}:`, error);
        return null;
      }
    },

    /**
     * answer_id로 CSV 파일에서 해당 해설의 메타데이터를 가져옵니다
     * @param answerId - 해설 ID (예: "경제_고3_2021_11_수능_1_해설")
     * @returns 해설 메타데이터, 찾지 못한 경우 null
     */
    async fetchAnswerMetadata(answerId: string): Promise<ProblemMetadata | null> {
      try {
        // answerId에서 examId 추출 (마지막 _숫자_해설 제거)
        const match = answerId.match(/^(.+)_\d+_해설$/);
        if (!match) {
          console.error('Invalid answer ID format:', answerId);
          return null;
        }
        const examId = match[1];

        const url = getAnswerCsvUrl(examId);
        const response = await fetch(url);

        if (!response.ok) {
          return null;
        }

        const csvText = await response.text();
        const lines = csvText.split('\n');

        // 간단한 CSV 파서: 큰따옴표로 감싸진 필드 처리
        const parseCSVLine = (line: string): string[] => {
          const columns: string[] = [];
          let current = '';
          let inQuotes = false;

          for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                // 이스케이프된 따옴표 ("")
                current += '"';
                i++; // 다음 따옴표 스킵
              } else {
                // 따옴표 시작/끝
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              // 컬럼 구분자
              columns.push(current);
              current = '';
            } else {
              current += char;
            }
          }
          columns.push(current); // 마지막 컬럼
          return columns;
        };

        // 헤더 스킵
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const columns = parseCSVLine(line);
          if (columns.length < 13) continue;

          const id = columns[1];
          if (id !== answerId) continue;

          // bbox 컬럼(11번째)을 JSON 파싱하여 배열로 변환
          let bbox: BBox[] = [];
          try {
            const parsedBBoxArray = JSON.parse(columns[12]);

            // parsedBBoxArray가 배열인지 확인
            if (Array.isArray(parsedBBoxArray)) {
              // 각 아이템을 BBox 형식으로 변환
              bbox = parsedBBoxArray.map((item) => ({
                page: item.page_idx,
                x0: item.bbox[0],
                y0: item.bbox[1],
                x1: item.bbox[2],
                y1: item.bbox[3],
              }));
            }
          } catch (e) {
            console.error('Failed to parse bbox:', e, columns[11]);
            // 파싱 실패 시 빈 배열
            bbox = [];
          }

          return {
            doc_type: columns[0],
            id: columns[1],
            subject: columns[2],
            year: columns[3],
            month: columns[4],
            target: columns[5],
            problem_number: columns[6],
            has_image: columns[7],
            image_path: columns[8],
            source_pdf: columns[9],
            page: columns[10],
            bbox,
            exam_id: columns[12],
            conversion_error: columns[13] || '',
          };
        }

        return null;
      } catch (error) {
        console.error(`Failed to fetch answer metadata for ${answerId}:`, error);
        return null;
      }
    },

    /**
     * problem_id로 CSV 파일에서 해당 문제의 메타데이터를 가져옵니다
     * @param problemId - 문제 ID (예: "경제_고3_2021_11_수능_1_문제")
     * @returns 문제 메타데이터, 찾지 못한 경우 null
     */
    async fetchProblemMetadata(problemId: string): Promise<ProblemMetadata | null> {
      try {
        // problemId에서 examId 추출 (마지막 _숫자_문제 제거)
        const match = problemId.match(/^(.+)_\d+_문제$/);
        if (!match) {
          console.error('Invalid problem ID format:', problemId);
          return null;
        }
        const examId = match[1];

        const url = getProblemCsvUrl(examId);
        const response = await fetch(url);

        if (!response.ok) {
          return null;
        }

        const csvText = await response.text();
        const lines = csvText.split('\n');

        // 간단한 CSV 파서: 큰따옴표로 감싸진 필드 처리
        const parseCSVLine = (line: string): string[] => {
          const columns: string[] = [];
          let current = '';
          let inQuotes = false;

          for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                // 이스케이프된 따옴표 ("")
                current += '"';
                i++; // 다음 따옴표 스킵
              } else {
                // 따옴표 시작/끝
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              // 컬럼 구분자
              columns.push(current);
              current = '';
            } else {
              current += char;
            }
          }
          columns.push(current); // 마지막 컬럼
          return columns;
        };

        // 헤더 스킵
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const columns = parseCSVLine(line);
          if (columns.length < 13) continue;

          const id = columns[1];
          if (id !== problemId) continue;

          // bbox 컬럼(11번째)을 JSON 파싱하여 배열로 변환
          let bbox: BBox[] = [];
          try {
            const parsedBBox = JSON.parse(columns[11]);
            // 파싱된 값이 있으면 배열로 감싸기, 없으면 빈 배열
            if (parsedBBox && typeof parsedBBox === 'object') {
              bbox = [parsedBBox];
            }
          } catch (e) {
            console.error('Failed to parse bbox:', e, columns[11]);
            // 파싱 실패 시 빈 배열
            bbox = [];
          }

          return {
            doc_type: columns[0],
            id: columns[1],
            subject: columns[2],
            year: columns[3],
            month: columns[4],
            target: columns[5],
            problem_number: columns[6],
            has_image: columns[7],
            image_path: columns[8],
            source_pdf: columns[9],
            page: columns[10],
            bbox,
            exam_id: columns[12],
            conversion_error: columns[13] || '',
          };
        }

        return null;
      } catch (error) {
        console.error(`Failed to fetch problem metadata for ${problemId}:`, error);
        return null;
      }
    },

    /**
     * 시험 통계 데이터를 서버에서 가져오는 API
     * @param params - years: 연도 배열, subject: 과목명, target: 학년
     * @returns 시험 데이터
     */
    async fetchExamHistory({ years, subject, target }: FetchExamHistoryParams): Promise<ExamHistoryResponse> {
      // 쿼리 스트링 생성
      const queryParams = new URLSearchParams({
        year: years.join(','),
        subject,
        target,
      });

      // 실제 API 호출 (현재는 주석 처리)
      // const response = await fetch(`/api/exam-history?${queryParams.toString()}`);
      // const data = await response.json();
      // return data;

      // Mock 데이터 반환 (서버 구현 전까지 사용)
      console.log(`API Mock Call: /api/exam-history?${queryParams.toString()}`);

      // 네트워크 지연 시뮬레이션 (1초)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 요청된 연도에 해당하는 데이터만 필터링
      const filteredData = MOCK_EXAM_DATA.filter((row) => years.includes(row.year));

      return {
        data: filteredData,
      };
    },
  },

  /**
   * Contents 관련 API (실제 문제/해설 컨텐츠)
   * 향후 확장을 위한 placeholder
   */
  Contents: {
    // TODO: 실제 컨텐츠 가져오기 API 추가 예정
  },

  /**
   * PDF 관련 API
   */
  Pdf: {
    /**
     * list.csv에서 모든 PDF 목록을 가져와서 examId별로 매핑합니다
     * @returns examId를 키로 하고 문제/해설 PDF 정보를 값으로 하는 Map
     */
    async generatePdfFileMap(): Promise<PdfListMap> {
      try {
        const url = getPdfListCsvUrl();
        const response = await fetch(url);

        if (!response.ok) {
          console.error('Failed to fetch PDF list CSV');
          return {};
        }

        const csvText = await response.text();
        const lines = csvText.split('\n').filter((line) => line.trim().length > 0);

        const pdfMap: PdfListMap = {};

        for (const line of lines) {
          // CSV 파일의 첫 번째 컬럼만 추출 (쉼표로 구분)
          const columns = line.split(',');
          const originalFilename = columns[0].trim();
          const filename = originalFilename.normalize('NFC'); // NFC로 정규화
          const hasNfcIssue = originalFilename !== filename; // 정규화 이슈 확인

          // .pdf로 끝나지 않으면 스킵
          if (!filename.endsWith('.pdf')) {
            continue;
          }

          // 파일명에서 .pdf 제거
          const withoutExt = filename.slice(0, -4);

          // _문제 또는 _해설로 끝나는지 확인
          let type: 'problem' | 'answer' | null = null;
          let withoutType = withoutExt;

          if (withoutExt.endsWith('_문제')) {
            type = 'problem';
            withoutType = withoutExt.slice(0, -3); // "_문제" 제거
          } else if (withoutExt.endsWith('_해설')) {
            type = 'answer';
            withoutType = withoutExt.slice(0, -3); // "_해설" 제거
          } else {
            continue; // 문제도 해설도 아니면 스킵
          }

          // 마지막 _region 제거하여 baseExamId 생성
          const lastUnderscoreIndex = withoutType.lastIndexOf('_');
          if (lastUnderscoreIndex === -1) {
            continue;
          }

          const baseExamId = withoutType.substring(0, lastUnderscoreIndex);

          // Map에 저장
          if (!pdfMap[baseExamId]) {
            pdfMap[baseExamId] = {
              problemPdf: null,
              answerPdf: null,
            };
          }

          if (type === 'problem') {
            pdfMap[baseExamId].problemPdf = filename;
            // NFC 정규화 이슈가 있는 경우에만 플래그 설정
            if (hasNfcIssue) {
              pdfMap[baseExamId]._isProblemNFC = true;
            }
          } else if (type === 'answer') {
            pdfMap[baseExamId].answerPdf = filename;
            // NFC 정규화 이슈가 있는 경우에만 플래그 설정
            if (hasNfcIssue) {
              pdfMap[baseExamId]._isAnswerNFC = true;
            }
          }
        }

        return pdfMap;
      } catch (error) {
        console.error('Failed to fetch PDF list:', error);
        return {};
      }
    },
  },
};
