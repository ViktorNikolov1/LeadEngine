import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jcufbvayhjlauahxrdon.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY env var with your service_role key.');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function createUser() {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: 'plataformas@cubik.pro',
    password: 'vewmeM-vacgu6-rowqan',
    email_confirm: true
    // optional: user_metadata: { name: 'Platformas' }
  });

  if (error) {
    console.error('Create user error:', error);
    process.exit(1);
  }
  console.log('Created user:', data);
}

createUser();