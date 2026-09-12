import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { PGlite } from '@electric-sql/pglite';
import postgres from 'postgres';
import ws from 'ws';
import * as schema from './schema';
import fs from 'fs';
import path from 'path';

// Configure Neon WebSocket constructor for serverless and Node.js environments
if (typeof window === 'undefined' && !globalThis.WebSocket) {
  neonConfig.webSocketConstructor = ws;
}

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';

let pgliteInstance: PGlite | null = null;

// Singleton database instance
function createDbInstance() {
  // If a Neon connection string is provided, use Neon Serverless
  if (connectionString.includes('neon.tech')) {
    const pool = new Pool({ connectionString });
    return drizzleNeon(pool, { schema });
  }

  // If standard PostgreSQL connection string is provided
  if (connectionString && connectionString.startsWith('postgres')) {
    const client = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    return drizzlePg(client, { schema });
  }

  // Otherwise, use local PGlite (embedded WASM Postgres) for local development/testing
  // Persist to .local-db directory if available
  const dataDir = path.join(process.cwd(), '.local-db');
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  } catch {}

  pgliteInstance = new PGlite(dataDir);
  return drizzlePglite(pgliteInstance, { schema });
}

export const db = (globalThis as any).__cinebook_db || createDbInstance();
if (process.env.NODE_ENV !== 'production') {
  (globalThis as any).__cinebook_db = db;
}

export { schema, pgliteInstance };
export type Database = typeof db;
