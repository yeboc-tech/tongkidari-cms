/**
 * SSOT: 문제 태그 타입 정의
 * Single Source of Truth for problem tag types
 */

/**
 * 문제 태그 타입 상수
 * DB에 저장되는 값
 */
export const PROBLEM_TAG_TYPES = {
  /** 마더텅 단원 태그 */
  MOTHER: 'MT_단원_태그',
  /** 자세한통합사회 단원 태그 */
  DETAIL_TONGSA: '자세한통사_단원_태그',
  /** 커스텀 태그 */
  CUSTOM_TONGSA: '자세한통사_커스텀_태그',
  /** 단원_사회탐구_경제 */
  SOCIAL_STUDY_ECONOMY: '단원_사회탐구_경제',
} as const;

/**
 * 문제 태그 타입 (union type)
 */
export type ProblemTagType = (typeof PROBLEM_TAG_TYPES)[keyof typeof PROBLEM_TAG_TYPES];
