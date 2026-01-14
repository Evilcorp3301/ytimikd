import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";
import path from "path";

// База данных всегда находится в корне проекта
const dbPath = path.join(process.cwd(), "database.sqlite");

export const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
