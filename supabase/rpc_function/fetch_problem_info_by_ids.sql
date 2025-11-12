CREATE OR REPLACE FUNCTION fetch_problem_info_by_ids(
  p_problem_ids text[]
)
RETURNS TABLE (
  problem_id text,
  accuracy_data jsonb,
  tags jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.problem_id,
    to_jsonb(ar.*) as accuracy_data,
    jsonb_object_agg(
      pt.type,
      jsonb_build_object(
        'tag_ids', pt.tag_ids,
        'tag_labels', pt.tag_labels,
        'updated_at', pt.updated_at
      )
    ) FILTER (WHERE pt.problem_id IS NOT NULL) as tags
  FROM unnest(p_problem_ids) AS p(problem_id)
  LEFT JOIN accuracy_rate ar ON ar.problem_id = p.problem_id
  LEFT JOIN problem_tags pt ON pt.problem_id = p.problem_id
  GROUP BY p.problem_id, ar.*;
END;
$$ LANGUAGE plpgsql;
