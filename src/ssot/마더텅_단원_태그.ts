/**
 * SSOT: 마더텅 교재 구조 (경제, 동아시아사, 사회문화, 생활과윤리, 정치와법)
 * Single Source of Truth for 마더텅 curriculum structure
 */

import type { Chapter } from './types';
import { 사회탐구_경제 } from './마더텅_단원_태그_세부/사회탐구_경제';
import { 사회탐구_동아시아사 } from './마더텅_단원_태그_세부/사회탐구_동아시아사';
import { 사회탐구_사회문화 } from './마더텅_단원_태그_세부/사회탐구_사회문화';
import { 사회탐구_생활과윤리 } from './마더텅_단원_태그_세부/사회탐구_생활과윤리';
import { 사회탐구_정치와법 } from './마더텅_단원_태그_세부/사회탐구_정치와법';

/**
 * 마더텅 교재 구조 (프랙탈 패턴 Chapter 배열)
 */
export const 마더텅_단원_태그: Chapter[] = [
  사회탐구_경제,
  사회탐구_동아시아사,
  사회탐구_사회문화,
  사회탐구_생활과윤리,
  사회탐구_정치와법,
];
