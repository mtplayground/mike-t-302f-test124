import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { AppDatabase } from './database.js';

type MigrationRow = {
  name: string;
};

function findMigrationsDirectory(): string {
  const moduleDirectory = dirname(fileURLToPath(import.meta.url));
  const backendRoot = resolve(moduleDirectory, '..', '..');
  const candidates = [
    resolve(moduleDirectory, 'migrations'),
    resolve(backendRoot, 'src', 'db', 'migrations'),
  ];

  const migrationsDirectory = candidates.find((candidate) => existsSync(candidate));

  if (!migrationsDirectory) {
    throw new Error(`Migration directory not found. Checked: ${candidates.join(', ')}`);
  }

  return migrationsDirectory;
}

function listMigrationFiles(migrationsDirectory: string): string[] {
  return readdirSync(migrationsDirectory)
    .filter((name) => name.endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right));
}

export function runMigrations(
  database: AppDatabase,
  migrationsDirectory = findMigrationsDirectory(),
): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `);

  const migrationFiles = listMigrationFiles(migrationsDirectory);
  const appliedRows = database
    .prepare('SELECT name FROM schema_migrations ORDER BY name')
    .all() as MigrationRow[];
  const appliedMigrations = new Set(appliedRows.map((row) => row.name));

  const applyPendingMigrations = database.transaction((pendingMigrationFiles: string[]) => {
    const insertMigration = database.prepare('INSERT INTO schema_migrations (name) VALUES (?)');

    for (const migrationFile of pendingMigrationFiles) {
      if (appliedMigrations.has(migrationFile)) {
        continue;
      }

      const migrationPath = resolve(migrationsDirectory, migrationFile);
      const migrationSql = readFileSync(migrationPath, 'utf8');

      database.exec(migrationSql);
      insertMigration.run(migrationFile);
    }
  });

  applyPendingMigrations(migrationFiles);
}
