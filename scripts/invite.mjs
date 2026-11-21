// Creates an account while sign-ups are closed. Local only:
//   node scripts/invite.mjs friend@example.com "Their name"
// Uses your Neon CLI login. The new account has no password yet: the person
// sets one with "Forgot password?" (a 6-digit code by email), which also
// confirms their address. Or they simply log in with Google using that email.
import { neon } from './neon-local.mjs';

const [email, ...nameParts] = process.argv.slice(2);
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: node scripts/invite.mjs <email> [name]');
  process.exit(1);
}
const address = email.trim().toLowerCase();
const name = nameParts.join(' ').trim() || address.split('@')[0];

try {
  const out = neon(['neon-auth', 'user', 'create', '--email', address, '--name', name]);
  console.log(out.trim());
} catch (err) {
  const text = String(err.stderr || err.message);
  console.error(/exist/i.test(text) ? `There is already an account for ${address}.` : `Could not create the account: ${text.trim()}`);
  process.exit(1);
}

const site = 'https://orel009.github.io/daybook/#/settings';
console.log(`
Account created for ${address}. Send them this:

  You're invited to Daybook. Open ${site}
  Under Account, tap "Forgot password?", enter ${address} and send the code.
  Enter the 6-digit code from the email and choose a password; you're logged in.
  (Or tap "Continue with Google" if ${address} is a Google account.)
`);
