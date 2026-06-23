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
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { count, error } = await supabase
    .from('evaluations')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error fetching evaluations:', error);
  } else {
    console.log('Total evaluations in database:', count);
  }
}

run();
