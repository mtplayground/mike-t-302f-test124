import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export type AppDatabase = Database.Database;

export function openDatabase(sqlitePath: string): AppDatabase {
  mkdirSync(dirname(sqlitePath), { recursive: true });

  const database = new Database(sqlitePath);

  database.pragma('foreign_keys = ON');
  database.pragma('journal_mode = WAL');

  return database;
}
