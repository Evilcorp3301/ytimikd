import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Используем DATABASE_URL или путь по умолчанию
const dbPath = process.env.DATABASE_URL || path.join(__dirname, "../database.sqlite");

export const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
