// The deployed application uses Supabase PostgreSQL through the shared pooler.
export { postgresDatabase as db } from '@/lib/database';
import { postgresDatabase } from '@/lib/database';
export function getDb(){return postgresDatabase;}
