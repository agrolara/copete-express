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
  FileText,
  PieChart as PieIcon,
  BarChart3,
  Package,
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
  const { sales, expenses, invoices } = useCart();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('current');

  // Formato monetario
  const formatMoney = (val: number) => {
    return (
      '$' +
      Number(val || 0).toLocaleString('es-CL', {
        minimumFractionDigits: val % 1 !== 0 ? 2 : 0,
        maximumFractionDigits: 2,
      })
    );
  };

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

    invoices.forEach((i) => {
      const d = new Date(i.created_at || i.invoice_date);
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
  }, [sales, expenses, invoices]);

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

  // Filtrar facturas de compra por fecha
  const filteredInvoices = useMemo(() => {
    const now = new Date();
    return invoices.filter((inv) => {
      const invDate = new Date(inv.created_at || inv.invoice_date);
      if (timeFilter === 'day') {
        return (
          invDate.getDate() === now.getDate() &&
          invDate.getMonth() === now.getMonth() &&
          invDate.getFullYear() === now.getFullYear()
        );
      }
      if (timeFilter === 'week') {
        const diffDays = Math.ceil(Math.abs(now.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }
      if (timeFilter === 'month') {
        if (selectedMonth && selectedMonth !== 'all' && selectedMonth !== 'current') {
          const [y, m] = selectedMonth.split('-').map(Number);
          return invDate.getFullYear() === y && invDate.getMonth() + 1 === m;
        }
        return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [invoices, timeFilter, selectedMonth]);

  // ARQUEO DE CAJA COMPLETO: VENTAS (+), GASTOS (-) Y FACTURAS DE PROVEEDORES (-)
  const cashMetrics = useMemo(() => {
    // 1. Ventas
    let salesCash = 0;
    let salesTransfer = 0;
    filteredSales.forEach((s) => {
      if (s.payment_method === 'efectivo') {
        salesCash += s.total_amount;
      } else {
        salesTransfer += s.total_amount;
      }
    });

    // 2. Gastos Operacionales
    let expensesCash = 0;
    let expensesTransfer = 0;
    filteredExpenses.forEach((e) => {
      if (e.payment_method === 'efectivo') {
        expensesCash += e.amount;
      } else {
        expensesTransfer += e.amount;
      }
    });

    // 3. Pagos de Facturas a Proveedores (Abastecimiento)
    let invoicesCash = 0;
    let invoicesTransfer = 0;
    filteredInvoices.forEach((i) => {
      if (i.payment_method === 'efectivo') {
        invoicesCash += i.total_amount;
      } else {
        invoicesTransfer += i.total_amount;
      }
    });

    const totalSales = salesCash + salesTransfer;
    const totalExpenses = expensesCash + expensesTransfer;
    const totalInvoices = invoicesCash + invoicesTransfer;

    // Saldos Netos
    const netCashInHand = salesCash - expensesCash - invoicesCash;
    const netBankTransfer = salesTransfer - expensesTransfer - invoicesTransfer;
    const totalAvailable = netCashInHand + netBankTransfer;

    return {
      salesCash,
      salesTransfer,
      totalSales,
      expensesCash,
      expensesTransfer,
      totalExpenses,
      invoicesCash,
      invoicesTransfer,
      totalInvoices,
      netCashInHand,
      netBankTransfer,
      totalAvailable,
    };
  }, [filteredSales, filteredExpenses, filteredInvoices]);

  // Lista consolidada de movimientos de dinero
  const movementHistory = useMemo(() => {
    const movements: Array<{
      id: string;
      date: string;
      concept: string;
      type: 'venta' | 'gasto' | 'factura';
      payment_method: 'efectivo' | 'transferencia';
      amount: number;
      is_positive: boolean;
    }> = [];

    filteredSales.forEach((s) => {
      movements.push({
        id: s.id,
        date: s.created_at.split('T')[0],
        concept: `Venta a ${s.customer_name} (${s.items?.length || 1} ítems)`,
        type: 'venta',
        payment_method: s.payment_method || 'transferencia',
        amount: s.total_amount,
        is_positive: true,
      });
    });

    filteredExpenses.forEach((e) => {
      movements.push({
        id: e.id,
        date: e.date || e.created_at.split('T')[0],
        concept: `Gasto: ${e.category} - ${e.description}`,
        type: 'gasto',
        payment_method: e.payment_method,
        amount: e.amount,
        is_positive: false,
      });
    });

    filteredInvoices.forEach((i) => {
      movements.push({
        id: i.id,
        date: i.invoice_date || i.created_at.split('T')[0],
        concept: `Factura #${i.invoice_number} Proveedor: ${i.supplier_name} (${i.items.length} productos)`,
        type: 'factura',
        payment_method: i.payment_method,
        amount: i.total_amount,
        is_positive: false,
      });
    });

    return movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredSales, filteredExpenses, filteredInvoices]);

  // Gráficos de Flujo de Efectivo
  const cashFlowChartData = [
    {
      name: 'Efectivo',
      Ventas: cashMetrics.salesCash,
      Gastos: cashMetrics.expensesCash,
      Facturas: cashMetrics.invoicesCash,
      Disponible: cashMetrics.netCashInHand,
    },
    {
      name: 'Transferencia',
      Ventas: cashMetrics.salesTransfer,
      Gastos: cashMetrics.expensesTransfer,
      Facturas: cashMetrics.invoicesTransfer,
      Disponible: cashMetrics.netBankTransfer,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Wallet className="w-7 h-7 text-emerald-400" />
            <span>Control y Arqueo de Caja</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Diferenciación en tiempo real del dinero en Efectivo (Caja Física) y Transferencias (Banco), descontando gastos operacionales y facturas pagadas a proveedores.
          </p>
        </div>

        {/* Filtros Temporales */}
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

      {/* TARJETAS PRINCIPALES DE ARQUEO EN VIVO */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Efectivo en Caja Física */}
        <div className="p-6 rounded-3xl bg-zinc-900/90 border border-emerald-500/40 shadow-neon-emerald flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              <span>Efectivo en Caja Física</span>
            </span>
            <h3 className="text-3xl font-black text-white mt-1.5">
              {formatMoney(cashMetrics.netCashInHand)}
            </h3>
            <div className="mt-2 space-y-0.5 text-[11px] text-zinc-400">
              <div className="text-emerald-400 font-bold">Ventas: +{formatMoney(cashMetrics.salesCash)}</div>
              {cashMetrics.expensesCash > 0 && <div className="text-red-400">Gastos: -{formatMoney(cashMetrics.expensesCash)}</div>}
              {cashMetrics.invoicesCash > 0 && <div className="text-orange-400">Facturas: -{formatMoney(cashMetrics.invoicesCash)}</div>}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/40">
            <DollarSign className="w-7 h-7" />
          </div>
        </div>

        {/* 2. Transferencias Bancarias */}
        <div className="p-6 rounded-3xl bg-zinc-900/90 border border-purple-500/40 shadow-neon-purple flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" />
              <span>Transferencia (Cuenta Bancaria)</span>
            </span>
            <h3 className="text-3xl font-black text-white mt-1.5">
              {formatMoney(cashMetrics.netBankTransfer)}
            </h3>
            <div className="mt-2 space-y-0.5 text-[11px] text-zinc-400">
              <div className="text-purple-300 font-bold">Ventas: +{formatMoney(cashMetrics.salesTransfer)}</div>
              {cashMetrics.expensesTransfer > 0 && <div className="text-red-400">Gastos: -{formatMoney(cashMetrics.expensesTransfer)}</div>}
              {cashMetrics.invoicesTransfer > 0 && <div className="text-orange-400">Facturas: -{formatMoney(cashMetrics.invoicesTransfer)}</div>}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/40">
            <CreditCard className="w-7 h-7" />
          </div>
        </div>

        {/* 3. Saldo Total Disponible */}
        <div className="p-6 rounded-3xl bg-zinc-900/90 border border-orange-500/40 shadow-neon-orange flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              <span>Saldo Total Disponible</span>
            </span>
            <h3 className="text-3xl font-black text-white mt-1.5">
              {formatMoney(cashMetrics.totalAvailable)}
            </h3>
            <div className="mt-2 text-[11px] text-zinc-400">
              Efectivo + Transferencias combinadas (Descontando facturas y gastos)
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-orange-600/20 text-orange-400 border border-orange-500/40">
            <Wallet className="w-7 h-7" />
          </div>
        </div>
      </section>

      {/* SUB-TARJETAS DE RESUMEN DE FLUJO */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
              📈 Ingresos por Ventas
            </span>
            <h4 className="text-xl font-black text-white mt-1">
              +{formatMoney(cashMetrics.totalSales)}
            </h4>
            <span className="text-[10px] text-zinc-500 block mt-0.5">{filteredSales.length} transacciones</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950 border border-orange-500/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block">
              📦 Pagos por Facturas de Compra
            </span>
            <h4 className="text-xl font-black text-orange-400 mt-1">
              -{formatMoney(cashMetrics.totalInvoices)}
            </h4>
            <span className="text-[10px] text-zinc-500 block mt-0.5">{filteredInvoices.length} facturas pagadas</span>
          </div>
          <div className="p-2.5 rounded-xl bg-orange-600/20 text-orange-400">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950 border border-red-500/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider block">
              📉 Pagos por Gastos Operacionales
            </span>
            <h4 className="text-xl font-black text-red-400 mt-1">
              -{formatMoney(cashMetrics.totalExpenses)}
            </h4>
            <span className="text-[10px] text-zinc-500 block mt-0.5">{filteredExpenses.length} egresos</span>
          </div>
          <div className="p-2.5 rounded-xl bg-red-600/20 text-red-400">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
      </section>

      {/* GRÁFICO COMPARATIVO DE FLUJO DE CAJA */}
      <section className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-4">
        <h3 className="text-base font-extrabold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          <span>Flujo de Fondos por Medio de Pago (Ventas vs Compras Facturadas vs Gastos vs Saldo)</span>
        </h3>
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashFlowChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} />
              <YAxis stroke="#a1a1aa" fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '12px' }}
                formatter={(v: any) => [formatMoney(v)]}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="Ventas" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Facturas" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Disponible" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* HISTORIAL COMPLETO DE MOVIMIENTOS DE CAJA */}
      <section className="space-y-4">
        <h2 className="text-lg font-black text-white tracking-tight">Historial Cronológico de Movimientos de Fondos</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            {movementHistory.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                No hay movimientos registrados en el período seleccionado.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Fecha</th>
                    <th className="p-4">Tipo de Movimiento</th>
                    <th className="p-4">Concepto / Glosa</th>
                    <th className="p-4">Medio de Pago</th>
                    <th className="p-4 text-right">Monto / Impacto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                  {movementHistory.map((mov) => (
                    <tr key={mov.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="p-4 text-zinc-400 font-mono">{mov.date}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            mov.type === 'venta'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : mov.type === 'factura'
                              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}
                        >
                          {mov.type === 'venta' ? '📈 Venta' : mov.type === 'factura' ? '📦 Factura Compra' : '📉 Gasto'}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-white max-w-sm">{mov.concept}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            mov.payment_method === 'transferencia'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {mov.payment_method === 'transferencia' ? 'Transferencia' : 'Efectivo'}
                        </span>
                      </td>
                      <td
                        className={`p-4 text-right font-black font-mono text-sm ${
                          mov.is_positive ? 'text-emerald-400' : 'text-orange-400'
                        }`}
                      >
                        {mov.is_positive ? `+${formatMoney(mov.amount)}` : `-${formatMoney(mov.amount)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
