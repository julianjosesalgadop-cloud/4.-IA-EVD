import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

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

async function run() {
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);
  
  // Try to run ALTER TABLE via inspect_db RPC
  const { data, error } = await adminClient.rpc('inspect_db', { 
    query_text: "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES areas(id) ON DELETE SET NULL" 
  });
  
  if (error) {
    console.error('Error executing alter table:', error);
  } else {
    console.log('Success execution result:', data);
  }
}

run();
