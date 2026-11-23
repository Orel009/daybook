import { useEffect, useMemo, useState } from 'react';
import { blobFromBase64, type PhotoSource } from '../data/assets';
import { getPublicClient } from '../data/cloud';
import { isLinkToken } from '../data/shareRules';
import { bookOrder, coverOf, type Page } from '../domain/pages';
import type { TrackerDefinition, TrackerEntry } from '../domain/types';
import { EmptyState, PageHeader } from '../ui/Layout';
import type { PageSource } from '../ui/PageCanvas';
import { PageSourceContext } from '../ui/PageCanvas';
import { BookView } from './Book';
import { ReadOnlyPage } from './Shared';

// A page or a whole book opened from a public link (#/s/<token>), without an
// account. This screen runs outside the app's normal start: no book is loaded,
// nothing is written to this device, nothing syncs. The token is checked by
// the database (link_view / link_assets), which also counts the day's views.

type Result =
  | { status: 'loading' }
  | { status: 'ok'; owner_name: string; scope: 'page' | 'book'; records: { kind: string; id: string; data: Record<string, unknown> }[] }
  | { status: 'resting' }
  | { status: 'gone' }
  | { status: 'error' };

/** Photos for this link, fetched in small batches and kept in memory only. */
function linkPhotos(token: string): PhotoSource {
  const cache = new Map<string, Promise<Blob | undefined>>();
  let queue: { id: string; resolve: (b: Blob | undefined) => void }[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;
  const flush = async () => {
    const batch = queue.splice(0, 8);
    if (queue.length) timer = setTimeout(flush, 0);
    else timer = undefined;
    try {
      const client = await getPublicClient();
      const { data } = await client.rpc('link_assets', { p_token: token, p_ids: batch.map((b) => b.id) });
      const rows = (data ?? []) as { id: string; mime: string; data: string }[];
      for (const b of batch) {
        const row = rows.find((r) => r.id === b.id);
        b.resolve(row ? blobFromBase64(row.mime, row.data) : undefined);
      }
    } catch {
      for (const b of batch) b.resolve(undefined);
    }
  };
  return {
    ns: 'link',
    load: (id) => {
      let p = cache.get(id);
      if (!p) {
        p = new Promise((resolve) => queue.push({ id, resolve }));
        cache.set(id, p);
        timer ??= setTimeout(flush, 0);
      }
      return p;
    },
  };
}

export function PublicView({ token }: { token: string }) {
  const [result, setResult] = useState<Result>({ status: 'loading' });

  useEffect(() => {
    let live = true;
    (async () => {
      if (!isLinkToken(token)) return setResult({ status: 'gone' });
      try {
        const client = await getPublicClient();
        const { data, error } = await client.rpc('link_view', { p_token: token });
        if (!live) return;
        if (error) return setResult({ status: 'error' });
        setResult((data as Result) ?? { status: 'gone' });
      } catch {
        if (live) setResult({ status: 'error' });
      }
    })();
    return () => {
      live = false;
    };
  }, [token]);

  const content = useMemo(() => {
    if (result.status !== 'ok') return null;
    const of = <T,>(kind: string) => result.records.filter((r) => r.kind === kind).map((r) => r.data as unknown as T);
    const trackers = of<TrackerDefinition>('tracker');
    const entries = of<TrackerEntry>('entry');
    // a link shows the pages; the book's own covers are not part of it
    const everyPage = of<Page>('page');
    const pages = result.scope === 'page' ? everyPage.filter((p) => !p.isTemplate) : bookOrder(everyPage);
    const source: PageSource = { photos: linkPhotos(token), tracker: (id) => trackers.find((t) => t.id === id), entries };
    // a book link shows the book with the covers its owner designed
    return { pages, source, cover: coverOf(everyPage, 'cover'), back: coverOf(everyPage, 'back') };
  }, [result, token]);

  return (
    <main className="public-view">
      {result.status === 'loading' && <div className="loading" aria-busy="true" aria-label="Opening the shared page" />}
      {result.status === 'resting' && (
        <EmptyState emoji="🌙" title="This link is resting until tomorrow">
          <p>It has been opened a lot today. Come back tomorrow and it will be here again.</p>
        </EmptyState>
      )}
      {result.status === 'gone' && (
        <EmptyState emoji="🔒" title="This link doesn't work">
          <p>It may have been turned off by the person who shared it, or copied incompletely. Ask them for the link again.</p>
        </EmptyState>
      )}
      {result.status === 'error' && (
        <EmptyState emoji="📡" title="Couldn't open the link">
          <p>Check the internet connection and reload the page.</p>
        </EmptyState>
      )}
      {result.status === 'ok' && content && (
        <>
          {result.scope === 'page' && content.pages[0] ? (
            <>
              <PageHeader title={content.pages[0].title || 'Untitled page'} sub={`From ${result.owner_name}’s Daybook · view only`} />
              <ReadOnlyPage page={content.pages[0]} source={content.source} />
            </>
          ) : (
            <PageSourceContext.Provider value={content.source}>
              <BookView
                pages={content.pages}
                owner={result.owner_name}
                cover={content.cover}
                back={content.back}
                header={<PageHeader title={`${result.owner_name}’s book`} sub="Shared with a link · view only" />}
                empty={<EmptyState emoji="📖" title="This book has no pages yet" />}
              />
            </PageSourceContext.Provider>
          )}
        </>
      )}
    </main>
  );
}
