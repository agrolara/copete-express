'use client';

import React from 'react';
import { Wine, ShieldCheck, Clock, Truck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 text-zinc-400 py-10 px-4 mt-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Columna 1: Brand */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-orange-500 flex items-center justify-center text-white">
              <Wine className="w-5 h-5" />
            </div>
            <span className="text-base font-extrabold text-white">COPETE EXPRESS</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
            Tu botillería digital de confianza. Entregas Express de piscos, cervezas, destilados y packs promocionales directo a tu fiesta.
          </p>
        </div>

        {/* Columna 2: Garantías */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Ventajas Express</h4>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center gap-2 text-zinc-300">
              <Clock className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Despacho en 30 a 45 minutos</span>
            </li>
            <li className="flex items-center gap-2 text-zinc-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Productos 100% Originales y Sellados</span>
            </li>
            <li className="flex items-center gap-2 text-zinc-300">
              <Truck className="w-4 h-4 text-orange-400 shrink-0" />
              <span>Seguimiento y Pago al Recibir</span>
            </li>
          </ul>
        </div>

        {/* Columna 3: Categorías Rápidas */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Categorías Populares</h4>
          <div className="grid grid-cols-2 gap-1 text-xs text-zinc-400">
            <span>• Piscos Chilenos</span>
            <span>• Six-Packs Cerveza</span>
            <span>• Whiskies & Vodka</span>
            <span>• Vinos Reserva</span>
            <span>• Hielo Purificado</span>
            <span>• Packs Piscola</span>
          </div>
        </div>

        {/* Columna 4: Infraestructura y Responsabilidad */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Despliegue & Infraestructura</h4>
          <p className="text-xs text-zinc-500">
            Powered by <strong>Coolify VPS</strong> + <strong>Supabase Self-Hosted</strong> (PostgreSQL & Storage).
          </p>
          <div className="pt-2 text-[10px] text-zinc-600 border-t border-zinc-900">
            * Venta prohibida a menores de 18 años. Consume con responsabilidad.
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-2">
        <span>© {new Date().getFullYear()} Copete Express. Todos los derechos reservados.</span>
        <span className="flex items-center gap-1">
          Hecho con <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" /> para la previa perfecta.
        </span>
      </div>
    </footer>
  );
};
