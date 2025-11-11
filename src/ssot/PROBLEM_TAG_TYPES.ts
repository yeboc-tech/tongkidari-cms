/**
 * SSOT: 문제 태그 타입 정의
 * Single Source of Truth for problem tag types
 */

/**
 * 문제 태그 타입 상수
 * DB에 저장되는 값
 */
export const PROBLEM_TAG_TYPES = {
  /** 마더텅 경제 단원 태그 */
  MOTHER: '마더텅_단원_태그',
  /** 자세한통합사회 단원 태그 */
  DETAIL_TONGSA: '자세한통사_단원_태그',
  /** 커스텀 태그 */
  CUSTOM_TONGSA: '자세한통사_커스텀_태그',
} as const;

/**
 * 문제 태그 타입 (union type)
 */
export type ProblemTagType = (typeof PROBLEM_TAG_TYPES)[keyof typeof PROBLEM_TAG_TYPES];

/**
 * 태그 타입별 표시 이름 매핑
 */
export const TAG_TYPE_DISPLAY_NAMES: Record<ProblemTagType, string> = {
  [PROBLEM_TAG_TYPES.MOTHER]: '마더텅 경제 단원 태그',
  [PROBLEM_TAG_TYPES.DETAIL_TONGSA]: '자세한통사 단원 태그',
  [PROBLEM_TAG_TYPES.CUSTOM_TONGSA]: '커스텀 태그',
};

/**
 * 태그 타입별 placeholder 텍스트
 */
export const TAG_TYPE_PLACEHOLDERS: Record<ProblemTagType, string> = {
  [PROBLEM_TAG_TYPES.MOTHER]: '마더텅 경제 단원 태그',
  [PROBLEM_TAG_TYPES.DETAIL_TONGSA]: '자세한통사 단원 태그',
  [PROBLEM_TAG_TYPES.CUSTOM_TONGSA]: '커스텀 태그',
};
