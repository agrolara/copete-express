'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/shop/ProductCard';
import { PromotionCard } from '@/components/shop/PromotionCard';
import { useCart } from '@/context/CartContext';
import { Sparkles, Flame, Wine, ShieldCheck, Zap, ArrowRight, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
  const { products, promotions } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  // Filtrado de productos por categoría y término de búsqueda
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'Todos' ||
      selectedCategory === 'Promos' ||
      p.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // Filtrado de promociones
  const filteredPromotions = promotions.filter((promo) => {
    return (
      promo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promo.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Identificar productos en stock crítico (< 3) para banner destacado
  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock < 3);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header / Navbar con búsqueda y categorías */}
      <Navbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
        {/* HERO BANNER DINÁMICO */}
        {selectedCategory === 'Todos' && !searchTerm && (
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950 via-zinc-900 to-orange-950 border border-purple-500/30 p-6 md:p-10 shadow-2xl">
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-extrabold tracking-wider uppercase">
                  <Zap className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                  <span>Despacho Exprés 24/7 en Chile</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
                  Tu Previa Organizada en <span className="bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">Minutos</span>
                </h1>
                <p className="text-sm text-zinc-300 max-w-md leading-relaxed">
                  Licores fríos, hielo y los mejores packs promocionales entregados en la puerta de tu casa en menos de 45 minutos.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => setSelectedCategory('Promos')}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-orange-500 text-white font-extrabold text-xs shadow-neon-purple hover:opacity-95 transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    Ver Packs Promocionales
                  </button>
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 bg-zinc-900/80 px-4 py-3 rounded-2xl border border-zinc-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Pago al recibir o Transferencia</span>
                  </div>
                </div>
              </div>

              {/* Imagen destacada del Pack Principal */}
              <div className="relative aspect-square max-w-sm mx-auto w-full rounded-3xl overflow-hidden border-2 border-purple-500/40 shadow-neon-purple group">
                <Image
                  src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80"
                  alt="Pack Previa Exprès"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-5 flex flex-col justify-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                    MÁS VENDIDO DE LA SEMANA
                  </span>
                  <h3 className="text-lg font-black text-white">Pack Piscola Suprema 1L</h3>
                  <p className="text-xs text-zinc-300">Pisco Alto 1L + Coca 1.5L + Hielo 2kg por $11.990</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ALERTA VISUAL DE STOCK CRÍTICO (< 3) PARA CLIENTES */}
        {lowStockProducts.length > 0 && selectedCategory === 'Todos' && (
          <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 backdrop-blur-md flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-600/30 text-red-400 shrink-0 animate-pulse">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                  ¡Últimas Unidades Disponibles! 🔥
                </h4>
                <p className="text-xs text-zinc-300">
                  Quedan menos de 3 unidades de: {lowStockProducts.map((p) => p.name).join(', ')}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN DE PROMOCIONES Y PACKS (SI CORRESPONDE) */}
        {(selectedCategory === 'Todos' || selectedCategory === 'Promos') && filteredPromotions.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-400" />
                <h2 className="text-xl font-extrabold text-white tracking-tight">Packs & Promociones</h2>
              </div>
              <span className="text-xs text-zinc-400 font-medium">
                Descuento directo al comprar en combo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPromotions.map((promo) => (
                <PromotionCard key={promo.id} promotion={promo} />
              ))}
            </div>
          </section>
        )}

        {/* SECCIÓN DE PRODUCTOS INDIVIDUALES */}
        {selectedCategory !== 'Promos' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wine className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  {selectedCategory === 'Todos' ? 'Catálogo de Licores' : selectedCategory}
                </h2>
              </div>
              <span className="text-xs text-zinc-400 font-medium">
                {filteredProducts.length} licores listos para despacho
              </span>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="py-12 text-center bg-zinc-900/50 rounded-3xl border border-zinc-800 space-y-2">
                <Wine className="w-10 h-10 mx-auto text-zinc-600" />
                <h3 className="text-sm font-bold text-zinc-300">No se encontraron productos</h3>
                <p className="text-xs text-zinc-500">Prueba ajustando el término de búsqueda o la categoría.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
