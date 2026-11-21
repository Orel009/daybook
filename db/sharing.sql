-- Daybook sharing: view-only shares, copies and public links.
-- Not applied yet: run only after review (see the Phase B/C report).
--
-- Read-only sharing between accounts, as a separate layer:
--   * view-only shares: a page, a tracker (with its entries) or the whole book
--   * copies: a page or template sent once; the recipient's app turns it into
--     ordinary records of their own (new ids), so there is no link back
--
-- The existing tables and policies are NOT changed. records / assets keep
-- their own-rows-only RLS, so the owner's sync and merge work exactly as now.
-- Shared data is read only through the SECURITY DEFINER functions below, and
-- every one of them filters by "an active share to my verified email".
--
-- Identity:
--   * a share is addressed to an email address, matched when the recipient
--     reads; no function ever looks an email up for the sender, so sharing
--     can't be used to find out who has an account
--   * only accounts with a verified email receive anything (Google accounts,
--     and password accounts after a "Forgot password?" code, which verifies)
--   * the recipient sees the owner_name typed on the share and an opaque
--     owner_key (a per-recipient hash), never the owner's user id or email
--
-- Requires: db/schema.sql already applied (records, assets, auth.user_id()).

BEGIN;

-- ---------------------------------------------------------------------------
-- Private helpers (schema not exposed by the Data API; no grants to API roles)
-- ---------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS sharing_private;
REVOKE ALL ON SCHEMA sharing_private FROM PUBLIC;

-- The caller's email, only if it is verified. NULL for anyone else
-- (anonymous token, unverified account, no account).
CREATE OR REPLACE FUNCTION sharing_private.my_email() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT pg_catalog.lower(u.email)
  FROM neon_auth."user" u
  WHERE u.id::text = auth.user_id() AND u."emailVerified" IS TRUE
$$;

-- What the recipient gets instead of the owner's user id: stable for one
-- owner/recipient pair, meaningless anywhere else.
CREATE OR REPLACE FUNCTION sharing_private.owner_key(owner_id text, recipient_email text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(owner_id || ':' || recipient_email, 'UTF8')), 'hex')
$$;

CREATE OR REPLACE FUNCTION sharing_private.clean_email(e text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT pg_catalog.lower(pg_catalog.btrim(e))
$$;

-- Photo ids a page uses: background photo and photo / sticker elements.
CREATE OR REPLACE FUNCTION sharing_private.page_asset_ids(page jsonb) RETURNS SETOF text
LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT page -> 'background' ->> 'assetId' WHERE page -> 'background' ->> 'assetId' IS NOT NULL
  UNION
  SELECT e ->> 'assetId' FROM pg_catalog.jsonb_array_elements(COALESCE(page -> 'elements', '[]'::jsonb)) e
  WHERE e ->> 'assetId' IS NOT NULL
$$;

-- Is this record covered by this share? The single place the rules live.
--   book:    trackers, entries, categories and journal pages (not templates)
--   page:    that page
--   tracker: that tracker and its entries (data->>'trackerId')
CREATE OR REPLACE FUNCTION sharing_private.covers(scope text, item_id text, kind text, id text, data jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT CASE scope
    WHEN 'book' THEN kind IN ('tracker', 'entry', 'category')
                  OR (kind = 'page' AND COALESCE(data ->> 'isTemplate', 'false') <> 'true')
    WHEN 'page' THEN kind = 'page' AND id = item_id
    WHEN 'tracker' THEN (kind = 'tracker' AND id = item_id)
                     OR (kind = 'entry' AND data ->> 'trackerId' = item_id)
    ELSE false
  END
$$;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA sharing_private FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- View-only shares
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.shares (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        text        NOT NULL DEFAULT (auth.user_id()),
  owner_name      text        NOT NULL CHECK (char_length(owner_name) BETWEEN 1 AND 60),
  recipient_email text        NOT NULL CHECK (recipient_email = lower(btrim(recipient_email)) AND recipient_email LIKE '%_@_%'),
  scope           text        NOT NULL CHECK (scope IN ('page', 'tracker', 'book')),
  item_id         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CHECK ((scope = 'book') = (item_id IS NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS shares_one_per_item ON public.shares (owner_id, recipient_email, scope, COALESCE(item_id, ''));
CREATE INDEX IF NOT EXISTS shares_by_recipient ON public.shares (recipient_email);

ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.shares FROM PUBLIC, anonymous, authenticated;
-- The owner lists and revokes (deletes) their own shares directly.
-- Creating one goes through share_create(), which checks the item.
GRANT SELECT, DELETE ON public.shares TO authenticated;
DROP POLICY IF EXISTS shares_owner_select ON public.shares;
DROP POLICY IF EXISTS shares_owner_delete ON public.shares;
CREATE POLICY shares_owner_select ON public.shares FOR SELECT TO authenticated
  USING ((SELECT auth.user_id()) = owner_id);
CREATE POLICY shares_owner_delete ON public.shares FOR DELETE TO authenticated
  USING ((SELECT auth.user_id()) = owner_id);

-- Share one of my own items (or my whole book). Idempotent: sharing the same
-- thing again returns the existing share. Never says whether the email has an
-- account.
CREATE OR REPLACE FUNCTION public.share_create(p_recipient_email text, p_scope text, p_item_id text, p_owner_name text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  me text := auth.user_id();
  rcpt text := sharing_private.clean_email(p_recipient_email);
  item text := CASE WHEN p_scope = 'book' THEN NULL ELSE p_item_id END;
  share_id uuid;
BEGIN
  IF me IS NULL OR me = 'anonymous' THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  IF rcpt = sharing_private.my_email() THEN RAISE EXCEPTION 'cannot share with yourself' USING ERRCODE = '22023'; END IF;
  IF p_scope IN ('page', 'tracker') AND NOT EXISTS (
    SELECT 1 FROM public.records r
    WHERE r.user_id = me AND r.kind = p_scope AND r.id = item AND NOT r.deleted
      AND NOT (r.kind = 'page' AND COALESCE(r.data ->> 'isTemplate', 'false') = 'true')
  ) THEN
    RAISE EXCEPTION 'no such item' USING ERRCODE = '22023';
  END IF;
  IF (SELECT count(*) FROM public.shares s WHERE s.owner_id = me) >= 200 THEN
    RAISE EXCEPTION 'too many shares' USING ERRCODE = '54000';
  END IF;

  INSERT INTO public.shares (owner_id, owner_name, recipient_email, scope, item_id)
  VALUES (me, pg_catalog.btrim(p_owner_name), rcpt, p_scope, item)
  ON CONFLICT (owner_id, recipient_email, scope, (COALESCE(item_id, ''))) DO UPDATE SET owner_name = EXCLUDED.owner_name
  RETURNING id INTO share_id;
  RETURN share_id;
END $$;

-- What is shared with me (verified email only).
CREATE OR REPLACE FUNCTION public.shared_with_me()
RETURNS TABLE (share_id uuid, owner_key text, owner_name text, scope text, item_id text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT s.id, sharing_private.owner_key(s.owner_id, s.recipient_email), s.owner_name, s.scope, s.item_id, s.created_at
  FROM public.shares s
  WHERE s.recipient_email = sharing_private.my_email()
  ORDER BY s.created_at
$$;

-- Shared records changed after a cursor, in pages of at most 500, ordered by
-- (synced_at, owner_key, kind, id) for keyset paging. Tombstones included, so
-- deletes reach the recipient. A record covered by two shares appears once.
CREATE OR REPLACE FUNCTION public.shared_records(
  p_after_synced_at timestamptz DEFAULT NULL, p_after_owner text DEFAULT '', p_after_kind text DEFAULT '', p_after_id text DEFAULT '',
  p_limit integer DEFAULT 500)
RETURNS TABLE (owner_key text, kind text, id text, data jsonb, updated_at timestamptz, deleted boolean, synced_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  WITH mine AS (
    SELECT s.owner_id, s.scope, s.item_id, sharing_private.owner_key(s.owner_id, s.recipient_email) AS okey
    FROM public.shares s WHERE s.recipient_email = sharing_private.my_email()
  ), owners AS (SELECT DISTINCT owner_id, okey FROM mine)
  SELECT o.okey, r.kind, r.id, r.data, r.updated_at, r.deleted, r.synced_at
  FROM public.records r JOIN owners o ON o.owner_id = r.user_id
  WHERE EXISTS (SELECT 1 FROM mine m WHERE m.owner_id = r.user_id AND sharing_private.covers(m.scope, m.item_id, r.kind, r.id, r.data))
    AND (r.synced_at, o.okey, r.kind, r.id) > (COALESCE(p_after_synced_at, '-infinity'::timestamptz), p_after_owner, p_after_kind, p_after_id)
  ORDER BY r.synced_at, o.okey, r.kind, r.id
  LIMIT LEAST(GREATEST(p_limit, 1), 500)
$$;

-- Photos of shared pages, at most 8 per call. A photo is returned only while a
-- live page covered by one of my shares uses it.
CREATE OR REPLACE FUNCTION public.shared_assets(p_ids text[])
RETURNS TABLE (owner_key text, id text, mime text, w integer, h integer, data text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  WITH mine AS (
    SELECT s.owner_id, s.scope, s.item_id, sharing_private.owner_key(s.owner_id, s.recipient_email) AS okey
    FROM public.shares s WHERE s.recipient_email = sharing_private.my_email() AND s.scope IN ('page', 'book')
  ), allowed AS (
    SELECT DISTINCT m.owner_id, m.okey, aid
    FROM mine m
    JOIN public.records p ON p.user_id = m.owner_id AND p.kind = 'page' AND NOT p.deleted
      AND sharing_private.covers(m.scope, m.item_id, p.kind, p.id, p.data)
    CROSS JOIN LATERAL sharing_private.page_asset_ids(p.data) aid
  )
  SELECT al.okey, a.id, a.mime, a.w, a.h, a.data
  FROM public.assets a JOIN allowed al ON al.owner_id = a.user_id AND al.aid = a.id
  WHERE a.id = ANY (p_ids[1:8]) AND NOT a.deleted
$$;

-- ---------------------------------------------------------------------------
-- Copies (send a page or template once)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.copies (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        text        NOT NULL DEFAULT (auth.user_id()),
  owner_name      text        NOT NULL CHECK (char_length(owner_name) BETWEEN 1 AND 60),
  recipient_email text        NOT NULL CHECK (recipient_email = lower(btrim(recipient_email)) AND recipient_email LIKE '%_@_%'),
  title           text        NOT NULL,
  is_template     boolean     NOT NULL,
  data            jsonb       NOT NULL,            -- the page as it was when sent
  created_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL DEFAULT now() + interval '30 days'
);
CREATE INDEX IF NOT EXISTS copies_by_recipient ON public.copies (recipient_email);

-- Photos copied server-side when sending, so the copy doesn't depend on the
-- sender keeping the page. Deleted with the copy.
CREATE TABLE IF NOT EXISTS public.copy_assets (
  copy_id  uuid    NOT NULL REFERENCES public.copies (id) ON DELETE CASCADE,
  asset_id text    NOT NULL,
  mime     text    NOT NULL,
  w        integer,
  h        integer,
  data     text    NOT NULL,
  PRIMARY KEY (copy_id, asset_id)
);

ALTER TABLE public.copies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copy_assets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.copies, public.copy_assets FROM PUBLIC, anonymous, authenticated;
-- The sender sees and can cancel what they sent; the recipient uses functions.
GRANT SELECT (id, recipient_email, title, is_template, created_at, expires_at), DELETE ON public.copies TO authenticated;
DROP POLICY IF EXISTS copies_owner_select ON public.copies;
DROP POLICY IF EXISTS copies_owner_delete ON public.copies;
CREATE POLICY copies_owner_select ON public.copies FOR SELECT TO authenticated
  USING ((SELECT auth.user_id()) = owner_id);
CREATE POLICY copies_owner_delete ON public.copies FOR DELETE TO authenticated
  USING ((SELECT auth.user_id()) = owner_id);
-- copy_assets: no grants at all; only reachable through copy_photos().

CREATE OR REPLACE FUNCTION public.copy_send(p_recipient_email text, p_page_id text, p_owner_name text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  me text := auth.user_id();
  rcpt text := sharing_private.clean_email(p_recipient_email);
  page jsonb;
  v_copy_id uuid;
BEGIN
  IF me IS NULL OR me = 'anonymous' THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  IF rcpt = sharing_private.my_email() THEN RAISE EXCEPTION 'cannot send to yourself' USING ERRCODE = '22023'; END IF;
  DELETE FROM public.copies c WHERE c.expires_at < now();
  IF (SELECT count(*) FROM public.copies c WHERE c.owner_id = me) >= 20 THEN
    RAISE EXCEPTION 'too many copies waiting' USING ERRCODE = '54000';
  END IF;

  SELECT r.data INTO page FROM public.records r
  WHERE r.user_id = me AND r.kind = 'page' AND r.id = p_page_id AND NOT r.deleted;
  IF page IS NULL THEN RAISE EXCEPTION 'no such page' USING ERRCODE = '22023'; END IF;

  INSERT INTO public.copies (owner_id, owner_name, recipient_email, title, is_template, data)
  VALUES (me, pg_catalog.btrim(p_owner_name), rcpt, COALESCE(NULLIF(page ->> 'title', ''), 'Untitled page'),
          COALESCE((page ->> 'isTemplate')::boolean, false), page - 'deletedAt')
  RETURNING id INTO v_copy_id;

  INSERT INTO public.copy_assets (copy_id, asset_id, mime, w, h, data)
  SELECT v_copy_id, a.id, a.mime, a.w, a.h, a.data
  FROM public.assets a
  WHERE a.user_id = me AND NOT a.deleted AND a.data IS NOT NULL
    AND a.id IN (SELECT sharing_private.page_asset_ids(page));
  RETURN v_copy_id;
END $$;

-- Copies waiting for me (verified email only).
CREATE OR REPLACE FUNCTION public.copies_for_me()
RETURNS TABLE (id uuid, owner_name text, title text, is_template boolean, photos integer, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT c.id, c.owner_name, c.title, c.is_template,
         (SELECT count(*)::integer FROM public.copy_assets ca WHERE ca.copy_id = c.id), c.created_at
  FROM public.copies c
  WHERE c.recipient_email = sharing_private.my_email() AND c.expires_at > now()
  ORDER BY c.created_at
$$;

CREATE OR REPLACE FUNCTION public.copy_page(p_copy_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT c.data FROM public.copies c
  WHERE c.id = p_copy_id AND c.recipient_email = sharing_private.my_email() AND c.expires_at > now()
$$;

-- At most 8 photos per call.
CREATE OR REPLACE FUNCTION public.copy_photos(p_copy_id uuid, p_ids text[])
RETURNS TABLE (id text, mime text, w integer, h integer, data text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT ca.asset_id, ca.mime, ca.w, ca.h, ca.data
  FROM public.copy_assets ca JOIN public.copies c ON c.id = ca.copy_id
  WHERE ca.copy_id = p_copy_id AND c.recipient_email = sharing_private.my_email() AND c.expires_at > now()
    AND ca.asset_id = ANY (p_ids[1:8])
$$;

-- Accepted (after the app saved its own copy) or declined: remove it.
CREATE OR REPLACE FUNCTION public.copy_done(p_copy_id uuid)
RETURNS void
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
  DELETE FROM public.copies c WHERE c.id = p_copy_id AND c.recipient_email = sharing_private.my_email()
$$;

-- ---------------------------------------------------------------------------
-- Public view-only links (no account), covering journal pages only (see
-- covers_public: no trackers, entries or categories). Neon's anonymous Data API token has the
-- role "anonymous", which can execute link_view() and link_assets() and
-- nothing else. The link token (256 random bits, made in the owner's browser)
-- is never stored, only its SHA-256. An unknown, revoked or malformed token
-- gets the same answer as a deleted one: {"status": "gone"}.
--
-- Daily limit per link (default 200 views): each link_view() counts one view;
-- when the day's views are used up the answer is {"status": "resting"} with no
-- data. Photos have their own daily budget (30 per allowed view) and are only
-- served on a day the link was viewed, so link_assets() can't be used to skip
-- the view count. Days are UTC.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.links (
  id           uuid        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  token_hash   bytea       PRIMARY KEY CHECK (octet_length(token_hash) = 32),
  owner_id     text        NOT NULL DEFAULT (auth.user_id()),
  owner_name   text        NOT NULL CHECK (char_length(owner_name) BETWEEN 1 AND 60),
  scope        text        NOT NULL CHECK (scope IN ('page', 'book')),
  item_id      text,
  daily_limit  integer     NOT NULL DEFAULT 200 CHECK (daily_limit BETWEEN 1 AND 10000),
  day          date        NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  views_today  integer     NOT NULL DEFAULT 0,
  photos_today integer     NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CHECK ((scope = 'book') = (item_id IS NULL))
);
CREATE INDEX IF NOT EXISTS links_by_owner ON public.links (owner_id);

ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.links FROM PUBLIC, anonymous, authenticated;
-- The owner lists their links (with today's views) and revokes them. The hash
-- is not readable through the API.
GRANT SELECT (id, scope, item_id, daily_limit, day, views_today, created_at), DELETE ON public.links TO authenticated;
DROP POLICY IF EXISTS links_owner_select ON public.links;
DROP POLICY IF EXISTS links_owner_delete ON public.links;
CREATE POLICY links_owner_select ON public.links FOR SELECT TO authenticated
  USING ((SELECT auth.user_id()) = owner_id);
CREATE POLICY links_owner_delete ON public.links FOR DELETE TO authenticated
  USING ((SELECT auth.user_id()) = owner_id);

-- What a public link covers: journal pages only, never trackers, entries or
-- categories (a link can travel anywhere; tracker history stays with
-- invited accounts). Tracker widgets on a public page show as not shared.
--   book: every journal page (not templates)
--   page: that page
CREATE OR REPLACE FUNCTION sharing_private.covers_public(scope text, item_id text, kind text, id text, data jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT kind = 'page'
     AND COALESCE(data ->> 'isTemplate', 'false') <> 'true'
     AND CASE scope WHEN 'book' THEN true WHEN 'page' THEN id = item_id ELSE false END
$$;
REVOKE ALL ON FUNCTION sharing_private.covers_public(text, text, text, text, jsonb) FROM PUBLIC;

CREATE OR REPLACE FUNCTION sharing_private.token_hash(p_token text) RETURNS bytea
LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT CASE WHEN p_token ~ '^[A-Za-z0-9_-]{43}$' THEN pg_catalog.sha256(pg_catalog.convert_to(p_token, 'UTF8')) END
$$;
REVOKE ALL ON FUNCTION sharing_private.token_hash(text) FROM PUBLIC;

-- The owner registers a link by the hash of a token their browser made.
CREATE OR REPLACE FUNCTION public.link_create(p_token_hash text, p_scope text, p_item_id text, p_owner_name text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  me text := auth.user_id();
  item text := CASE WHEN p_scope = 'book' THEN NULL ELSE p_item_id END;
  v_link_id uuid;
BEGIN
  IF me IS NULL OR me = 'anonymous' THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  IF p_token_hash IS NULL OR p_token_hash !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'bad token hash' USING ERRCODE = '22023'; END IF;
  IF p_scope = 'page' AND NOT EXISTS (
    SELECT 1 FROM public.records r
    WHERE r.user_id = me AND r.kind = 'page' AND r.id = item AND NOT r.deleted
      AND COALESCE(r.data ->> 'isTemplate', 'false') <> 'true'
  ) THEN
    RAISE EXCEPTION 'no such page' USING ERRCODE = '22023';
  END IF;
  IF (SELECT count(*) FROM public.links l WHERE l.owner_id = me) >= 50 THEN
    RAISE EXCEPTION 'too many links' USING ERRCODE = '54000';
  END IF;
  INSERT INTO public.links (token_hash, owner_id, owner_name, scope, item_id)
  VALUES (pg_catalog.decode(p_token_hash, 'hex'), me, pg_catalog.btrim(p_owner_name), p_scope, item)
  RETURNING id INTO v_link_id;
  RETURN v_link_id;
END $$;

-- Opening a link: counts one view and returns the covered pages (live only).
CREATE OR REPLACE FUNCTION public.link_view(p_token text)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  h bytea := sharing_private.token_hash(p_token);
  today date := (now() AT TIME ZONE 'UTC')::date;
  l public.links;
  recs jsonb;
BEGIN
  IF h IS NULL THEN RETURN pg_catalog.jsonb_build_object('status', 'gone'); END IF;
  SELECT * INTO l FROM public.links WHERE token_hash = h FOR UPDATE;
  IF NOT FOUND THEN RETURN pg_catalog.jsonb_build_object('status', 'gone'); END IF;
  IF l.day <> today THEN
    l.day := today; l.views_today := 0; l.photos_today := 0;
  END IF;
  IF l.views_today >= l.daily_limit THEN
    UPDATE public.links SET day = l.day, views_today = l.views_today, photos_today = l.photos_today WHERE token_hash = h;
    RETURN pg_catalog.jsonb_build_object('status', 'resting');
  END IF;

  SELECT COALESCE(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('kind', r.kind, 'id', r.id, 'data', r.data) ORDER BY r.kind, r.id), '[]'::jsonb)
  INTO recs
  FROM public.records r
  WHERE r.user_id = l.owner_id AND NOT r.deleted AND sharing_private.covers_public(l.scope, l.item_id, r.kind, r.id, r.data);
  IF l.scope = 'page' AND pg_catalog.jsonb_array_length(recs) = 0 THEN
    RETURN pg_catalog.jsonb_build_object('status', 'gone');   -- the page was deleted
  END IF;

  UPDATE public.links SET day = l.day, views_today = l.views_today + 1, photos_today = l.photos_today WHERE token_hash = h;
  RETURN pg_catalog.jsonb_build_object('status', 'ok', 'owner_name', l.owner_name, 'scope', l.scope, 'records', recs);
END $$;

-- Photos for a link, at most 8 per call, only those used by covered live
-- pages (covers_public), only on a day the link was viewed, within the day's
-- photo budget.
CREATE OR REPLACE FUNCTION public.link_assets(p_token text, p_ids text[])
RETURNS TABLE (id text, mime text, w integer, h integer, data text)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  hash bytea := sharing_private.token_hash(p_token);
  today date := (now() AT TIME ZONE 'UTC')::date;
  l public.links;
  served integer;
BEGIN
  IF hash IS NULL THEN RETURN; END IF;
  SELECT * INTO l FROM public.links WHERE token_hash = hash FOR UPDATE;
  IF NOT FOUND OR l.day <> today OR l.views_today = 0 OR l.photos_today >= l.daily_limit * 30 THEN RETURN; END IF;

  RETURN QUERY
    SELECT a.id, a.mime, a.w, a.h, a.data
    FROM public.assets a
    WHERE a.user_id = l.owner_id AND NOT a.deleted AND a.id = ANY (p_ids[1:8])
      AND EXISTS (
        SELECT 1 FROM public.records p
        WHERE p.user_id = l.owner_id AND p.kind = 'page' AND NOT p.deleted
          AND sharing_private.covers_public(l.scope, l.item_id, p.kind, p.id, p.data)
          AND a.id IN (SELECT sharing_private.page_asset_ids(p.data))
      );
  GET DIAGNOSTICS served = ROW_COUNT;
  UPDATE public.links SET photos_today = l.photos_today + served WHERE token_hash = hash;
END $$;

-- ---------------------------------------------------------------------------
-- Who may call what: functions are executable by PUBLIC by default in
-- Postgres, so close everything first, then open exactly these.
-- ---------------------------------------------------------------------------

REVOKE ALL ON FUNCTION
  public.share_create(text, text, text, text),
  public.shared_with_me(),
  public.shared_records(timestamptz, text, text, text, integer),
  public.shared_assets(text[]),
  public.copy_send(text, text, text),
  public.copies_for_me(),
  public.copy_page(uuid),
  public.copy_photos(uuid, text[]),
  public.copy_done(uuid),
  public.link_create(text, text, text, text),
  public.link_view(text),
  public.link_assets(text, text[])
FROM PUBLIC, anonymous, authenticated;

-- Signed-in users: sharing, copies, making links.
GRANT EXECUTE ON FUNCTION
  public.share_create(text, text, text, text),
  public.shared_with_me(),
  public.shared_records(timestamptz, text, text, text, integer),
  public.shared_assets(text[]),
  public.copy_send(text, text, text),
  public.copies_for_me(),
  public.copy_page(uuid),
  public.copy_photos(uuid, text[]),
  public.copy_done(uuid),
  public.link_create(text, text, text, text)
TO authenticated;

-- Anyone holding a link (anonymous token): exactly these two.
GRANT EXECUTE ON FUNCTION public.link_view(text), public.link_assets(text, text[]) TO anonymous, authenticated;

COMMIT;
