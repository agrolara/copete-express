'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Sale } from '@/types';
import { ShoppingBag, Search, Calendar, User, Phone, MapPin, CheckCircle2, Eye, X, Trash2, RotateCcw } from 'lucide-react';

export default function AdminSalesPage() {
  const { sales, deleteSale } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const filteredSales = sales.filter(
    (s) =>
      s.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.delivery_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteSale = (saleId: string) => {
    if (confirm('¿Deseas eliminar esta venta y restaurar automáticamente el stock de sus productos al inventario?')) {
      deleteSale(saleId, true);
      if (selectedSale?.id === saleId) {
        setSelectedSale(null);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-orange-400" />
            Historial de Ventas & Transacciones
          </h1>
          <p className="text-xs text-zinc-400">
            Registro dinámico de ventas. Puedes eliminar o revertir pedidos para devolver el stock atrapado al inventario.
          </p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Buscar por cliente, dirección o ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Tabla de Ventas */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          {filteredSales.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs">
              No hay ventas registradas en el historial.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">ID Venta</th>
                  <th className="p-4">Fecha & Hora</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Teléfono</th>
                  <th className="p-4">Dirección</th>
                  <th className="p-4">Monto Total</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="p-4 font-mono text-[11px] text-purple-400">{sale.id.substring(0, 8)}...</td>
                    <td className="p-4 text-zinc-400">
                      {new Date(sale.created_at).toLocaleString('es-CL', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-4 font-bold text-white">{sale.customer_name}</td>
                    <td className="p-4 text-zinc-400">{sale.customer_phone}</td>
                    <td className="p-4 text-zinc-400 max-w-xs truncate">{sale.delivery_address}</td>
                    <td className="p-4 font-extrabold text-white">
                      ${sale.total_amount.toLocaleString('es-CL')}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Completado
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="p-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSale(sale.id)}
                        className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-400 transition-colors"
                        title="Eliminar venta y devolver stock"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Detalle de Venta */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-extrabold text-white">Detalle de Venta</h3>
              <button onClick={() => setSelectedSale(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">ID Venta:</span>
                  <span className="font-mono text-purple-400">{selectedSale.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Cliente:</span>
                  <span className="font-bold text-white">{selectedSale.customer_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Teléfono:</span>
                  <span className="text-white">{selectedSale.customer_phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Dirección:</span>
                  <span className="text-white font-medium">{selectedSale.delivery_address}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">Ítems Comprados:</h4>
                <div className="space-y-1.5">
                  {selectedSale.items?.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex justify-between items-center"
                    >
                      <div>
                        <span className="font-bold text-white block">{item.item_name}</span>
                        <span className="text-zinc-500 text-[10px]">
                          {item.quantity} unit. x ${item.unit_price.toLocaleString('es-CL')}
                        </span>
                      </div>
                      <span className="font-extrabold text-purple-400">
                        ${(item.quantity * item.unit_price).toLocaleString('es-CL')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-between items-center text-sm">
                <span className="font-bold text-white">Total Pagado:</span>
                <span className="text-lg font-black text-purple-400">
                  ${selectedSale.total_amount.toLocaleString('es-CL')}
                </span>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleDeleteSale(selectedSale.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 font-bold text-xs transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Eliminar Venta y Revertir Stock al Inventario</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
