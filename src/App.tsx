import { useEffect } from 'react';
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
import { Journal, Templates } from './screens/Journal';
import { PageScreen } from './screens/PageScreen';
import { Book } from './screens/Book';
import { Settings } from './screens/Settings';

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
          <Route path="templates" element={<Templates />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<EmptyState emoji="🧭" title="That page doesn't exist" />} />
        </Route>
      </Routes>
      {log && <LogSheet key={`${log.trackerId}-${log.entryId ?? log.date ?? 'new'}`} />}
    </HashRouter>
  );
}
