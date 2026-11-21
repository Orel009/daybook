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

/**
 * For public links only: the same Data API, but without an account it uses
 * Neon's anonymous token (role "anonymous"), which can call link_view() and
 * link_assets() and nothing else. Kept in memory; nothing is stored.
 */
const makePublicClient = (neon: typeof import('@neon/neon-js')) =>
  neon.createClient({ auth: { url: AUTH_URL!, allowAnonymous: true }, dataApi: { url: DATA_API_URL! } });
let publicClientPromise: Promise<ReturnType<typeof makePublicClient>> | null = null;
export const getPublicClient = () => {
  if (!cloudConfigured) return Promise.reject(new Error('Cloud sync is not set up.'));
  publicClientPromise ??= import('@neon/neon-js').then(makePublicClient);
  return publicClientPromise;
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

const SIGN_UPS_CLOSED = 'New accounts are closed. Log in with an existing account.';
const GOOGLE_OFF = 'Logging in with Google is turned off. Log in with your email and password.';

const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "That email and password don't match an account.",
  USER_ALREADY_EXISTS: 'There is already an account with that email. Log in instead.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'There is already an account with that email. Log in instead.',
  PASSWORD_TOO_SHORT: 'Choose a password of at least 8 characters.',
  PASSWORD_TOO_LONG: 'That password is too long.',
  INVALID_EMAIL: "That doesn't look like an email address.",
  EMAIL_NOT_VERIFIED: 'Confirm your email address first, using the link we sent you.',
  // sign-ups turned off on the server
  EMAIL_PASSWORD_SIGN_UP_DISABLED: SIGN_UPS_CLOSED,
  EMAIL_AND_PASSWORD_SIGN_UP_IS_NOT_ENABLED: SIGN_UPS_CLOSED,
  SIGNUP_DISABLED: SIGN_UPS_CLOSED,
  NEW_USER_SIGNUP_DISABLED: SIGN_UPS_CLOSED,
  // Google removed as a login provider
  PROVIDER_NOT_FOUND: GOOGLE_OFF,
  OAUTH_PROVIDER_NOT_FOUND: GOOGLE_OFF,
  // password reset codes
  INVALID_OTP: 'That code is wrong or no longer valid. Check the email address and the code, or send a new code.',
  OTP_EXPIRED: 'That code has expired. Send a new code.',
  TOO_MANY_ATTEMPTS: 'Too many wrong tries for that code. Send a new code.',
  TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE: 'Too many wrong tries for that code. Send a new code.',
  TOO_MANY_ATTEMPTS_PLEASE_REQUEST_A_NEW_CODE: 'Too many wrong tries for that code. Send a new code.',
  USER_NOT_FOUND: "There's no account with that email address.",
  TOO_MANY_REQUESTS: 'Too many tries in a short time. Wait a minute, then try again.',
};

/** A clear message for an auth error, from its code or, when the code is missing, its text. */
export function explain(error: unknown): string {
  const e = error as { code?: string; message?: string; status?: number; error?: { code?: string }; body?: { code?: string } } | null;
  // The code isn't always passed through; "Invalid email or password" → INVALID_EMAIL_OR_PASSWORD.
  const fromMessage = e?.message?.toUpperCase().replace(/[^A-Z]+/g, '_').replace(/^_+|_+$/g, '');
  const code = [e?.code, e?.error?.code, e?.body?.code, fromMessage].find((c) => c && MESSAGES[c]);
  if (code) return MESSAGES[code];
  if (e?.status === 429) return MESSAGES.TOO_MANY_REQUESTS;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return "You're offline. Connect to the internet and try again.";
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

/**
 * Leaves for Google's sign-in page; the app opens again on Settings afterwards,
 * also when Google login fails (then with `?error=…`, see `googleLoginProblem`).
 */
export async function logInWithGoogle(): Promise<string | null> {
  try {
    const client = await getClient();
    const back = `${location.origin}${location.pathname}#/settings`;
    const { error } = await client.auth.signIn.social({ provider: 'google', callbackURL: back, errorCallbackURL: back });
    return error ? explain(error) : null;
  } catch (err) {
    return explain(err);
  }
}

/**
 * Why a Google login that returned to the app didn't work, read once when the
 * app loads; the `error` parameter is then removed from the address.
 */
export const googleLoginProblem: string | null = (() => {
  if (typeof location === 'undefined') return null;
  const url = new URL(location.href);
  const code = url.searchParams.get('error');
  if (!code) return null;
  url.searchParams.delete('error');
  url.searchParams.delete('error_description');
  history.replaceState(history.state, '', url.href);
  const known = MESSAGES[code.toUpperCase().replace(/[^A-Z]+/g, '_')];
  return known ?? "Logging in with Google didn't finish. Try again, or log in with your email and password.";
})();

// ---------- forgotten password: a 6-digit code by email ----------

// The SDK loads Better Auth's email-OTP plugin, but its types don't expose it
// on `client.auth` (@neon/neon-js 0.10.2), so these two calls are typed here.
interface ResetApi {
  forgetPassword?: { emailOtp?: (body: { email: string }) => Promise<{ error?: unknown }> };
  emailOtp?: { resetPassword?: (body: { email: string; otp: string; password: string }) => Promise<{ error?: unknown }> };
}
const RESET_UNAVAILABLE = "Resetting a password isn't available right now. Try again later.";

/**
 * Asks for a reset code. The server answers the same whether or not the email
 * has an account (so nobody can probe for accounts); a wrong address shows up
 * later as an invalid code.
 */
export async function sendResetCode(email: string): Promise<string | null> {
  try {
    const auth = (await getClient()).auth as unknown as ResetApi;
    if (!auth.forgetPassword?.emailOtp) return RESET_UNAVAILABLE;
    const { error } = await auth.forgetPassword.emailOtp({ email });
    return error ? explain(error) : null;
  } catch (err) {
    return explain(err);
  }
}

/** Sets the new password with the code, then logs in with it. */
export async function resetPasswordWithCode(email: string, otp: string, password: string): Promise<string | null> {
  try {
    const auth = (await getClient()).auth as unknown as ResetApi;
    if (!auth.emailOtp?.resetPassword) return RESET_UNAVAILABLE;
    const { error } = await auth.emailOtp.resetPassword({ email, otp, password });
    if (error) return explain(error);
  } catch (err) {
    return explain(err);
  }
  const loginError = await logInWithEmail(email, password);
  return loginError ? `Your new password is set, but logging in didn't work. Go back and log in with it. (${loginError})` : null;
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
