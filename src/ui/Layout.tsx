import { NavLink, Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';

const icon = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    {d}
  </svg>
);

const TABS = [
  { to: '/', label: 'Home', tape: 'rose', icon: icon(<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />) },
  { to: '/trackers', label: 'Trackers', tape: 'butter', icon: icon(<><circle cx="12" cy="12" r="8" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></>) },
  { to: '/journal', label: 'Journal', tape: 'mint', icon: icon(<><path d="M6 4h11a1 1 0 0 1 1 1v15H7a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1z" /><path d="M9 8h6M9 12h6" /></>) },
  { to: '/book', label: 'Book', tape: 'peach', icon: icon(<><path d="M12 6.500C9.500 4.800 6.500 4.500 3.500 5.500v12.500c3-1 6-.700 8.500 1 2.500-1.700 5.500-2 8.500-1V5.500c-3-1-6-.700-8.500 1z" /><path d="M12 6.500V19" /></>) },
  { to: '/templates', label: 'Templates', tape: 'sky', icon: icon(<><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>) },
  { to: '/settings', label: 'Settings', tape: 'lilac', icon: icon(<><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /></>) },
];

export function Layout() {
  return (
    <div className="app">
      <nav className="tabs" aria-label="Main">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.to === '/'} className={({ isActive }) => `tab tape-${t.tape} ${isActive ? 'is-active' : ''}`}>
            {t.icon}
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>
      <main className="page">
        <Outlet />
      </main>
    </div>
  );
}

export function PageHeader({ title, sub, action, back }: { title: string; sub?: string; action?: ReactNode; back?: ReactNode }) {
  return (
    <header className="page-head">
      {back}
      <div className="page-head-text">
        <h1>{title}</h1>
        {sub && <p className="muted">{sub}</p>}
      </div>
      {action && <div className="page-head-action">{action}</div>}
    </header>
  );
}

export function EmptyState({ emoji, title, children }: { emoji: string; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-art" aria-hidden="true">
        {emoji}
      </div>
      <h2>{title}</h2>
      {children}
    </div>
  );
}
