import type { StoreName } from '@/types';

export interface DataAdapter {
  getAll(store: StoreName): Promise<any[]>;
  get(store: StoreName, id: string): Promise<any | undefined>;
  put(store: StoreName, obj: any): Promise<void>;
  del(store: StoreName, id: string): Promise<void>;
  clear(store: StoreName): Promise<void>;
}
