/**
 * CDN URL 유틸리티 함수
 */

const CDN_BASE_URL = 'https://cdn.y3c.kr';

/**
 * 리소스 ID로 CDN URL 생성
 * @param resourceId - 문제 또는 해설 ID
 * @param isEdited - 편집된 콘텐츠 여부
 * @returns CDN URL
 */
export function getCdnUrl(resourceId: string, isEdited: boolean): string {
  const directory = isEdited ? 'edited-contents' : 'contents';
  return `${CDN_BASE_URL}/tongkidari/${directory}/${resourceId}.png`;
}

/**
 * 문제 CDN URL 생성
 * @param problemId - 문제 ID (_문제 포함)
 * @param isEdited - 편집 여부
 */
export function getProblemCdnUrl(problemId: string, isEdited: boolean): string {
  return getCdnUrl(problemId, isEdited);
}

/**
 * 해설 CDN URL 생성
 * @param problemId - 문제 ID (_문제 포함)
 * @param isEdited - 편집 여부
 */
export function getAnswerCdnUrl(problemId: string, isEdited: boolean): string {
  const answerId = problemId.replace('_문제', '_해설');
  return getCdnUrl(answerId, isEdited);
}
