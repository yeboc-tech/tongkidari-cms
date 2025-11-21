/**
 * SSOT: 공통 타입 정의
 * Single Source of Truth for common types
 */

/**
 * 프랙탈 패턴 Chapter 구조
 * 재귀적으로 하위 Chapter를 가질 수 있음
 *
 * 루트 레벨: 교과서/교재 (예: "통합사회 1", "경제")
 * 1단계: 대단원 (예: "I. 통합적 관점", "1. 경제생활")
 * 2단계: 중단원 (예: "01. 인간, 사회, 환경을 바라보는 다양한 관점")
 * 3단계 이상: 소단원 및 하위 구조 (무한 depth 가능)
 */
export interface Chapter {
  id: string; // 예: "1", "1-1", "1-1-1", "economy-1"
  title: string; // 예: "통합사회 1", "I. 통합적 관점", "01. 인간, 사회, 환경을 바라보는 다양한 관점"
  chapters?: Chapter[]; // 선택적: 하위 Chapter 배열 (재귀 구조)
}
