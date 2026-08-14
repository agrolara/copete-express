'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import Image from 'next/image';
import { CheckoutModal } from './CheckoutModal';

export const CartDrawer: React.FC = () => {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, totalAmount, totalItems, clearCart } =
    useCart();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  if (!isCartOpen) return null;

  const formattedTotal = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(totalAmount);

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          onClick={() => setIsCartOpen(false)}
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-md bg-zinc-950 border-l border-zinc-800 text-white flex flex-col shadow-2xl">
            {/* Drawer Header */}
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white">Tu Carrito de Copete</h2>
                  <p className="text-xs text-zinc-400">{totalItems} productos seleccionados</p>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Banner Despacho Express */}
            <div className="bg-gradient-to-r from-purple-950/80 via-zinc-900 to-orange-950/80 px-4 py-2 border-b border-purple-500/20 flex items-center justify-center gap-2 text-xs text-purple-200">
              <Truck className="w-4 h-4 text-orange-400 shrink-0" />
              <span>¡Despacho Express en <strong>30-45 min</strong> a tu puerta! 🚀</span>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
                    <ShoppingBag className="w-8 h-8 text-zinc-600" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-300">Tu carrito está vacío</h3>
                  <p className="text-xs text-zinc-500 max-w-xs">
                    Explora nuestros piscos, cervezas, destilados y packs promocionales para armar tu previa.
                  </p>
                </div>
              ) : (
                cart.map((item) => {
                  const itemTotal = item.price * item.quantity;
                  const formattedItemPrice = new Intl.NumberFormat('es-CL', {
                    style: 'currency',
                    currency: 'CLP',
                    maximumFractionDigits: 0,
                  }).format(itemTotal);

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-colors"
                    >
                      {/* Imagen cuadrada mini */}
                      <div className="relative w-16 h-16 aspect-square rounded-xl overflow-hidden bg-zinc-950 shrink-0 border border-zinc-800">
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>

                      {/* Info & Controles */}
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] uppercase font-bold tracking-wider text-purple-400">
                          {item.type === 'promotion' ? 'Pack Promo' : 'Producto'}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                        <p className="text-xs font-extrabold text-white mt-0.5">{formattedItemPrice}</p>

                        {/* Control de Cantidad */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-0.5">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="text-zinc-400 hover:text-white p-0.5"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-bold text-white w-4 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.max_stock}
                              className="text-zinc-400 hover:text-white disabled:opacity-30 p-0.5"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer de Resumen y Checkout */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-zinc-800 bg-zinc-900/90 space-y-4">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal</span>
                    <span>{formattedTotal}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Despacho Exprés</span>
                    <span className="text-emerald-400 font-semibold">GRATIS</span>
                  </div>
                  <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-sm font-extrabold text-white">
                    <span>Total a Pagar</span>
                    <span className="text-lg text-purple-400">{formattedTotal}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={clearCart}
                    className="px-3 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-semibold transition-colors"
                  >
                    Vaciar
                  </button>
                  <button
                    onClick={() => setIsCheckoutOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-purple-600 to-orange-500 hover:opacity-95 shadow-neon-purple transition-all"
                  >
                    <span>Confirmar y Pagar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pago 100% seguro al recibir o transferencia</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Checkout */}
      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
    </>
  );
};
