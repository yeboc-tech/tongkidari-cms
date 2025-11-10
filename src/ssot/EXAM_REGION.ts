/**
 * SSOT: 시험 컬럼 정의
 * Single Source of Truth for exam columns configuration
 */

import { getCurriculumByYearAndGrade, type Grade } from '../constants/tableConfig';

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
    { month: '03', type: '학평', region: '서울시' },
    { month: '04', type: '학평', region: '경기도' },
    { month: '06', type: '모평', region: '평가원' },
    { month: '07', type: '학평', region: '인천시' },
    { month: '09', type: '모평', region: '평가원' },
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

/**
 * 연도, 학년, 월, 시험 유형으로 주관 지역 조회
 * @param year - 시험 연도
 * @param grade - 학년 (고1, 고2, 고3)
 * @param month - 시험 월 (숫자 또는 "N월" 형식)
 * @param type - 시험 유형 (학평, 모평, 수능)
 * @returns 주관 지역 (찾지 못하면 '-')
 */
export function getRegionByExamInfo(
  year: number,
  grade: Grade,
  month: string,
  type: string
): string {
  // 학년과 연도로 교육과정 추정
  const curriculum = getCurriculumByYearAndGrade(year, grade);

  // 교육과정에 맞는 시험 컬럼 가져오기
  const examColumns = getExamColumns(curriculum);

  // 월에서 "월" 제거하고 숫자만 추출 후 2자리로 패딩
  const monthNumber = month.replace('월', '').padStart(2, '0');

  // 해당 월과 유형의 시험 정보 찾기
  const examColumn = examColumns.find(
    (col) => col.month === monthNumber && col.type === type
  );

  return examColumn?.region || '-';
}
