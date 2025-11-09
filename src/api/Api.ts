// API 클래스 정의

import { countTrueValues } from '../utils/csvParser';
import { getProblemCsvUrl, getAnswerCsvUrl } from '../ssot/examMetaUrl';

// Type definitions
export interface ExamColumn {
  month: string;
  type: string;
  region: string;
}

export interface ExamCellData {
  problem: number | null | 'forbidden';
  answer: number | null | 'forbidden';
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
      { problem: 20, answer: 20 },
      { problem: 20, answer: 20 },
      { problem: 20, answer: 20 },
      { problem: 20, answer: 20 },
      { problem: 20, answer: 20 },
      { problem: 20, answer: 20 },
      { problem: 20, answer: 20 },
    ],
  },
  {
    year: 2023,
    data: [
      { problem: 20, answer: 20 },
      { problem: 20, answer: 20 },
      { problem: 20, answer: 20 },
      { problem: 20, answer: 20 },
      { problem: 20, answer: 20 },
      { problem: 20, answer: 20 },
      { problem: 20, answer: 20 },
    ],
  },
  {
    year: 2022,
    data: [
      { problem: 20, answer: 20 },
      { problem: 20, answer: 20 },
      { problem: 20, answer: 20 },
      { problem: 20, answer: 20 },
      { problem: 20, answer: 20 },
      { problem: 20, answer: 20 },
      { problem: 20, answer: 20 },
    ],
  },
  {
    year: 2021,
    data: [
      { problem: 20, answer: 20 },
      { problem: 20, answer: 20 },
      { problem: 20, answer: 20 },
      { problem: 20, answer: 20 },
      { problem: 20, answer: 20 },
      { problem: 20, answer: 20 },
      { problem: 20, answer: 20 },
    ],
  },
  {
    year: 2020,
    data: [
      { problem: 20, answer: 20 },
      { problem: 20, answer: 20 },
      { problem: 20, answer: 20 },
      { problem: 20, answer: 20 },
      { problem: 20, answer: 20 },
      { problem: 20, answer: 20 },
      { problem: 20, answer: 20 },
    ],
  },
  {
    year: 2019,
    data: [
      { problem: 11, answer: 11 },
      { problem: 13, answer: 13 },
      { problem: 16, answer: 16 },
      { problem: 10, answer: 10 },
      { problem: 15, answer: 15 },
      { problem: 9, answer: 9 },
      { problem: 16, answer: 16 },
    ],
  },
  {
    year: 2018,
    data: [
      { problem: 5, answer: 5 },
      { problem: 5, answer: 5 },
      { problem: 8, answer: 8 },
      { problem: 4, answer: 4 },
      { problem: 5, answer: 5 },
      { problem: 5, answer: 5 },
      { problem: 6, answer: 6 },
    ],
  },
  {
    year: 2017,
    data: [
      { problem: 2, answer: 2 },
      { problem: 2, answer: 2 },
      { problem: 4, answer: 4 },
      { problem: 2, answer: 2 },
      { problem: 5, answer: 5 },
      { problem: 1, answer: 1 },
      { problem: 1, answer: 1 },
    ],
  },
  {
    year: 2016,
    data: [
      { problem: 2, answer: 2 },
      { problem: 1, answer: 1 },
      { problem: 2, answer: 2 },
      { problem: 2, answer: 2 },
      { problem: 3, answer: 3 },
      { problem: null, answer: null },
      { problem: 1, answer: 1 },
    ],
  },
  {
    year: 2014,
    data: [
      { problem: null, answer: null },
      { problem: null, answer: null },
      { problem: null, answer: null },
      { problem: 1, answer: 1 },
      { problem: null, answer: null },
      { problem: null, answer: null },
      { problem: null, answer: null },
    ],
  },
  {
    year: 2013,
    data: [
      { problem: null, answer: null },
      { problem: null, answer: null },
      { problem: null, answer: null },
      { problem: null, answer: null },
      { problem: null, answer: null },
      { problem: null, answer: null },
      { problem: 1, answer: 1 },
    ],
  },
];

/**
 * API 요청을 처리하는 클래스
 */
export class Api {
  /**
   * exam_id로부터 CSV 파일에서 has_image가 True인 문항 개수를 가져옵니다
   * @param examId - 시험 ID (예: "경제_고3_2024_03_학평(서울)")
   * @returns has_image가 True인 문항 개수, 403일 경우 'forbidden', 파일이 없거나 에러 시 null
   */
  static async fetchExamQuestionCount(examId: string): Promise<number | null | 'forbidden'> {
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
  }

  /**
   * exam_id로부터 해설 CSV 파일에서 has_image가 True인 해설 개수를 가져옵니다
   * @param examId - 시험 ID (예: "경제_고3_2024_03_학평(서울)")
   * @returns has_image가 True인 해설 개수, 403일 경우 'forbidden', 파일이 없거나 에러 시 null
   */
  static async fetchExamAnswerCount(examId: string): Promise<number | null | 'forbidden'> {
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
  }

  /**
   * 시험 통계 데이터를 서버에서 가져오는 API
   * @param params - years: 연도 배열, subject: 과목명, target: 학년
   * @returns 시험 데이터
   */
  static async fetchExamHistory({
    years,
    subject,
    target,
  }: FetchExamHistoryParams): Promise<ExamHistoryResponse> {
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
  }
}
