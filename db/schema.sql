-- Daybook cloud copy (Neon Postgres + Data API + Neon Auth).
-- Run once, after Neon Auth and the Data API are enabled (they create the
-- `auth.user_id()` function and the `authenticated` / `anonymous` roles).
-- Safe to run again.

BEGIN;

-- Trackers, entries, categories, journal pages and settings, one row each.
CREATE TABLE IF NOT EXISTS public.records (
  user_id    text        NOT NULL DEFAULT (auth.user_id()),
  kind       text        NOT NULL CHECK (kind IN ('tracker', 'entry', 'category', 'page', 'settings')),
  id         text        NOT NULL,
  data       jsonb       NOT NULL,
  updated_at timestamptz NOT NULL,              -- the device's updatedAt; the later one wins
  deleted    boolean     NOT NULL DEFAULT false,
  synced_at  timestamptz NOT NULL DEFAULT now(), -- set by the server on every write
  PRIMARY KEY (user_id, kind, id)
);
CREATE INDEX IF NOT EXISTS records_pull ON public.records (user_id, synced_at);

-- Photos, re-encoded by the app to at most 1200px WebP before upload.
CREATE TABLE IF NOT EXISTS public.assets (
  user_id   text        NOT NULL DEFAULT (auth.user_id()),
  id        text        NOT NULL,
  mime      text,
  w         integer,
  h         integer,
  data      text,                                -- base64; empty once deleted
  deleted   boolean     NOT NULL DEFAULT false,
  synced_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id),
  CHECK (deleted OR (data IS NOT NULL AND mime IS NOT NULL)),
  CHECK (data IS NULL OR length(data) <= 4000000) -- about 3 MB per photo at most
);
CREATE INDEX IF NOT EXISTS assets_pull ON public.assets (user_id, synced_at);

-- synced_at: the column default only covers inserts, so a trigger stamps every
-- write. clock_timestamp() (not now()) gives each row its own instant.
-- records also ignore a write older than what is stored, so a device that was
-- offline for a while can't overwrite newer changes.
CREATE OR REPLACE FUNCTION public.records_before_write() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.updated_at < OLD.updated_at THEN
      RETURN NULL;
    END IF;
  END IF;
  NEW.synced_at := pg_catalog.clock_timestamp();
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.assets_before_write() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.synced_at := pg_catalog.clock_timestamp();
  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION public.records_before_write() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assets_before_write() FROM PUBLIC;

DROP TRIGGER IF EXISTS records_before_write ON public.records;
CREATE TRIGGER records_before_write BEFORE INSERT OR UPDATE ON public.records
  FOR EACH ROW EXECUTE FUNCTION public.records_before_write();
DROP TRIGGER IF EXISTS assets_before_write ON public.assets;
CREATE TRIGGER assets_before_write BEFORE INSERT OR UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.assets_before_write();

-- Row-Level Security: each account sees and writes only its own rows.
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Only logged-in users get access, and only select / insert / update (no delete).
REVOKE ALL ON public.records, public.assets FROM PUBLIC, anonymous, authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.records, public.assets TO authenticated;

DROP POLICY IF EXISTS records_select_own ON public.records;
DROP POLICY IF EXISTS records_insert_own ON public.records;
DROP POLICY IF EXISTS records_update_own ON public.records;
CREATE POLICY records_select_own ON public.records FOR SELECT TO authenticated
  USING ((SELECT auth.user_id()) = user_id);
CREATE POLICY records_insert_own ON public.records FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.user_id()) = user_id);
CREATE POLICY records_update_own ON public.records FOR UPDATE TO authenticated
  USING ((SELECT auth.user_id()) = user_id)
  WITH CHECK ((SELECT auth.user_id()) = user_id);

DROP POLICY IF EXISTS assets_select_own ON public.assets;
DROP POLICY IF EXISTS assets_insert_own ON public.assets;
DROP POLICY IF EXISTS assets_update_own ON public.assets;
CREATE POLICY assets_select_own ON public.assets FOR SELECT TO authenticated
  USING ((SELECT auth.user_id()) = user_id);
CREATE POLICY assets_insert_own ON public.assets FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.user_id()) = user_id);
CREATE POLICY assets_update_own ON public.assets FOR UPDATE TO authenticated
  USING ((SELECT auth.user_id()) = user_id)
  WITH CHECK ((SELECT auth.user_id()) = user_id);

COMMIT;
