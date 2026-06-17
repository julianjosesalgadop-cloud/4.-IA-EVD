import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wzgagrxvdiffjcyuqiau.supabase.co';
const supabaseServiceKey = 'sb_secret_DP007AREx_zw61liYZlk1g_XTybDhK-';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error listing auth users:', error);
  } else {
    console.log('AUTH USERS:', data.users.map(u => ({ id: u.id, email: u.email })));
  }
}

run();
