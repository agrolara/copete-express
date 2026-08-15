import { NextResponse } from 'next/server';
import { getStore, saveStore } from '@/lib/serverStore';
import {
  INITIAL_PRODUCTS,
  INITIAL_PROMOTIONS,
  INITIAL_SALES,
  INITIAL_INVOICES,
  INITIAL_EXPENSES,
} from '@/lib/supabase';

export async function GET() {
  const store = getStore();
  return NextResponse.json(store, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body;
    const store = getStore();

    if (action === 'ADD_SALE') {
      const { sale, updatedProducts } = payload;
      store.sales = [sale, ...store.sales];
      if (updatedProducts) {
        store.products = updatedProducts;
      }
      saveStore(store);
      return NextResponse.json({ success: true, store });
    }

    if (action === 'DELETE_SALE') {
      const { saleId, updatedProducts } = payload;
      store.sales = store.sales.filter((s) => s.id !== saleId);
      if (updatedProducts) {
        store.products = updatedProducts;
      }
      saveStore(store);
      return NextResponse.json({ success: true, store });
    }

    if (action === 'ADD_INVOICE') {
      const { invoice, updatedProducts } = payload;
      store.invoices = [invoice, ...(store.invoices || [])];
      if (updatedProducts) {
        store.products = updatedProducts;
      }
      saveStore(store);
      return NextResponse.json({ success: true, store });
    }

    if (action === 'DELETE_INVOICE') {
      const { invoiceId, updatedProducts } = payload;
      store.invoices = (store.invoices || []).filter((i) => i.id !== invoiceId);
      if (updatedProducts) {
        store.products = updatedProducts;
      }
      saveStore(store);
      return NextResponse.json({ success: true, store });
    }

    if (action === 'ADD_EXPENSE') {
      const { expense } = payload;
      store.expenses = [expense, ...(store.expenses || [])];
      saveStore(store);
      return NextResponse.json({ success: true, store });
    }

    if (action === 'DELETE_EXPENSE') {
      const { expenseId } = payload;
      store.expenses = (store.expenses || []).filter((e) => e.id !== expenseId);
      saveStore(store);
      return NextResponse.json({ success: true, store });
    }

    if (action === 'UPDATE_PRODUCTS') {
      store.products = payload;
      saveStore(store);
      return NextResponse.json({ success: true, store });
    }

    if (action === 'UPDATE_SETTINGS') {
      if (payload.whatsappNumber) store.whatsappNumber = payload.whatsappNumber;
      if (payload.bankDetails) store.bankDetails = payload.bankDetails;
      saveStore(store);
      return NextResponse.json({ success: true, store });
    }

    if (action === 'RESET_ALL') {
      store.products = INITIAL_PRODUCTS;
      store.promotions = INITIAL_PROMOTIONS;
      store.sales = INITIAL_SALES;
      store.invoices = INITIAL_INVOICES;
      store.expenses = INITIAL_EXPENSES;
      saveStore(store);
      return NextResponse.json({ success: true, store });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
