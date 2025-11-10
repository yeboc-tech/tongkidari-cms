import { supabase } from '../lib/supabase';
import { AccuracyRate } from '../types/accuracyRate';
import { type ProblemTagType } from '../ssot/PROBLEM_TAG_TYPES';

/**
 * Supabase API 래퍼
 * 데이터베이스 작업을 구조화된 방식으로 처리
 */

// ========== Types ==========

export interface ProblemTag {
  exam_id: string;
  type: ProblemTagType;
  tag_ids: string[];
  tag_labels: string[];
  updated_at: string;
}

export interface ProblemTagUpsertParams {
  exam_id: string;
  type: ProblemTagType;
  tag_ids: string[];
  tag_labels: string[];
}

// ========== API ==========

export const Supabase = {
  /**
   * ProblemTags 관련 API
   */
  ProblemTags: {
    /**
     * 여러 문제의 태그 데이터를 한 번에 가져오기
     * @param examIds - 문제 ID 배열
     * @returns 태그 데이터 배열
     */
    async fetch(examIds: string[]): Promise<ProblemTag[]> {
      const { data, error } = await supabase
        .from('problem_tags')
        .select('*')
        .in('exam_id', examIds);

      if (error) {
        console.error('Error fetching problem tags:', error);
        throw error;
      }

      return data || [];
    },

    /**
     * 태그 데이터 저장 또는 업데이트
     * @param params - 저장할 태그 정보
     */
    async upsert(params: ProblemTagUpsertParams): Promise<void> {
      const { error } = await supabase
        .from('problem_tags')
        .upsert({
          exam_id: params.exam_id,
          type: params.type,
          tag_ids: params.tag_ids,
          tag_labels: params.tag_labels,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'exam_id,type'
        });

      if (error) {
        console.error('Error upserting problem tags:', error);
        throw error;
      }
    },

    /**
     * 특정 문제의 특정 타입 태그 삭제
     * @param examId - 문제 ID
     * @param type - 태그 타입
     */
    async delete(examId: string, type: ProblemTagType): Promise<void> {
      const { error } = await supabase
        .from('problem_tags')
        .delete()
        .eq('exam_id', examId)
        .eq('type', type);

      if (error) {
        console.error('Error deleting problem tags:', error);
        throw error;
      }
    },
  },

  /**
   * AccuracyRates 관련 API
   */
  AccuracyRates: {
    /**
     * 여러 문제의 정확도 데이터를 한 번에 가져오기
     * @param questionIds - 문제 ID 배열
     * @returns 정확도 데이터 배열
     */
    async fetch(questionIds: string[]): Promise<AccuracyRate[]> {
      const { data, error } = await supabase
        .from('accuracy_rate')
        .select('*')
        .in('id', questionIds);

      if (error) {
        console.error('Error fetching accuracy rates:', error);
        throw error;
      }

      return data || [];
    },
  }
};
