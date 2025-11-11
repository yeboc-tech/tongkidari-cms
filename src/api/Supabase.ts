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

export interface SelectedTag {
  tagIds: string[];
  tagLabels: string[];
}

export interface TagWithId {
  id: string;
  label: string;
}

export interface ProblemInfo {
  problemId: string;
  questionNumber: number;
  accuracyData?: AccuracyRate;
  motherTongTag: SelectedTag | null;
  integratedTag: SelectedTag | null;
  customTags: TagWithId[];
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
      const { data, error } = await supabase.from('problem_tags').select('*').in('problem_id', problemIds);

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

      const { data, error } = await supabase.from('problem_tags').select('problem_id, tag_ids').eq('type', type);

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
      const { error } = await supabase.from('problem_tags').upsert(
        {
          problem_id: params.problem_id,
          type: params.type,
          tag_ids: params.tag_ids,
          tag_labels: params.tag_labels,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'problem_id,type',
        },
      );

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
      const { error } = await supabase.from('problem_tags').delete().eq('problem_id', problemId).eq('type', type);

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
      const { data, error } = await supabase.from('accuracy_rate').select('*').in('id', questionIds);

      if (error) {
        console.error('Error fetching accuracy rates:', error);
        throw error;
      }

      return data || [];
    },
  },

  /**
   * 여러 문제의 모든 정보를 한 번에 가져오기
   * accuracy_rate와 problem_tags를 조합하여 반환
   * @param problemIds - 문제 ID 배열
   * @returns 문제 정보 배열
   */
  async fetchProblemInfoByIds(problemIds: string[]): Promise<ProblemInfo[]> {
    if (problemIds.length === 0) {
      return [];
    }

    // accuracy_rate 테이블에서 데이터 가져오기 (id가 problem_id 역할)
    const { data: accuracyData, error: accuracyError } = await supabase
      .from('accuracy_rate')
      .select('*')
      .in('id', problemIds);

    if (accuracyError) {
      console.error('Error fetching accuracy rates:', accuracyError);
      throw accuracyError;
    }

    // problem_tags 테이블에서 모든 타입의 태그 가져오기
    const { data: tagsData, error: tagsError } = await supabase
      .from('problem_tags')
      .select('*')
      .in('problem_id', problemIds);

    if (tagsError) {
      console.error('Error fetching problem tags:', tagsError);
      throw tagsError;
    }

    // accuracy_rate를 Map으로 변환
    const accuracyMap = new Map<string, AccuracyRate>();
    (accuracyData || []).forEach((item) => {
      accuracyMap.set(item.id, item);
    });

    // problem_tags를 problem_id별로 그룹화
    const tagsMap = new Map<string, ProblemTag[]>();
    (tagsData || []).forEach((tag) => {
      if (!tagsMap.has(tag.problem_id)) {
        tagsMap.set(tag.problem_id, []);
      }
      tagsMap.get(tag.problem_id)!.push(tag);
    });

    // 각 problem_id에 대해 ProblemInfo 생성
    return problemIds.map((problemId) => {
      // problem_id에서 문제 번호 추출: "경제_고3_2024_03_학평_1_문제" -> 1
      let questionNumber = 0;
      let cleaned = problemId.endsWith('_문제') ? problemId.slice(0, -3) : problemId;
      const parts = cleaned.split('_');
      const lastPart = parts[parts.length - 1];
      const parsedNumber = parseInt(lastPart, 10);
      if (!isNaN(parsedNumber)) {
        questionNumber = parsedNumber;
      }

      const accuracyData = accuracyMap.get(problemId);
      const tags = tagsMap.get(problemId) || [];

      // 태그 타입별로 분류
      let motherTongTag: SelectedTag | null = null;
      let integratedTag: SelectedTag | null = null;
      const customTags: TagWithId[] = [];

      tags.forEach((tag) => {
        if (tag.type === '마더텅_단원_태그') {
          motherTongTag = {
            tagIds: tag.tag_ids,
            tagLabels: tag.tag_labels,
          };
        } else if (tag.type === '자세한통사_단원_태그') {
          integratedTag = {
            tagIds: tag.tag_ids,
            tagLabels: tag.tag_labels,
          };
        } else if (tag.type === '자세한통사_커스텀_태그') {
          // 커스텀 태그는 배열로 변환
          tag.tag_ids.forEach((id, index) => {
            customTags.push({
              id,
              label: tag.tag_labels[index],
            });
          });
        }
      });

      return {
        problemId,
        questionNumber,
        accuracyData,
        motherTongTag,
        integratedTag,
        customTags,
      };
    });
  },
};
