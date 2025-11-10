/**
 * SSOT: 시험 컬럼 정의
 * Single Source of Truth for exam columns configuration
 */

/**
 * 시험 컬럼 타입 정의
 */
export interface ExamColumn {
  month: string;
  type: string;
  region: string;
}

/**
 * 교육과정별 시험 컬럼 정의
 */
export const EXAM_COLUMNS = {
  '2015교육과정': [
    { month: '3', type: '학평', region: '서울시' },
    { month: '4', type: '학평', region: '경기도' },
    { month: '6', type: '모평', region: '평가원' },
    { month: '7', type: '학평', region: '인천시' },
    { month: '9', type: '모평', region: '평가원' },
    { month: '10', type: '학평', region: '서울시' },
    { month: '11', type: '수능', region: '평가원' },
  ] as const,
  '2022교육과정': [] as const,
} as const;

/**
 * 교육과정 타입
 */
export type CurriculumType = keyof typeof EXAM_COLUMNS;

/**
 * 특정 교육과정의 시험 컬럼 가져오기
 * @param curriculum - 교육과정 이름
 * @returns 해당 교육과정의 시험 컬럼 배열
 */
export function getExamColumns(curriculum: CurriculumType): readonly ExamColumn[] {
  return EXAM_COLUMNS[curriculum];
}
