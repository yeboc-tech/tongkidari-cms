// 시험 ID 생성 규칙 정의

interface ExamIdParams {
  subject: string;
  target: string;
  year: number;
  month: string;
  type: string;
  region: string;
}

/**
 * ID_SPECIFICATION: 시험 ID 생성 규칙
 * 형식: {subject}_{target}_{year}_{month}_{type}({region})
 * 예: "정치와법_고3_2024_10_학평(서울)"
 */
export const ID_SPECIFICATION = {
  separator: '_',
  format: '{subject}_{target}_{year}_{month}_{type}({region})',

  /**
   * 시험 ID 생성 함수
   */
  generate: ({ subject, target, year, month, type, region }: ExamIdParams): string => {
    // "3월" -> "3", "10월" -> "10"
    const monthNumber = month.replace('월', '');
    return `${subject}_${target}_${year}_${monthNumber}_${type}(${region})`;
  },

  /**
   * 시험 ID 파싱 함수
   */
  parse: (examId: string): ExamIdParams | null => {
    // 형식: subject_target_year_month_type(region)
    const regex = /^(.+)_(.+)_(\d{4})_(\d{1,2})_(.+)\((.+)\)$/;
    const match = examId.match(regex);

    if (!match) return null;

    return {
      subject: match[1],
      target: match[2],
      year: parseInt(match[3], 10),
      month: `${match[4]}월`,
      type: match[5],
      region: match[6],
    };
  },
};

export type { ExamIdParams };
