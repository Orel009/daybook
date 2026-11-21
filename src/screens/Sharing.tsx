import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cancelCopy, myLinks, myShares, revokeLink, revokeShare, sentCopies, useShared, type MyLink, type MyShare, type SentCopy } from '../data/sharing';
import { linkUrl, viewsToday } from '../data/shareRules';
import { useStore } from '../data/store';
import { useSync } from '../data/sync';
import { ShareSheet } from '../ui/ShareSheet';
import { shortDate } from './Shared';

/** Settings → Sharing: everything this account shares, and what is shared with it. */
export function SharingSection() {
  const signedIn = useSync((s) => s.status === 'signed-in');
  const pages = useStore((s) => s.pages);
  const trackers = useStore((s) => s.trackers);
  const sharedWithMe = useShared((s) => s.shares);
  const copiesForMe = useShared((s) => s.copies);
  const [shares, setShares] = useState<MyShare[]>([]);
  const [links, setLinks] = useState<(MyLink & { token?: string })[]>([]);
  const [copies, setCopies] = useState<SentCopy[]>([]);
  const [sharingBook, setSharingBook] = useState(false);
  const [message, setMessage] = useState('');

  const refresh = useCallback(async () => {
    if (!signedIn) return;
    try {
      const [s, l, c] = await Promise.all([myShares(), myLinks(), sentCopies()]);
      setShares(s);
      setLinks(l);
      setCopies(c);
    } catch {
      setMessage("Couldn't load your shares. Check the connection and try again.");
    }
  }, [signedIn]);
  useEffect(() => void refresh(), [refresh]);

  if (!signedIn) return null;

  const what = (scope: string, itemId: string | null) =>
    scope === 'book'
      ? 'Your whole book'
      : scope === 'page'
        ? `Page: ${pages.find((p) => p.id === itemId)?.title || 'a page you deleted'}`
        : `Tracker: ${trackers.find((t) => t.id === itemId)?.name ?? 'a tracker you deleted'}`;

  const run = async (fn: () => Promise<void>, done: string) => {
    setMessage('');
    try {
      await fn();
      setMessage(done);
      await refresh();
    } catch {
      setMessage("That didn't work. Try again in a moment.");
    }
  };

  const owners = [...new Map(sharedWithMe.map((s) => [s.owner_key, s.owner_name])).values()];

  return (
    <section className="card form-card">
      <h2>Sharing</h2>
      <p>Share a page, a tracker or your whole book with someone, view only. Pages can also be sent as a copy. Open a page or tracker to share it.</p>
      <div className="inline">
        <button className="btn btn-primary" onClick={() => setSharingBook(true)}>
          Share my whole book
        </button>
        <button className="btn" onClick={() => void refresh()}>
          Refresh
        </button>
      </div>

      {(shares.length > 0 || links.length > 0 || copies.length > 0) && (
        <div className="share-list">
          <h3>What you share</h3>
          <ul className="rows is-quiet">
            {shares.map((s) => (
              <li key={s.id} className="row">
                <span className="row-text">
                  <strong>{what(s.scope, s.item_id)}</strong>
                  <small>
                    View only, with {s.recipient_email} · since {shortDate(s.created_at)}
                  </small>
                </span>
                <button className="btn btn-small" onClick={() => run(() => revokeShare(s.id), `${s.recipient_email} can no longer see it (from their next sync).`)}>
                  Stop sharing
                </button>
              </li>
            ))}
            {links.map((l) => (
              <li key={l.id} className="row">
                <span className="row-text">
                  <strong>{what(l.scope, l.item_id)}</strong>
                  <small>
                    Public link · {viewsToday(l)} of {l.daily_limit} views today
                  </small>
                </span>
                <span className="inline">
                  {l.token && (
                    <button
                      className="btn btn-small"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(linkUrl(l.token!));
                          setMessage('Link copied.');
                        } catch {
                          setMessage(linkUrl(l.token!));
                        }
                      }}
                    >
                      Copy link
                    </button>
                  )}
                  <button className="btn btn-small" onClick={() => run(() => revokeLink(l.id), 'The link is turned off.')}>
                    Turn off
                  </button>
                </span>
              </li>
            ))}
            {copies.map((c) => (
              <li key={c.id} className="row">
                <span className="row-text">
                  <strong>
                    {c.is_template ? 'Template' : 'Page'}: {c.title}
                  </strong>
                  <small>
                    Copy sent to {c.recipient_email}, not opened yet · waits until {shortDate(c.expires_at)}
                  </small>
                </span>
                <button className="btn btn-small" onClick={() => run(() => cancelCopy(c.id), 'The copy was taken back.')}>
                  Take back
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="share-list">
        <h3>Shared with you</h3>
        {owners.length === 0 && copiesForMe.length === 0 ? (
          <p className="muted">Nothing yet. When someone shares with your email address, it shows up in the Journal, Trackers and Book.</p>
        ) : (
          <p>
            {owners.length > 0 && <>From {owners.join(', ')}: see the Journal, Trackers and Book. </>}
            {copiesForMe.length > 0 && (
              <Link to="/journal" className="text-link">
                {copiesForMe.length} cop{copiesForMe.length === 1 ? 'y' : 'ies'} waiting in the Journal
              </Link>
            )}
          </p>
        )}
      </div>

      {message && (
        <p className="muted" role="status">
          {message}
        </p>
      )}
      {sharingBook && (
        <ShareSheet
          target={{ scope: 'book', title: 'your book' }}
          onClose={() => {
            setSharingBook(false);
            void refresh();
          }}
        />
      )}
    </section>
  );
}
