import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read env variables from .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase URL or Service Key in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  // Query pg_policies to see all policies
  const { data: policies, error } = await supabase.rpc('inspect_roles_table_or_similar', {}, { head: false });
  
  // Or we can just run a custom SQL query if we can't do RPC, let's select from pg_policies using an ad-hoc query or check if roles has RLS enabled
  const { data: rlsStatus, error: rlsError } = await supabase.from('roles').select('id').limit(1);
  console.log("Service role query to roles:", rlsStatus, rlsError);
  
  // Let's run a direct SQL query by creating a temporary function/rpc or running it via postgres if possible.
  // Wait, we can inspect pg_tables to check if row security is enabled for 'roles'
  // Let's see: we can query the pg_tables and pg_policies view using sql.
}

run();
