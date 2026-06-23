import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase URL or Service Key in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function inspect() {
  console.log('Querying DB...');
  
  const { data: companies } = await supabase.from('companies').select('*');
  console.log('\n--- COMPANIES ---');
  console.log(companies);
  
  const { data: areas } = await supabase.from('areas').select('*');
  console.log('\n--- AREAS ---');
  console.log(areas);

  const { data: processes } = await supabase.from('processes').select('*');
  console.log('\n--- PROCESSES ---');
  console.log(processes);

  const { data: positions } = await supabase.from('positions').select('*');
  console.log('\n--- POSITIONS ---');
  console.log(positions);

  const { data: costCenters } = await supabase.from('cost_centers').select('*');
  console.log('\n--- COST CENTERS ---');
  console.log(costCenters);
}

inspect();
