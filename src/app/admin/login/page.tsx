'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wine, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validación de prueba para el panel de Super Administrador
    setTimeout(() => {
      if (email && password) {
        // Guardar sesión de admin en localStorage
        localStorage.setItem(
          'copete_admin_session',
          JSON.stringify({ email, role: 'admin', loggedInAt: new Date().toISOString() })
        );
        router.push('/admin');
      } else {
        setError('Credenciales inválidas de Supabase Auth.');
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-orange-500 flex items-center justify-center text-white mx-auto shadow-neon-purple">
            <Wine className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Super Administrador</h1>
          <p className="text-xs text-zinc-400">Acceso exclusivo para gestión de inventario y analítica</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="admin@copeteexpress.cl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-orange-500 hover:opacity-95 shadow-neon-purple transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Ingresando...' : 'Iniciar Sesión Admin'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <Link href="/" className="hover:text-white transition-colors">
            ← Volver a la Tienda
          </Link>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Supabase Auth
          </span>
        </div>
      </div>
    </div>
  );
}
