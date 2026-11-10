BEGIN;
CREATE SCHEMA IF NOT EXISTS portfolio_internal;
REVOKE ALL ON SCHEMA portfolio_internal FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE IF NOT EXISTS portfolio_internal.queries(id text PRIMARY KEY,sql text NOT NULL,parameter_count integer NOT NULL);
ALTER TABLE portfolio_internal.queries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON portfolio_internal.queries FROM PUBLIC,anon,authenticated,service_role;
-- Only fixed application statements registered below can run. Caller-supplied
-- values are quoted by PostgreSQL and never treated as SQL. No raw SQL RPC.
CREATE OR REPLACE FUNCTION public.portfolio_query(query_id text,parameters jsonb DEFAULT '[]'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','pg_temp' AS $$
DECLARE statement text; expected integer; i integer; value jsonb; parameter_values text[]:=ARRAY[]::text[]; result jsonb;
BEGIN
 SELECT q.sql,q.parameter_count INTO statement,expected FROM portfolio_internal.queries q WHERE q.id=query_id;
 IF statement IS NULL THEN RAISE EXCEPTION 'Unknown application operation'; END IF;
 IF jsonb_typeof(parameters)<>'array' OR jsonb_array_length(parameters)<>expected THEN RAISE EXCEPTION 'Invalid operation parameters'; END IF;
 -- PostgreSQL format quotes each value once; parameter text is never re-parsed.
 FOR i IN 1..expected LOOP
  value:=parameters->(i-1);
  IF value='null'::jsonb THEN parameter_values:=array_append(parameter_values,NULL::text);
  ELSIF jsonb_typeof(value) IN ('string','number','boolean') THEN parameter_values:=array_append(parameter_values,parameters->>(i-1));
  ELSE RAISE EXCEPTION 'Invalid parameter type'; END IF;
 END LOOP;
 statement:=format(statement,VARIADIC parameter_values);
 IF statement ~* '^SELECT' THEN
  EXECUTE 'SELECT coalesce(jsonb_agg(to_jsonb(r)),''[]''::jsonb) FROM ('||statement||') r' INTO result;
 ELSIF statement ~* '\mRETURNING\M' THEN
  EXECUTE 'WITH r AS ('||statement||') SELECT coalesce(jsonb_agg(to_jsonb(r)),''[]''::jsonb) FROM r' INTO result;
 ELSE EXECUTE statement; result:='[]'::jsonb;
 END IF;
 RETURN result;
END; $$;
CREATE OR REPLACE FUNCTION public.portfolio_batch(commands jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','pg_temp' AS $$
DECLARE command jsonb; results jsonb:='[]'::jsonb;
BEGIN
 IF jsonb_typeof(commands)<>'array' OR jsonb_array_length(commands)>100 THEN RAISE EXCEPTION 'Invalid batch'; END IF;
 FOR command IN SELECT * FROM jsonb_array_elements(commands) LOOP
  results:=results||jsonb_build_array(public.portfolio_query(command->>'query_id',command->'parameters'));
 END LOOP;
 RETURN results;
END; $$;
REVOKE ALL ON FUNCTION public.portfolio_query(text,jsonb) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.portfolio_batch(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.portfolio_query(text,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.portfolio_batch(jsonb) TO service_role;
-- The trusted catalog is populated from the repository's prepared statements.
