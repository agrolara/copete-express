'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Sparkles,
  ShoppingBag,
  LogOut,
  Wine,
  Menu,
  X,
  Store,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // Si estamos en la página de login, no forzar redirección
    if (pathname === '/admin/login') {
      setAuthenticated(true);
      return;
    }

    const session = localStorage.getItem('copete_admin_session');
    if (!session) {
      router.push('/admin/login');
    } else {
      setAuthenticated(true);
    }
  }, [pathname, router]);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-zinc-400 text-xs">
        Cargando Panel de Administración...
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('copete_admin_session');
    router.push('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard & Analítica', href: '/admin', icon: LayoutDashboard },
    { name: 'Productos e Inventario', href: '/admin/products', icon: Package },
    { name: 'Promociones (Packs)', href: '/admin/promotions', icon: Sparkles },
    { name: 'Historial de Ventas', href: '/admin/sales', icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Mobile Header Sidebar Toggle */}
      <div className="md:hidden bg-zinc-950 border-b border-zinc-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white">
            <Wine className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-white text-sm">Copete Express Admin</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          sidebarOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-zinc-950 border-r border-zinc-800/80 p-5 flex flex-col justify-between shrink-0 z-30`}
      >
        <div className="space-y-6">
          {/* Brand */}
          <div className="hidden md:flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-orange-500 flex items-center justify-center text-white shadow-neon-purple">
              <Wine className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-white block">COPETE EXPRESS</span>
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">
                Panel Administrador
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-neon-purple'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-zinc-900 space-y-2">
          <Link
            href="/"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium border border-zinc-800 transition-colors"
          >
            <Store className="w-4 h-4 text-orange-400" />
            <span>Ir a Tienda Pública</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-semibold border border-red-500/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
