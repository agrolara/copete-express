'use client';

import React, { useState, useMemo } from 'react';
import { useCart } from '@/context/CartContext';
import {
  Wallet,
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  ShoppingBag,
  Receipt,
  PieChart as PieIcon,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';

type TimeFilter = 'day' | 'week' | 'month' | 'all';

export default function AdminCashPage() {
  const { sales, expenses } = useCart();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('current');

  // Meses disponibles en historial
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

    expenses.forEach((e) => {
      const d = new Date(e.created_at || e.date);
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
  }, [sales, expenses]);

  // Filtrar ventas por fecha
  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales.filter((s) => {
      const saleDate = new Date(s.created_at);
      if (timeFilter === 'day') {
        return (
          saleDate.getDate() === now.getDate() &&
          saleDate.getMonth() === now.getMonth() &&
          saleDate.getFullYear() === now.getFullYear()
        );
      }
      if (timeFilter === 'week') {
        const diffDays = Math.ceil(Math.abs(now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }
      if (timeFilter === 'month') {
        if (selectedMonth && selectedMonth !== 'all' && selectedMonth !== 'current') {
          const [y, m] = selectedMonth.split('-').map(Number);
          return saleDate.getFullYear() === y && saleDate.getMonth() + 1 === m;
        }
        return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [sales, timeFilter, selectedMonth]);

  // Filtrar gastos por fecha
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter((e) => {
      const expDate = new Date(e.created_at || e.date);
      if (timeFilter === 'day') {
        return (
          expDate.getDate() === now.getDate() &&
          expDate.getMonth() === now.getMonth() &&
          expDate.getFullYear() === now.getFullYear()
        );
      }
      if (timeFilter === 'week') {
        const diffDays = Math.ceil(Math.abs(now.getTime() - expDate.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }
      if (timeFilter === 'month') {
        if (selectedMonth && selectedMonth !== 'all' && selectedMonth !== 'current') {
          const [y, m] = selectedMonth.split('-').map(Number);
          return expDate.getFullYear() === y && expDate.getMonth() + 1 === m;
        }
        return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [expenses, timeFilter, selectedMonth]);

  // ARQUEO DE CAJA: EFECTIVO VS TRANSFERENCIAS
  const cashMetrics = useMemo(() => {
    let salesCash = 0;
    let salesTransfer = 0;

    filteredSales.forEach((s) => {
      if (s.payment_method === 'efectivo') {
        salesCash += s.total_amount;
      } else {
        salesTransfer += s.total_amount;
      }
    });

    let expensesCash = 0;
    let expensesTransfer = 0;

    filteredExpenses.forEach((e) => {
      if (e.payment_method === 'efectivo') {
        expensesCash += e.amount;
      } else {
        expensesTransfer += e.amount;
      }
    });

    const netCashInHand = salesCash - expensesCash;
    const netBankTransfer = salesTransfer - expensesTransfer;
    const totalAvailable = netCashInHand + netBankTransfer;

    return {
      salesCash,
      salesTransfer,
      expensesCash,
      expensesTransfer,
      netCashInHand,
      netBankTransfer,
      totalAvailable,
    };
  }, [filteredSales, filteredExpenses]);

  // Datos para gráficos de torta y barras
  const pieDistributionData = [
    { name: 'Efectivo en Caja', value: Math.max(0, cashMetrics.netCashInHand), color: '#10b981' },
    { name: 'Transferencia (Banco)', value: Math.max(0, cashMetrics.netBankTransfer), color: '#a855f7' },
  ];

  const barComparisonData = [
    {
      tipo: 'Efectivo',
      Ingresos: cashMetrics.salesCash,
      Egresos: cashMetrics.expensesCash,
      Disponible: cashMetrics.netCashInHand,
    },
    {
      tipo: 'Transferencia',
      Ingresos: cashMetrics.salesTransfer,
      Egresos: cashMetrics.expensesTransfer,
      Disponible: cashMetrics.netBankTransfer,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Filtro Temporal */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Wallet className="w-7 h-7 text-emerald-400" />
            <span>Control y Arqueo de Caja</span>
          </h1>
          <p className="text-xs text-zinc-400">
            Diferenciación en tiempo real del dinero en Efectivo (Caja Física) y Transferencias (Banco), descontando gastos operacionales.
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
            <option value="all">📅 Seleccionar Mes...</option>
            {availableMonths.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>

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

      {/* TARJETAS DE SALDO EN CAJA */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Caja Efectivo Física */}
        <div className="p-6 rounded-3xl bg-zinc-900/90 border border-emerald-500/40 shadow-neon-emerald space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              💵 Efectivo en Caja Física
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-white">
              ${cashMetrics.netCashInHand.toLocaleString('es-CL')}
            </h3>
            <span className="text-[11px] text-zinc-400 block mt-1">
              Dinero disponible en caja local
            </span>
          </div>
          <div className="pt-3 border-t border-zinc-800/80 flex justify-between text-xs text-zinc-400">
            <span className="text-emerald-400 font-medium">
              +${cashMetrics.salesCash.toLocaleString('es-CL')} ventas
            </span>
            <span className="text-red-400 font-medium">
              -${cashMetrics.expensesCash.toLocaleString('es-CL')} gastos
            </span>
          </div>
        </div>

        {/* Transferencia Banco */}
        <div className="p-6 rounded-3xl bg-zinc-900/90 border border-purple-500/40 shadow-neon-purple space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
              💳 Transferencia (Cuenta Bancaria)
            </span>
            <div className="p-2.5 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-white">
              ${cashMetrics.netBankTransfer.toLocaleString('es-CL')}
            </h3>
            <span className="text-[11px] text-zinc-400 block mt-1">
              Dinero recibido en cuentas digitales
            </span>
          </div>
          <div className="pt-3 border-t border-zinc-800/80 flex justify-between text-xs text-zinc-400">
            <span className="text-purple-400 font-medium">
              +${cashMetrics.salesTransfer.toLocaleString('es-CL')} ventas
            </span>
            <span className="text-red-400 font-medium">
              -${cashMetrics.expensesTransfer.toLocaleString('es-CL')} gastos
            </span>
          </div>
        </div>

        {/* Saldo Total Disponible */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-orange-500/40 shadow-neon-orange space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
              💰 Saldo Total Disponible
            </span>
            <div className="p-2.5 rounded-2xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
              <Layers className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-white">
              ${cashMetrics.totalAvailable.toLocaleString('es-CL')}
            </h3>
            <span className="text-[11px] text-zinc-400 block mt-1">
              Efectivo + Transferencias combinadas
            </span>
          </div>
          <div className="pt-3 border-t border-zinc-800/80 flex justify-between text-xs text-zinc-400">
            <span>{filteredSales.length} ventas</span>
            <span>{filteredExpenses.length} egresos</span>
          </div>
        </div>
      </section>

      {/* GRÁFICOS DE DISTRIBUCIÓN DE CAJA */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico Comparativo de Entradas, Salidas y Saldo */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                <span>Flujo de Dinero por Método de Pago</span>
              </h3>
              <p className="text-xs text-zinc-400">Comparativa de ingresos por ventas, egresos por gastos y saldo disponible</p>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="tipo" stroke="#a1a1aa" fontSize={12} />
                <YAxis stroke="#a1a1aa" fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '12px' }}
                  formatter={(val: any) => [`$${val.toLocaleString('es-CL')}`]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Ingresos" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Egresos" fill="#ef4444" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Disponible" fill="#a855f7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Proporción de Dinero */}
        <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-white">Proporción de Fondos</h3>
            <p className="text-xs text-zinc-400">Distribución porcentual de los fondos disponibles</p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }}
                  formatter={(v: any) => [`$${v.toLocaleString('es-CL')}`]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 text-xs">
            {pieDistributionData.map((item) => (
              <div key={item.name} className="flex justify-between items-center text-zinc-300">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
                <span className="font-bold">${item.value.toLocaleString('es-CL')}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DETALLE DE MOVIMIENTOS RECIENTES */}
      <section className="space-y-4">
        <h2 className="text-lg font-black text-white tracking-tight">Últimos Movimientos de Caja & Banco</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ingresos por Ventas */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4" />
              <span>Ventas Recientes ({filteredSales.length})</span>
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {filteredSales.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">No hay ventas registradas.</p>
              ) : (
                filteredSales.slice(0, 10).map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">{s.customer_name}</span>
                      <span className="text-[10px] text-zinc-400">
                        {new Date(s.created_at).toLocaleString('es-CL', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        •{' '}
                        <span className={s.payment_method === 'efectivo' ? 'text-emerald-400 font-bold' : 'text-purple-400 font-bold'}>
                          {s.payment_method === 'efectivo' ? 'Efectivo' : 'Transferencia'}
                        </span>
                      </span>
                    </div>
                    <span className="font-black text-emerald-400">
                      +${s.total_amount.toLocaleString('es-CL')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Egresos por Gastos */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
              <ArrowDownRight className="w-4 h-4" />
              <span>Gastos Operacionales ({filteredExpenses.length})</span>
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {filteredExpenses.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">No hay gastos registrados.</p>
              ) : (
                filteredExpenses.slice(0, 10).map((e) => (
                  <div
                    key={e.id}
                    className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">{e.description}</span>
                      <span className="text-[10px] text-zinc-400">
                        {e.category} • Pagado con{' '}
                        <span className={e.payment_method === 'efectivo' ? 'text-emerald-400 font-bold' : 'text-purple-400 font-bold'}>
                          {e.payment_method === 'efectivo' ? 'Efectivo' : 'Transferencia'}
                        </span>
                      </span>
                    </div>
                    <span className="font-black text-red-400">
                      -${e.amount.toLocaleString('es-CL')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
