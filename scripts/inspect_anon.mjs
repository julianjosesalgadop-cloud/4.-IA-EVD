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
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Querying roles table with anon key...');
  const { data: roles, error: rolesError } = await supabase.from('roles').select('*');
  if (rolesError) {
    console.error('Roles error:', rolesError.message);
  } else {
    console.log('Roles data:', roles);
  }

  console.log('\nQuerying profiles table with anon key (no authentication)...');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, first_name, roles(name, display_name)')
    .limit(3);
  if (profilesError) {
    console.error('Profiles error:', profilesError.message);
  } else {
    console.log('Profiles data:', JSON.stringify(profiles, null, 2));
  }
}

run();
