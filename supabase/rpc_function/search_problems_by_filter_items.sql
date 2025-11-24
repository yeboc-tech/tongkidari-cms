CREATE OR REPLACE FUNCTION search_problems_by_filter_items(
    p_filters jsonb
  )
  RETURNS TABLE (problem_id text) AS $$
  DECLARE
    filter_item jsonb;
    filter_type text;
    filter_tag_ids text[];
    filter_grades text[];
    filter_years text[];
    filter_accuracy_min numeric;
    filter_accuracy_max numeric;
    and_filter_items jsonb;
    and_filter_item jsonb;
    and_filter_type text;
    and_filter_tag_ids text[];
  BEGIN
    -- 임시 테이블 생성
    CREATE TEMP TABLE IF NOT EXISTS temp_results (problem_id text) ON COMMIT DROP;

    -- 각 필터 세트에 대해 반복
    FOR filter_item IN SELECT * FROM jsonb_array_elements(p_filters)
    LOOP
      -- 각 필터 항목에서 값 추출
      filter_type := filter_item->>'type';
      filter_tag_ids := ARRAY(SELECT jsonb_array_elements_text(filter_item->'tag_ids'));
      filter_grades := CASE
        WHEN filter_item->'grades' IS NOT NULL
        THEN ARRAY(SELECT jsonb_array_elements_text(filter_item->'grades'))
        ELSE NULL
      END;
      filter_years := CASE
        WHEN filter_item->'years' IS NOT NULL
        THEN ARRAY(SELECT jsonb_array_elements_text(filter_item->'years'))
        ELSE NULL
      END;
      filter_accuracy_min := (filter_item->>'accuracy_min')::numeric;
      filter_accuracy_max := (filter_item->>'accuracy_max')::numeric;
      and_filter_items := filter_item->'and_problem_filter_items';

      -- 조건에 맞는 problem_id를 임시 테이블에 삽입
      INSERT INTO temp_results
      SELECT DISTINCT pt.problem_id
      FROM problem_tags pt
      INNER JOIN accuracy_rate ar ON pt.problem_id = ar.problem_id
      WHERE pt.type = filter_type
        AND (filter_tag_ids IS NULL OR pt.tag_ids && filter_tag_ids)
        AND (filter_grades IS NULL OR split_part(pt.problem_id, '_', 2) = ANY(filter_grades))
        AND (filter_years IS NULL OR split_part(pt.problem_id, '_', 3) = ANY(filter_years))
        AND (filter_accuracy_min IS NULL OR ar.accuracy_rate >= filter_accuracy_min)
        AND (filter_accuracy_max IS NULL OR ar.accuracy_rate <= filter_accuracy_max)
        -- AND 조건: and_filter_items가 null이거나 빈 배열이면 무시, 있으면 모든 조건을 만족해야 함
        AND (
          and_filter_items IS NULL
          OR jsonb_array_length(and_filter_items) = 0
          OR (
            SELECT COUNT(*) = jsonb_array_length(and_filter_items)
            FROM jsonb_array_elements(and_filter_items) as and_item
            WHERE EXISTS (
              SELECT 1
              FROM problem_tags and_pt
              WHERE and_pt.problem_id = pt.problem_id
                AND and_pt.type = and_item->>'type'
                AND (
                  (and_item->'tag_ids' IS NULL OR jsonb_typeof(and_item->'tag_ids') = 'null')
                  OR and_pt.tag_ids && ARRAY(SELECT jsonb_array_elements_text(and_item->'tag_ids'))
                )
            )
          )
        );
    END LOOP;

    -- 중복 제거하여 반환
    RETURN QUERY
    SELECT DISTINCT tr.problem_id
    FROM temp_results tr;

    -- 임시 테이블은 ON COMMIT DROP으로 자동 삭제됨
  END;
  $$ LANGUAGE plpgsql;
