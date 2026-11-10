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

INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('83338661fd867fad8456a52f79dfa4ce4cb2c02c6fbcbe72eb8d7fd2c41be048','SELECT kind FROM entries WHERE id=%1$L',1) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('70f46039c76f4a2ffa1b5ae1a57b63bfb1f8e4ca504b9f7e525c4fe8ea5d843e','SELECT * FROM settings WHERE key IN (''initialized'',''academic-content-revision'')',0) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('54b3a18f920fb8a418ce96735a9c878be8ef8e92695c8a547bff9c2f7ffdc4a0','INSERT INTO settings (key,value) SELECT %1$L,%2$L WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key=''initialized'') ON CONFLICT DO NOTHING',2) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('d47e7e2b6aebc7264dc4a813ee1bea6b16cc90102d9b4acf51fea58f18f6708f','INSERT INTO entries (id,kind,data,is_public,position) SELECT %1$L,%2$L,%3$L,%4$L,%5$L WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key=''initialized'') ON CONFLICT DO NOTHING',5) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('1529d5d1a6d7908a8c6003f90e5101d23ae7b8e0d35bcd58296ad62598bff19a','INSERT INTO categories (id,name) SELECT %1$L,%2$L WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key=''initialized'') ON CONFLICT DO NOTHING',2) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('3139c296f0c5a3071ba1333acce1d553add6b6f2b24b8eec13d8a2aaab52d489','INSERT INTO settings (key,value) VALUES (%1$L,%2$L) ON CONFLICT DO NOTHING',2) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('8cc357efbb533a9bac74af5f95ad68d763a4b4cd1c2fc4aee94f7cea48ca29b2','INSERT INTO settings (key,value) VALUES (''initialized'',''1'') ON CONFLICT DO NOTHING',0) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('5f830aab6f21f6aa4b8c68f05577bdac12b589690c5c4b04c2b5dd125d953d56','SELECT * FROM entries ORDER BY position ASC',0) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('95ef81a0e4d30d54bc211fdb1f1005ac45fe2449990f6776a5191f9dce85e3d8','INSERT INTO entries (id,kind,data,is_public,position) VALUES (%1$L,%2$L,%3$L,%4$L,%5$L) ON CONFLICT DO NOTHING',5) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('02afb7db015af8a75c4b9294bd471ba610fd0c5de0f1d3777b6bc6fa37d312cf','INSERT INTO categories (id,name) VALUES (%1$L,%2$L) ON CONFLICT DO NOTHING',2) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('8f33eb325471d25f4827620fb72323c41275cc477d114378b6f8d7057f2a790f','INSERT INTO settings (key,value) VALUES (%1$L,%2$L) ON CONFLICT(key) DO UPDATE SET value=excluded.value',2) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('f401bf45c469a3c5a6f9232152ff52a96a2ee27f1634a6b71ede73dbc9d58109','SELECT * FROM settings WHERE key IN (''profile'',''initialized'',''academic-content-revision'',''source-references'')',0) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('67dd2aa8ec6b0dac67079f10a0ff8025dec6c3783d0e02f169828cb28b10e997','SELECT * FROM categories ORDER BY name',0) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('5fb97d034d6e70528d7c21614a867573b06dd3340d4dab6fefa05cc52cbfa1e6','SELECT * FROM documents  ORDER BY added_at DESC',0) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('d63cac19ba2e2a1d6e24f8f3851383e671f113b720670b6e5a8e6c6f7ba1a2e5','SELECT * FROM documents WHERE is_public=1 AND deleted_at IS NULL ORDER BY added_at DESC',0) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('b9380fe3d8b459eab1a3f6df7d35d983c8b8284f20a743574c76205ccf04a36c','SELECT * FROM messages ORDER BY created_at DESC LIMIT 200',0) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('6a69692ee82de94f0a58320ccb89820af565d61b6b8aa091e7ff509a698fb475','SELECT id FROM categories WHERE name=%1$L',1) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('95d726487840d023374ce73f5667b60457494b2397e15cab1114ffd91c6ee0d6','INSERT INTO categories (id,name) VALUES (%1$L,%2$L)',2) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('572bae8d7baeaea19f566753c1fca11e2f6d7879ecf51c3b684ff8185789ff1a','UPDATE documents SET category_id=NULL WHERE category_id=%1$L',1) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('16ba9b97208dd913dcca4d769a710924518adc6735df3f8d22c62bf72a234bee','DELETE FROM categories WHERE id=%1$L',1) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('21e7f1cb018ef47e0725150ab3efbd1ee9807dff63db83fef0ab39ce87eac780','SELECT id FROM categories WHERE name=%1$L AND id<>%2$L',2) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('0dc03ab111998ce8987f36d49aee151e542e2050315567a6c7fa7f4da607e62b','UPDATE categories SET name=%1$L WHERE id=%2$L',2) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('a1d4908d515b5a92eff1ae0d76f25aeec807f8838ae1b30d62a4420d088f878b','SELECT * FROM documents WHERE id=%1$L AND deleted_at IS NULL',1) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('002e9ede2453e4a4a2cce93054ffd22dd84a5f590a4b0185a0da415109d11187','SELECT id FROM categories WHERE id=%1$L',1) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('19a345256670a1781849852077c4c370aea038ec44df0f417cd0eb319bfa0c34','INSERT INTO documents (id,name,description,category_id,size,mime,storage_key,is_public,is_photo,project_id,added_at,deleted_at) VALUES (%1$L,%2$L,%3$L,%4$L,%5$L,%6$L,%7$L,%8$L,%9$L,%10$L,%11$L,NULL) ON CONFLICT(id) DO UPDATE SET name=excluded.name,description=excluded.description,category_id=excluded.category_id,size=excluded.size,mime=excluded.mime,storage_key=excluded.storage_key,is_public=excluded.is_public,is_photo=excluded.is_photo,project_id=excluded.project_id,added_at=excluded.added_at',11) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('5b6f9303d0c7d713c3b5c6f72768cf2910d85411f08317465fc37e3960d82c60','SELECT * FROM documents WHERE id=%1$L',1) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('4a1278497b6456fee5bb0385f58e2a938cf86971c982dd0b55455af87e696b4c','UPDATE documents SET deleted_at=NULL WHERE id=%1$L',1) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('549ed7286cf235b658fa80bb41b4c89cd373ba53db6562a851015327d1638993','UPDATE documents SET name=%1$L,description=%2$L,category_id=%3$L,is_public=%4$L,project_id=%5$L WHERE id=%6$L',6) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('f477bba95e0754058250dbdeabf9b3468acdfecb766fb38610722c88406297ab','UPDATE documents SET deleted_at=%1$L WHERE id=%2$L',2) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('be7fb4258e4f5f6c1df193389384d8d01cab49b3696fc5ff8b39b7394826a0aa','INSERT INTO entries (id,kind,data,is_public,position) VALUES (%1$L,%2$L,%3$L,%4$L,%5$L) ON CONFLICT(id) DO UPDATE SET kind=excluded.kind,data=excluded.data,is_public=excluded.is_public,position=excluded.position',5) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('9312331d05fd8149cdde5689195cdefc86d34172554d36279813215299cd561b','DELETE FROM entries WHERE id=%1$L',1) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('b8b4af81286833faaf3cae322ef02a679707d9872d00ec485f66d2175f1da2ce','UPDATE messages SET is_read=%1$L WHERE id=%2$L',2) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('024802c6fce1f97e78525a2c43de57f2a7643c91999ff6be1856cbf7ba5a7794','INSERT INTO settings (key,value) VALUES (''profile'',%1$L) ON CONFLICT(key) DO UPDATE SET value=excluded.value',1) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('cf81ebc22c4d867def76879aa476dc21d0b361d72e2465facc6111df033de720','SELECT * FROM documents',0) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('8372f2fc2e80c3ad99e5eae51d0f058e42d34d17db9f26d4a911aa59b2b0c20a','INSERT INTO rate_limits (key,count,expires_at) VALUES (%1$L,1,%2$L) ON CONFLICT(key) DO UPDATE SET count=rate_limits.count+1 RETURNING count',2) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('2f86de2d5d01665666e70dbdd19ccc4ef6a6fb6cbb4ddb2484e7a21be835e5ee','INSERT INTO messages (id,name,email,message,created_at,is_read) VALUES (%1$L,%2$L,%3$L,%4$L,%5$L,0)',5) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
INSERT INTO portfolio_internal.queries(id,sql,parameter_count) VALUES ('ae7702a206863b9ddb3d7b84df6d666744f247735f0f1a7e64ec3128ee5735ae','DELETE FROM rate_limits WHERE expires_at<%1$L',1) ON CONFLICT(id) DO UPDATE SET sql=excluded.sql,parameter_count=excluded.parameter_count;
COMMIT;
