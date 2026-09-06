import { openDB as idbOpen, type IDBPDatabase } from 'idb';
import type { DataAdapter } from './interface';
import type { StoreName } from '@/types';

const DB_NAME = 'ahsan-danish-os';
const DB_VERSION = 2;

const STORES: StoreName[] = [
  'meta', 'tasks', 'habits', 'content', 'projects', 'inbox',
  'team', 'money', 'holdings', 'loans', 'notes', 'reminders',
];

let dbInstance: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await idbOpen(DB_NAME, DB_VERSION, {
    upgrade(database) {
      for (const store of STORES) {
        if (!database.objectStoreNames.contains(store)) {
          database.createObjectStore(store, { keyPath: 'id' });
        }
      }
    },
  });
  return dbInstance;
}

export class IndexedDBAdapter implements DataAdapter {
  async getAll(store: StoreName): Promise<any[]> {
    const db = await getDB();
    return db.getAll(store);
  }

  async get(store: StoreName, id: string): Promise<any | undefined> {
    const db = await getDB();
    return db.get(store, id);
  }

  async put(store: StoreName, obj: any): Promise<void> {
    const db = await getDB();
    await db.put(store, obj);
  }

  async del(store: StoreName, id: string): Promise<void> {
    const db = await getDB();
    await db.delete(store, id);
  }

  async clear(store: StoreName): Promise<void> {
    const db = await getDB();
    await db.clear(store);
  }
}
