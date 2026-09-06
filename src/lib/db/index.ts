import type { DataAdapter } from './interface';
import { IndexedDBAdapter } from './indexeddb';

let adapter: DataAdapter | null = null;

export function getAdapter(): DataAdapter {
  if (!adapter) {
    adapter = new IndexedDBAdapter();
  }
  return adapter;
}

export function setAdapter(a: DataAdapter): void {
  adapter = a;
}

export type { DataAdapter };
