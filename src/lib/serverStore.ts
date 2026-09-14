import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { Product, Promotion, Sale, Invoice, Expense, InventoryMovement } from '@/types';
import {
  INITIAL_PRODUCTS,
  INITIAL_PROMOTIONS,
  INITIAL_SALES,
  INITIAL_INVOICES,
  INITIAL_EXPENSES,
} from './supabase';

export interface AppStoreData {
  products: Product[];
  promotions: Promotion[];
  sales: Sale[];
  invoices: Invoice[];
  expenses: Expense[];
  inventoryMovements?: InventoryMovement[];
  globalLowStockThreshold?: number;
  whatsappNumber: string;
  bankDetails: {
    banco: string;
    tipoCuenta: string;
    numeroCuenta: string;
    rut: string;
    nombre: string;
    email: string;
  };
  updated_at?: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://supabase.agrolara.dedyn.io';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4MDk4MDE4MCwiZXhwIjo0OTM2NjUzNzgwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.jU61l2XNxwvk_955XHpXC5YV7nWHxcODH-c-AzPYN5w';

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// Almacén persistente en carpeta data/ fuera de .next para preservar datos entre compilaciones y reinicios
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'copete_express_store.json');

const defaultStore: AppStoreData = {
  products: INITIAL_PRODUCTS,
  promotions: INITIAL_PROMOTIONS,
  sales: INITIAL_SALES,
  invoices: INITIAL_INVOICES,
  expenses: INITIAL_EXPENSES,
  inventoryMovements: [],
  globalLowStockThreshold: 6,
  whatsappNumber: '56912345678',
  bankDetails: {
    banco: 'Banco Estado / Banco de Chile',
    tipoCuenta: 'Cuenta Vista / Rut / Corriente',
    numeroCuenta: '123456789',
    rut: '12.345.678-9',
    nombre: 'Copete Express SpA',
    email: 'pagos@copeteexpress.cl',
  },
  updated_at: new Date().toISOString(),
};

let memoryStore: AppStoreData | null = null;

export function getStore(): AppStoreData {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const data = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed: AppStoreData = JSON.parse(data);
      if (!parsed.products) parsed.products = [];
      if (!parsed.promotions) parsed.promotions = [];
      if (!parsed.sales) parsed.sales = [];
      if (!parsed.invoices) parsed.invoices = [];
      if (!parsed.expenses) parsed.expenses = [];
      if (!parsed.inventoryMovements) parsed.inventoryMovements = [];
      if (!parsed.globalLowStockThreshold) parsed.globalLowStockThreshold = 6;
      memoryStore = parsed;
      return parsed;
    }
  } catch (e) {
    console.error('Error reading server store file:', e);
  }

  // Si STORE_FILE no existe aún en el volumen persistente montado, inicializarlo con el catálogo base
  try {
    const fallbackFile = path.join(process.cwd(), 'data', 'copete_express_store.json');
    if (fs.existsSync(fallbackFile) && fallbackFile !== STORE_FILE) {
      const initData = fs.readFileSync(fallbackFile, 'utf-8');
      const parsed: AppStoreData = JSON.parse(initData);
      saveStore(parsed);
      return parsed;
    }
  } catch (e) {
    console.error('Error seeding store into persistent volume:', e);
  }

  memoryStore = { ...defaultStore };
  saveStore(memoryStore);
  return memoryStore;
}

export function saveStore(store: AppStoreData) {
  memoryStore = store;
  try {
    const dir = path.dirname(STORE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');

    // Respaldo de seguridad rotativo en subcarpeta backups
    const backupDir = path.join(dir, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    fs.writeFileSync(path.join(backupDir, 'copete_express_store.backup.json'), JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving server store file:', e);
  }
}

export async function getStoreAsync(): Promise<AppStoreData> {
  const localStore = getStore();
  try {
    const { data, error } = await supabaseAdmin
      .from('copete_store')
      .select('data, updated_at')
      .eq('id', 'main')
      .single();

    if (!error && data?.data) {
      const supaStore = data.data as AppStoreData;
      const supaUpdatedAt = data.updated_at ? new Date(data.updated_at).getTime() : 0;
      const localUpdatedAt = localStore.updated_at ? new Date(localStore.updated_at).getTime() : 0;

      // Si el archivo local es más reciente o tiene mayor volumen de datos (ej. nuevas ventas/productos)
      const localHasMore =
        (localStore.products?.length || 0) > (supaStore.products?.length || 0) ||
        (localStore.sales?.length || 0) > (supaStore.sales?.length || 0);

      if (localUpdatedAt > supaUpdatedAt || (localUpdatedAt === 0 && localHasMore)) {
        console.log('[ServerStore] Local store is newer or has more items. Syncing local to Supabase...');
        localStore.updated_at = new Date().toISOString();
        saveStore(localStore);
        await supabaseAdmin.from('copete_store').upsert({
          id: 'main',
          data: localStore,
          updated_at: localStore.updated_at,
        });
        return localStore;
      }

      // Si Supabase es más reciente o igual, adoptamos Supabase y mantenemos respaldo local
      supaStore.updated_at = data.updated_at || new Date().toISOString();
      saveStore(supaStore);
      return supaStore;
    }
  } catch (e) {
    console.error('Error fetching store from Supabase:', e);
  }
  return localStore;
}

export async function saveStoreAsync(store: AppStoreData): Promise<void> {
  const now = new Date().toISOString();
  store.updated_at = now;
  saveStore(store);

  try {
    const { error } = await supabaseAdmin.from('copete_store').upsert({
      id: 'main',
      data: store,
      updated_at: now,
    });
    if (error) {
      console.error('[ServerStore] Error upserting store to Supabase:', error);
    } else {
      console.log('[ServerStore] Synchronized store to Supabase successfully at:', now);
    }
  } catch (e) {
    console.error('[ServerStore] Exception saving store to Supabase:', e);
  }
}
