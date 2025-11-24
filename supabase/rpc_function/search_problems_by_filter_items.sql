-- 여러 type-tagIds 세트로 검색하는 RPC 함수 (각 필터에 독립적인 조건)
--
-- 사용 예시:
-- SELECT * FROM search_problems_by_filter_items(
--   '[
--     {
--       "type": "단원_사회탐구_경제",
--       "tag_ids": ["1", "1-1"],
--       "years": ["2024", "2023"],
--       "accuracy_min": 30,
--       "accuracy_max": 70
--     },
--     {
--       "type": "단원_사회탐구_사회문화",
--       "tag_ids": null,
--       "years": ["2024"],
--       "accuracy_min": 50,
--       "accuracy_max": 100
--     }
--   ]'::jsonb
-- );
--
-- tag_ids가 null이면 해당 type의 모든 문제를 가져옵니다.

CREATE OR REPLACE FUNCTION search_problems_by_filter_items(
    p_filters jsonb  -- [{"type": "...", "tag_ids": [...], "years": [...], "accuracy_min": n, "accuracy_max": n}, ...]
  )
  RETURNS TABLE (problem_id text) AS $$
  DECLARE
    filter_item jsonb;
    filter_type text;
    filter_tag_ids text[];
    filter_years text[];
    filter_accuracy_min numeric;
    filter_accuracy_max numeric;
  BEGIN
    -- 임시 테이블 생성
    CREATE TEMP TABLE IF NOT EXISTS temp_results (problem_id text) ON COMMIT DROP;

    -- 각 필터 세트에 대해 반복
    FOR filter_item IN SELECT * FROM jsonb_array_elements(p_filters)
    LOOP
      -- 각 필터 항목에서 값 추출
      filter_type := filter_item->>'type';
      filter_tag_ids := ARRAY(SELECT jsonb_array_elements_text(filter_item->'tag_ids'));
      filter_years := CASE
        WHEN filter_item->'years' IS NOT NULL
        THEN ARRAY(SELECT jsonb_array_elements_text(filter_item->'years'))
        ELSE NULL
      END;
      filter_accuracy_min := (filter_item->>'accuracy_min')::numeric;
      filter_accuracy_max := (filter_item->>'accuracy_max')::numeric;

      -- 조건에 맞는 problem_id를 임시 테이블에 삽입
      INSERT INTO temp_results
      SELECT DISTINCT pt.problem_id
      FROM problem_tags pt
      INNER JOIN accuracy_rate ar ON pt.problem_id = ar.problem_id
      WHERE pt.type = filter_type
        AND (filter_tag_ids IS NULL OR pt.tag_ids && filter_tag_ids)
        AND (filter_years IS NULL OR split_part(pt.problem_id, '_', 3) = ANY(filter_years))
        AND (filter_accuracy_min IS NULL OR ar.accuracy_rate >= filter_accuracy_min)
        AND (filter_accuracy_max IS NULL OR ar.accuracy_rate <= filter_accuracy_max);
    END LOOP;

    -- 중복 제거하여 반환
    RETURN QUERY
    SELECT DISTINCT tr.problem_id
    FROM temp_results tr;

    -- 임시 테이블 삭제
    DROP TABLE IF EXISTS temp_results;
  END;
  $$ LANGUAGE plpgsql;
