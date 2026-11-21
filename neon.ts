// Neon services for Daybook's cloud sync (`neon config plan`, `neon deploy`).
// Postgres is always on. The app reaches it only through Neon Auth and the
// Data API (with Row-Level Security, see db/schema.sql); there is no server.
import { defineConfig } from '@neon/config/v1';

export default defineConfig({
  auth: true, // Managed Better Auth: accounts and sessions
  dataApi: true, // PostgREST-style HTTP API, verified by Neon Auth JWTs
});
