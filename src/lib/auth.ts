import { createClient as createBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export type { User };

const NOT_CONFIGURED = { message: 'Cloud sync is not configured. Add your Supabase keys to .env.local to enable sign in.' };

export async function getUser(): Promise<User | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signInWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured) return { data: null, error: NOT_CONFIGURED };
  const supabase = createBrowserClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured) return { data: null, error: NOT_CONFIGURED };
  const supabase = createBrowserClient();
  return supabase.auth.signUp({ email, password });
}

export async function signInWithGoogle() {
  if (!isSupabaseConfigured) return { data: null, error: NOT_CONFIGURED };
  const supabase = createBrowserClient();
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

export async function signOut() {
  window.location.href = '/login';
}
