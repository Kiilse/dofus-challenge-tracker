import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema.ts';
import { config } from '../config.ts';

const sql = postgres(config.databaseUrl);
export const db = drizzle(sql, { schema });
