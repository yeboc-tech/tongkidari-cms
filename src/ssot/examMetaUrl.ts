/**
 * SSOT: 시험 메타 파일 URL 생성 유틸리티
 * Single Source of Truth for exam metadata file URLs
 */

const CDN_BASE_URL = 'https://cdn.y3c.kr/tongkidari/meta';

/**
 * 한글 문자열을 NFD로 정규화
 * @param text - 정규화할 텍스트
 * @returns NFD로 정규화된 텍스트
 */
const normalizeToNFD = (text: string): string => {
  return text.normalize('NFD');
};

/**
 * examId에서 지역 정보를 제거 (괄호 부분 제거)
 * @param examId - 시험 ID
 * @returns 지역 정보가 제거된 시험 ID
 * @example "경제_고3_2024_03_학평(서울)" -> "경제_고3_2024_03_학평"
 */
export const removeRegion = (examId: string): string => {
  return examId.replace(/\([^)]+\)$/, '');
};

/**
 * 문제 CSV 파일의 정규화된 파일명 생성
 * @param examId - 시험 ID
 * @returns NFD로 정규화된 파일명
 */
export const getProblemCsvFilename = (examId: string): string => {
  const filename = `${examId}_문제.csv`;
  return normalizeToNFD(filename);
};

/**
 * 문제 CSV 파일의 전체 URL 생성
 * @param examId - 시험 ID
 * @returns 문제 CSV 파일 URL
 */
export const getProblemCsvUrl = (examId: string): string => {
  return `${CDN_BASE_URL}/${getProblemCsvFilename(examId)}`;
};

/**
 * 문제 페이지 이미지 파일의 정규화된 파일명 생성
 * @param examId - 시험 ID
 * @param page - 페이지 번호 (1-4)
 * @returns NFD로 정규화된 파일명
 */
export const getProblemPageFilename = (examId: string, page: number): string => {
  const filename = `${examId}_문제_p${page}.png`;
  return normalizeToNFD(filename);
};

/**
 * 문제 페이지 이미지 파일의 전체 URL 생성
 * @param examId - 시험 ID
 * @param page - 페이지 번호 (1-4)
 * @returns 문제 페이지 이미지 URL
 */
export const getProblemPageUrl = (examId: string, page: number): string => {
  return `${CDN_BASE_URL}/${getProblemPageFilename(examId, page)}`;
};

/**
 * 문제 디버그 이미지 파일의 정규화된 파일명 생성
 * @param examId - 시험 ID
 * @param page - 페이지 번호 (1-4)
 * @returns NFD로 정규화된 파일명
 */
export const getProblemDebugFilename = (examId: string, page: number): string => {
  const filename = `${examId}_문제_p${page}_debug.png`;
  return normalizeToNFD(filename);
};

/**
 * 문제 디버그 이미지 파일의 전체 URL 생성
 * @param examId - 시험 ID
 * @param page - 페이지 번호 (1-4)
 * @returns 문제 디버그 이미지 URL
 */
export const getProblemDebugUrl = (examId: string, page: number): string => {
  return `${CDN_BASE_URL}/${getProblemDebugFilename(examId, page)}`;
};

/**
 * 정확도 CSV 파일의 정규화된 파일명 생성 (지역 정보 제거)
 * @param examId - 시험 ID
 * @returns NFD로 정규화된 파일명
 */
export const getAccuracyRateCsvFilename = (examId: string): string => {
  const examIdWithoutRegion = removeRegion(examId);
  const filename = `${examIdWithoutRegion}_accuracy_rate.csv`;
  return normalizeToNFD(filename);
};

/**
 * 정확도 CSV 파일의 전체 URL 생성
 * @param examId - 시험 ID
 * @returns 정확도 CSV 파일 URL
 */
export const getAccuracyRateCsvUrl = (examId: string): string => {
  return `${CDN_BASE_URL}/${getAccuracyRateCsvFilename(examId)}`;
};

/**
 * 레이블 CSV 파일의 정규화된 파일명 생성
 * @param examId - 시험 ID
 * @returns NFD로 정규화된 파일명
 */
export const getLabelCsvFilename = (examId: string): string => {
  const filename = `${examId}_label.csv`;
  return normalizeToNFD(filename);
};

/**
 * 레이블 CSV 파일의 전체 URL 생성
 * @param examId - 시험 ID
 * @returns 레이블 CSV 파일 URL
 */
export const getLabelCsvUrl = (examId: string): string => {
  return `${CDN_BASE_URL}/${getLabelCsvFilename(examId)}`;
};

/**
 * 히스토리 CSV 파일의 정규화된 파일명 생성
 * @param examId - 시험 ID
 * @returns NFD로 정규화된 파일명
 */
export const getHistoryCsvFilename = (examId: string): string => {
  const filename = `${examId}_히스토리.csv`;
  return normalizeToNFD(filename);
};

/**
 * 히스토리 CSV 파일의 전체 URL 생성
 * @param examId - 시험 ID
 * @returns 히스토리 CSV 파일 URL
 */
export const getHistoryCsvUrl = (examId: string): string => {
  return `${CDN_BASE_URL}/${getHistoryCsvFilename(examId)}`;
};
