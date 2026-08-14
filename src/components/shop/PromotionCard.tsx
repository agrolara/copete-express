'use client';

import React from 'react';
import { Promotion } from '@/types';
import { SquareImageContainer } from '@/components/ui/SquareImageContainer';
import { useCart } from '@/context/CartContext';
import { Sparkles, Plus, Check, PackageCheck } from 'lucide-react';

interface PromotionCardProps {
  promotion: Promotion;
}

export const PromotionCard: React.FC<PromotionCardProps> = ({ promotion }) => {
  const { addToCart, cart, products } = useCart();

  // Calcular disponibilidad real del pack según stock individual
  let maxPacksAvailable = 99;
  if (promotion.items && promotion.items.length > 0) {
    const packs = promotion.items.map((pi) => {
      const prod = products.find((p) => p.id === pi.product_id);
      if (!prod || prod.stock < pi.quantity) return 0;
      return Math.floor(prod.stock / pi.quantity);
    });
    maxPacksAvailable = Math.min(...packs);
  }

  const isOutOfStock = maxPacksAvailable <= 0;
  const cartItem = cart.find((ci) => ci.id === promotion.id && ci.type === 'promotion');
  const cartQty = cartItem ? cartItem.quantity : 0;

  const formattedPrice = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(promotion.promo_price);

  const handleAdd = () => {
    if (!isOutOfStock) {
      addToCart(promotion, 'promotion');
    }
  };

  return (
    <div className="group relative bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-purple-950/20 border-2 border-orange-500/40 hover:border-orange-400 rounded-2xl p-3 flex flex-col justify-between transition-all duration-300 hover:shadow-neon-orange">
      {/* Badge de Oferta Exclusiva */}
      <div className="absolute -top-3 -right-2 z-20">
        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-neon-orange animate-bounce">
          <Sparkles className="w-3 h-3" /> PACK PROMO
        </span>
      </div>

      {/* Contenedor Cuadrado de Imagen (1:1) */}
      <SquareImageContainer
        src={promotion.image_url}
        alt={promotion.name}
        objectFit="cover"
        badgeText={isOutOfStock ? 'Pack Agotado' : `Quedan ${maxPacksAvailable} Packs`}
        badgeType={isOutOfStock ? 'outOfStock' : 'promo'}
      />

      {/* Contenido de la Promoción */}
      <div className="mt-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-extrabold text-white group-hover:text-orange-300 transition-colors line-clamp-1">
            {promotion.name}
          </h3>
          <p className="text-xs text-zinc-300 line-clamp-2 mt-1 min-h-[2.2rem]">
            {promotion.description}
          </p>

          {/* Resumen de contenido del Pack */}
          <div className="mt-2.5 p-2 rounded-xl bg-zinc-950/60 border border-zinc-800 text-[11px] text-zinc-300 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-orange-400">
              <PackageCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Incluye en este Pack:</span>
            </div>
            <p className="text-zinc-400 text-[10px] pl-5 leading-tight">
              {promotion.description}
            </p>
          </div>
        </div>

        {/* Precio del Pack y Botón de Añadir */}
        <div className="mt-4 pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-orange-400 font-semibold block uppercase">Precio Pack</span>
            <span className="text-lg font-black text-white">{formattedPrice}</span>
          </div>

          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`relative flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              isOutOfStock
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                : cartQty > 0
                ? 'bg-orange-600 text-white shadow-neon-orange hover:bg-orange-500'
                : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:opacity-90 shadow-neon-orange'
            }`}
          >
            {cartQty > 0 ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>En Carro ({cartQty})</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Llevar Pack</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
