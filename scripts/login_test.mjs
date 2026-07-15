import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read env variables from .env.local
const envContent = fs.readFileSync('c:/Users/AUX SISTEMAS/Desktop/1. Antigravity PR/4. IA EVD/evd-sugamuxi/.env.local', 'utf-8');
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
  const { data: profile, error } = await adminClient
    .from('profiles')
    .select('*')
    .eq('email', 'salomejuanjo2018@gmail.com')
    .single();

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Profile:', JSON.stringify(profile, null, 2));
  }
}

run();
