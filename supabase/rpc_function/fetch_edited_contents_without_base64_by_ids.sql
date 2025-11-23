-- RPC function to fetch edited_contents without base64 data
-- This improves performance by excluding large base64 strings

CREATE OR REPLACE FUNCTION fetch_edited_contents_without_base64_by_ids(
    p_resource_ids text[]
  )
  RETURNS TABLE (
    resource_id text,
    "json" jsonb,
    created_at timestamptz,
    updated_at timestamptz
  ) AS $$
  BEGIN
    RETURN QUERY
    SELECT
      ec.resource_id,
      ec."json",
      ec.created_at,
      ec.updated_at
    FROM edited_contents ec
    WHERE ec.resource_id = ANY(p_resource_ids);
  END;
  $$ LANGUAGE plpgsql;
