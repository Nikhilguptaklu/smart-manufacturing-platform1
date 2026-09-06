import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || 'https://srtvbbgezsprtpwtshbv.supabase.co';
const key = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_WUbPbhEv4xbXRDsWyjyNaQ_d9MK6ssq';

const supabase = createClient(url, key);

async function trySignIn(email, password) {
  const res = await supabase.auth.signInWithPassword({ email, password });
  console.log('Full response:', JSON.stringify(res, null, 2));
}

(async () => {
  await trySignIn('nonexistent@example.com', 'bad-password');
})();
