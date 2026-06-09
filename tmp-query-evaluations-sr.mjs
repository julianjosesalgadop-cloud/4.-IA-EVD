import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envFile = path.resolve(process.cwd(), '.env.local');
const env = fs.readFileSync(envFile, 'utf8');
const vars = Object.fromEntries(env.split(/\r?\n/).filter(Boolean).map(line => line.split('=', 2)));

const supabase = createClient(vars.NEXT_PUBLIC_SUPABASE_URL, vars.SUPABASE_SERVICE_ROLE_KEY);

const query = async () => {
  const { data, error } = await supabase
    .from('evaluations')
    .select('id, evaluatee_id, evaluator_id, status, evaluation_year, created_at, version_id')
    .order('created_at', { ascending: false })
    .limit(10);
  console.log('error', error);
  console.log('count', data?.length);
  console.log(JSON.stringify(data, null, 2));
};

query().catch((err) => {
  console.error(err);
  process.exit(1);
});
