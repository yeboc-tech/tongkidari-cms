import { supabase } from '../lib/supabase';
import { AccuracyRate } from '../types/accuracyRate';
import { PROBLEM_TAG_TYPES, type ProblemTagType } from '../ssot/PROBLEM_TAG_TYPES';
import { type BBox } from './Api';

/**
 * Supabase API 래퍼
 * 데이터베이스 작업을 구조화된 방식으로 처리
 */

// ========== Types ==========

export interface EditedContent {
  resource_id: string;
  json: any;
  base64: string;
  created_at: string;
  updated_at: string;
}

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
  editedBase64?: string;
  editedBBox?: BBox | BBox[];
  answerEditedBase64?: string;
  answerEditedBBox?: BBox | BBox[];
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

    /**
     * 모든 커스텀 태그 레이블 목록 가져오기 (중복 제거)
     * @param subject - 과목명 (옵션, 지정 시 해당 과목의 태그만 반환)
     * @returns 중복 제거된 커스텀 태그 레이블 배열
     */
    async fetchAllCustomTagLabels(subject?: string): Promise<string[]> {
      const { data, error } = await supabase
        .from('problem_tags')
        .select('problem_id, tag_labels')
        .eq('type', PROBLEM_TAG_TYPES.CUSTOM_TONGSA);

      if (error) {
        console.error('Error fetching custom tag labels:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // subject가 지정되면 해당 과목으로 시작하는 problem_id만 필터링
      const filteredData = subject ? data.filter((row) => row.problem_id.startsWith(`${subject}_`)) : data;

      // 모든 tag_labels 배열을 평탄화하고 중복 제거
      const allLabels = filteredData.flatMap((row) => row.tag_labels);
      const uniqueLabels = Array.from(new Set(allLabels));

      // 알파벳순으로 정렬
      return uniqueLabels.sort((a, b) => a.localeCompare(b, 'ko'));
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
      const { data, error } = await supabase.from('accuracy_rate').select('*').in('problem_id', questionIds);

      if (error) {
        console.error('Error fetching accuracy rates:', error);
        throw error;
      }

      return data || [];
    },
  },

  /**
   * EditedContent 관련 API
   */
  EditedContent: {
    /**
     * 편집된 콘텐츠 저장 또는 업데이트
     * @param resourceId - 리소스 ID (문제 ID)
     * @param bbox - BBox 데이터 (단일 또는 배열)
     * @param base64 - 크롭된 이미지의 base64 문자열
     */
    async upsertBBox(resourceId: string, bbox: BBox | BBox[], base64: string): Promise<void> {
      const { error } = await supabase.from('edited_contents').upsert(
        {
          resource_id: resourceId,
          json: bbox,
          base64,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'resource_id',
        },
      );

      if (error) {
        console.error('Error upserting edited content:', error);
        throw error;
      }
    },

    /**
     * base64 이미지만 저장 (json은 빈 객체로)
     * @param resourceId - 리소스 ID
     * @param base64 - 이미지의 base64 문자열
     */
    async upsertBase64Only(resourceId: string, base64: string): Promise<void> {
      const { error } = await supabase.from('edited_contents').upsert(
        {
          resource_id: resourceId,
          json: {},
          base64,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'resource_id',
        },
      );

      if (error) {
        console.error('Error upserting base64 content:', error);
        throw error;
      }
    },

    /**
     * 편집된 콘텐츠 조회 (단일)
     * @param resourceId - 리소스 ID
     * @returns 편집된 콘텐츠 또는 null
     */
    async fetchById(resourceId: string): Promise<EditedContent | null> {
      const { data, error } = await supabase.from('edited_contents').select('*').eq('resource_id', resourceId).single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 데이터 없음 (not found)
          return null;
        }
        console.error('Error fetching edited content:', error);
        throw error;
      }

      return data;
    },

    /**
     * 편집된 콘텐츠 삭제
     * @param resourceId - 리소스 ID
     */
    async delete(resourceId: string): Promise<void> {
      const { error } = await supabase.from('edited_contents').delete().eq('resource_id', resourceId);

      if (error) {
        console.error('Error deleting edited content:', error);
        throw error;
      }
    },

    /**
     * 여러 리소스의 편집된 콘텐츠 조회 (RPC 사용)
     * @param resourceIds - 리소스 ID 배열
     * @returns 편집된 콘텐츠 배열
     */
    async fetchByIds(resourceIds: string[]): Promise<EditedContent[]> {
      if (resourceIds.length === 0) {
        return [];
      }

      const { data, error } = await supabase.rpc('fetch_edited_contents_by_ids', {
        p_resource_ids: resourceIds,
      });

      if (error) {
        console.error('Error fetching edited contents by ids:', error);
        throw error;
      }

      return data || [];
    },
  },

  /**
   * 태그, 정답률, 연도로 문제 검색
   * problem_tags와 accuracy_rate를 조합하여 조건에 맞는 문제 검색
   * @param params - 검색 조건
   * @returns problem_id 배열
   */
  async searchByFilter(params: {
    type: ProblemTagType;
    tagIds: string[] | null;
    years?: string[];
    grades?: string[];
    accuracyMin?: number;
    accuracyMax?: number;
  }): Promise<string[]> {
    const { type, tagIds, years, accuracyMin, accuracyMax } = params;

    // RPC 함수를 사용하여 데이터베이스에서 직접 join과 필터링 수행
    // TODO: grades 파라미터는 아직 SQL 함수에 추가되지 않음
    const { data, error } = await supabase.rpc('search_problems_by_filter', {
      p_type: type,
      p_tag_ids: tagIds && tagIds.length > 0 ? tagIds : null,
      p_years: years && years.length > 0 ? years : null,
      p_accuracy_min: accuracyMin ?? null,
      p_accuracy_max: accuracyMax ?? null,
    });

    if (error) {
      console.error('Error searching by filter:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return (data as Array<{ problem_id: string }>).map((row) => row.problem_id);
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

    // RPC 함수로 한 번에 모든 정보 가져오기
    const { data, error } = await supabase.rpc('fetch_problem_info_by_ids', {
      p_problem_ids: problemIds,
    });

    if (error) {
      console.error('Error fetching problem info:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // RPC 결과를 ProblemInfo 형태로 변환
    return data.map((item: any) => {
      const problemId = item.problem_id;

      // problem_id에서 문제 번호 추출: "경제_고3_2024_03_학평_1_문제" -> 1
      let questionNumber = 0;
      let cleaned = problemId.endsWith('_문제') ? problemId.slice(0, -3) : problemId;
      const parts = cleaned.split('_');
      const lastPart = parts[parts.length - 1];
      const parsedNumber = parseInt(lastPart, 10);
      if (!isNaN(parsedNumber)) {
        questionNumber = parsedNumber;
      }

      const accuracyData = item.accuracy_data || undefined;
      const tags = item.tags || {};

      // 태그 타입별로 분류
      let motherTongTag: SelectedTag | null = null;
      let integratedTag: SelectedTag | null = null;
      const customTags: TagWithId[] = [];

      // tags 객체를 순회하며 type별로 처리
      Object.keys(tags).forEach((type) => {
        const tag = tags[type];
        if (type === PROBLEM_TAG_TYPES.MOTHER) {
          motherTongTag = {
            tagIds: tag.tag_ids,
            tagLabels: tag.tag_labels,
          };
        } else if (type === PROBLEM_TAG_TYPES.DETAIL_TONGSA) {
          integratedTag = {
            tagIds: tag.tag_ids,
            tagLabels: tag.tag_labels,
          };
        } else if (type === PROBLEM_TAG_TYPES.CUSTOM_TONGSA) {
          // 커스텀 태그는 배열로 변환
          tag.tag_ids.forEach((id: string, index: number) => {
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
