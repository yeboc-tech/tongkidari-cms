/**
 * 검색 인덱스 생성 및 검색 유틸리티
 */

import { SUBJECTS } from '../ssot/subjects';
import { GRADE_OPTIONS } from '../constants/tableConfig';
import { EXAM_COLUMNS } from '../ssot/EXAM_REGION';

export interface SearchIndexItem {
  type: 'exam' | 'problem';
  id: string; // exam_id or problem_id
  tokens: string[]; // 검색용 토큰 배열 (소문자)
  displayText: string; // 표시용 텍스트
  subject: string;
  grade: string;
  year: number;
  month: string;
  examType: string;
  problemNumber?: number; // problem일 경우만
}

/**
 * 전체 검색 인덱스 생성
 */
export function buildSearchIndex(): SearchIndexItem[] {
  const index: SearchIndexItem[] = [];
  const years = Array.from({ length: 12 }, (_, i) => 2013 + i); // 2013-2024
  const examColumns = EXAM_COLUMNS['2015교육과정']; // 현재는 2015교육과정만

  // 모든 과목 가져오기
  const allSubjects = Object.values(SUBJECTS).flatMap((curricula) =>
    Object.values(curricula).flat()
  );

  // 모든 조합 생성
  allSubjects.forEach((subject) => {
    GRADE_OPTIONS.forEach((grade) => {
      years.forEach((year) => {
        examColumns.forEach(({ month, type }) => {
          const examId = `${subject}_${grade}_${year}_${month}_${type}`;

          // exam_id 인덱스 아이템
          const examTokens = [
            subject.toLowerCase(),
            grade.toLowerCase(),
            year.toString(),
            month,
            type.toLowerCase(),
          ];

          index.push({
            type: 'exam',
            id: examId,
            tokens: examTokens,
            displayText: `${subject} ${grade} ${year}년 ${month}월 ${type}`,
            subject,
            grade,
            year,
            month,
            examType: type,
          });

          // problem_id 인덱스 아이템들 (1-20번)
          for (let problemNum = 1; problemNum <= 20; problemNum++) {
            const problemId = `${examId}_${problemNum}_문제`;
            const problemTokens = [
              ...examTokens,
              problemNum.toString(),
              '문제',
            ];

            index.push({
              type: 'problem',
              id: problemId,
              tokens: problemTokens,
              displayText: `${subject} ${grade} ${year}년 ${month}월 ${type} ${problemNum}번 문제`,
              subject,
              grade,
              year,
              month,
              examType: type,
              problemNumber: problemNum,
            });
          }
        });
      });
    });
  });

  return index;
}

/**
 * 검색 수행 (displayText 기반 순서 무관 토큰 매칭)
 */
export function searchIndex(query: string, index: SearchIndexItem[]): SearchIndexItem[] {
  if (!query.trim()) return [];

  // 검색어를 토큰으로 분리 (공백, 특수문자 기준)
  const queryTokens = query
    .toLowerCase()
    .split(/[\s_]+/)
    .filter((token) => token.length > 0);

  if (queryTokens.length === 0) return [];

  // displayText에 모든 검색 토큰이 포함된 아이템만 필터링
  const results = index.filter((item) => {
    const lowerDisplayText = item.displayText.toLowerCase();
    return queryTokens.every((queryToken) => lowerDisplayText.includes(queryToken));
  });

  return results;
}

/**
 * 텍스트 세그먼트 타입 (하이라이트 여부 포함)
 */
export interface TextSegment {
  text: string;
  highlight: boolean;
}

/**
 * 검색어에 따라 텍스트를 세그먼트로 분리
 */
export function getHighlightSegments(text: string, query: string): TextSegment[] {
  if (!query.trim()) return [{ text, highlight: false }];

  const queryTokens = query
    .toLowerCase()
    .split(/[\s_]+/)
    .filter((token) => token.length > 0);

  // 각 토큰의 위치 찾기
  const matches: Array<{ start: number; end: number; token: string }> = [];
  const lowerText = text.toLowerCase();

  queryTokens.forEach((token) => {
    let index = 0;
    while ((index = lowerText.indexOf(token, index)) !== -1) {
      matches.push({
        start: index,
        end: index + token.length,
        token,
      });
      index += token.length;
    }
  });

  if (matches.length === 0) return [{ text, highlight: false }];

  // 겹치지 않게 정렬 및 병합
  matches.sort((a, b) => a.start - b.start);

  const result: TextSegment[] = [];
  let lastIndex = 0;

  matches.forEach((match, idx) => {
    // 이전 매치와 겹치는지 확인
    if (idx > 0 && match.start < matches[idx - 1].end) {
      return; // 겹치면 스킵
    }

    // 매치 이전 텍스트
    if (match.start > lastIndex) {
      result.push({
        text: text.substring(lastIndex, match.start),
        highlight: false,
      });
    }

    // 매치된 텍스트 (하이라이트)
    result.push({
      text: text.substring(match.start, match.end),
      highlight: true,
    });

    lastIndex = match.end;
  });

  // 마지막 매치 이후 텍스트
  if (lastIndex < text.length) {
    result.push({
      text: text.substring(lastIndex),
      highlight: false,
    });
  }

  return result;
}
