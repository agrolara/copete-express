'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, Promotion, Sale, SaleItem, Invoice, Expense, InvoiceItem } from '@/types';
import {
  INITIAL_PRODUCTS,
  INITIAL_PROMOTIONS,
  INITIAL_SALES,
  INITIAL_INVOICES,
  INITIAL_EXPENSES,
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
  addInvoice: (
    invoiceData: Omit<Invoice, 'id' | 'created_at'>,
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
    orderItems: { id: string; type: 'product' | 'promotion'; quantity: number }[]
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

  // Guardado persistente automático de Productos
  const setProducts: React.Dispatch<React.SetStateAction<Product[]>> = (value) => {
    setProductsState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
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
      fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_PROMOTIONS', payload: next }),
      }).catch((e) => console.error('Error persisting promotions:', e));
      return next;
    });
  };

  const setSales = setSalesState;
  const setInvoices = setInvoicesState;
  const setExpenses = setExpensesState;

  const setWhatsappNumber = (num: string) => {
    setWhatsappNumberState(num);
    fetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_SETTINGS', payload: { whatsappNumber: num } }),
    }).catch(console.error);
  };

  const setBankDetails = (details: BankDetails) => {
    setBankDetailsState(details);
    fetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_SETTINGS', payload: { bankDetails: details } }),
    }).catch(console.error);
  };

  // Cargar estado centralizado desde la API del Servidor (/api/store)
  const fetchServerStore = async () => {
    try {
      const res = await fetch('/api/store', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.products !== undefined) setProductsState(data.products);
        if (data.promotions !== undefined) setPromotionsState(data.promotions);
        if (data.sales !== undefined) setSalesState(data.sales);
        if (data.invoices !== undefined) setInvoicesState(data.invoices);
        if (data.expenses !== undefined) setExpensesState(data.expenses);
        if (data.whatsappNumber) setWhatsappNumberState(data.whatsappNumber);
        if (data.bankDetails) setBankDetailsState(data.bankDetails);
      }
    } catch (e) {
      console.error('Error sincronizando estado con el servidor:', e);
    }
  };

  useEffect(() => {
    // Cargar del servidor al iniciar
    fetchServerStore();

    // Polling ligero de 8 segundos para mantener dispositivos sincronizados
    const interval = setInterval(fetchServerStore, 8000);
    return () => clearInterval(interval);
  }, []);

  // Eliminar venta y opcionalmente restaurar el stock al catálogo
  const deleteSale = async (saleId: string, restoreStock: boolean = true) => {
    const saleToDelete = sales.find((s) => s.id === saleId);
    let updatedProducts = [...products];

    if (saleToDelete && restoreStock && saleToDelete.items) {
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

    setSalesState((prev) => prev.filter((s) => s.id !== saleId));

    try {
      await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_SALE',
          payload: { saleId, updatedProducts: restoreStock ? updatedProducts : null },
        }),
      });
    } catch (e) {
      console.error('Error enviando deleteSale al servidor:', e);
    }
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
      setInvoicesState((prev) => [newInvoice, ...prev]);

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

    setInvoicesState((prev) => prev.filter((i) => i.id !== invoiceId));

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

      setExpensesState((prev) => [newExpense, ...prev]);

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
    setExpensesState((prev) => prev.filter((e) => e.id !== expenseId));

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

  // Proceso de Checkout y Guardado Centralizado de Ventas
  const processCheckout = async (
    customerName: string,
    customerPhone: string,
    deliveryAddress: string,
    paymentMethod: PaymentMethod = 'transferencia'
  ): Promise<{ success: boolean; message: string }> => {
    if (cart.length === 0) {
      return { success: false, message: 'El carrito está vacío.' };
    }

    const updatedProducts = [...products];
    let calculatedTotal = 0;
    const saleItemsList: SaleItem[] = [];

    // Validar y descontar stock
    for (const item of cart) {
      if (item.type === 'product') {
        const pIndex = updatedProducts.findIndex((p) => p.id === item.id);
        if (pIndex === -1 || updatedProducts[pIndex].stock < item.quantity) {
          return {
            success: false,
            message: `Stock insuficiente para el producto ${item.name}.`,
          };
        }
        updatedProducts[pIndex] = {
          ...updatedProducts[pIndex],
          stock: updatedProducts[pIndex].stock - item.quantity,
        };
        saleItemsList.push({
          id: crypto.randomUUID(),
          sale_id: '',
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          cost_price: updatedProducts[pIndex].cost_price || Math.round(item.price * 0.6),
          item_name: item.name,
        });
        calculatedTotal += item.price * item.quantity;
      } else {
        const promo = promotions.find((p) => p.id === item.id);
        if (promo && promo.items) {
          for (const pi of promo.items) {
            const pIndex = updatedProducts.findIndex((p) => p.id === pi.product_id);
            const needed = pi.quantity * item.quantity;
            if (pIndex === -1 || updatedProducts[pIndex].stock < needed) {
              return {
                success: false,
                message: `Stock insuficiente para armar el pack ${promo.name}.`,
              };
            }
            updatedProducts[pIndex] = {
              ...updatedProducts[pIndex],
              stock: updatedProducts[pIndex].stock - needed,
            };
          }
          saleItemsList.push({
            id: crypto.randomUUID(),
            sale_id: '',
            promotion_id: promo.id,
            quantity: item.quantity,
            unit_price: promo.promo_price,
            cost_price: Math.round(promo.promo_price * 0.6),
            item_name: promo.name,
          });
          calculatedTotal += promo.promo_price * item.quantity;
        }
      }
    }

    const newSaleId = crypto.randomUUID();
    const newSale: Sale = {
      id: newSaleId,
      customer_name: customerName,
      customer_phone: customerPhone,
      delivery_address: deliveryAddress,
      payment_method: paymentMethod,
      total_amount: calculatedTotal,
      status: 'completed',
      created_at: new Date().toISOString(),
      items: saleItemsList.map((si) => ({ ...si, sale_id: newSaleId })),
    };

    setProductsState(updatedProducts);
    setSalesState((prevSales) => [newSale, ...prevSales]);
    clearCart();

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
      console.error('Error enviando venta al servidor:', e);
    }

    return { success: true, message: 'Pedido registrado con éxito.' };
  };

  // Crear Pedido Manual por Administrador (WhatsApp)
  const createAdminOrder = async (
    customerName: string,
    customerPhone: string,
    deliveryAddress: string,
    paymentMethod: PaymentMethod,
    orderItems: { id: string; type: 'product' | 'promotion'; quantity: number }[]
  ): Promise<{ success: boolean; message: string; summaryText: string }> => {
    const updatedProducts = [...products];
    let calculatedTotal = 0;
    const saleItemsList: SaleItem[] = [];
    const summaryLines: string[] = [];

    summaryLines.push(`🍺 *PEDIDO COPETE EXPRESS* 🍺`);
    summaryLines.push(`👤 *Cliente:* ${customerName}`);
    summaryLines.push(`📞 *Teléfono:* ${customerPhone}`);
    summaryLines.push(`📍 *Dirección:* ${deliveryAddress}`);
    summaryLines.push(`💳 *Forma de Pago:* ${paymentMethod === 'transferencia' ? 'Transferencia Bancaria' : 'Efectivo al Recibir'}`);
    summaryLines.push(`\n🛒 *DETALLE DEL PEDIDO:*`);

    for (const item of orderItems) {
      if (item.type === 'product') {
        const prod = updatedProducts.find((p) => p.id === item.id);
        if (!prod || prod.stock < item.quantity) {
          return {
            success: false,
            message: `Stock insuficiente para ${prod?.name || 'producto'}.`,
            summaryText: '',
          };
        }
        prod.stock -= item.quantity;
        const subtotal = prod.price * item.quantity;
        calculatedTotal += subtotal;
        saleItemsList.push({
          id: crypto.randomUUID(),
          sale_id: '',
          product_id: prod.id,
          quantity: item.quantity,
          unit_price: prod.price,
          cost_price: prod.cost_price || Math.round(prod.price * 0.6),
          item_name: prod.name,
        });
        summaryLines.push(`• ${item.quantity}x ${prod.name} - $${subtotal.toLocaleString('es-CL')}`);
      } else {
        const promo = promotions.find((p) => p.id === item.id);
        if (promo && promo.items) {
          for (const pi of promo.items) {
            const pIdx = updatedProducts.findIndex((p) => p.id === pi.product_id);
            const needed = pi.quantity * item.quantity;
            if (pIdx === -1 || updatedProducts[pIdx].stock < needed) {
              return {
                success: false,
                message: `Stock insuficiente para pack ${promo.name}.`,
                summaryText: '',
              };
            }
            updatedProducts[pIdx].stock -= needed;
          }
          const subtotal = promo.promo_price * item.quantity;
          calculatedTotal += subtotal;
          saleItemsList.push({
            id: crypto.randomUUID(),
            sale_id: '',
            promotion_id: promo.id,
            quantity: item.quantity,
            unit_price: promo.promo_price,
            cost_price: Math.round(promo.promo_price * 0.6),
            item_name: promo.name,
          });
          summaryLines.push(`• ${item.quantity}x ${promo.name} - $${subtotal.toLocaleString('es-CL')}`);
        }
      }
    }

    summaryLines.push(`\n💰 *TOTAL A PAGAR:* $${calculatedTotal.toLocaleString('es-CL')}`);

    if (paymentMethod === 'transferencia') {
      summaryLines.push(`\n🏦 *DATOS DE TRANSFERENCIA:*`);
      summaryLines.push(`• *Banco:* ${bankDetails.banco}`);
      summaryLines.push(`• *Tipo de Cuenta:* ${bankDetails.tipoCuenta}`);
      summaryLines.push(`• *N° Cuenta:* ${bankDetails.numeroCuenta}`);
      summaryLines.push(`• *RUT:* ${bankDetails.rut}`);
      summaryLines.push(`• *Titular:* ${bankDetails.nombre}`);
      summaryLines.push(`• *Email:* ${bankDetails.email}`);
      summaryLines.push(`\n_Por favor envía el comprobante respondiendo a este mensaje para despachar de inmediato._ 🚀`);
    } else {
      summaryLines.push(`\n💵 _Pago en efectivo al repartidor al momento de la entrega._ 🛵💨`);
    }

    const newSaleId = crypto.randomUUID();
    const newSale: Sale = {
      id: newSaleId,
      customer_name: customerName,
      customer_phone: customerPhone,
      delivery_address: deliveryAddress,
      payment_method: paymentMethod,
      total_amount: calculatedTotal,
      status: 'completed',
      created_at: new Date().toISOString(),
      items: saleItemsList.map((si) => ({ ...si, sale_id: newSaleId })),
    };

    setProductsState(updatedProducts);
    setSalesState((prevSales) => [newSale, ...prevSales]);

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
      message: 'Venta registrada con éxito.',
      summaryText: summaryLines.join('\n'),
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
        addInvoice,
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
