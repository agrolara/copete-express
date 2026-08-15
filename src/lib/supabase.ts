import { createClient } from '@supabase/supabase-js';
import { Product, Promotion, Sale, Invoice, Expense } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const STORAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'copete-express-media';

// Datos iniciales en blanco (Todo dato ingresado por el usuario es persistente y real)
export const INITIAL_PRODUCTS: Product[] = [];
export const INITIAL_PROMOTIONS: Promotion[] = [];
export const INITIAL_SALES: Sale[] = [];
export const INITIAL_INVOICES: Invoice[] = [];
export const INITIAL_EXPENSES: Expense[] = [];
