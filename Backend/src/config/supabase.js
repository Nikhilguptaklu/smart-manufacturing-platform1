const { createClient } = require("@supabase/supabase-js");

const createSupabaseClient = () => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const supabase = createSupabaseClient();

module.exports = supabase;
module.exports.createSupabaseClient = createSupabaseClient;