// API 클래스 정의

// Type definitions
export interface ExamColumn {
  month: string;
  type: string;
  region: string;
}

export interface ExamDataRow {
  year: number;
  data: (number | null)[];
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
