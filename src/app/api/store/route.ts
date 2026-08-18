import { NextResponse } from 'next/server';
import { getStore, saveStore } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const store = getStore();
  return NextResponse.json(store, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body;
    const store = getStore();

    if (action === 'SAVE_ALL') {
      if (payload.products !== undefined) store.products = payload.products;
      if (payload.promotions !== undefined) store.promotions = payload.promotions;
      if (payload.sales !== undefined) store.sales = payload.sales;
      if (payload.invoices !== undefined) store.invoices = payload.invoices;
      if (payload.expenses !== undefined) store.expenses = payload.expenses;
      if (payload.whatsappNumber) store.whatsappNumber = payload.whatsappNumber;
      if (payload.bankDetails) store.bankDetails = payload.bankDetails;
      saveStore(store);
      return NextResponse.json({ success: true, store });
    }

    if (action === 'UPDATE_PRODUCTS') {
      store.products = payload;
      saveStore(store);
      return NextResponse.json({ success: true, store });
    }

    if (action === 'UPDATE_PROMOTIONS') {
      store.promotions = payload;
      saveStore(store);
      return NextResponse.json({ success: true, store });
    }

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

    if (action === 'UPDATE_INVOICE') {
      const { invoice, updatedProducts } = payload;
      store.invoices = (store.invoices || []).map((i) => (i.id === invoice.id ? invoice : i));
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

    if (action === 'UPDATE_SETTINGS') {
      if (payload.whatsappNumber) store.whatsappNumber = payload.whatsappNumber;
      if (payload.bankDetails) store.bankDetails = payload.bankDetails;
      saveStore(store);
      return NextResponse.json({ success: true, store });
    }

    if (action === 'RESET_ALL') {
      store.products = [];
      store.promotions = [];
      store.sales = [];
      store.invoices = [];
      store.expenses = [];
      saveStore(store);
      return NextResponse.json({ success: true, store });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
