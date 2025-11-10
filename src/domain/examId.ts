import { normalizeMonth } from '../utils/monthNormalizer';

/**
 * 시험 ID 생성을 위한 파라미터
 */
export interface ExamIdParams {
  subject: string;
  target: string;
  year: number;
  month: string;
  type: string;
  region?: string; // 표시용으로만 사용, ID 생성에는 포함되지 않음
}

/**
 * 시험 ID 생성 및 파싱 클래스
 * 형식: {subject}_{target}_{year}_{month}_{type}
 * 예: "정치와법_고3_2024_10_학평"
 */
export class ExamId {
  private static readonly FORMAT = '{subject}_{target}_{year}_{month}_{type}';

  /**
   * 시험 ID 생성
   * @param params - 시험 정보 파라미터
   * @returns 생성된 시험 ID
   */
  static generate(params: ExamIdParams): string {
    const { subject, target, year, month, type } = params;
    const normalizedMonth = normalizeMonth(month);
    return `${subject}_${target}_${year}_${normalizedMonth}_${type}`;
  }

  /**
   * 시험 ID 파싱
   * @param examId - 파싱할 시험 ID 문자열
   * @returns 파싱된 시험 정보 또는 null
   */
  static parse(examId: string): ExamIdParams | null {
    // 형식: subject_target_year_month_type
    const regex = /^(.+)_(.+)_(\d{4})_(\d{1,2})_(.+)$/;
    const match = examId.match(regex);

    if (!match) return null;

    return {
      subject: match[1],
      target: match[2],
      year: parseInt(match[3], 10),
      month: `${match[4]}월`,
      type: match[5],
      // region은 ID에 포함되지 않으므로 생략
    };
  }

  /**
   * 시험 ID 형식 반환
   */
  static getFormat(): string {
    return this.FORMAT;
  }
}
