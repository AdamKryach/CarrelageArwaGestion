import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import type { DatabaseSchema } from '../src/server/db';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY must be configured.');
}

const databasePath = path.resolve(process.cwd(), 'data', 'database.json');
const state = JSON.parse(await fs.readFile(databasePath, 'utf8')) as DatabaseSchema;
const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: existingState, error: readError } = await supabase
  .from('app_state')
  .select('id')
  .eq('id', 'main')
  .maybeSingle();

if (readError) {
  throw new Error(`Lecture Supabase impossible: ${readError.message}`);
}

if (existingState) {
  throw new Error('Supabase contient déjà une base applicative. Import annulé pour éviter son écrasement.');
}

const { error } = await supabase
  .from('app_state')
  .upsert({ id: 'main', state, updated_at: new Date().toISOString() });

if (error) {
  throw new Error(`Migration Supabase impossible: ${error.message}`);
}

console.log('database.json imported into Supabase app_state.');
