'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { setAdapter } from '@/lib/db';
import { SupabaseAdapter } from '@/lib/db/supabase';
import { IndexedDBAdapter } from '@/lib/db/indexeddb';
import { useStore } from '@/lib/store';
import type { User } from '@supabase/supabase-js';
import type { Subscription } from '@/lib/gate';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const loadAll = useStore((s) => s.loadAll);
  const setSubscription = useStore((s) => s.setSubscription);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAdapter(new IndexedDBAdapter());
      loadAll();
      setLoading(false);
      return;
    }

    const supabase = createClient();

    async function init() {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);

      if (u) {
        setAdapter(new SupabaseAdapter(supabase));
        await syncProfileName(u, supabase);
        await loadAll();
        // Overwrite name from auth metadata (loadAll may have loaded stale DB value)
        const authName = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0];
        if (authName) {
          useStore.setState((s) => ({ settings: { ...s.settings, name: authName } }));
        }
        await loadSubscription(u.id, supabase, setSubscription);
      }

      setLoading(false);
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user || null;
        setUser(u);

        if (u) {
          setAdapter(new SupabaseAdapter(supabase));
          await syncProfileName(u, supabase);
          await loadAll();
          const authName = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0];
          if (authName) {
            useStore.setState((s) => ({ settings: { ...s.settings, name: authName } }));
          }
          await loadSubscription(u.id, supabase, setSubscription);
        } else {
          setSubscription(null);
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [loadAll, setSubscription]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

async function syncProfileName(
  user: User,
  supabase: ReturnType<typeof createClient>,
) {
  const authName = user.user_metadata?.full_name
    || user.user_metadata?.name
    || user.user_metadata?.preferred_username
    || user.email?.split('@')[0]
    || '';
  if (!authName) return;

  // Always update the profile in Supabase with the auth name
  await supabase
    .from('profiles')
    .update({ name: authName })
    .eq('id', user.id);

  // Update the store directly (don't use saveSettings — it writes with id 'settings')
  useStore.setState((s) => ({
    settings: { ...s.settings, name: authName, id: user.id as any },
  }));
}

async function loadSubscription(
  userId: string,
  supabase: ReturnType<typeof createClient>,
  setSubscription: (s: Subscription | null) => void,
) {
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (data) {
    setSubscription({
      plan: data.plan || 'trial',
      trialEndsAt: data.trial_ends_at || null,
      stripeCustomerId: data.stripe_customer_id || null,
      stripeSubscriptionId: data.stripe_subscription_id || null,
    });
  } else {
    setSubscription({ plan: 'trial', trialEndsAt: new Date(Date.now() + 14 * 86400000).toISOString(), stripeCustomerId: null, stripeSubscriptionId: null });
  }
}
