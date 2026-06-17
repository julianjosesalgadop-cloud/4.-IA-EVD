import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wzgagrxvdiffjcyuqiau.supabase.co';
const supabaseServiceKey = 'sb_secret_DP007AREx_zw61liYZlk1g_XTybDhK-';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      roles(id, name, display_name),
      positions(id, name)
    `);

  if (error) {
    console.error('ERROR ON SELECT QUERY:', error);
  } else {
    console.log('SUCCESS:', data);
  }
}

run();
