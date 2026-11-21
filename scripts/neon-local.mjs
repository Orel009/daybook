// Shared helpers for the local admin scripts in this folder. They run only on
// the developer's machine, through the Neon CLI's own login (`neon login`).
// Nothing here is part of the app, the build or the deploy. The connection
// string is fetched at run time, kept in memory and never printed or saved.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

/** Project and branch from the `.neon` link file (made by `neon link`). */
export function linkedProject() {
  try {
    const ctx = JSON.parse(readFileSync(`${root}.neon`, 'utf8'));
    if (!ctx.projectId) throw new Error();
    return { projectId: ctx.projectId, branch: ctx.branch || 'production' };
  } catch {
    throw new Error('This folder is not linked to a Neon project. Run `neon link` first.');
  }
}

/**
 * The globally installed Neon CLI's script, run with this Node directly: no
 * shell is involved, so arguments (like an email address) can't be read as
 * shell commands.
 */
let cliPath;
function cli() {
  if (cliPath) return cliPath;
  const npmCli = join(dirname(process.execPath), process.platform === 'win32' ? '' : '../lib', 'node_modules', 'npm', 'bin', 'npm-cli.js');
  const globalRoot = execFileSync(process.execPath, [npmCli, 'root', '-g'], { encoding: 'utf8' }).trim();
  cliPath = join(globalRoot, 'neon', 'dist', 'cli.js');
  if (!existsSync(cliPath)) throw new Error('The Neon CLI is not installed. Run: npm i -g neon');
  return cliPath;
}

const run = (args) => execFileSync(process.execPath, [cli(), ...args, '--no-analytics'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

/** Runs a Neon CLI command against the linked project and branch. */
export function neon(args) {
  const { projectId, branch } = linkedProject();
  return run([...args, '--project-id', projectId, '--branch', branch]);
}

/**
 * One read-only SQL query over Neon's HTTPS SQL endpoint (what the serverless
 * driver uses), so no Postgres driver is needed. Returns rows as objects.
 */
export async function query(sql, params = []) {
  const { projectId, branch } = linkedProject();
  const cs = run(['connection-string', branch, '--project-id', projectId, '--pooled']).trim();
  const host = new URL(cs).hostname;
  const res = await fetch(`https://${host}/sql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Neon-Connection-String': cs, 'Neon-Raw-Text-Output': 'true' },
    body: JSON.stringify({ query: sql, params }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Query failed (${res.status}): ${String(body.message ?? '').split(cs).join('<connection string>')}`);
  return body.rows ?? [];
}
