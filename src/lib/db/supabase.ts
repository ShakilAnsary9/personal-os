import type { DataAdapter } from './interface';
import type { StoreName } from '@/types';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

const STORE_TO_TABLE: Record<StoreName, string> = {
  meta: 'profiles',
  tasks: 'tasks',
  habits: 'habits',
  content: 'content',
  projects: 'projects',
  inbox: 'inbox',
  team: 'team',
  money: 'money',
  holdings: 'holdings',
  loans: 'loans',
  notes: 'notes',
  reminders: 'reminders',
};

// Map the JS Settings shape (camelCase) to the profiles table columns (snake_case).
const PROFILE_DB_TO_JS: Record<string, string> = {
  name: 'name',
  pfp: 'pfp',
  platforms: 'platforms',
  stages: 'stages',
  markets: 'markets',
  templates: 'templates',
  usd_rate: 'usdRate',
  base_currency: 'baseCurrency',
  last_backup: 'lastBackup',
};

function profileRowToSettings(row: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = { id: row.id };
  for (const [dbKey, jsKey] of Object.entries(PROFILE_DB_TO_JS)) {
    if (row[dbKey] !== undefined) out[jsKey] = row[dbKey];
  }
  return out;
}

function settingsToProfileRow(settings: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [dbKey, jsKey] of Object.entries(PROFILE_DB_TO_JS)) {
    if (settings[jsKey] !== undefined) out[dbKey] = settings[jsKey];
  }
  return out;
}

export class SupabaseAdapter implements DataAdapter {
  private client: SupabaseClient;
  private userIdPromise: Promise<string | null> | null = null;

  constructor(client?: SupabaseClient) {
    this.client = client || createClient();
  }

  private table(store: StoreName): string {
    return STORE_TO_TABLE[store] || store;
  }

  private getUserId(): Promise<string | null> {
    if (!this.userIdPromise) {
      this.userIdPromise = this.client.auth
        .getUser()
        .then(({ data }) => data.user?.id ?? null)
        .catch(() => null);
    }
    return this.userIdPromise;
  }

  async getAll(store: StoreName): Promise<any[]> {
    const uid = await this.getUserId();
    if (!uid) return [];

    if (store === 'meta') {
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();
      if (error) throw error;
      return data ? [profileRowToSettings(data)] : [];
    }

    const { data, error } = await this.client
      .from(this.table(store))
      .select('*')
      .eq('user_id', uid);
    if (error) throw error;
    return data || [];
  }

  async get(store: StoreName, id: string): Promise<any | undefined> {
    const uid = await this.getUserId();
    if (!uid) return undefined;

    if (store === 'meta') {
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();
      if (error) return undefined;
      return profileRowToSettings(data);
    }

    const { data, error } = await this.client
      .from(this.table(store))
      .select('*')
      .eq('id', id)
      .eq('user_id', uid)
      .single();
    if (error) return undefined;
    return data;
  }

  async put(store: StoreName, obj: any): Promise<void> {
    const uid = await this.getUserId();
    if (!uid) throw new Error('Not authenticated');

    if (store === 'meta') {
      const { error } = await this.client.from('profiles').upsert(
        { ...settingsToProfileRow(obj), id: uid },
        { onConflict: 'id' },
      );
      if (error) throw error;
      return;
    }

    const { error } = await this.client
      .from(this.table(store))
      .upsert({ ...obj, user_id: uid }, { onConflict: 'id' });
    if (error) throw error;
  }

  async del(store: StoreName, id: string): Promise<void> {
    const uid = await this.getUserId();
    if (!uid) throw new Error('Not authenticated');

    const query = this.client
      .from(this.table(store))
      .delete()
      .eq('user_id', uid);
    if (store !== 'meta') {
      query.eq('id', id);
    }
    const { error } = await query;
    if (error) throw error;
  }

  async clear(store: StoreName): Promise<void> {
    const uid = await this.getUserId();
    if (!uid) throw new Error('Not authenticated');

    const { error } = await this.client
      .from(this.table(store))
      .delete()
      .eq('user_id', uid)
      .neq('id', '_______none_______');
    if (error) throw error;
  }
}
