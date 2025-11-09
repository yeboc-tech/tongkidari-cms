/**
 * 월(month) 정규화 유틸리티
 */

/**
 * 월 문자열을 0 패딩된 형식으로 변환
 * @param month - 월 문자열 (예: "3", "3월", "10", "10월")
 * @returns 0 패딩된 월 문자열 (예: "03", "10")
 *
 * @example
 * normalizeMonth("3") // "03"
 * normalizeMonth("3월") // "03"
 * normalizeMonth("10") // "10"
 * normalizeMonth("10월") // "10"
 */
export const normalizeMonth = (month: string): string => {
  // "월" 제거 후 0 패딩 처리
  const monthNumber = month.replace('월', '').padStart(2, '0');
  return monthNumber;
};
