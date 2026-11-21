import { useEffect, useState, type FormEvent } from 'react';
import { googleLoginProblem, logInWithEmail, logInWithGoogle, resetPasswordWithCode, sendResetCode, signUpWithEmail } from '../data/cloud';
import { useStore } from '../data/store';
import { logOut, syncNow, unsentCount, useSync } from '../data/sync';
import { LOCALE } from '../domain/dates';
import { Sheet } from '../ui/Sheet';

function when(iso: string): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString(LOCALE, { hour: 'numeric', minute: '2-digit' });
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return `today at ${time}`;
  return `${d.toLocaleDateString(LOCALE, { month: 'long', day: 'numeric' })} at ${time}`;
}

/** Settings → Account: optional login that keeps a copy of the book in the cloud. */
export function AccountSection() {
  const { status, email, syncing, lastSyncedAt, problem } = useSync();
  const [leaving, setLeaving] = useState<{ unsent: number } | null>(null);
  const [message, setMessage] = useState('');

  // A message from logging out is shown on the login form; it is cleared by the next login.
  useEffect(() => {
    if (status === 'signed-in') setMessage('');
  }, [status]);

  if (status === 'off') return null;

  if (status === 'checking') {
    return (
      <section className="card form-card">
        <h2>Account</h2>
        <p className="muted" role="status">
          Checking your account…
        </p>
      </section>
    );
  }

  if (status === 'signed-out') return <LogInForm notice={message} onPasswordReset={() => setMessage('Your new password is set, and you are logged in.')} />;

  const startLogOut = async () => {
    setMessage('');
    await syncNow(); // send anything still waiting first
    setLeaving({ unsent: await unsentCount() });
  };

  const finishLogOut = async (clear: boolean) => {
    const error = await logOut(clear);
    setLeaving(null);
    setMessage(error ?? (clear ? 'Logged out. This tablet is empty now.' : 'Logged out. Your book stays on this tablet.'));
  };

  const state = syncing
    ? 'Syncing…'
    : problem === 'offline'
      ? "You're offline. Changes are kept here and sync when you're back online."
      : problem === 'failed'
        ? "The last sync didn't finish. It will try again on its own."
        : null;

  return (
    <section className="card form-card">
      <h2>Account</h2>
      <p>
        Logged in as <strong>{email}</strong>. Your book is saved to the cloud, so if this tablet is reset or replaced, log in again and everything comes back, photos included.
      </p>
      <p className="muted" role="status">
        Last synced: {lastSyncedAt ? when(lastSyncedAt) : 'not yet'}
        {state && (
          <>
            <br />
            {state}
          </>
        )}
      </p>
      <div className="inline">
        <button className="btn btn-primary" onClick={() => void syncNow()} disabled={syncing}>
          Sync now
        </button>
        <button className="btn" onClick={startLogOut}>
          Log out
        </button>
      </div>
      {message && (
        <p className="muted" role="status">
          {message}
        </p>
      )}

      {leaving && (
        <Sheet
          title="Log out?"
          onClose={() => setLeaving(null)}
          footer={
            <>
              <button className="btn btn-quiet" onClick={() => setLeaving(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={() => finishLogOut(true)}>
                Remove from this tablet
              </button>
              <button className="btn btn-primary" onClick={() => finishLogOut(false)}>
                Keep on this tablet
              </button>
            </>
          }
        >
          <p>Your book stays saved in your account either way. Do you want to keep a copy on this tablet, or remove it from here?</p>
          {leaving.unsent > 0 && (
            <p className="warning" role="status">
              {leaving.unsent} recent change{leaving.unsent === 1 ? " hasn't" : "s haven't"} reached the cloud yet. If you remove the book from this tablet, {leaving.unsent === 1 ? 'it is' : 'they are'} lost.
            </p>
          )}
        </Sheet>
      )}
    </section>
  );
}

function LogInForm({ notice, onPasswordReset }: { notice: string; onPasswordReset: () => void }) {
  const ownerName = useStore((s) => s.settings.ownerName);
  const expired = useSync((s) => s.email); // set when this device was logged in and the login ran out
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState(expired ?? '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(googleLoginProblem ?? '');
  const [resetting, setResetting] = useState(false);

  if (resetting) {
    return (
      <ResetPassword
        startEmail={email.trim()}
        onBack={() => setResetting(false)}
        onDone={onPasswordReset}
      />
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    const address = email.trim();
    const error =
      mode === 'login'
        ? await logInWithEmail(address, password)
        : await signUpWithEmail(address, password, ownerName.trim() || address.split('@')[0]);
    if (error) {
      setMessage(error);
    } else {
      setPassword('');
      await syncNow();
      if (useSync.getState().status !== 'signed-in') setMessage('Check your email to confirm your address, then log in here.');
    }
    setBusy(false);
  };

  const google = async () => {
    setBusy(true);
    const error = await logInWithGoogle(); // on success the page moves to Google
    if (error) setMessage(error);
    setBusy(false);
  };

  return (
    <section className="card form-card">
      <h2>Account</h2>
      {notice && (
        <p className="muted" role="status">
          {notice}
        </p>
      )}
      {expired ? (
        <p className="warning" role="status">
          You were logged out of {expired}. Log in again to keep your book in sync; nothing on this tablet was removed.
        </p>
      ) : (
        <p>
          Your book is stored on this tablet. Log in to also keep it in the cloud: if the tablet is reset or replaced, log in again and everything comes back, photos included. Logging in is optional.
        </p>
      )}
      <div className="seg" role="radiogroup" aria-label="Log in or create an account">
        <button type="button" role="radio" aria-checked={mode === 'login'} className={mode === 'login' ? 'is-on' : ''} onClick={() => setMode('login')}>
          Log in
        </button>
        <button type="button" role="radio" aria-checked={mode === 'signup'} className={mode === 'signup' ? 'is-on' : ''} onClick={() => setMode('signup')}>
          Create account
        </button>
      </div>
      <form className="form-card account-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="acc-email">Email</label>
          <input id="acc-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="acc-password">Password</label>
          <input
            id="acc-password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={mode === 'signup' ? 8 : undefined}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'signup' ? 'At least 8 characters' : undefined}
          />
          {mode === 'login' && (
            <button type="button" className="btn btn-quiet account-forgot" onClick={() => setResetting(true)}>
              Forgot password?
            </button>
          )}
        </div>
        <div className="inline">
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {mode === 'login' ? 'Log in' : 'Create account'}
          </button>
          <button className="btn" type="button" onClick={google} disabled={busy}>
            Continue with Google
          </button>
        </div>
      </form>
      {message && (
        <p className="muted" role="status">
          {message}
        </p>
      )}
    </section>
  );
}

/** Forgot password: a 6-digit code by email, then a new password, then logged in. */
function ResetPassword({ startEmail, onBack, onDone }: { startEmail: string; onBack: () => void; onDone: () => void }) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState(startEmail);
  const [sentTo, setSentTo] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    setBusy(true);
    setMessage('');
    const address = (step === 'email' ? email : sentTo).trim();
    const error = await sendResetCode(address);
    if (error) {
      setMessage(error);
    } else {
      setSentTo(address);
      setCode('');
      setStep('code');
      if (step === 'code') setMessage('A new code is on its way. Use the newest one.');
    }
    setBusy(false);
  };

  const reset = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    const error = await resetPasswordWithCode(sentTo, code.trim(), password);
    if (error) {
      setMessage(error);
      setBusy(false);
      return;
    }
    await syncNow(); // logged in: the Account section switches to the signed-in view
    onDone();
  };

  return (
    <section className="card form-card">
      <h2>Account</h2>
      <h3>Reset your password</h3>
      {step === 'email' ? (
        <form className="form-card account-form" onSubmit={send}>
          <p>Enter the email address of your account. We'll send you a 6-digit code.</p>
          <div className="field">
            <label htmlFor="reset-email">Email</label>
            <input id="reset-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="inline">
            <button className="btn btn-primary" type="submit" disabled={busy}>
              Send code
            </button>
            <button className="btn btn-quiet" type="button" onClick={onBack}>
              Back to log in
            </button>
          </div>
        </form>
      ) : (
        <form className="form-card account-form" onSubmit={reset}>
          <p>
            If there is an account for <strong>{sentTo}</strong>, a 6-digit code is on its way. It can take a minute; check the spam folder too. The code works for a few minutes.
          </p>
          <div className="field">
            <label htmlFor="reset-code">Code from the email</label>
            <input
              id="reset-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <div className="field">
            <label htmlFor="reset-password">New password</label>
            <input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
          <div className="inline">
            <button className="btn btn-primary" type="submit" disabled={busy}>
              Set new password
            </button>
            <button className="btn" type="button" onClick={() => void send()} disabled={busy}>
              Send a new code
            </button>
            <button className="btn btn-quiet" type="button" onClick={onBack}>
              Back to log in
            </button>
          </div>
        </form>
      )}
      {message && (
        <p className="muted" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
