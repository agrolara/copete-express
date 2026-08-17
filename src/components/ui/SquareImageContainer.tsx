'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Wine, Flame, Sparkles } from 'lucide-react';
import { formatImageUrl } from '@/lib/imageUtils';

interface SquareImageContainerProps {
  src: string;
  alt: string;
  objectFit?: 'cover' | 'contain';
  badgeText?: string;
  badgeType?: 'promo' | 'warning' | 'outOfStock' | 'category';
  className?: string;
}

export const SquareImageContainer: React.FC<SquareImageContainerProps> = ({
  src,
  alt,
  objectFit = 'cover',
  badgeText,
  badgeType = 'category',
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const formattedSrc = formatImageUrl(src);

  const getBadgeStyle = () => {
    switch (badgeType) {
      case 'promo':
        return 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-neon-orange';
      case 'warning':
        return 'bg-red-600/90 text-white animate-pulse shadow-neon-red border border-red-400/30';
      case 'outOfStock':
        return 'bg-zinc-800 text-zinc-400 border border-zinc-700';
      case 'category':
      default:
        return 'bg-purple-900/80 text-purple-200 border border-purple-500/30 backdrop-blur-md';
    }
  };

  return (
    <div
      className={`relative w-full aspect-square overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800/80 group ${className}`}
    >
      {/* Badge flotante en la esquina superior izquierda */}
      {badgeText && (
        <div className="absolute top-3 left-3 z-10">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full shadow-md ${getBadgeStyle()}`}
          >
            {badgeType === 'promo' && <Sparkles className="w-3.5 h-3.5" />}
            {badgeType === 'warning' && <Flame className="w-3.5 h-3.5" />}
            {badgeText}
          </span>
        </div>
      )}

      {/* Brillo de fondo estético neón */}
      <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-300 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/30 via-transparent to-transparent pointer-events-none" />

      {/* Renderizado de la imagen */}
      {!imageError && formattedSrc ? (
        <Image
          src={formattedSrc}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`transition-all duration-500 group-hover:scale-105 ${
            objectFit === 'contain' ? 'object-contain p-3' : 'object-cover'
          } ${loading ? 'scale-105 blur-sm grayscale' : 'scale-100 blur-0 grayscale-0'}`}
          onLoad={() => setLoading(false)}
          onError={() => setImageError(true)}
          unoptimized
        />
      ) : (
        /* Fallback elegante en caso de error de imagen o URL vacía */
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-zinc-600 p-4 text-center">
          <Wine className="w-12 h-12 mb-2 text-purple-500/50 group-hover:text-purple-400 transition-colors" />
          <span className="text-xs text-zinc-400 font-medium line-clamp-2">{alt}</span>
        </div>
      )}
    </div>
  );
};
