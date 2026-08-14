'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { X, CheckCircle2, AlertCircle, ShoppingBag, MapPin, Phone, User, Loader2, Send, MessageSquare } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const { cart, totalAmount, processCheckout } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');

  if (!isOpen) return null;

  const formattedTotal = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(totalAmount);

  // Número de WhatsApp configurado para recibir pedidos (Admin/Ventas)
  const targetWhatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '56912345678';

  const generateWhatsappMessage = () => {
    const itemsSummary = cart
      .map((item) => `• ${item.quantity}x ${item.name} - $${(item.price * item.quantity).toLocaleString('es-CL')}`)
      .join('\n');

    const message = `🍹 *NUEVO PEDIDO - COPETE EXPRESS*\n\n` +
      `👤 *Cliente:* ${customerName}\n` +
      `📱 *Teléfono:* ${customerPhone}\n` +
      `📍 *Dirección:* ${deliveryAddress}\n\n` +
      `🛒 *DETALLE DEL PEDIDO:*\n${itemsSummary}\n\n` +
      `💰 *TOTAL A PAGAR:* ${formattedTotal}\n\n` +
      `💬 *Mensaje:* Hola, acabo de realizar este pedido desde la web. Por favor envíenme los datos de transferencia para realizar el pago o coordinar la entrega.`;

    return `https://wa.me/${targetWhatsappNumber.replace('+', '').trim()}?text=${encodeURIComponent(message)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !deliveryAddress) {
      setErrorMessage('Por favor completa todos los campos de despacho.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      // Generar link de WhatsApp con el carrito actual
      const waUrl = generateWhatsappMessage();
      setWhatsappUrl(waUrl);

      // Procesar descuento atómico en base de datos y limpiar carrito
      const result = await processCheckout(customerName, customerPhone, deliveryAddress);
      if (result.success) {
        setIsSuccess(true);
        // Abrir automáticamente WhatsApp en nueva pestaña
        if (typeof window !== 'undefined') {
          window.open(waUrl, '_blank');
        }
      } else {
        setErrorMessage(result.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al procesar la compra.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    setIsSuccess(false);
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryAddress('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-extrabold text-white">Finalizar Pedido Exprés</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          /* Pantalla de Éxito de Compra + Botón WhatsApp */
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-neon-purple animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-black text-white">¡Pedido Registrado con Éxito! 🎉</h4>
            <p className="text-xs text-zinc-300 max-w-xs mx-auto">
              Gracias <strong>{customerName}</strong>. El inventario fue actualizado. Para coordinar el pago o solicitar los datos de transferencia, envía el detalle por WhatsApp.
            </p>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-left text-xs space-y-2">
              <div className="flex justify-between text-zinc-400">
                <span>Cliente:</span>
                <span className="text-white font-semibold">{customerName}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Dirección de Despacho:</span>
                <span className="text-white font-semibold">{deliveryAddress}</span>
              </div>
              <div className="flex justify-between text-zinc-400 pt-2 border-t border-zinc-800">
                <span>Total Pedido:</span>
                <span className="text-emerald-400 font-extrabold text-sm">{formattedTotal}</span>
              </div>
            </div>

            {/* BOTÓN WHATSAPP DESTACADO */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all border border-emerald-400/30"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>Enviar Pedido a WhatsApp (+56 9 ...)</span>
              <Send className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={handleFinish}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-bold text-zinc-300 hover:text-white text-xs transition-all"
            >
              Volver a la Tienda
            </button>
          </div>
        ) : (
          /* Formulario de Datos de Cliente */
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Nombre Completo</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Ej: Juan Pérez"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Teléfono Móvil (WhatsApp)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="+56 9 1234 5678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Dirección de Entrega Exacta</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <textarea
                    required
                    rows={2}
                    placeholder="Ej: Av. Providencia 1234, Dpto 502, Providencia"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Resumen corto de ítems e instrucción WhatsApp */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex justify-between text-xs text-zinc-400 font-medium">
                <span>Total Pedido ({cart.length} tipos de producto):</span>
                <span className="text-white font-extrabold">{formattedTotal}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/30">
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span>Al hacer clic, se abrirá WhatsApp con el desglose para enviártelo al vendedor y recibir los datos de transferencia.</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-95 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    <span>Enviar a WhatsApp ({formattedTotal})</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
