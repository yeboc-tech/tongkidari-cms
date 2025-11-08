// API 설정 상수

// CDN 호스트 URL
export const HOST_URL = 'https://cdn.y3c.kr';

// 컨텐츠 경로
export const CONTENT_PATH = '/tongkidari/contents';

/**
 * 한글 자소 분리 함수 (NFC -> NFD 정규화)
 * @param text - 분리할 한글 텍스트
 * @returns 자소 분리된 텍스트 (NFD)
 */
const decomposeHangul = (text: string): string => {
  return text.normalize('NFD');
};

/**
 * 문제 이미지 URL 생성
 * @param examId - 시험 ID (예: "정치와법_고3_2024_10_학평(서울)")
 * @param questionNumber - 문제 번호 (1-20)
 * @returns 문제 이미지 URL
 */
export const getQuestionImageUrl = (examId: string, questionNumber: number): string => {
  const fullPath = `${examId}_${questionNumber}_문제`;
  const decomposedPath = decomposeHangul(fullPath);
  return `${HOST_URL}${CONTENT_PATH}/${decomposedPath}.png`;
};

/**
 * 전체 문제 목록의 URL 배열 생성
 * @param examId - 시험 ID
 * @param totalQuestions - 전체 문제 수 (기본값: 20)
 * @returns 문제 이미지 URL 배열
 */
export const getQuestionImageUrls = (examId: string, totalQuestions: number = 20): string[] => {
  return Array.from({ length: totalQuestions }, (_, i) => getQuestionImageUrl(examId, i + 1));
};
