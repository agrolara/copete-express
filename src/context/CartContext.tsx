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
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [promotions, setPromotions] = useState<Promotion[]>(INITIAL_PROMOTIONS);
  const [sales, setSales] = useState<Sale[]>(INITIAL_SALES);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);

  // Configuración de WhatsApp y Datos Bancarios editables por el Super Admin
  const [whatsappNumber, setWhatsappNumber] = useState<string>('56912345678');
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    banco: 'Banco Estado / Banco de Chile',
    tipoCuenta: 'Cuenta Vista / Rut / Corriente',
    numeroCuenta: '123456789',
    rut: '12.345.678-9',
    nombre: 'Copete Express SpA',
    email: 'pagos@copeteexpress.cl',
  });

  // Cargar estado centralizado desde la API del Servidor (/api/store)
  const fetchServerStore = async () => {
    try {
      const res = await fetch('/api/store', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.products) setProducts(data.products);
        if (data.promotions) setPromotions(data.promotions);
        if (data.sales) setSales(data.sales);
        if (data.invoices) setInvoices(data.invoices);
        if (data.expenses) setExpenses(data.expenses);
        if (data.whatsappNumber) setWhatsappNumber(data.whatsappNumber);
        if (data.bankDetails) setBankDetails(data.bankDetails);
      }
    } catch (e) {
      console.error('Error sincronizando estado con el servidor:', e);
    }
  };

  useEffect(() => {
    // Cargar del servidor al iniciar
    fetchServerStore();

    // Polling ligero de 8 segundos para mantener PC y Celulares 100% sincronizados en tiempo real
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

      setProducts(updatedProducts);
    }

    setSales((prev) => prev.filter((s) => s.id !== saleId));

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

      // Clonar lista de productos
      let updatedProducts = [...products];

      // Si hay productos nuevos creados en la factura, incorporarlos
      if (newProducts.length > 0) {
        newProducts.forEach((newP) => {
          if (!updatedProducts.some((p) => p.id === newP.id)) {
            updatedProducts.push(newP);
          }
        });
      }

      // Actualizar stock y costo unitario de cada ítem de la factura
      newInvoice.items.forEach((item) => {
        const pIdx = updatedProducts.findIndex((p) => p.id === item.product_id);
        if (pIdx > -1) {
          updatedProducts[pIdx] = {
            ...updatedProducts[pIdx],
            stock: updatedProducts[pIdx].stock + item.quantity,
            cost_price: item.cost_price, // Actualizar costo con la factura
            price: item.selling_price || updatedProducts[pIdx].price,
          };
        }
      });

      setProducts(updatedProducts);
      setInvoices((prev) => [newInvoice, ...prev]);

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
      setProducts(updatedProducts);
    }

    setInvoices((prev) => prev.filter((i) => i.id !== invoiceId));

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

      setExpenses((prev) => [newExpense, ...prev]);

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
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));

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
    setProducts(INITIAL_PRODUCTS);
    setSales(INITIAL_SALES);
    setInvoices(INITIAL_INVOICES);
    setExpenses(INITIAL_EXPENSES);
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
                message: `Stock insuficiente para ingredientes de la promo ${promo.name}.`,
              };
            }
            updatedProducts[pIndex] = {
              ...updatedProducts[pIndex],
              stock: updatedProducts[pIndex].stock - needed,
            };
          }
        }
        saleItemsList.push({
          id: crypto.randomUUID(),
          sale_id: '',
          promotion_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          cost_price: Math.round(item.price * 0.6),
          item_name: item.name,
        });
        calculatedTotal += item.price * item.quantity;
      }
    }

    // REGISTRAR VENTA EN EL SERVIDOR CENTRALIZADO
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

    setSales((prev) => [newSale, ...prev]);
    setProducts(updatedProducts);
    clearCart();
    setIsCartOpen(false);

    try {
      await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ADD_SALE', payload: { sale: newSale, updatedProducts } }),
      });
    } catch (e) {
      console.error('Error enviando nueva venta al servidor:', e);
    }

    return {
      success: true,
      message: '¡Pedido registrado con éxito! El inventario ha sido actualizado.',
    };
  };

  // Creación Manual de Pedidos por Administradores desde el Dashboard
  const createAdminOrder = async (
    customerName: string,
    customerPhone: string,
    deliveryAddress: string,
    paymentMethod: PaymentMethod,
    orderItems: { id: string; type: 'product' | 'promotion'; quantity: number }[]
  ): Promise<{ success: boolean; message: string; summaryText: string }> => {
    if (orderItems.length === 0) {
      return { success: false, message: 'Debe seleccionar al menos un producto o promoción.', summaryText: '' };
    }

    const updatedProducts = [...products];
    let totalOrderPrice = 0;
    const itemLines: string[] = [];
    const saleItemsList: SaleItem[] = [];

    for (const item of orderItems) {
      if (item.type === 'product') {
        const prodIndex = updatedProducts.findIndex((p) => p.id === item.id);
        if (prodIndex === -1 || updatedProducts[prodIndex].stock < item.quantity) {
          return {
            success: false,
            message: `Stock insuficiente para el producto ${updatedProducts[prodIndex]?.name || ''}.`,
            summaryText: '',
          };
        }
        const prod = updatedProducts[prodIndex];
        updatedProducts[prodIndex] = {
          ...prod,
          stock: prod.stock - item.quantity,
        };

        const itemSubtotal = prod.price * item.quantity;
        totalOrderPrice += itemSubtotal;
        itemLines.push(`• ${item.quantity}x ${prod.name} - $${itemSubtotal.toLocaleString('es-CL')}`);
        saleItemsList.push({
          id: crypto.randomUUID(),
          sale_id: '',
          product_id: prod.id,
          quantity: item.quantity,
          unit_price: prod.price,
          cost_price: prod.cost_price || Math.round(prod.price * 0.6),
          item_name: prod.name,
        });
      } else {
        const promoIndex = promotions.findIndex((p) => p.id === item.id);
        if (promoIndex === -1) {
          return { success: false, message: 'Promoción no encontrada.', summaryText: '' };
        }
        const promo = promotions[promoIndex];
        if (promo.items && promo.items.length > 0) {
          for (const pi of promo.items) {
            const pIdx = updatedProducts.findIndex((p) => p.id === pi.product_id);
            const needed = pi.quantity * item.quantity;
            if (pIdx === -1 || updatedProducts[pIdx].stock < needed) {
              return {
                success: false,
                message: `Stock insuficiente para armar ${promo.name}.`,
                summaryText: '',
              };
            }
            updatedProducts[pIdx] = {
              ...updatedProducts[pIdx],
              stock: updatedProducts[pIdx].stock - needed,
            };
          }
        }

        const itemSubtotal = promo.promo_price * item.quantity;
        totalOrderPrice += itemSubtotal;
        itemLines.push(`• ${item.quantity}x ${promo.name} (Pack) - $${itemSubtotal.toLocaleString('es-CL')}`);
        saleItemsList.push({
          id: crypto.randomUUID(),
          sale_id: '',
          promotion_id: promo.id,
          quantity: item.quantity,
          unit_price: promo.promo_price,
          cost_price: Math.round(promo.promo_price * 0.6),
          item_name: promo.name,
        });
      }
    }

    const orderId = `ADM-${Math.floor(1000 + Math.random() * 9000)}`;
    const newSaleId = crypto.randomUUID();
    const newSale: Sale = {
      id: newSaleId,
      customer_name: customerName,
      customer_phone: customerPhone,
      delivery_address: deliveryAddress,
      payment_method: paymentMethod,
      total_amount: totalOrderPrice,
      status: 'completed',
      created_at: new Date().toISOString(),
      items: saleItemsList.map((si) => ({ ...si, sale_id: newSaleId })),
    };

    setSales((prev) => [newSale, ...prev]);
    setProducts(updatedProducts);

    try {
      await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ADD_SALE', payload: { sale: newSale, updatedProducts } }),
      });
    } catch (e) {
      console.error('Error enviando nueva venta manual al servidor:', e);
    }

    // Generar resumen para WhatsApp
    let summary = `🍻 *COPETE EXPRESS - RESUMEN DE TU PEDIDO #${orderId}* 🍻\n\n`;
    summary += `👤 *Cliente:* ${customerName}\n`;
    summary += `📞 *Teléfono:* ${customerPhone}\n`;
    summary += `📍 *Dirección de Entrega:* ${deliveryAddress}\n\n`;
    summary += `📋 *DETALLE DEL PEDIDO:*\n`;
    summary += itemLines.join('\n') + '\n\n';
    summary += `💰 *TOTAL A PAGAR: $${totalOrderPrice.toLocaleString('es-CL')}*\n`;
    summary += `💳 *Forma de Pago:* ${paymentMethod === 'transferencia' ? 'Transferencia Bancaria' : 'Efectivo al Recibir'}\n\n`;

    if (paymentMethod === 'transferencia') {
      summary += `🏦 *DATOS PARA TRANSFERENCIA BANCARIA:*\n`;
      summary += `• *Banco:* ${bankDetails.banco}\n`;
      summary += `• *Tipo de Cuenta:* ${bankDetails.tipoCuenta}\n`;
      summary += `• *Número:* ${bankDetails.numeroCuenta}\n`;
      summary += `• *RUT:* ${bankDetails.rut}\n`;
      summary += `• *Nombre:* ${bankDetails.nombre}\n`;
      summary += `• *Correo de Confirmación:* ${bankDetails.email}\n\n`;
      summary += `⚠️ _Por favor reenvía el comprobante de transferencia a este chat para enviar al repartidor de inmediato._ 🚀`;
    } else {
      summary += `💵 _Recuerda tener el efectivo listo al momento de la entrega._ 🚀`;
    }

    return {
      success: true,
      message: '¡Pedido manual generado y stock descontado con éxito!',
      summaryText: summary,
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
