import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { createLink, myLinks, myShares, revokeLink, revokeShare, sendCopy, shareItem, type MyLink, type MyShare } from '../data/sharing';
import { linkUrl, viewsToday, type ShareScope } from '../data/shareRules';
import { useStore } from '../data/store';
import { syncNow, useSync } from '../data/sync';
import { Sheet } from './Sheet';

export interface ShareTarget {
  scope: ShareScope;
  /** Page or tracker id; none for the whole book. */
  itemId?: string;
  title: string;
  isTemplate?: boolean;
  /** Trackers shown on the page, offered as "Also share". */
  trackerIds?: string[];
}

/** Why a share didn't work, in words. */
function explain(err: unknown): string {
  const msg = (err as { message?: string } | null)?.message ?? '';
  if (/no such (item|page)/.test(msg)) return "This hasn't reached the cloud yet. Wait for the sync to finish, then try again.";
  if (/yourself/.test(msg)) return "That's your own email address.";
  if (/too many/.test(msg)) return "You've reached the limit for shares or links. Stop sharing something you no longer need, then try again.";
  if (/recipient_email|check constraint|violates/.test(msg)) return "That doesn't look like an email address.";
  if (navigator.onLine === false) return "You're offline. Connect to the internet and try again.";
  return msg ? `That didn't work: ${msg}` : "That didn't work. Try again in a moment.";
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ShareSheet({ target, onClose }: { target: ShareTarget; onClose: () => void }) {
  const signedIn = useSync((s) => s.status === 'signed-in');
  const accountEmail = useSync((s) => s.email);
  const savedName = useStore((s) => s.settings.ownerName);
  const trackers = useStore((s) => s.trackers);
  const canCopy = target.scope === 'page';
  const canView = !(target.scope === 'page' && target.isTemplate);
  const canLink = (target.scope === 'page' && !target.isTemplate) || target.scope === 'book';
  const [mode, setMode] = useState<'view' | 'copy'>(canView ? 'view' : 'copy');
  const [email, setEmail] = useState('');
  const [name, setName] = useState(savedName || accountEmail?.split('@')[0] || '');
  const pageTrackers = (target.trackerIds ?? []).map((id) => trackers.find((t) => t.id === id)).filter((t): t is NonNullable<typeof t> => Boolean(t));
  const [alsoShare, setAlsoShare] = useState<string[]>(pageTrackers.map((t) => t.id));
  const [shares, setShares] = useState<MyShare[]>([]);
  const [links, setLinks] = useState<(MyLink & { token?: string })[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const mine = (s: MyShare) => s.scope === target.scope && (target.scope === 'book' || s.item_id === target.itemId);
  const ofPageTracker = (s: MyShare) => s.scope === 'tracker' && pageTrackers.some((t) => t.id === s.item_id);
  const thisLink = (l: MyLink) => l.scope === target.scope && (target.scope === 'book' || l.item_id === target.itemId);

  const refresh = useCallback(async () => {
    if (!signedIn) return;
    try {
      const [s, l] = await Promise.all([myShares(), canLink ? myLinks() : Promise.resolve([])]);
      setShares(s);
      setLinks(l);
    } catch (err) {
      setMessage(explain(err));
    }
  }, [signedIn, canLink]);
  useEffect(() => void refresh(), [refresh]);

  if (!signedIn) {
    return (
      <Sheet title={`Share ${target.title}`} onClose={onClose}>
        <p>Sharing needs an account. Log in under Settings → Account, then come back here.</p>
        <Link className="btn btn-primary" to="/settings" onClick={onClose}>
          Go to Settings
        </Link>
      </Sheet>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    const to = email.trim().toLowerCase();
    try {
      await syncNow(); // the item must be in the cloud before it can be shared
      if (mode === 'copy') {
        await sendCopy(to, target.itemId!, name);
        setMessage(`Sent a copy to ${to}. It waits for them under "Sent to you" for 30 days.`);
      } else {
        await shareItem(to, target.scope, target.itemId ?? null, name);
        for (const id of alsoShare) await shareItem(to, 'tracker', id, name);
        setMessage(`Shared with ${to}, view only. They see it under "Shared with me" after their next sync. If they don't have an account yet, it waits until they do.`);
      }
      setEmail('');
      await refresh();
    } catch (err) {
      setMessage(explain(err));
    }
    setBusy(false);
  };

  const stop = async (s: MyShare) => {
    setBusy(true);
    try {
      await revokeShare(s.id);
      setMessage(`${s.recipient_email} can no longer see it (from their next sync).`);
      await refresh();
    } catch (err) {
      setMessage(explain(err));
    }
    setBusy(false);
  };

  const makeLink = async () => {
    setBusy(true);
    setMessage('');
    try {
      await syncNow();
      const { token } = await createLink(target.scope as 'page' | 'book', target.itemId ?? null, name);
      const copied = await copyText(linkUrl(token));
      setMessage(copied ? 'Link made and copied. Anyone with it can view, without an account.' : 'Link made. Use "Copy link" to copy it.');
      await refresh();
    } catch (err) {
      setMessage(explain(err));
    }
    setBusy(false);
  };

  const linkOff = async (l: MyLink) => {
    setBusy(true);
    try {
      await revokeLink(l.id);
      setMessage('The link is turned off. Anyone opening it now sees nothing.');
      await refresh();
    } catch (err) {
      setMessage(explain(err));
    }
    setBusy(false);
  };

  const current = shares.filter((s) => mine(s) || ofPageTracker(s));
  const label = (s: MyShare) => (mine(s) ? '' : `${trackers.find((t) => t.id === s.item_id)?.name ?? 'Tracker'}: `);

  return (
    <Sheet title={`Share ${target.title}`} onClose={onClose}>
      <form className="form-card account-form" onSubmit={submit}>
        {canView && canCopy && (
          <div className="seg" role="radiogroup" aria-label="How to share">
            <button type="button" role="radio" aria-checked={mode === 'view'} className={mode === 'view' ? 'is-on' : ''} onClick={() => setMode('view')}>
              View only
            </button>
            <button type="button" role="radio" aria-checked={mode === 'copy'} className={mode === 'copy' ? 'is-on' : ''} onClick={() => setMode('copy')}>
              Send a copy
            </button>
          </div>
        )}
        <p className="muted">
          {mode === 'copy'
            ? 'They get their own copy, photos included, to keep and change. Later changes on either side stay separate.'
            : 'They can look but not change anything. It stays up to date, and you can stop sharing at any time.'}
        </p>
        {mode === 'view' && target.scope === 'book' && (
          <p className="warning" role="note">
            Sharing the whole book also shares all your trackers and their history.
          </p>
        )}
        <div className="field">
          <label htmlFor="share-email">Their email address</label>
          <input id="share-email" type="email" required autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="share-name">Your name, as they will see it</label>
          <input id="share-name" type="text" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        {mode === 'view' && pageTrackers.length > 0 && (
          <fieldset className="field share-also">
            <legend className="label">Also share</legend>
            {pageTrackers.map((t) => (
              <label key={t.id} className="check-row">
                <input type="checkbox" checked={alsoShare.includes(t.id)} onChange={(e) => setAlsoShare(e.target.checked ? [...alsoShare, t.id] : alsoShare.filter((x) => x !== t.id))} />
                <span aria-hidden="true">{t.emoji}</span> {t.name}
              </label>
            ))}
            <small className="muted">So the tracker boxes on this page show their days. Each one can be stopped on its own below.</small>
          </fieldset>
        )}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {mode === 'copy' ? 'Send the copy' : 'Share'}
        </button>
      </form>

      {current.length > 0 && (
        <section className="share-list" aria-label="Shared with">
          <h3>Shared with</h3>
          <ul className="rows is-quiet">
            {current.map((s) => (
              <li key={s.id} className="row">
                <span className="row-text">
                  <strong>
                    {label(s)}
                    {s.recipient_email}
                  </strong>
                </span>
                <button className="btn btn-small" onClick={() => stop(s)} disabled={busy}>
                  Stop sharing
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {canLink && (
        <section className="share-list" aria-label="Public link">
          <h3>Public link</h3>
          <p className="muted">
            Anyone with the link can view {target.scope === 'book' ? 'the pages of your book' : 'this page'}, without an account. Trackers are never included: their boxes show as not shared. Up to 200 views a day.
          </p>
          {links.filter(thisLink).map((l) => (
            <div key={l.id} className="inline">
              <span className="muted">{viewsToday(l)} view{viewsToday(l) === 1 ? '' : 's'} today</span>
              {l.token ? (
                <button className="btn btn-small" onClick={async () => setMessage((await copyText(linkUrl(l.token!))) ? 'Link copied.' : linkUrl(l.token!))}>
                  Copy link
                </button>
              ) : (
                <span className="muted">(made on another device)</span>
              )}
              <button className="btn btn-small" onClick={() => linkOff(l)} disabled={busy}>
                Turn off
              </button>
            </div>
          ))}
          <button className="btn" onClick={makeLink} disabled={busy}>
            Make a public link
          </button>
        </section>
      )}

      {message && (
        <p className="muted" role="status">
          {message}
        </p>
      )}
    </Sheet>
  );
}
