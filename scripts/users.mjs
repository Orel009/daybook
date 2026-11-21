// Lists every account on the linked Neon branch, so strangers stand out.
// Local only:  node scripts/users.mjs
// Read-only. Uses your Neon CLI login; prints emails, never secrets.
import { query } from './neon-local.mjs';

const rows = await query(`
  select u.email,
         u."createdAt"     as created,
         u."emailVerified" as verified,
         coalesce((select string_agg(a."providerId", ', ' order by a."providerId") from neon_auth.account a where a."userId" = u.id), '') as sign_in
  from neon_auth."user" u
  order by u."createdAt"`);

console.log(`${rows.length} account${rows.length === 1 ? '' : 's'}:`);
for (const r of rows) {
  const method = r.sign_in.replace('credential', 'password') || 'none yet';
  console.log(`  ${r.email.padEnd(36)} created ${String(r.created).slice(0, 16).replace('T', ' ')}  sign-in: ${method}${r.verified === 'true' || r.verified === 't' ? '' : '  (email not verified)'}`);
}
