'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, Search, ShieldAlert, Sparkles, Flame, Menu, X, Wine } from 'lucide-react';

interface NavbarProps {
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchTerm = '',
  onSearchChange,
  selectedCategory = 'Todos',
  onSelectCategory,
}) => {
  const { totalItems, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const categories = ['Todos', 'Promos', 'Piscos', 'Cervezas', 'Destilados', 'Vinos', 'Bebidas & Hielo'];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-zinc-950/80 border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo Brand */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-purple-500 to-orange-500 flex items-center justify-center shadow-neon-purple group-hover:scale-105 transition-transform">
              <Wine className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-zinc-200 to-purple-400 bg-clip-text text-transparent">
                COPETE<span className="text-orange-500">EXPRESS</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest block font-bold text-purple-400 -mt-1">
                Licores 24/7
              </span>
            </div>
          </Link>

          {/* Search bar (Desktop & Tablet) */}
          {onSearchChange && (
            <div className="hidden md:flex flex-1 max-w-md relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Buscar piscos, cervezas, packs, whisky..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              />
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Admin Panel Button */}
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-purple-400 transition-all"
            >
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Panel Admin</span>
            </Link>

            {/* Cart Trigger Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 text-white font-extrabold text-xs shadow-neon-purple hover:opacity-95 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Carro</span>
              {totalItems > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-purple-900 font-black text-[11px] flex items-center justify-center shadow-md">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Search bar en móvil */}
        {onSearchChange && (
          <div className="md:hidden pb-3">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Buscar licores o packs..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Category Pills Header Nav */}
      {onSelectCategory && (
        <div className="border-t border-zinc-800/60 bg-zinc-950/60 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white shadow-neon-purple'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800'
                }`}
              >
                {cat === 'Promos' && <Sparkles className="w-3 h-3 inline mr-1 text-orange-400" />}
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
