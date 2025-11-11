/**
 * SSOT: 공통 타입 정의
 * Single Source of Truth for common types
 */

/**
 * 소단원 구조 (3단계 구조에서 사용)
 */
export interface Subtopic {
  id: string; // 예: "아시아사-1-1-1", "아시아사-1-1-2"
  title: string; // 예: "01. 동아시아의 자연환경과 생업"
}

/**
 * 중단원 구조
 */
export interface Topic {
  id: string; // 예: "1-1-1", "1-1-2", "economy-1-1"
  title: string; // 예: "01. 인간, 사회, 환경을 바라보는 다양한 관점"
  subtopics?: Subtopic[]; // 선택적: 3단계 구조에서 사용
}

/**
 * 대단원 구조
 */
export interface Chapter {
  id: string; // 예: "1-1", "1-2", "economy-1"
  title: string; // 예: "I. 통합적 관점", "1. 경제생활"
  topics: Topic[];
}

/**
 * 교과(통합사회 1 또는 2, 마더텅 경제 등) 구조
 */
export interface Book {
  id: string; // 예: "1", "2", "economy"
  title: string; // 예: "통합사회 1", "통합사회 2", "경제"
  chapters: Chapter[];
}
