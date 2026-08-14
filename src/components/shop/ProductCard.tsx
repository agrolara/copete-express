'use client';

import React from 'react';
import { Product } from '@/types';
import { SquareImageContainer } from '@/components/ui/SquareImageContainer';
import { useCart } from '@/context/CartContext';
import { Plus, ShoppingBag, AlertTriangle, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, cart } = useCart();

  const isLowStock = product.stock > 0 && product.stock < 3;
  const isOutOfStock = product.stock <= 0;

  const cartItem = cart.find((ci) => ci.id === product.id && ci.type === 'product');
  const cartQty = cartItem ? cartItem.quantity : 0;

  const handleAdd = () => {
    if (!isOutOfStock) {
      addToCart(product, 'product');
    }
  };

  const formattedPrice = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(product.price);

  return (
    <div className="group relative bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800/90 hover:border-purple-500/40 rounded-2xl p-3 flex flex-col justify-between transition-all duration-300 hover:shadow-neon-purple">
      {/* Contenedor Cuadrado de Imagen (1:1) - Requisito Crítico UI/UX */}
      <SquareImageContainer
        src={product.image_url}
        alt={product.name}
        objectFit="cover"
        badgeText={
          isOutOfStock
            ? 'Agotado'
            : isLowStock
            ? `¡Quedan ${product.stock}! 🔥`
            : product.category
        }
        badgeType={isOutOfStock ? 'outOfStock' : isLowStock ? 'warning' : 'category'}
      />

      {/* Información del Producto */}
      <div className="mt-3 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-purple-400">
            {product.category}
          </span>
          <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2 mt-0.5">
            {product.name}
          </h3>
          <p className="text-xs text-zinc-400 line-clamp-2 mt-1 min-h-[2rem]">
            {product.description}
          </p>
        </div>

        {/* Alerta Visual de Bajo Stock (< 3 Unidades) - Requisito Módulo 4 */}
        {isLowStock && (
          <div className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-[11px] font-semibold animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>Stock crítico: {product.stock} un. disponibles</span>
          </div>
        )}

        {/* Precio y Botón de Acción */}
        <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
          <div>
            <span className="text-xs text-zinc-500 block leading-none">Precio</span>
            <span className="text-base font-extrabold text-white">{formattedPrice}</span>
          </div>

          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`relative flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              isOutOfStock
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                : cartQty > 0
                ? 'bg-purple-600 text-white shadow-neon-purple hover:bg-purple-500'
                : 'bg-gradient-to-r from-purple-600 to-orange-500 text-white hover:opacity-90 shadow-md'
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
                <span>Agregar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
