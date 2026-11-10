BEGIN;
CREATE TABLE IF NOT EXISTS public.settings (key text PRIMARY KEY,value text NOT NULL);
CREATE TABLE IF NOT EXISTS public.entries (id text PRIMARY KEY,kind text NOT NULL,data text NOT NULL,is_public integer NOT NULL DEFAULT 0,position integer NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS public.categories (id text PRIMARY KEY,name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS public.documents (id text PRIMARY KEY,name text NOT NULL,description text NOT NULL DEFAULT '',category_id text,size integer NOT NULL,mime text NOT NULL,storage_key text NOT NULL,is_public integer NOT NULL DEFAULT 0,is_photo integer NOT NULL DEFAULT 0,project_id text,added_at text NOT NULL,deleted_at text);
CREATE TABLE IF NOT EXISTS public.messages (id text PRIMARY KEY,name text NOT NULL,email text NOT NULL,message text NOT NULL,created_at text NOT NULL,is_read integer NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS public.rate_limits (key text PRIMARY KEY,count integer NOT NULL DEFAULT 1,expires_at bigint NOT NULL);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- All reads and writes use the authenticated application server. There is no
-- direct anonymous Data API policy for private portfolio data or messages.
REVOKE ALL ON public.settings,public.entries,public.categories,public.documents,public.messages,public.rate_limits FROM anon,authenticated;
INSERT INTO storage.buckets(id,name,public,file_size_limit) VALUES('portfolio-vault','portfolio-vault',false,20971520) ON CONFLICT(id) DO NOTHING;
COMMIT;
