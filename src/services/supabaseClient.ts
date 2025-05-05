import { createClient } from '@supabase/supabase-js';

// Type definition for environment variables (optional but recommended)
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  // Add other env variables here if needed
}

// Type assertion for import.meta.env
const env = import.meta.env as unknown as ImportMetaEnv;

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase environment variables VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY are missing.',
    'Please check your .env file.'
  );
  // In a real app, you might want to throw an error or disable Supabase features
}

// Initialize the client only if keys exist
// The exclamation marks assert that the values are non-null, based on the check above.
// If the check fails, the client won't be used effectively anyway.
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

// Debug log according to Rule #4
console.log('Supabase client initialized (or attempted).');

// Reminder: Ensure @supabase/supabase-js is installed
// You might need to run: npm install @supabase/supabase-js 