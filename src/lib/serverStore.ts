import fs from 'fs';
import path from 'path';
import { Product, Promotion, Sale, Invoice, Expense } from '@/types';
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
  whatsappNumber: string;
  bankDetails: {
    banco: string;
    tipoCuenta: string;
    numeroCuenta: string;
    rut: string;
    nombre: string;
    email: string;
  };
}

const STORE_FILE = path.join(process.cwd(), '.next', 'copete_express_store.json');

const defaultStore: AppStoreData = {
  products: INITIAL_PRODUCTS,
  promotions: INITIAL_PROMOTIONS,
  sales: INITIAL_SALES,
  invoices: INITIAL_INVOICES,
  expenses: INITIAL_EXPENSES,
  whatsappNumber: '56912345678',
  bankDetails: {
    banco: 'Banco Estado / Banco de Chile',
    tipoCuenta: 'Cuenta Vista / Rut / Corriente',
    numeroCuenta: '123456789',
    rut: '12.345.678-9',
    nombre: 'Copete Express SpA',
    email: 'pagos@copeteexpress.cl',
  },
};

let memoryStore: AppStoreData | null = null;

export function getStore(): AppStoreData {
  if (memoryStore) return memoryStore;

  try {
    if (fs.existsSync(STORE_FILE)) {
      const data = fs.readFileSync(STORE_FILE, 'utf-8');
      memoryStore = JSON.parse(data);
      // Asegurar compatibilidad si se agregaron nuevos campos
      if (!memoryStore!.invoices) memoryStore!.invoices = INITIAL_INVOICES;
      if (!memoryStore!.expenses) memoryStore!.expenses = INITIAL_EXPENSES;
      return memoryStore!;
    }
  } catch (e) {
    console.error('Error reading server store file:', e);
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
  } catch (e) {
    console.error('Error saving server store file:', e);
  }
}
