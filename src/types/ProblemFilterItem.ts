import { type ProblemTagType } from '../ssot/PROBLEM_TAG_TYPES';

/**
 * AND 조건으로 결합할 필터 아이템
 */
export interface AndProblemFilterItem {
  /** 태그 타입 (예: '단원_사회탐구_경제') */
  type: ProblemTagType;
  /** 태그 ID 배열 (예: ['1', '1-1', '1-2']), null이면 해당 type의 모든 문제 */
  tagIds: string[] | null;
}

/**
 * 문제 검색을 위한 단일 필터 조건
 */
export interface ProblemFilterItem {
  /** 태그 타입 (예: '단원_사회탐구_경제') */
  type: ProblemTagType;
  /** 태그 ID 배열 (예: ['1', '1-1', '1-2']), null이면 해당 type의 모든 문제 */
  tagIds: string[] | null;
  /** 연도 필터 (선택적) */
  years?: string[];
  /** 최소 정답률 (선택적) */
  accuracyMin?: number;
  /** 최대 정답률 (선택적) */
  accuracyMax?: number;
  //
  /** AND 조건으로 결합할 추가 필터 (선택적) */
  andProblemFilterItems?: AndProblemFilterItem[];
}
