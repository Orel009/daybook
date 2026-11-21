import { describe, expect, it } from 'vitest';
import { explain } from './cloud';

// Codes and texts as Better Auth 1.7 (inside @neon/auth) sends them. The SDK
// doesn't always pass `code` through, so the text alone must also work.
describe('auth error messages', () => {
  const closed = 'New accounts are closed. Log in with an existing account.';

  it('sign-ups turned off, by code or by text', () => {
    expect(explain({ code: 'EMAIL_PASSWORD_SIGN_UP_DISABLED' })).toBe(closed);
    expect(explain({ message: 'Email and password sign up is not enabled' })).toBe(closed);
    expect(explain({ code: 'signup_disabled' })).not.toBe(closed); // lower-case codes come only from the Google redirect
  });

  it('Google removed as a provider', () => {
    expect(explain({ message: 'Provider not found' })).toMatch(/Google is turned off/);
    expect(explain({ code: 'PROVIDER_NOT_FOUND' })).toMatch(/Google is turned off/);
  });

  it('wrong password', () => {
    expect(explain({ message: 'Invalid email or password' })).toBe("That email and password don't match an account.");
  });

  it('reset codes: wrong, expired, too many tries, unknown account', () => {
    expect(explain({ message: 'Invalid OTP' })).toMatch(/code is wrong or no longer valid/);
    expect(explain({ message: 'OTP expired' })).toBe('That code has expired. Send a new code.');
    expect(explain({ message: 'Too many attempts' })).toMatch(/Too many wrong tries/);
    expect(explain({ message: 'Too many attempts. Please request a new code.' })).toMatch(/Too many wrong tries/);
    expect(explain({ code: 'USER_NOT_FOUND' })).toBe("There's no account with that email address.");
  });

  it('rate limit', () => {
    expect(explain({ status: 429, message: 'Too Many Requests' })).toMatch(/Wait a minute/);
  });

  it('falls back to the server text', () => {
    expect(explain({ message: 'Something new' })).toBe("That didn't work: Something new");
  });
});
