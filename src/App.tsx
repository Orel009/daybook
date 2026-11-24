import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { useStore, useUi } from './data/store';
import { startSync } from './data/sync';
import './visualizations';
import { Layout, EmptyState } from './ui/Layout';
import { LogSheet } from './ui/LogSheet';
import { Home } from './screens/Home';
import { Trackers } from './screens/Trackers';
import { TrackerDetail } from './screens/TrackerDetail';
import { TrackerFormRoute } from './screens/TrackerForm';
import { Journal } from './screens/Journal';
import { Templates } from './screens/Templates';
import { PageScreen } from './screens/PageScreen';
import { Book } from './screens/Book';
import { Arrange } from './screens/Arrange';
import { Settings } from './screens/Settings';
import { SharedBookScreen, SharedPageScreen, SharedTrackerScreen } from './screens/Shared';

// Printing and exporting is a piece of its own, fetched the first time its screen is opened.
const ExportScreen = lazy(() => import('./export/ExportScreen'));

const THEME_COLORS = { scrapbook: '#E9E4F2', dark: '#1D1A24', minimal: '#F3F3F1' } as const;

export function App() {
  const ready = useStore((s) => s.ready);
  const theme = useStore((s) => s.settings.theme);
  const log = useUi((s) => s.log);

  useEffect(() => {
    void useStore.getState().init();
  }, []);

  // Cloud sync runs in the background once the book on this device is loaded.
  useEffect(() => {
    if (ready) startSync();
  }, [ready]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
  }, [theme]);

  if (!ready) return <div className="loading" aria-busy="true" aria-label="Opening your book" />;

  return (
    // Hash routes work on any static host without server rewrite rules.
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="trackers" element={<Trackers />} />
          <Route path="trackers/new" element={<TrackerFormRoute />} />
          <Route path="trackers/:id" element={<TrackerDetail />} />
          <Route path="trackers/:id/edit" element={<TrackerFormRoute />} />
          <Route path="journal" element={<Journal />} />
          <Route path="journal/:id" element={<PageScreen />} />
          <Route path="book" element={<Book />} />
          <Route path="arrange" element={<Arrange />} />
          <Route path="templates" element={<Templates />} />
          <Route
            path="export"
            element={
              <Suspense fallback={<p className="muted" role="status">Getting ready to print…</p>}>
                <ExportScreen />
              </Suspense>
            }
          />
          <Route path="settings" element={<Settings />} />
          <Route path="shared/:owner/page/:id" element={<SharedPageScreen />} />
          <Route path="shared/:owner/tracker/:id" element={<SharedTrackerScreen />} />
          <Route path="shared/:owner/book" element={<SharedBookScreen />} />
          <Route path="*" element={<EmptyState emoji="🧭" title="That page doesn't exist" />} />
        </Route>
      </Routes>
      {log && <LogSheet key={`${log.trackerId}-${log.entryId ?? log.date ?? 'new'}`} />}
    </HashRouter>
  );
}
