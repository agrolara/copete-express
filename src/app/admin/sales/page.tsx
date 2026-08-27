'use client';

import React, { useState, useMemo } from 'react';
import { useCart } from '@/context/CartContext';
import { Sale, SaleItem } from '@/types';
import {
  ShoppingBag,
  Search,
  Calendar,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  X,
  Trash2,
  RotateCcw,
  TrendingUp,
  DollarSign,
  Edit2,
  Plus,
  Check,
  CheckSquare,
} from 'lucide-react';

type TimeFilter = 'day' | 'week' | 'month' | 'specific_date' | 'all';
type StatusFilter = 'all' | 'completed' | 'pending' | 'cancelled';

export default function AdminSalesPage() {
  const { sales, deleteSale, confirmPendingOrder, updateSale, products } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('current');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  // Estados para Modal de Edición de Venta
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editDeliveryAddress, setEditDeliveryAddress] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<'transferencia' | 'efectivo'>('transferencia');
  const [editItems, setEditItems] = useState<SaleItem[]>([]);
  const [selectedNewProductId, setSelectedNewProductId] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Generar lista dinámica de meses disponibles en el historial (Mes Actual + Meses Anteriores)
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    monthsSet.add(currentKey);

    sales.forEach((s) => {
      const d = new Date(s.created_at);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthsSet.add(monthKey);
    });

    return Array.from(monthsSet)
      .sort()
      .reverse()
      .map((key) => {
        const [y, m] = key.split('-');
        const dateObj = new Date(parseInt(y), parseInt(m) - 1, 1);
        const label = dateObj.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
        return { key, label: label.charAt(0).toUpperCase() + label.slice(1) };
      });
  }, [sales]);

  const filteredSales = useMemo(() => {
    const now = new Date();

    return sales.filter((s) => {
      const saleDate = new Date(s.created_at);

      // Filtro de Estado
      if (statusFilter !== 'all') {
        const currentStatus = s.status || 'completed';
        if (currentStatus !== statusFilter) return false;
      }

      // Filtro de Fecha
      let matchesTime = true;
      if (timeFilter === 'day') {
        matchesTime =
          saleDate.getDate() === now.getDate() &&
          saleDate.getMonth() === now.getMonth() &&
          saleDate.getFullYear() === now.getFullYear();
      } else if (timeFilter === 'specific_date' && selectedDate) {
        const [targetYear, targetMonth, targetDay] = selectedDate.split('-').map(Number);
        matchesTime =
          saleDate.getFullYear() === targetYear &&
          saleDate.getMonth() + 1 === targetMonth &&
          saleDate.getDate() === targetDay;
      } else if (timeFilter === 'week') {
        const diffTime = Math.abs(now.getTime() - saleDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        matchesTime = diffDays <= 7;
      } else if (timeFilter === 'month') {
        if (selectedMonth && selectedMonth !== 'all' && selectedMonth !== 'current') {
          const [targetYear, targetMonth] = selectedMonth.split('-').map(Number);
          matchesTime =
            saleDate.getFullYear() === targetYear &&
            saleDate.getMonth() + 1 === targetMonth;
        } else {
          matchesTime =
            saleDate.getMonth() === now.getMonth() &&
            saleDate.getFullYear() === now.getFullYear();
        }
      }

      // Filtro Búsqueda
      const matchesSearch =
        s.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.customer_phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.delivery_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesTime && matchesSearch;
    });
  }, [sales, timeFilter, statusFilter, selectedMonth, selectedDate, searchTerm]);

  const handleDeleteSale = (saleId: string) => {
    if (confirm('¿Deseas eliminar esta venta? Si estaba completada, se restaurará automáticamente el stock de sus productos.')) {
      deleteSale(saleId, true);
      if (selectedSale?.id === saleId) {
        setSelectedSale(null);
      }
    }
  };

  const handleConfirmSale = async (saleId: string) => {
    const res = await confirmPendingOrder(saleId);
    if (!res.success) {
      alert(res.message);
    } else if (selectedSale?.id === saleId) {
      setSelectedSale((prev) => (prev ? { ...prev, status: 'completed' } : null));
    }
  };

  const handleOpenEdit = (sale: Sale) => {
    setEditingSale(sale);
    setEditCustomerName(sale.customer_name);
    setEditCustomerPhone(sale.customer_phone);
    setEditDeliveryAddress(sale.delivery_address);
    setEditPaymentMethod(sale.payment_method || 'transferencia');
    setEditItems(sale.items ? JSON.parse(JSON.stringify(sale.items)) : []);
    setSelectedNewProductId('');
  };

  const handleUpdateItemQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      setEditItems((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    setEditItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: newQty } : item))
    );
  };

  const handleRemoveItem = (index: number) => {
    setEditItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddProductToSale = (productId: string) => {
    if (!productId) return;
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const existingIndex = editItems.findIndex((it) => it.product_id === productId);
    if (existingIndex > -1) {
      handleUpdateItemQty(existingIndex, editItems[existingIndex].quantity + 1);
    } else {
      setEditItems((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sale_id: editingSale?.id || '',
          product_id: prod.id,
          item_name: prod.name,
          unit_price: prod.price,
          cost_price: prod.cost_price,
          quantity: 1,
        },
      ]);
    }
    setSelectedNewProductId('');
  };

  const handleSaveEditedSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;
    if (editItems.length === 0) {
      alert('La venta debe tener al menos un producto.');
      return;
    }

    setIsSavingEdit(true);
    try {
      const subtotal = editItems.reduce((sum, it) => sum + it.unit_price * it.quantity, 0);
      let discountAmount = 0;
      if (editingSale.discount_type === 'percentage' && editingSale.discount_value) {
        discountAmount = Math.round((subtotal * Math.min(100, editingSale.discount_value)) / 100);
      } else if (editingSale.discount_type === 'fixed' && editingSale.discount_value) {
        discountAmount = Math.min(subtotal, editingSale.discount_value);
      }
      const finalTotal = Math.max(0, subtotal - discountAmount);

      const updated: Sale = {
        ...editingSale,
        customer_name: editCustomerName.trim(),
        customer_phone: editCustomerPhone.trim(),
        delivery_address: editDeliveryAddress.trim(),
        payment_method: editPaymentMethod,
        subtotal_amount: subtotal,
        discount_amount: discountAmount,
        total_amount: finalTotal,
        items: editItems,
      };

      const res = await updateSale(updated);
      if (res.success) {
        setEditingSale(null);
        if (selectedSale?.id === updated.id) {
          setSelectedSale(updated);
        }
      } else {
        alert(res.message);
      }
    } finally {
      setIsSavingEdit(false);
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
            Filtra ventas por día, semana o meses anteriores. Elimina o revierte pedidos para devolver el stock al inventario.
          </p>
        </div>

        {/* Filtros Temporales (Día, Semana, Mes Específico/Anterior, Todo) */}
        <div className="flex flex-wrap items-center gap-1.5 bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setTimeFilter('day')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeFilter === 'day'
                ? 'bg-purple-600 text-white shadow-neon-purple'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Hoy (Día)
          </button>
          <button
            onClick={() => setTimeFilter('week')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeFilter === 'week'
                ? 'bg-purple-600 text-white shadow-neon-purple'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Esta Semana
          </button>
          <button
            onClick={() => {
              setTimeFilter('month');
              if (selectedMonth === 'all') setSelectedMonth('current');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeFilter === 'month'
                ? 'bg-purple-600 text-white shadow-neon-purple'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Por Mes
          </button>

          {/* SELECTOR DESPLEGABLE DE MESES ANTERIORES */}
          <select
            value={timeFilter === 'month' ? selectedMonth : 'all'}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'all') {
                setTimeFilter('all');
                setSelectedMonth('all');
              } else {
                setTimeFilter('month');
                setSelectedMonth(val);
              }
            }}
            className="px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs font-bold text-white focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="all">📅 Seleccionar Mes Anterior...</option>
            {availableMonths.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>

          {/* SELECTOR DE DÍA ESPECÍFICO / DÍAS ANTERIORES */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-all ${
              timeFilter === 'specific_date'
                ? 'bg-purple-950/80 border-purple-500 shadow-neon-purple text-white'
                : 'bg-zinc-950 border-zinc-700 text-zinc-300'
            }`}
          >
            <span className="text-[11px] font-bold text-purple-300">📅 Día:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(e.target.value);
                  setTimeFilter('specific_date');
                }
              }}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => {
              setTimeFilter('all');
              setSelectedMonth('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeFilter === 'all'
                ? 'bg-purple-600 text-white shadow-neon-purple'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Histórico Todo
          </button>
        </div>
      </div>

      {/* Barra de Filtro de Estado & Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filtros por Estado */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-2xl overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-purple-600 text-white shadow-neon-purple'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Todos ({sales.length})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Completados ({sales.filter((s) => s.status === 'completed' || !s.status).length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Web Pendientes ({sales.filter((s) => s.status === 'pending').length})
          </button>
          <button
            onClick={() => setStatusFilter('cancelled')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'cancelled'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Cancelados ({sales.filter((s) => s.status === 'cancelled').length})
          </button>
        </div>

        {/* Input de Búsqueda */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por cliente, teléfono, dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Tabla de Ventas */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          {filteredSales.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs">
              No hay ventas registradas para los filtros seleccionados.
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
                    <td className="p-4">
                      <div className="font-extrabold text-white">
                        ${sale.total_amount.toLocaleString('es-CL')}
                      </div>
                      {sale.discount_amount && sale.discount_amount > 0 ? (
                        <span className="inline-block text-[10px] text-amber-400 font-bold bg-amber-950/50 px-1.5 py-0.5 rounded-md border border-amber-500/30">
                          Dto: -${sale.discount_amount.toLocaleString('es-CL')} {sale.discount_type === 'percentage' ? `(${sale.discount_value}%)` : ''}
                        </span>
                      ) : null}
                    </td>
                    <td className="p-4">
                      {sale.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                          <Clock className="w-3 h-3" /> Web Pendiente
                        </span>
                      ) : sale.status === 'cancelled' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold">
                          <XCircle className="w-3 h-3" /> Cancelado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Completado
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-1.5">
                      {sale.status === 'pending' && (
                        <button
                          onClick={() => handleConfirmSale(sale.id)}
                          className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white transition-colors"
                          title="Confirmar pedido y descontar stock"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEdit(sale)}
                        className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors"
                        title="Editar datos del cliente y productos"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="p-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white transition-colors"
                        title="Ver detalle de costos y ganancia"
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

      {/* MODAL DETALLE DE VENTA CON COSTOS Y MÁRGENES */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-400" />
                <h3 className="text-base font-extrabold text-white">Detalle de Venta</h3>
              </div>
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
                  <span className="text-zinc-400">Estado:</span>
                  <span className="font-bold">
                    {selectedSale.status === 'pending' ? (
                      <span className="text-amber-400">🟡 Web Pendiente de Confirmar</span>
                    ) : selectedSale.status === 'cancelled' ? (
                      <span className="text-red-400">🔴 Cancelado</span>
                    ) : (
                      <span className="text-emerald-400">🟢 Completado</span>
                    )}
                  </span>
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
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Forma de Pago:</span>
                  <span className="text-white font-medium">
                    {selectedSale.payment_method === 'efectivo' ? '💵 Efectivo al Recibir' : '🏦 Transferencia'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">Ítems Comprados:</h4>
                <div className="space-y-1.5">
                  {selectedSale.items?.map((item) => {
                    const prod = products.find((p) => p.id === item.product_id);
                    const costUnit = prod?.cost_price || item.cost_price || Math.round(item.unit_price * 0.6);
                    const totalItemRev = item.unit_price * item.quantity;
                    const totalItemCost = costUnit * item.quantity;
                    const itemProfit = totalItemRev - totalItemCost;

                    return (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex justify-between items-center"
                      >
                        <div>
                          <span className="font-bold text-white block">{item.item_name}</span>
                          <span className="text-zinc-500 text-[10px]">
                            {item.quantity} un. x ${item.unit_price.toLocaleString('es-CL')} (Costo: ${costUnit.toLocaleString('es-CL')})
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-purple-400 block">
                            ${totalItemRev.toLocaleString('es-CL')}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-bold">
                            +${itemProfit.toLocaleString('es-CL')} ganancia
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Desglose Subtotal, Descuento y Total */}
              <div className="pt-3 border-t border-zinc-800 space-y-1.5 text-xs">
                {selectedSale.subtotal_amount && selectedSale.subtotal_amount !== selectedSale.total_amount && (
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal ítems:</span>
                    <span className="font-mono font-bold text-white">${selectedSale.subtotal_amount.toLocaleString('es-CL')}</span>
                  </div>
                )}
                {selectedSale.discount_amount && selectedSale.discount_amount > 0 && (
                  <div className="flex justify-between text-amber-400 font-semibold">
                    <span>Descuento aplicado {selectedSale.discount_type === 'percentage' ? `(${selectedSale.discount_value}%)` : ''}:</span>
                    <span className="font-mono font-bold">-${selectedSale.discount_amount.toLocaleString('es-CL')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm pt-1 border-t border-zinc-800">
                  <span className="font-bold text-white">Total Cobrado:</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    ${selectedSale.total_amount.toLocaleString('es-CL')}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                {selectedSale.status === 'pending' && (
                  <button
                    onClick={() => handleConfirmSale(selectedSale.id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-extrabold text-xs shadow-md transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirmar Pedido y Descontar Stock de Bodega</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    const toEdit = selectedSale;
                    setSelectedSale(null);
                    handleOpenEdit(toEdit);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-300 hover:text-white font-bold text-xs transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Editar Datos del Cliente / Productos Pedidos</span>
                </button>
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

      {/* MODAL PARA EDITAR VENTA (CLIENTE, TELÉFONO, DIRECCIÓN E ÍTEMS) */}
      {editingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-base font-extrabold text-white">Editar Datos de Venta</h3>
                  <span className="text-[10px] text-zinc-500 font-mono">ID: {editingSale.id}</span>
                </div>
              </div>
              <button onClick={() => setEditingSale(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedSale} className="space-y-4 text-xs">
              {/* DATOS DEL CLIENTE */}
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">
                  Información del Cliente
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 font-medium mb-1">Nombre Cliente *</label>
                    <input
                      type="text"
                      required
                      value={editCustomerName}
                      onChange={(e) => setEditCustomerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-medium mb-1">Teléfono WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      value={editCustomerPhone}
                      onChange={(e) => setEditCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Dirección de Despacho *</label>
                  <input
                    type="text"
                    required
                    value={editDeliveryAddress}
                    onChange={(e) => setEditDeliveryAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Forma de Pago</label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e) => setEditPaymentMethod(e.target.value as 'transferencia' | 'efectivo')}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="transferencia">🏦 Transferencia Bancaria</option>
                    <option value="efectivo">💵 Efectivo al Recibir</option>
                  </select>
                </div>
              </div>

              {/* PRODUCTOS E ÍTEMS PEDIDOS */}
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                    Productos del Pedido
                  </span>
                  <span className="text-[10px] text-zinc-500 font-bold">
                    {editItems.length} {editItems.length === 1 ? 'producto' : 'productos'}
                  </span>
                </div>

                {/* Lista de Ítems editables */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {editItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-white truncate block">{item.item_name}</span>
                        <span className="text-[11px] text-purple-400 font-mono">
                          ${item.unit_price.toLocaleString('es-CL')} c/u
                        </span>
                      </div>

                      {/* Control de Cantidad */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQty(idx, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center transition-colors"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-mono font-black text-white text-xs">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQty(idx, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center transition-colors"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-400 transition-colors ml-1"
                          title="Eliminar ítem"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dropdown para agregar producto adicional */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-2">
                  <select
                    value={selectedNewProductId}
                    onChange={(e) => setSelectedNewProductId(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">+ Seleccionar Producto para Agregar...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${p.price.toLocaleString('es-CL')} - Stock: {p.stock} un.)
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!selectedNewProductId}
                    onClick={() => handleAddProductToSale(selectedNewProductId)}
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>

              {/* RESUMEN TOTALES EDITADOS */}
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal Ítems:</span>
                  <span className="font-mono font-bold text-white">
                    ${editItems.reduce((s, it) => s + it.unit_price * it.quantity, 0).toLocaleString('es-CL')}
                  </span>
                </div>
                {editingSale.discount_amount && editingSale.discount_amount > 0 ? (
                  <div className="flex justify-between text-amber-400 font-semibold">
                    <span>Descuento aplicado:</span>
                    <span className="font-mono font-bold">
                      -${editingSale.discount_amount.toLocaleString('es-CL')}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between items-center text-sm pt-2 border-t border-zinc-800">
                  <span className="font-bold text-white">Nuevo Total de Venta:</span>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    ${Math.max(
                      0,
                      editItems.reduce((s, it) => s + it.unit_price * it.quantity, 0) -
                        (editingSale.discount_amount || 0)
                    ).toLocaleString('es-CL')}
                  </span>
                </div>
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingSale(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-black text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingEdit ? 'Guardando...' : 'Guardar y Actualizar Venta'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
