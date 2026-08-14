'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, Promotion, Sale, SaleItem } from '@/types';
import { INITIAL_PRODUCTS, INITIAL_PROMOTIONS, INITIAL_SALES } from '@/lib/supabase';

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
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setPromotions: React.Dispatch<React.SetStateAction<Promotion[]>>;
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  deleteSale: (saleId: string, restoreStock?: boolean) => void;
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

  // Cargar estado inicial desde localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('copete_express_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Error parsing cart', e);
      }
    }

    const savedProducts = localStorage.getItem('copete_express_products');
    if (savedProducts) {
      try {
        setProducts(JSON.parse(savedProducts));
      } catch (e) {
        console.error('Error parsing products', e);
      }
    }

    const savedSales = localStorage.getItem('copete_express_sales');
    if (savedSales) {
      try {
        setSales(JSON.parse(savedSales));
      } catch (e) {
        console.error('Error parsing sales', e);
      }
    }

    const savedWa = localStorage.getItem('copete_whatsapp_number');
    if (savedWa) setWhatsappNumber(savedWa);

    const savedBank = localStorage.getItem('copete_bank_details');
    if (savedBank) {
      try {
        setBankDetails(JSON.parse(savedBank));
      } catch (e) {
        console.error('Error parsing bank details', e);
      }
    }
  }, []);

  // Persistir cambios en localStorage
  useEffect(() => {
    localStorage.setItem('copete_express_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('copete_express_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('copete_express_sales', JSON.stringify(sales));
  }, [sales]);

  const updateWhatsappNumber = (num: string) => {
    const cleaned = num.replace(/[^0-9]/g, '');
    setWhatsappNumber(cleaned);
    localStorage.setItem('copete_whatsapp_number', cleaned);
  };

  const updateBankDetails = (details: BankDetails) => {
    setBankDetails(details);
    localStorage.setItem('copete_bank_details', JSON.stringify(details));
  };

  // Revertir y eliminar venta (Devolver stock atrapado)
  const deleteSale = (saleId: string, restoreStock: boolean = true) => {
    const targetSale = sales.find((s) => s.id === saleId);
    if (!targetSale) return;

    if (restoreStock && targetSale.items) {
      const updatedProducts = [...products];

      targetSale.items.forEach((item) => {
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
  };

  const resetAllData = () => {
    localStorage.removeItem('copete_express_products');
    localStorage.removeItem('copete_express_sales');
    setProducts(INITIAL_PRODUCTS);
    setSales(INITIAL_SALES);
  };

  const addToCart = (item: Product | Promotion, type: 'product' | 'promotion') => {
    let maxStock = 99;
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
        updated[existingIndex] = { ...existing, quantity: newQty };
        return updated;
      } else {
        const price = type === 'product' ? (item as Product).price : (item as Promotion).promo_price;
        return [
          ...prevCart,
          {
            id: item.id,
            type,
            name: item.name,
            price,
            image_url: item.image_url,
            quantity: 1,
            max_stock: maxStock,
            items_summary: itemsSummary,
          },
        ];
      }
    });

    setIsCartOpen(true);
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
          const validQty = Math.min(quantity, item.max_stock);
          return { ...item, quantity: validQty };
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

  // Proceso de Checkout Público del Cliente
  const processCheckout = async (
    customerName: string,
    customerPhone: string,
    deliveryAddress: string,
    paymentMethod: PaymentMethod = 'transferencia'
  ): Promise<{ success: boolean; message: string }> => {
    if (cart.length === 0) {
      return { success: false, message: 'El carrito de compras está vacío.' };
    }

    const updatedProducts = [...products];
    const saleItemsList: SaleItem[] = [];
    let calculatedTotal = 0;

    for (const item of cart) {
      if (item.type === 'product') {
        const pIndex = updatedProducts.findIndex((p) => p.id === item.id);
        if (pIndex === -1 || updatedProducts[pIndex].stock < item.quantity) {
          return {
            success: false,
            message: `Stock insuficiente para ${item.name}.`,
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
          item_name: item.name,
        });
        calculatedTotal += item.price * item.quantity;
      }
    }

    // REGISTRAR VENTA DINÁMICAMENTE EN EL ESTADO Y LOCALSTORAGE
    const newSaleId = crypto.randomUUID();
    const newSale: Sale = {
      id: newSaleId,
      customer_name: customerName,
      customer_phone: customerPhone,
      delivery_address: deliveryAddress,
      total_amount: calculatedTotal,
      status: 'completed',
      created_at: new Date().toISOString(),
      items: saleItemsList.map((si) => ({ ...si, sale_id: newSaleId })),
    };

    setSales((prev) => [newSale, ...prev]);
    setProducts(updatedProducts);
    clearCart();
    setIsCartOpen(false);

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
        const itemTotal = prod.price * item.quantity;
        totalOrderPrice += itemTotal;
        itemLines.push(`• ${item.quantity}x ${prod.name} - $${itemTotal.toLocaleString('es-CL')}`);
        saleItemsList.push({
          id: crypto.randomUUID(),
          sale_id: '',
          product_id: prod.id,
          quantity: item.quantity,
          unit_price: prod.price,
          item_name: prod.name,
        });
      } else {
        const promo = promotions.find((p) => p.id === item.id);
        if (!promo) continue;

        if (promo.items) {
          for (const pi of promo.items) {
            const prodIndex = updatedProducts.findIndex((p) => p.id === pi.product_id);
            const needed = pi.quantity * item.quantity;
            if (prodIndex === -1 || updatedProducts[prodIndex].stock < needed) {
              return {
                success: false,
                message: `Stock insuficiente del producto en la promo ${promo.name}.`,
                summaryText: '',
              };
            }
            updatedProducts[prodIndex] = {
              ...updatedProducts[prodIndex],
              stock: updatedProducts[prodIndex].stock - needed,
            };
          }
        }
        const itemTotal = promo.promo_price * item.quantity;
        totalOrderPrice += itemTotal;
        itemLines.push(`• ${item.quantity}x ${promo.name} - $${itemTotal.toLocaleString('es-CL')}`);
        saleItemsList.push({
          id: crypto.randomUUID(),
          sale_id: '',
          promotion_id: promo.id,
          quantity: item.quantity,
          unit_price: promo.promo_price,
          item_name: promo.name,
        });
      }
    }

    // REGISTRAR VENTA OFICIAL EN EL ESTADO
    const newSaleId = crypto.randomUUID();
    const newSale: Sale = {
      id: newSaleId,
      customer_name: customerName,
      customer_phone: customerPhone,
      delivery_address: deliveryAddress,
      total_amount: totalOrderPrice,
      status: 'completed',
      created_at: new Date().toISOString(),
      items: saleItemsList.map((si) => ({ ...si, sale_id: newSaleId })),
    };

    setSales((prev) => [newSale, ...prev]);
    setProducts(updatedProducts);

    const formattedTotal = new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(totalOrderPrice);

    let paymentDetailsText = '';
    if (paymentMethod === 'transferencia') {
      paymentDetailsText = `💳 *DATOS PARA TRANSFERENCIA BANCARIA:*\n` +
        `• *Banco:* ${bankDetails.banco}\n` +
        `• *Tipo de Cuenta:* ${bankDetails.tipoCuenta}\n` +
        `• *N° Cuenta:* ${bankDetails.numeroCuenta}\n` +
        `• *RUT:* ${bankDetails.rut}\n` +
        `• *Nombre Titular:* ${bankDetails.nombre}\n` +
        `• *Correo:* ${bankDetails.email}\n` +
        `📌 *Por favor envía el comprobante de transferencia a este chat para enviar tu pedido inmediatamente.*`;
    } else {
      paymentDetailsText = `💵 *FORMA DE PAGO SELECCIONADA:* Efectivo al Recibir en Domicilio.\n` +
        `📌 *El repartidor cobrará exactamente ${formattedTotal} al entregar.*`;
    }

    const summaryText = `🍹 *RESUMEN DE TU PEDIDO - COPETE EXPRESS*\n\n` +
      `👤 *Cliente:* ${customerName}\n` +
      `📱 *Teléfono:* ${customerPhone}\n` +
      `📍 *Dirección de Despacho:* ${deliveryAddress}\n\n` +
      `🛒 *PRODUCTOS SOLICITADOS:*\n${itemLines.join('\n')}\n\n` +
      `💰 *TOTAL A PAGAR:* ${formattedTotal}\n\n` +
      `${paymentDetailsText}\n\n` +
      `🚀 *Tiempo estimado de entrega:* 30 a 45 minutos. ¡Muchas gracias por elegir Copete Express!`;

    return {
      success: true,
      message: '¡Pedido registrado con éxito e inventario descontado!',
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
        setProducts,
        setPromotions,
        setSales,
        deleteSale,
        resetAllData,
        whatsappNumber,
        setWhatsappNumber: updateWhatsappNumber,
        bankDetails,
        setBankDetails: updateBankDetails,
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
    throw new Error('useCart debe utilizarse dentro de un CartProvider');
  }
  return context;
};
