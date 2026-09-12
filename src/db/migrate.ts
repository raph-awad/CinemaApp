import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import { migrate as migratePg } from 'drizzle-orm/postgres-js/migrator';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { PGlite } from '@electric-sql/pglite';
import postgres from 'postgres';
import path from 'path';
import fs from 'fs';

async function runMigrations() {
  const connectionString =
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL;

  const migrationsFolder = path.join(process.cwd(), 'drizzle');

  if (connectionString && (connectionString.startsWith('postgres') || connectionString.includes('neon.tech'))) {
    console.log('🔄 Running migrations on target PostgreSQL / Neon database...');
    const migrationClient = postgres(connectionString, { max: 1 });
    const db = drizzlePg(migrationClient);

    try {
      await migratePg(db, { migrationsFolder });
      console.log('✅ Remote migrations applied successfully!');
    } catch (err) {
      console.error('❌ Remote migration failed:', err);
      process.exit(1);
    } finally {
      await migrationClient.end();
    }
  } else {
    console.log('🔄 Running migrations on local embedded PostgreSQL (PGlite)...');
    const dataDir = path.join(process.cwd(), '.local-db');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const pglite = new PGlite(dataDir);
    const db = drizzlePglite(pglite);

    try {
      await migratePglite(db, { migrationsFolder });
      console.log('✅ Local PostgreSQL migrations applied successfully!');
    } catch (err) {
      console.error('❌ Local migration failed:', err);
      process.exit(1);
    } finally {
      await pglite.close();
    }
  }
}

runMigrations();
