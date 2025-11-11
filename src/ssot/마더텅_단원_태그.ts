/**
 * SSOT: 마더텅 교재 구조 (경제, 동아시아사, 사회문화, 생활과윤리)
 * Single Source of Truth for 마더텅 curriculum structure
 */

import type { Book } from './types';
import { 경제 } from './마더텅_단원_태그_세부/경제';
import { 동아시아사 } from './마더텅_단원_태그_세부/동아시아사';
import { 사회문화 } from './마더텅_단원_태그_세부/사회문화';
import { 생활과윤리 } from './마더텅_단원_태그_세부/생활과윤리';

/**
 * 마더텅 교재 구조
 */
export const 마더텅_단원_태그: Book[] = [경제, 동아시아사, 사회문화, 생활과윤리];
