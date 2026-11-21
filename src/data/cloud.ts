// The Neon client: Neon Auth for accounts, the Data API for the cloud copy.
// Only two public URLs are needed; there is no database password in the app.
// Row-Level Security in the database makes each account see only its own rows.
//
// The client library is loaded on first use, so the app stays small and starts
// the same when cloud sync isn't set up.

const AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL as string | undefined;
const DATA_API_URL = import.meta.env.VITE_NEON_DATA_API_URL as string | undefined;

export const cloudConfigured = Boolean(AUTH_URL && DATA_API_URL);

const makeClient = (neon: typeof import('@neon/neon-js')) =>
  neon.createClient({ auth: { url: AUTH_URL! }, dataApi: { url: DATA_API_URL! } });
export type CloudClient = ReturnType<typeof makeClient>;

let clientPromise: Promise<CloudClient> | null = null;
export const getClient = (): Promise<CloudClient> => {
  if (!cloudConfigured) return Promise.reject(new Error('Cloud sync is not set up.'));
  clientPromise ??= import('@neon/neon-js').then(makeClient);
  return clientPromise;
};

export interface CloudUser {
  /** The id Row-Level Security sees (the token's `sub`). */
  id: string;
  email: string;
}

export type SessionCheck = { kind: 'signed-in'; user: CloudUser } | { kind: 'signed-out' } | { kind: 'unreachable' };

const statusOf = (err: unknown): number | undefined => {
  const e = err as { status?: number; statusCode?: number } | null;
  return e?.status ?? e?.statusCode;
};

/** The account id inside a session token, read without checking it (the server checks it). */
function tokenSubject(token: string | undefined): string | undefined {
  try {
    const part = token?.split('.')[1];
    if (!part) return undefined;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '='));
    const sub = (JSON.parse(json) as { sub?: unknown }).sub;
    return typeof sub === 'string' ? sub : undefined;
  } catch {
    return undefined;
  }
}

/** Who is logged in. "unreachable" means offline or the service didn't answer: try again later. */
export async function checkSession(): Promise<SessionCheck> {
  try {
    const client = await getClient();
    const { data, error } = await client.auth.getSession();
    if (error) {
      const status = statusOf(error);
      return status === 401 || status === 403 ? { kind: 'signed-out' } : { kind: 'unreachable' };
    }
    if (!data?.session || !data.user) return { kind: 'signed-out' };
    const id = tokenSubject(data.session.token) ?? data.user.id;
    return { kind: 'signed-in', user: { id, email: data.user.email } };
  } catch {
    return { kind: 'unreachable' };
  }
}

const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "That email and password don't match an account.",
  USER_ALREADY_EXISTS: 'There is already an account with that email. Log in instead.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'There is already an account with that email. Log in instead.',
  PASSWORD_TOO_SHORT: 'Choose a password of at least 8 characters.',
  PASSWORD_TOO_LONG: 'That password is too long.',
  INVALID_EMAIL: "That doesn't look like an email address.",
  EMAIL_NOT_VERIFIED: 'Confirm your email address first, using the link we sent you.',
};

function explain(error: unknown): string {
  const e = error as { code?: string; message?: string; error?: { code?: string }; body?: { code?: string } } | null;
  // The code isn't always passed through; "Invalid email or password" → INVALID_EMAIL_OR_PASSWORD.
  const fromMessage = e?.message?.toUpperCase().replace(/[^A-Z]+/g, '_').replace(/^_+|_+$/g, '');
  const code = [e?.code, e?.error?.code, e?.body?.code, fromMessage].find((c) => c && MESSAGES[c]);
  if (code) return MESSAGES[code];
  if (typeof navigator !== 'undefined' && !navigator.onLine) return "You're offline. Connect to the internet and try again.";
  return e?.message ? `That didn't work: ${e.message}` : "That didn't work. Try again in a moment.";
}

/** Returns an error message to show, or null when logged in. */
export async function logInWithEmail(email: string, password: string): Promise<string | null> {
  try {
    const client = await getClient();
    const { error } = await client.auth.signIn.email({ email, password });
    return error ? explain(error) : null;
  } catch (err) {
    return explain(err);
  }
}

export async function signUpWithEmail(email: string, password: string, name: string): Promise<string | null> {
  try {
    const client = await getClient();
    const { error } = await client.auth.signUp.email({ email, password, name });
    return error ? explain(error) : null;
  } catch (err) {
    return explain(err);
  }
}

/** Leaves for Google's sign-in page; the app opens again on Settings afterwards. */
export async function logInWithGoogle(): Promise<string | null> {
  try {
    const client = await getClient();
    const back = `${location.origin}${location.pathname}#/settings`;
    const { error } = await client.auth.signIn.social({ provider: 'google', callbackURL: back });
    return error ? explain(error) : null;
  } catch (err) {
    return explain(err);
  }
}

export async function logOutOfCloud(): Promise<string | null> {
  try {
    const client = await getClient();
    const { error } = await client.auth.signOut();
    return error ? explain(error) : null;
  } catch (err) {
    return explain(err);
  }
}
