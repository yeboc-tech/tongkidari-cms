/**
 * SSOT: 자세한통합사회 교과 구조 정의
 * Single Source of Truth for 자세한통합사회 curriculum structure
 */

import type { Chapter } from './types';
import { 자세한통사_1 } from './자세한통사_단원_태그/자세한통사_1';
import { 자세한통사_2 } from './자세한통사_단원_태그/자세한통사_2';

/**
 * 통합사회 전체 교과 구조 (프랙탈 패턴 Chapter 배열)
 *
 * 구조:
 * - 루트: 교과서 (통합사회 1, 통합사회 2)
 * - 1단계: 대단원 (I, II, III, ...)
 * - 2단계: 중단원 (01, 02, 03, ...)
 */
export const 자세한통합사회_단원_태그: Chapter[] = [자세한통사_1, 자세한통사_2];

/**
 * Chapter ID로 재귀적으로 찾기
 * @param chapterId - 예: "자세한통사_1", "자세한통사_1-1", "자세한통사_1-1-1", "자세한통사_2-3-2"
 */
export const findChapterById = (chapterId: string): Chapter | undefined => {
  const findRecursive = (chapters: Chapter[]): Chapter | undefined => {
    for (const chapter of chapters) {
      if (chapter.id === chapterId) return chapter;
      if (chapter.chapters) {
        const found = findRecursive(chapter.chapters);
        if (found) return found;
      }
    }
    return undefined;
  };

  return findRecursive(자세한통합사회_단원_태그);
};

/**
 * 레거시 호환 함수
 * @deprecated findChapterById 사용 권장
 */
export const findTopicById = findChapterById;

/**
 * 루트 레벨 Chapter (교과서) ID로 찾기
 * @param rootId - "자세한통사_1" 또는 "자세한통사_2"
 */
export const findRootChapterById = (rootId: string): Chapter | undefined => {
  return 자세한통합사회_단원_태그.find((chapter) => chapter.id === rootId);
};

/**
 * 레거시 호환 함수
 * @deprecated findRootChapterById 사용 권장
 */
export const findBookById = findRootChapterById;
