import { useRef, useState } from 'react';
import { useStore, type BackupFile } from '../data/store';
import { LOCALE, todayKey } from '../domain/dates';
import type { ThemeId } from '../domain/types';
import { PageHeader } from '../ui/Layout';
import { Sheet } from '../ui/Sheet';
import { useSync } from '../data/sync';
import { AccountSection } from './Account';
import { SharingSection } from './Sharing';

const THEMES: { id: ThemeId; name: string; hint: string }[] = [
  { id: 'scrapbook', name: 'Scrapbook', hint: 'Dotted paper, tape and soft colour' },
  { id: 'dark', name: 'Evening', hint: 'The same book, lights down' },
  { id: 'minimal', name: 'Minimal', hint: 'Plain paper, no decoration' },
];

export function Settings() {
  const settings = useStore((s) => s.settings);
  const persistent = useStore((s) => s.persistent);
  const trackerCount = useStore((s) => s.trackers.length);
  const entryCount = useStore((s) => s.entries.length);
  const pageCount = useStore((s) => s.pages.filter((p) => !p.isTemplate).length);
  const counts = { t: trackerCount, e: entryCount };
  const { updateSettings, exportBackup, importBackup } = useStore.getState();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [message, setMessage] = useState('');
  const signedIn = useSync((s) => s.status === 'signed-in');

  const download = async () => {
    try {
      const blob = new Blob([JSON.stringify(await exportBackup())], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daybook-backup-${todayKey()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setMessage('Backup saved to your downloads.');
    } catch (err) {
      console.error(err);
      setMessage(`The backup could not be made. ${err instanceof Error ? err.message : ''}`);
    }
  };

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as BackupFile;
      if (parsed?.app !== 'daybook' || !Array.isArray(parsed.trackers)) throw new Error();
      setPending(parsed);
    } catch {
      setMessage("That file isn't a Daybook backup. Choose a file saved with \"Save a backup\".");
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <>
      <PageHeader title="Settings" />

      <section className="card form-card">
        <h2>Your book</h2>
        <div className="field">
          <label htmlFor="s-name">Your name</label>
          <input id="s-name" type="text" value={settings.ownerName} onChange={(e) => updateSettings({ ownerName: e.target.value })} placeholder="Used in the greeting on Home" maxLength={30} />
        </div>
        <div className="field">
          <span className="label" id="week-label">Week starts on</span>
          <div className="seg" role="radiogroup" aria-labelledby="week-label">
            {([0, 1] as const).map((d) => (
              <button key={d} role="radio" aria-checked={settings.weekStartsOn === d} className={settings.weekStartsOn === d ? 'is-on' : ''} onClick={() => updateSettings({ weekStartsOn: d })}>
                {d === 0 ? 'Sunday' : 'Monday'}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card form-card">
        <h2>Look</h2>
        <div className="theme-grid" role="radiogroup" aria-label="Theme">
          {THEMES.map((t) => (
            <button key={t.id} role="radio" aria-checked={settings.theme === t.id} className={`theme-swatch theme-${t.id} ${settings.theme === t.id ? 'is-on' : ''}`} onClick={() => updateSettings({ theme: t.id })}>
              <span className="theme-preview" aria-hidden="true">
                <i /><i /><i />
              </span>
              <strong>{t.name}</strong>
              <small>{t.hint}</small>
            </button>
          ))}
        </div>
      </section>

      <AccountSection />
      <SharingSection />

      <section className="card form-card">
        <h2>Backup</h2>
        <p>
          Everything is stored on this device{signedIn ? ' and synced to your account' : ' only'}: {counts.t} tracker{counts.t === 1 ? '' : 's'} and {counts.e}{' '}
          {counts.e === 1 ? 'entry' : 'entries'}, plus {pageCount} journal page{pageCount === 1 ? '' : 's'} with their photos. {signedIn ? 'A backup file is an extra copy you keep yourself.' : 'Save a backup now and then so nothing is lost if the tablet is reset or replaced.'}
        </p>
        {!persistent && (
          <p className="warning" role="status">
            This browser is not letting Daybook save to the device, so changes last only until the page closes.
          </p>
        )}
        <div className="inline">
          <button className="btn btn-primary" onClick={download}>
            Save a backup
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Restore from a backup
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => pickFile(e.target.files?.[0])} />
        </div>
        {message && (
          <p className="muted" role="status">
            {message}
          </p>
        )}
      </section>

      {pending && (
        <Sheet
          title="Restore this backup?"
          onClose={() => setPending(null)}
          footer={
            <>
              <button className="btn btn-quiet" onClick={() => setPending(null)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={async () => {
                  try {
                    await importBackup(pending);
                    setMessage('Backup restored.');
                  } catch (err) {
                    setMessage(err instanceof Error ? err.message : 'The backup could not be restored.');
                  }
                  setPending(null);
                }}
              >
                Replace everything
              </button>
            </>
          }
        >
          <p>
            The backup from {new Date(pending.exportedAt).toLocaleDateString(LOCALE, { month: 'long', day: 'numeric', year: 'numeric' })} has {pending.trackers.length} trackers and{' '}
            {pending.entries.length} entries. Restoring replaces everything currently in this book.
          </p>
        </Sheet>
      )}
    </>
  );
}
