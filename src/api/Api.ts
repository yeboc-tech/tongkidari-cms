// API 클래스 정의

import { countTrueValues } from '../utils/csvParser';
import { getProblemCsvUrl } from '../ssot/examMetaUrl';

// Type definitions
export interface ExamColumn {
  month: string;
  type: string;
  region: string;
}

export interface ExamDataRow {
  year: number;
  data: (number | null | 'forbidden')[];
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
  { year: 2024, data: [20, 20, 20, 20, 20, 20, 20] },
  { year: 2023, data: [20, 20, 20, 20, 20, 20, 20] },
  { year: 2022, data: [20, 20, 20, 20, 20, 20, 20] },
  { year: 2021, data: [20, 20, 20, 20, 20, 20, 20] },
  { year: 2020, data: [20, 20, 20, 20, 20, 20, 20] },
  { year: 2019, data: [11, 13, 16, 10, 15, 9, 16] },
  { year: 2018, data: [5, 5, 8, 4, 5, 5, 6] },
  { year: 2017, data: [2, 2, 4, 2, 5, 1, 1] },
  { year: 2016, data: [2, 1, 2, 2, 3, null, 1] },
  { year: 2014, data: [null, null, null, 1, null, null, null] },
  { year: 2013, data: [null, null, null, null, null, null, 1] },
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
