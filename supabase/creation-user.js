import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL_USER = process.env.EMAIL_USER;
const PASSWORD_USER = process.env.PASSWORD_USER;

if (!SUPABASE_SERVICE_ROLE_KEY || !EMAIL_USER || !PASSWORD_USER) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY, EMAIL_USER, and PASSWORD_USER env vars.');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function createUser() {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: EMAIL_USER,
    password: PASSWORD_USER,
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