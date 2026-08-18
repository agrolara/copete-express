import { createClient } from '@supabase/supabase-js';
import { Product, Promotion, Sale, Invoice, Expense } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://supabase.agrolara.dedyn.io';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4MDk4MDE4MCwiZXhwIjo0OTM2NjUzNzgwLCJyb2xlIjoiYW5vbiJ9.iejQ436gpvOWQq5clGjhq-lZdkXN593b9pSNEh70Jq8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const STORAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'copete-express-media';

// Datos iniciales en blanco (Todo dato ingresado por el usuario es persistente y real)
export const INITIAL_PRODUCTS: Product[] = [];
export const INITIAL_PROMOTIONS: Promotion[] = [];
export const INITIAL_SALES: Sale[] = [];
export const INITIAL_INVOICES: Invoice[] = [];
export const INITIAL_EXPENSES: Expense[] = [];
