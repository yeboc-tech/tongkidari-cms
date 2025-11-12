CREATE OR REPLACE FUNCTION search_problems_by_filter(
    p_type text,
    p_tag_ids text[],
    p_years text[] DEFAULT NULL,
    p_accuracy_min numeric DEFAULT NULL,
    p_accuracy_max numeric DEFAULT NULL
  )
  RETURNS TABLE (problem_id text) AS $$
  BEGIN
    RETURN QUERY
    SELECT DISTINCT pt.problem_id
    FROM problem_tags pt
    INNER JOIN accuracy_rate ar ON pt.problem_id = ar.problem_id
    WHERE pt.type = p_type
      AND pt.tag_ids && p_tag_ids  -- overlaps 연산자
      AND (p_years IS NULL OR split_part(pt.problem_id, '_', 3) = ANY(p_years))
      AND (p_accuracy_min IS NULL OR ar.accuracy_rate >= p_accuracy_min)
      AND (p_accuracy_max IS NULL OR ar.accuracy_rate <= p_accuracy_max);
  END;
  $$ LANGUAGE plpgsql;