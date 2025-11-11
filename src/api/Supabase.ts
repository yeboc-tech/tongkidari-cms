import { supabase } from '../lib/supabase';
import { AccuracyRate } from '../types/accuracyRate';
import { type ProblemTagType } from '../ssot/PROBLEM_TAG_TYPES';

/**
 * Supabase API 래퍼
 * 데이터베이스 작업을 구조화된 방식으로 처리
 */

// ========== Types ==========

export interface ProblemTag {
  problem_id: string;
  type: ProblemTagType;
  tag_ids: string[];
  tag_labels: string[];
  updated_at: string;
}

export interface ProblemTagUpsertParams {
  problem_id: string;
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
     * @param problemIds - 문제 ID 배열
     * @returns 태그 데이터 배열
     */
    async fetch(problemIds: string[]): Promise<ProblemTag[]> {
      const { data, error } = await supabase
        .from('problem_tags')
        .select('*')
        .in('problem_id', problemIds);

      if (error) {
        console.error('Error fetching problem tags:', error);
        throw error;
      }

      return data || [];
    },

    /**
     * 특정 타입과 태그 ID로 문제 검색
     * tag_ids 배열에 selectedTagIds 중 하나라도 포함되면 해당 problem_id 반환
     * @param type - 태그 타입
     * @param selectedTagIds - 선택된 태그 ID 배열
     * @returns problem_id 배열
     */
    async searchByTagIds(type: ProblemTagType, selectedTagIds: string[]): Promise<string[]> {
      if (selectedTagIds.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from('problem_tags')
        .select('problem_id, tag_ids')
        .eq('type', type);

      if (error) {
        console.error('Error searching problem tags:', error);
        throw error;
      }

      if (!data) {
        return [];
      }

      // tag_ids에 selectedTagIds 중 하나라도 포함되는 항목 필터링
      const matchedProblemIds = data
        .filter((row) => {
          return row.tag_ids.some((tagId: string) => selectedTagIds.includes(tagId));
        })
        .map((row) => row.problem_id);

      return matchedProblemIds;
    },

    /**
     * 태그 데이터 저장 또는 업데이트
     * @param params - 저장할 태그 정보
     */
    async upsert(params: ProblemTagUpsertParams): Promise<void> {
      const { error } = await supabase
        .from('problem_tags')
        .upsert({
          problem_id: params.problem_id,
          type: params.type,
          tag_ids: params.tag_ids,
          tag_labels: params.tag_labels,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'problem_id,type'
        });

      if (error) {
        console.error('Error upserting problem tags:', error);
        throw error;
      }
    },

    /**
     * 특정 문제의 특정 타입 태그 삭제
     * @param problemId - 문제 ID
     * @param type - 태그 타입
     */
    async delete(problemId: string, type: ProblemTagType): Promise<void> {
      const { error } = await supabase
        .from('problem_tags')
        .delete()
        .eq('problem_id', problemId)
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
