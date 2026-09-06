import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || 'https://srtvbbgezsprtpwtshbv.supabase.co';
const key = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_WUbPbhEv4xbXRDsWyjyNaQ_d9MK6ssq';

const supabase = createClient(url, key);

(async () => {
  try {
    // Try a lightweight head query on a common table
    const { data, error, status } = await supabase.from('profiles').select('id', { head: true });
    if (error) {
      console.error('Supabase query error:', error.message || error);
      process.exit(2);
    }
    console.log('Supabase reachable (status):', status);
    process.exit(0);
  } catch (err) {
    console.error('Connection failed:', err);
    process.exit(3);
  }
})();
