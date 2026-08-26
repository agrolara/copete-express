'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, Promotion, Sale, SaleItem, Invoice, Expense, InvoiceItem } from '@/types';
import {
  INITIAL_PRODUCTS,
  INITIAL_PROMOTIONS,
  INITIAL_SALES,
  INITIAL_INVOICES,
  INITIAL_EXPENSES,
  supabase,
} from '@/lib/supabase';

export interface BankDetails {
  banco: string;
  tipoCuenta: string;
  numeroCuenta: string;
  rut: string;
  nombre: string;
  email: string;
}

export type PaymentMethod = 'transferencia' | 'efectivo';

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Product | Promotion, type: 'product' | 'promotion') => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalAmount: number;
  totalItems: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  products: Product[];
  promotions: Promotion[];
  sales: Sale[];
  invoices: Invoice[];
  expenses: Expense[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setPromotions: React.Dispatch<React.SetStateAction<Promotion[]>>;
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  deleteSale: (saleId: string, restoreStock?: boolean) => void;
  confirmPendingOrder: (saleId: string) => Promise<{ success: boolean; message: string }>;
  cancelPendingOrder: (saleId: string) => Promise<{ success: boolean; message: string }>;
  updateSale: (updatedSale: Sale) => Promise<{ success: boolean; message: string }>;
  addInvoice: (
    invoiceData: Omit<Invoice, 'id' | 'created_at'>,
    newProducts?: Product[]
  ) => Promise<{ success: boolean; message: string }>;
  updateInvoice: (
    invoiceData: Invoice,
    newProducts?: Product[]
  ) => Promise<{ success: boolean; message: string }>;
  deleteInvoice: (invoiceId: string, revertStock?: boolean) => void;
  addExpense: (expenseData: Omit<Expense, 'id' | 'created_at'>) => Promise<{ success: boolean; message: string }>;
  deleteExpense: (expenseId: string) => void;
  resetAllData: () => void;
  whatsappNumber: string;
  setWhatsappNumber: (num: string) => void;
  bankDetails: BankDetails;
  setBankDetails: (details: BankDetails) => void;
  processCheckout: (
    customerName: string,
    customerPhone: string,
    deliveryAddress: string,
    paymentMethod?: PaymentMethod
  ) => Promise<{ success: boolean; message: string }>;
  createAdminOrder: (
    customerName: string,
    customerPhone: string,
    deliveryAddress: string,
    paymentMethod: PaymentMethod,
    orderItems: { id: string; type: 'product' | 'promotion'; quantity: number }[],
    discount?: { type: 'none' | 'percentage' | 'fixed'; value: number }
  ) => Promise<{ success: boolean; message: string; summaryText: string }>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [products, setProductsState] = useState<Product[]>(INITIAL_PRODUCTS);
  const [promotions, setPromotionsState] = useState<Promotion[]>(INITIAL_PROMOTIONS);
  const [sales, setSalesState] = useState<Sale[]>(INITIAL_SALES);
  const [invoices, setInvoicesState] = useState<Invoice[]>(INITIAL_INVOICES);
  const [expenses, setExpensesState] = useState<Expense[]>(INITIAL_EXPENSES);

  // Configuración de WhatsApp y Datos Bancarios editables por el Super Admin
  const [whatsappNumber, setWhatsappNumberState] = useState<string>('56912345678');
  const [bankDetails, setBankDetailsState] = useState<BankDetails>({
    banco: 'Banco Estado / Banco de Chile',
    tipoCuenta: 'Cuenta Vista / Rut / Corriente',
    numeroCuenta: '123456789',
    rut: '12.345.678-9',
    nombre: 'Copete Express SpA',
    email: 'pagos@copeteexpress.cl',
  });

  const LOCAL_CACHE_KEY = 'copete_express_backup_v3';

  // Guardar en localStorage de forma segura
  const saveLocalBackup = (patch: Partial<{
    products: Product[];
    promotions: Promotion[];
    sales: Sale[];
    invoices: Invoice[];
    expenses: Expense[];
    whatsappNumber: string;
    bankDetails: BankDetails;
  }>) => {
    if (typeof window === 'undefined') return;
    try {
      const existing = localStorage.getItem(LOCAL_CACHE_KEY);
      const parsed = existing ? JSON.parse(existing) : {};
      const updated = { ...parsed, ...patch };
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving local backup:', e);
    }
  };

  // Cargar respaldo local
  const getLocalBackup = () => {
    if (typeof window === 'undefined') return null;
    try {
      const existing = localStorage.getItem(LOCAL_CACHE_KEY);
      return existing ? JSON.parse(existing) : null;
    } catch {
      return null;
    }
  };

  // Guardado persistente automático de Productos
  const setProducts: React.Dispatch<React.SetStateAction<Product[]>> = (value) => {
    setProductsState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      saveLocalBackup({ products: next });
      fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_PRODUCTS', payload: next }),
      }).catch((e) => console.error('Error persisting products:', e));
      return next;
    });
  };

  // Guardado persistente automático de Promociones
  const setPromotions: React.Dispatch<React.SetStateAction<Promotion[]>> = (value) => {
    setPromotionsState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      saveLocalBackup({ promotions: next });
      fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_PROMOTIONS', payload: next }),
      }).catch((e) => console.error('Error persisting promotions:', e));
      return next;
    });
  };

  const setSales: React.Dispatch<React.SetStateAction<Sale[]>> = (value) => {
    setSalesState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      saveLocalBackup({ sales: next });
      fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SAVE_ALL', payload: { sales: next } }),
      }).catch(console.error);
      return next;
    });
  };

  const setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>> = (value) => {
    setInvoicesState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      saveLocalBackup({ invoices: next });
      fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SAVE_ALL', payload: { invoices: next } }),
      }).catch(console.error);
      return next;
    });
  };

  const setExpenses: React.Dispatch<React.SetStateAction<Expense[]>> = (value) => {
    setExpensesState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      saveLocalBackup({ expenses: next });
      fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SAVE_ALL', payload: { expenses: next } }),
      }).catch(console.error);
      return next;
    });
  };

  const setWhatsappNumber = (num: string) => {
    setWhatsappNumberState(num);
    saveLocalBackup({ whatsappNumber: num });
    fetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_SETTINGS', payload: { whatsappNumber: num } }),
    }).catch(console.error);
  };

  const setBankDetails = (details: BankDetails) => {
    setBankDetailsState(details);
    saveLocalBackup({ bankDetails: details });
    fetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_SETTINGS', payload: { bankDetails: details } }),
    }).catch(console.error);
  };

  // Cargar estado centralizado desde la API del Servidor (/api/store) con Auto-Restauración (Auto-Healing)
  const fetchServerStore = async () => {
    try {
      const res = await fetch(`/api/store?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      });
      if (res.ok) {
        const serverData = await res.json();
        const localBackup = getLocalBackup();

        // 1. Productos: Sincronización multi-dispositivo con el Servidor (y auto-restauración si el server está vacío)
        if (serverData.products && serverData.products.length > 0) {
          setProductsState(serverData.products);
          saveLocalBackup({ products: serverData.products });
        } else if (localBackup?.products && localBackup.products.length > 0) {
          setProductsState(localBackup.products);
          fetch('/api/store', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'UPDATE_PRODUCTS', payload: localBackup.products }),
          }).catch(console.error);
        }

        // 2. Promociones: Sincronización multi-dispositivo
        if (serverData.promotions && serverData.promotions.length > 0) {
          setPromotionsState(serverData.promotions);
          saveLocalBackup({ promotions: serverData.promotions });
        } else if (localBackup?.promotions && localBackup.promotions.length > 0) {
          setPromotionsState(localBackup.promotions);
          fetch('/api/store', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'UPDATE_PROMOTIONS', payload: localBackup.promotions }),
          }).catch(console.error);
        } else if (serverData.promotions !== undefined) {
          setPromotionsState(serverData.promotions);
        }

        // 3. Facturas: Sincronización multi-dispositivo
        if (serverData.invoices && serverData.invoices.length > 0) {
          setInvoicesState(serverData.invoices);
          saveLocalBackup({ invoices: serverData.invoices });
        } else if (localBackup?.invoices && localBackup.invoices.length > 0) {
          setInvoicesState(localBackup.invoices);
          fetch('/api/store', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'SAVE_ALL', payload: { invoices: localBackup.invoices } }),
          }).catch(console.error);
        } else if (serverData.invoices !== undefined) {
          setInvoicesState(serverData.invoices);
        }

        // 4. Ventas: Sincronización multi-dispositivo
        if (serverData.sales && serverData.sales.length > 0) {
          setSalesState(serverData.sales);
          saveLocalBackup({ sales: serverData.sales });
        } else if (localBackup?.sales && localBackup.sales.length > 0) {
          setSalesState(localBackup.sales);
          fetch('/api/store', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'SAVE_ALL', payload: { sales: localBackup.sales } }),
          }).catch(console.error);
        } else if (serverData.sales !== undefined) {
          setSalesState(serverData.sales);
        }

        // 5. Gastos Operacionales: Sincronización multi-dispositivo
        if (serverData.expenses && serverData.expenses.length > 0) {
          setExpensesState(serverData.expenses);
          saveLocalBackup({ expenses: serverData.expenses });
        } else if (localBackup?.expenses && localBackup.expenses.length > 0) {
          setExpensesState(localBackup.expenses);
          fetch('/api/store', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'SAVE_ALL', payload: { expenses: localBackup.expenses } }),
          }).catch(console.error);
        } else if (serverData.expenses !== undefined) {
          setExpensesState(serverData.expenses);
        }

        if (serverData.whatsappNumber) {
          setWhatsappNumberState(serverData.whatsappNumber);
          saveLocalBackup({ whatsappNumber: serverData.whatsappNumber });
        }
        if (serverData.bankDetails) {
          setBankDetailsState(serverData.bankDetails);
          saveLocalBackup({ bankDetails: serverData.bankDetails });
        }
      }
    } catch (e) {
      console.error('Error sincronizando estado con el servidor:', e);
    }
  };

  useEffect(() => {
    // 1. Carga inmediata desde el respaldo local para velocidad y persistencia garantizada
    const local = getLocalBackup();
    if (local) {
      if (local.products && local.products.length > 0) setProductsState(local.products);
      if (local.promotions && local.promotions.length > 0) setPromotionsState(local.promotions);
      if (local.invoices && local.invoices.length > 0) setInvoicesState(local.invoices);
      if (local.sales && local.sales.length > 0) setSalesState(local.sales);
      if (local.expenses && local.expenses.length > 0) setExpensesState(local.expenses);
      if (local.whatsappNumber) setWhatsappNumberState(local.whatsappNumber);
      if (local.bankDetails) setBankDetailsState(local.bankDetails);
    }

    // 2. Cargar y auto-sincronizar con el servidor y Supabase
    fetchServerStore();

    // 3. Suscripción en Tiempo Real con Supabase Realtime
    const channel = supabase
      .channel('copete_store_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'copete_store' },
        (payload) => {
          if (payload.new && (payload.new as { data?: { products?: Product[]; promotions?: Promotion[]; sales?: Sale[]; invoices?: Invoice[]; expenses?: Expense[] } }).data) {
            const fresh = (payload.new as { data: { products?: Product[]; promotions?: Promotion[]; sales?: Sale[]; invoices?: Invoice[]; expenses?: Expense[] } }).data;
            if (fresh.products && fresh.products.length > 0) {
              setProductsState(fresh.products);
              saveLocalBackup({ products: fresh.products });
            }
            if (fresh.promotions) {
              setPromotionsState(fresh.promotions);
              saveLocalBackup({ promotions: fresh.promotions });
            }
            if (fresh.sales) {
              setSalesState(fresh.sales);
              saveLocalBackup({ sales: fresh.sales });
            }
            if (fresh.invoices) {
              setInvoicesState(fresh.invoices);
              saveLocalBackup({ invoices: fresh.invoices });
            }
            if (fresh.expenses) {
              setExpensesState(fresh.expenses);
              saveLocalBackup({ expenses: fresh.expenses });
            }
          }
        }
      )
      .subscribe();

    // 4. Polling periódico de seguridad cada 8 segundos
    const interval = setInterval(fetchServerStore, 8000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  // Eliminar venta y opcionalmente restaurar el stock al catálogo (solo si la venta fue completada)
  const deleteSale = async (saleId: string, restoreStock: boolean = true) => {
    const saleToDelete = sales.find((s) => s.id === saleId);
    let updatedProducts = [...products];
    const shouldRestore = restoreStock && saleToDelete && saleToDelete.status === 'completed';

    if (shouldRestore && saleToDelete.items) {
      saleToDelete.items.forEach((item) => {
        if (item.product_id) {
          const pIdx = updatedProducts.findIndex((p) => p.id === item.product_id);
          if (pIdx > -1) {
            updatedProducts[pIdx] = {
              ...updatedProducts[pIdx],
              stock: updatedProducts[pIdx].stock + item.quantity,
            };
          }
        } else if (item.promotion_id) {
          const promo = promotions.find((p) => p.id === item.promotion_id);
          if (promo && promo.items) {
            promo.items.forEach((pi) => {
              const pIdx = updatedProducts.findIndex((p) => p.id === pi.product_id);
              if (pIdx > -1) {
                updatedProducts[pIdx] = {
                  ...updatedProducts[pIdx],
                  stock: updatedProducts[pIdx].stock + pi.quantity * item.quantity,
                };
              }
            });
          }
        }
      });

      setProductsState(updatedProducts);
    }

    setSalesState((prev) => {
      const next = prev.filter((s) => s.id !== saleId);
      saveLocalBackup({ sales: next, products: shouldRestore ? updatedProducts : undefined });
      return next;
    });

    try {
      await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_SALE',
          payload: { saleId, updatedProducts: shouldRestore ? updatedProducts : null },
        }),
      });
    } catch (e) {
      console.error('Error enviando deleteSale al servidor:', e);
    }
  };

  // Confirmar Pedido Web Pendiente y Descontar Stock de Bodega con 1 Clic
  const confirmPendingOrder = async (saleId: string): Promise<{ success: boolean; message: string }> => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) return { success: false, message: 'Pedido no encontrado.' };
    if (sale.status === 'completed') return { success: false, message: 'Este pedido ya fue confirmado.' };

    const updatedProducts = [...products];

    // Validar disponibilidad de stock para cada ítem
    if (sale.items) {
      for (const item of sale.items) {
        if (item.product_id) {
          const pIdx = updatedProducts.findIndex((p) => p.id === item.product_id);
          if (pIdx === -1 || updatedProducts[pIdx].stock < item.quantity) {
            return {
              success: false,
              message: `Stock insuficiente para ${item.item_name} (Disponibles: ${pIdx > -1 ? updatedProducts[pIdx].stock : 0}, Requeridos: ${item.quantity}).`,
            };
          }
          updatedProducts[pIdx] = {
            ...updatedProducts[pIdx],
            stock: updatedProducts[pIdx].stock - item.quantity,
          };
        } else if (item.promotion_id) {
          const promo = promotions.find((p) => p.id === item.promotion_id);
          if (promo && promo.items) {
            for (const pi of promo.items) {
              const pIdx = updatedProducts.findIndex((p) => p.id === pi.product_id);
              const needed = pi.quantity * item.quantity;
              if (pIdx === -1 || updatedProducts[pIdx].stock < needed) {
                return {
                  success: false,
                  message: `Stock insuficiente para armar el pack ${promo.name}.`,
                };
              }
              updatedProducts[pIdx] = {
                ...updatedProducts[pIdx],
                stock: updatedProducts[pIdx].stock - needed,
              };
            }
          }
        }
      }
    }

    const completedSale: Sale = { ...sale, status: 'completed' };

    setProductsState(updatedProducts);
    setSalesState((prev) => {
      const next = prev.map((s) => (s.id === saleId ? completedSale : s));
      saveLocalBackup({ sales: next, products: updatedProducts });
      return next;
    });

    try {
      await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CONFIRM_SALE',
          payload: { sale: completedSale, updatedProducts },
        }),
      });
    } catch (e) {
      console.error('Error confirmando venta en el servidor:', e);
    }

    return { success: true, message: '¡Pedido confirmado y stock descontado con éxito!' };
  };

  // Cancelar Pedido Web Pendiente (sin modificar stock)
  const cancelPendingOrder = async (saleId: string): Promise<{ success: boolean; message: string }> => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) return { success: false, message: 'Pedido no encontrado.' };

    const cancelledSale: Sale = { ...sale, status: 'cancelled' };

    setSalesState((prev) => {
      const next = prev.map((s) => (s.id === saleId ? cancelledSale : s));
      saveLocalBackup({ sales: next });
      return next;
    });

    try {
      await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CANCEL_SALE',
          payload: { sale: cancelledSale },
        }),
      });
    } catch (e) {
      console.error('Error cancelando venta en el servidor:', e);
    }

    return { success: true, message: 'Pedido marcado como cancelado.' };
  };

  // Actualizar Venta Existente (Datos de cliente, productos, cantidades y reconciliación de inventario)
  const updateSale = async (updatedSale: Sale): Promise<{ success: boolean; message: string }> => {
    const oldSale = sales.find((s) => s.id === updatedSale.id);
    if (!oldSale) return { success: false, message: 'Venta no encontrada.' };

    let updatedProducts = [...products];

    // Reconciliación de inventario si la venta estaba/sigue completada
    if (oldSale.status === 'completed' && updatedSale.status === 'completed') {
      // 1. Revertir temporalmente el stock del pedido anterior
      if (oldSale.items) {
        oldSale.items.forEach((item) => {
          if (item.product_id) {
            const pIdx = updatedProducts.findIndex((p) => p.id === item.product_id);
            if (pIdx > -1) {
              updatedProducts[pIdx] = {
                ...updatedProducts[pIdx],
                stock: updatedProducts[pIdx].stock + item.quantity,
              };
            }
          } else if (item.promotion_id) {
            const promo = promotions.find((p) => p.id === item.promotion_id);
            if (promo && promo.items) {
              promo.items.forEach((pi) => {
                const pIdx = updatedProducts.findIndex((p) => p.id === pi.product_id);
                if (pIdx > -1) {
                  updatedProducts[pIdx] = {
                    ...updatedProducts[pIdx],
                    stock: updatedProducts[pIdx].stock + pi.quantity * item.quantity,
                  };
                }
              });
            }
          }
        });
      }

      // 2. Descontar el stock según los nuevos ítems verificando existencias
      if (updatedSale.items) {
        for (const item of updatedSale.items) {
          if (item.product_id) {
            const pIdx = updatedProducts.findIndex((p) => p.id === item.product_id);
            if (pIdx === -1 || updatedProducts[pIdx].stock < item.quantity) {
              return {
                success: false,
                message: `Stock insuficiente para ${item.item_name} al actualizar (Disponibles: ${pIdx > -1 ? updatedProducts[pIdx].stock : 0}, Requeridos: ${item.quantity}).`,
              };
            }
            updatedProducts[pIdx] = {
              ...updatedProducts[pIdx],
              stock: updatedProducts[pIdx].stock - item.quantity,
            };
          } else if (item.promotion_id) {
            const promo = promotions.find((p) => p.id === item.promotion_id);
            if (promo && promo.items) {
              for (const pi of promo.items) {
                const pIdx = updatedProducts.findIndex((p) => p.id === pi.product_id);
                const needed = pi.quantity * item.quantity;
                if (pIdx === -1 || updatedProducts[pIdx].stock < needed) {
                  return {
                    success: false,
                    message: `Stock insuficiente para pack ${promo.name} al actualizar.`,
                  };
                }
                updatedProducts[pIdx] = {
                  ...updatedProducts[pIdx],
                  stock: updatedProducts[pIdx].stock - needed,
                };
              }
            }
          }
        }
      }

      setProductsState(updatedProducts);
    }

    setSalesState((prev) => {
      const next = prev.map((s) => (s.id === updatedSale.id ? updatedSale : s));
      saveLocalBackup({ sales: next, products: updatedProducts });
      return next;
    });

    try {
      await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_SALE',
          payload: { sale: updatedSale, updatedProducts },
        }),
      });
    } catch (e) {
      console.error('Error actualizando venta en el servidor:', e);
    }

    return { success: true, message: 'Venta actualizada correctamente.' };
  };

  // 1. INGRESO DE FACTURA DE COMPRA DE PROVEEDOR E INVENTARIO
  const addInvoice = async (
    invoiceData: Omit<Invoice, 'id' | 'created_at'>,
    newProducts: Product[] = []
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const invoiceId = `inv-${Date.now()}`;
      const newInvoice: Invoice = {
        ...invoiceData,
        id: invoiceId,
        created_at: new Date().toISOString(),
      };

      // Si vienen nuevos productos creados dentro de la factura, agregarlos al catálogo
      let updatedProducts = [...products];

      if (newProducts && newProducts.length > 0) {
        newProducts.forEach((newProd) => {
          const exists = updatedProducts.some((p) => p.id === newProd.id || p.name.toLowerCase() === newProd.name.toLowerCase());
          if (!exists) {
            updatedProducts.push(newProd);
          }
        });
      }

      // Sumar el stock comprado y actualizar costo de compra de cada ítem
      newInvoice.items.forEach((item) => {
        const pIdx = updatedProducts.findIndex((p) => p.id === item.product_id || p.name.toLowerCase() === item.product_name.toLowerCase());
        if (pIdx > -1) {
          updatedProducts[pIdx] = {
            ...updatedProducts[pIdx],
            stock: updatedProducts[pIdx].stock + item.quantity,
            cost_price: item.cost_price, // Actualizar costo con la factura
            price: item.selling_price || updatedProducts[pIdx].price,
          };
        }
      });

      setProductsState(updatedProducts);
      setInvoicesState((prev) => {
        const next = [newInvoice, ...prev];
        saveLocalBackup({ invoices: next, products: updatedProducts });
        return next;
      });

      await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_INVOICE',
          payload: { invoice: newInvoice, updatedProducts },
        }),
      });

      return {
        success: true,
        message: '¡Factura ingresada con éxito! El inventario y los costos han sido actualizados.',
      };
    } catch (e: any) {
      console.error('Error procesando factura:', e);
      return { success: false, message: e.message || 'Error al ingresar factura.' };
    }
  };

  // Actualizar Factura Existente y recalcular stock y costos
  const updateInvoice = async (
    updatedInvoice: Invoice,
    newProducts: Product[] = []
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const oldInvoice = invoices.find((i) => i.id === updatedInvoice.id);
      let updatedProducts = [...products];

      // 1. Agregar nuevos productos si se crearon durante la edición
      if (newProducts && newProducts.length > 0) {
        newProducts.forEach((newProd) => {
          const exists = updatedProducts.some(
            (p) => p.id === newProd.id || p.name.toLowerCase() === newProd.name.toLowerCase()
          );
          if (!exists) {
            updatedProducts.push(newProd);
          }
        });
      }

      // 2. Revertir el stock de la versión anterior de la factura
      if (oldInvoice) {
        oldInvoice.items.forEach((oldItem) => {
          const pIdx = updatedProducts.findIndex((p) => p.id === oldItem.product_id);
          if (pIdx > -1) {
            updatedProducts[pIdx] = {
              ...updatedProducts[pIdx],
              stock: Math.max(0, updatedProducts[pIdx].stock - oldItem.quantity),
            };
          }
        });
      }

      // 3. Aplicar las nuevas cantidades y costos unitarios
      updatedInvoice.items.forEach((item) => {
        const pIdx = updatedProducts.findIndex(
          (p) => p.id === item.product_id || p.name.toLowerCase() === item.product_name.toLowerCase()
        );
        if (pIdx > -1) {
          updatedProducts[pIdx] = {
            ...updatedProducts[pIdx],
            stock: updatedProducts[pIdx].stock + item.quantity,
            cost_price: item.cost_price,
            price: item.selling_price || updatedProducts[pIdx].price,
          };
        }
      });

      setProductsState(updatedProducts);
      setInvoicesState((prev) => {
        const next = prev.map((inv) => (inv.id === updatedInvoice.id ? updatedInvoice : inv));
        saveLocalBackup({ invoices: next, products: updatedProducts });
        return next;
      });

      await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_INVOICE',
          payload: { invoice: updatedInvoice, updatedProducts },
        }),
      });

      return {
        success: true,
        message: '¡Factura modificada con éxito! El inventario y los costos fueron recalculados.',
      };
    } catch (e: any) {
      console.error('Error actualizando factura:', e);
      return { success: false, message: e.message || 'Error al actualizar factura.' };
    }
  };

  // Eliminar Factura y opcionalmente revertir el stock sumado
  const deleteInvoice = async (invoiceId: string, revertStock: boolean = true) => {
    const invToDelete = invoices.find((i) => i.id === invoiceId);
    let updatedProducts = [...products];

    if (invToDelete && revertStock) {
      invToDelete.items.forEach((item) => {
        const pIdx = updatedProducts.findIndex((p) => p.id === item.product_id);
        if (pIdx > -1) {
          updatedProducts[pIdx] = {
            ...updatedProducts[pIdx],
            stock: Math.max(0, updatedProducts[pIdx].stock - item.quantity),
          };
        }
      });
      setProductsState(updatedProducts);
    }

    setInvoicesState((prev) => {
      const next = prev.filter((i) => i.id !== invoiceId);
      saveLocalBackup({ invoices: next, products: updatedProducts });
      return next;
    });

    try {
      await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_INVOICE',
          payload: { invoiceId, updatedProducts: revertStock ? updatedProducts : null },
        }),
      });
    } catch (e) {
      console.error('Error eliminando factura:', e);
    }
  };

  // 2. GESTIÓN DE GASTOS OPERACIONALES
  const addExpense = async (
    expenseData: Omit<Expense, 'id' | 'created_at'>
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const expenseId = `exp-${Date.now()}`;
      const newExpense: Expense = {
        ...expenseData,
        id: expenseId,
        created_at: new Date().toISOString(),
      };

      setExpensesState((prev) => {
        const next = [newExpense, ...prev];
        saveLocalBackup({ expenses: next });
        return next;
      });

      await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_EXPENSE',
          payload: { expense: newExpense },
        }),
      });

      return {
        success: true,
        message: '¡Gasto operacional registrado con éxito!',
      };
    } catch (e: any) {
      console.error('Error registrando gasto:', e);
      return { success: false, message: e.message || 'Error al registrar gasto.' };
    }
  };

  const deleteExpense = async (expenseId: string) => {
    setExpensesState((prev) => {
      const next = prev.filter((e) => e.id !== expenseId);
      saveLocalBackup({ expenses: next });
      return next;
    });

    try {
      await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_EXPENSE',
          payload: { expenseId },
        }),
      });
    } catch (e) {
      console.error('Error eliminando gasto:', e);
    }
  };

  const resetAllData = async () => {
    setProductsState([]);
    setPromotionsState([]);
    setSalesState([]);
    setInvoicesState([]);
    setExpensesState([]);
    saveLocalBackup({
      products: [],
      promotions: [],
      sales: [],
      invoices: [],
      expenses: [],
    });
    try {
      await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESET_ALL' }),
      });
    } catch (e) {
      console.error('Error enviando resetAllData al servidor:', e);
    }
  };

  const addToCart = (item: Product | Promotion, type: 'product' | 'promotion') => {
    let maxStock = 0;
    let itemsSummary = '';

    if (type === 'product') {
      const prod = item as Product;
      maxStock = prod.stock;
      if (prod.stock <= 0) return;
    } else {
      const promo = item as Promotion;
      if (promo.items && promo.items.length > 0) {
        const availablePacks = promo.items.map((pi) => {
          const matchingProd = products.find((p) => p.id === pi.product_id);
          if (!matchingProd || matchingProd.stock < pi.quantity) return 0;
          return Math.floor(matchingProd.stock / pi.quantity);
        });
        maxStock = Math.min(...availablePacks);
      }
      if (maxStock <= 0) return;
      itemsSummary = promo.description;
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((ci) => ci.id === item.id);
      if (existingIndex > -1) {
        const existing = prevCart[existingIndex];
        const newQty = Math.min(existing.quantity + 1, maxStock);
        const updated = [...prevCart];
        updated[existingIndex] = { ...existing, quantity: newQty, max_stock: maxStock };
        return updated;
      }
      return [
        ...prevCart,
        {
          id: item.id,
          type,
          name: item.name,
          price: type === 'product' ? (item as Product).price : (item as Promotion).promo_price,
          image_url: item.image_url,
          quantity: 1,
          max_stock: maxStock,
          items_summary: itemsSummary,
        },
      ];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const clampedQty = Math.min(quantity, item.max_stock);
          return { ...item, quantity: clampedQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Proceso de Checkout y Guardado Centralizado de Ventas Web (Estado Pendiente, SIN descontar stock de bodega de inmediato)
  const processCheckout = async (
    customerName: string,
    customerPhone: string,
    deliveryAddress: string,
    paymentMethod: PaymentMethod = 'transferencia'
  ): Promise<{ success: boolean; message: string }> => {
    if (cart.length === 0) {
      return { success: false, message: 'El carrito está vacío.' };
    }

    let calculatedTotal = 0;
    const saleItemsList: SaleItem[] = [];

    // Compilar lista de ítems sin descontar stock
    for (const item of cart) {
      if (item.type === 'product') {
        const prod = products.find((p) => p.id === item.id);
        saleItemsList.push({
          id: crypto.randomUUID(),
          sale_id: '',
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          cost_price: prod?.cost_price || Math.round(item.price * 0.6),
          item_name: item.name,
        });
        calculatedTotal += item.price * item.quantity;
      } else {
        const promo = promotions.find((p) => p.id === item.id);
        saleItemsList.push({
          id: crypto.randomUUID(),
          sale_id: '',
          promotion_id: promo?.id || item.id,
          quantity: item.quantity,
          unit_price: promo?.promo_price || item.price,
          cost_price: Math.round((promo?.promo_price || item.price) * 0.6),
          item_name: promo?.name || item.name,
        });
        calculatedTotal += (promo?.promo_price || item.price) * item.quantity;
      }
    }

    const newSaleId = crypto.randomUUID();
    const newSale: Sale = {
      id: newSaleId,
      customer_name: customerName,
      customer_phone: customerPhone,
      delivery_address: deliveryAddress,
      payment_method: paymentMethod,
      subtotal_amount: calculatedTotal,
      discount_amount: 0,
      total_amount: calculatedTotal,
      status: 'pending', // Pedido Web por Confirmar
      created_at: new Date().toISOString(),
      items: saleItemsList.map((si) => ({ ...si, sale_id: newSaleId })),
    };

    setSalesState((prevSales) => {
      const next = [newSale, ...prevSales];
      saveLocalBackup({ sales: next });
      return next;
    });
    clearCart();

    try {
      await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_SALE',
          payload: { sale: newSale },
        }),
      });
    } catch (e) {
      console.error('Error enviando venta web al servidor:', e);
    }

    return { success: true, message: 'Pedido registrado como pendiente. Se confirmará desde el panel de administración.' };
  };

  // Crear Pedido Manual por Administrador (WhatsApp) con Soporte de Descuento (% o Monto Fijo)
  const createAdminOrder = async (
    customerName: string,
    customerPhone: string,
    deliveryAddress: string,
    paymentMethod: PaymentMethod,
    orderItems: { id: string; type: 'product' | 'promotion'; quantity: number }[],
    discount?: { type: 'none' | 'percentage' | 'fixed'; value: number }
  ): Promise<{ success: boolean; message: string; summaryText: string }> => {
    const updatedProducts = [...products];
    let subtotalAmount = 0;
    const saleItemsList: SaleItem[] = [];
    const summaryLines: string[] = [
      `🛒 *PEDIDO COPETE EXPRESS* 🛒`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👤 *Cliente:* ${customerName}`,
      `📞 *Teléfono:* ${customerPhone}`,
      `📍 *Dirección:* ${deliveryAddress}`,
      `💳 *Forma de Pago:* ${paymentMethod === 'transferencia' ? 'Transferencia Bancaria' : 'Efectivo al Recibir'}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `📦 *DETALLE DEL PEDIDO:*`,
    ];

    for (const item of orderItems) {
      if (item.type === 'product') {
        const prod = products.find((p) => p.id === item.id);
        if (!prod || prod.stock < item.quantity) {
          return {
            success: false,
            message: `Stock insuficiente para ${prod?.name || 'producto'} (Disponibles: ${prod?.stock || 0}, Requeridos: ${item.quantity}).`,
            summaryText: '',
          };
        }
        const pIndex = updatedProducts.findIndex((p) => p.id === item.id);
        updatedProducts[pIndex] = {
          ...updatedProducts[pIndex],
          stock: updatedProducts[pIndex].stock - item.quantity,
        };

        const itemTotal = prod.price * item.quantity;
        subtotalAmount += itemTotal;
        saleItemsList.push({
          id: crypto.randomUUID(),
          sale_id: '',
          product_id: prod.id,
          quantity: item.quantity,
          unit_price: prod.price,
          cost_price: prod.cost_price,
          item_name: prod.name,
        });
        summaryLines.push(`• *${prod.name}* x${item.quantity} = $${itemTotal.toLocaleString('es-CL')}`);
      } else {
        const promo = promotions.find((p) => p.id === item.id);
        if (!promo || !promo.items) {
          return {
            success: false,
            message: `Promoción ${item.id} no encontrada.`,
            summaryText: '',
          };
        }
        for (const pi of promo.items) {
          const pIndex = updatedProducts.findIndex((p) => p.id === pi.product_id);
          const needed = pi.quantity * item.quantity;
          if (pIndex === -1 || updatedProducts[pIndex].stock < needed) {
            return {
              success: false,
              message: `Stock insuficiente para armar el pack ${promo.name}.`,
              summaryText: '',
            };
          }
          updatedProducts[pIndex] = {
            ...updatedProducts[pIndex],
            stock: updatedProducts[pIndex].stock - needed,
          };
        }

        const promoTotal = promo.promo_price * item.quantity;
        subtotalAmount += promoTotal;
        saleItemsList.push({
          id: crypto.randomUUID(),
          sale_id: '',
          promotion_id: promo.id,
          quantity: item.quantity,
          unit_price: promo.promo_price,
          cost_price: Math.round(promo.promo_price * 0.6),
          item_name: promo.name,
        });
        summaryLines.push(`• *PACK: ${promo.name}* x${item.quantity} = $${promoTotal.toLocaleString('es-CL')}`);
      }
    }

    // Cálculo de Descuento
    let discountAmount = 0;
    const dType = discount?.type || 'none';
    const dVal = discount?.value || 0;

    if (dType === 'percentage' && dVal > 0) {
      discountAmount = Math.round((subtotalAmount * Math.min(100, Math.max(0, dVal))) / 100);
    } else if (dType === 'fixed' && dVal > 0) {
      discountAmount = Math.min(subtotalAmount, dVal);
    }

    const finalTotal = Math.max(0, subtotalAmount - discountAmount);

    summaryLines.push(`━━━━━━━━━━━━━━━━━━━━`);
    if (discountAmount > 0) {
      summaryLines.push(`💵 *Subtotal:* $${subtotalAmount.toLocaleString('es-CL')}`);
      summaryLines.push(`🎁 *Descuento ${dType === 'percentage' ? `(${dVal}%)` : ''}:* -$${discountAmount.toLocaleString('es-CL')}`);
    }
    summaryLines.push(`💰 *TOTAL A PAGAR:* $${finalTotal.toLocaleString('es-CL')}`);

    if (paymentMethod === 'transferencia') {
      summaryLines.push(
        `━━━━━━━━━━━━━━━━━━━━`,
        `🏦 *DATOS DE TRANSFERENCIA:*`,
        `• *Banco:* ${bankDetails.banco}`,
        `• *Tipo Cuenta:* ${bankDetails.tipoCuenta}`,
        `• *N° Cuenta:* ${bankDetails.numeroCuenta}`,
        `• *RUT:* ${bankDetails.rut}`,
        `• *Nombre:* ${bankDetails.nombre}`,
        `• *Email:* ${bankDetails.email}`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `📸 *Por favor enviar comprobante de transferencia respondiendo a este mensaje.*`
      );
    } else {
      summaryLines.push(
        `━━━━━━━━━━━━━━━━━━━━`,
        `💵 *Pago en efectivo:* El repartidor cobrará al momento de la entrega en su domicilio.`
      );
    }

    const summaryText = summaryLines.join('\n');
    const newSaleId = crypto.randomUUID();
    const newSale: Sale = {
      id: newSaleId,
      customer_name: customerName,
      customer_phone: customerPhone,
      delivery_address: deliveryAddress,
      payment_method: paymentMethod,
      subtotal_amount: subtotalAmount,
      discount_type: dType,
      discount_value: dVal,
      discount_amount: discountAmount,
      total_amount: finalTotal,
      status: 'completed',
      created_at: new Date().toISOString(),
      items: saleItemsList.map((si) => ({ ...si, sale_id: newSaleId })),
    };

    setProductsState(updatedProducts);
    setSalesState((prevSales) => {
      const next = [newSale, ...prevSales];
      saveLocalBackup({ sales: next, products: updatedProducts });
      return next;
    });

    try {
      await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_SALE',
          payload: { sale: newSale, updatedProducts },
        }),
      });
    } catch (e) {
      console.error('Error enviando venta de admin al servidor:', e);
    }

    return {
      success: true,
      message: 'Pedido y venta confirmada exitosamente.',
      summaryText,
    };
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalAmount,
        totalItems,
        isCartOpen,
        setIsCartOpen,
        products,
        promotions,
        sales,
        invoices,
        expenses,
        setProducts,
        setPromotions,
        setSales,
        setInvoices,
        setExpenses,
        deleteSale,
        confirmPendingOrder,
        cancelPendingOrder,
        updateSale,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        addExpense,
        deleteExpense,
        resetAllData,
        whatsappNumber,
        setWhatsappNumber,
        bankDetails,
        setBankDetails,
        processCheckout,
        createAdminOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de un CartProvider');
  }
  return context;
};
