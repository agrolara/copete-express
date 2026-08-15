'use client';

import React, { useState, useMemo } from 'react';
import { useCart } from '@/context/CartContext';
import { Expense, ExpenseCategoryType } from '@/types';
import {
  Receipt,
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  Search,
  PieChart as PieIcon,
  BarChart3,
  Tag,
  FileText,
  DollarSign,
  X,
  Check,
  TrendingDown,
  Layers,
  ArrowDownRight,
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

const EXPENSE_CATEGORIES: ExpenseCategoryType[] = [
  'Arriendo',
  'Sueldos y Turnos',
  'Servicios Básicos (Luz/Agua/Internet)',
  'Bolsas y Empaques',
  'Combustible y Flete Delivery',
  'Publicidad y Marketing',
  'Mantenimiento y Reparaciones',
  'Otros Gastos',
];

const CATEGORY_COLORS: { [cat: string]: string } = {
  Arriendo: '#ef4444',
  'Sueldos y Turnos': '#f97316',
  'Servicios Básicos (Luz/Agua/Internet)': '#eab308',
  'Bolsas y Empaques': '#10b981',
  'Combustible y Flete Delivery': '#06b6d4',
  'Publicidad y Marketing': '#a855f7',
  'Mantenimiento y Reparaciones': '#ec4899',
  'Otros Gastos': '#64748b',
};

export default function AdminExpensesPage() {
  const { expenses, addExpense, deleteExpense } = useCart();

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('current');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal para registrar nuevo gasto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategoryType>('Bolsas y Empaques');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [loading, setLoading] = useState(false);

  // Meses disponibles
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    monthsSet.add(currentKey);

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
  }, [expenses]);

  // Filtrar gastos por fecha y búsqueda
  const filteredExpenses = useMemo(() => {
    const now = new Date();

    return expenses.filter((e) => {
      const expDate = new Date(e.created_at || e.date);

      let matchesTime = true;
      if (timeFilter === 'day') {
        matchesTime =
          expDate.getDate() === now.getDate() &&
          expDate.getMonth() === now.getMonth() &&
          expDate.getFullYear() === now.getFullYear();
      } else if (timeFilter === 'week') {
        const diffDays = Math.ceil(Math.abs(now.getTime() - expDate.getTime()) / (1000 * 60 * 60 * 24));
        matchesTime = diffDays <= 7;
      } else if (timeFilter === 'month') {
        if (selectedMonth && selectedMonth !== 'all' && selectedMonth !== 'current') {
          const [y, m] = selectedMonth.split('-').map(Number);
          matchesTime = expDate.getFullYear() === y && expDate.getMonth() + 1 === m;
        } else {
          matchesTime = expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
        }
      }

      const matchesSearch =
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.receipt_number && e.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesTime && matchesSearch;
    });
  }, [expenses, timeFilter, selectedMonth, searchTerm]);

  // Métricas de gastos
  const totalExpensesAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const expensesCash = useMemo(() => {
    return filteredExpenses.filter((e) => e.payment_method === 'efectivo').reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const expensesTransfer = useMemo(() => {
    return filteredExpenses.filter((e) => e.payment_method === 'transferencia').reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  // Distribución de gastos por categoría para gráficos
  const categoryData = useMemo(() => {
    const catMap: { [cat: string]: number } = {};
    filteredExpenses.forEach((e) => {
      catMap[e.category] = (catMap[e.category] || 0) + e.amount;
    });

    return Object.entries(catMap).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || '#64748b',
    }));
  }, [filteredExpenses]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) {
      alert('Ingresa una descripción válida y un monto mayor a 0.');
      return;
    }

    setLoading(true);
    const result = await addExpense({
      category,
      description: description.trim(),
      amount,
      date,
      payment_method: paymentMethod,
      receipt_number: receiptNumber.trim(),
    });

    setLoading(false);
    if (result.success) {
      setIsModalOpen(false);
      setDescription('');
      setAmount(0);
      setReceiptNumber('');
    } else {
      alert(result.message);
    }
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (confirm('¿Deseas eliminar este gasto?')) {
      deleteExpense(expenseId);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-red-400" />
            <span>Gestión de Gastos Operacionales</span>
          </h1>
          <p className="text-xs text-zinc-400">
            Registro de egresos clasificados por categoría. Se descuentan automáticamente de la Caja y de las Utilidades Netas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 text-white font-extrabold text-xs shadow-neon-red hover:opacity-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* TARJETAS DE GASTOS */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-3xl bg-zinc-900/90 border border-red-500/30 flex items-center justify-between shadow-neon-red">
          <div>
            <span className="text-xs font-semibold text-zinc-400">Total Gastos Operacionales</span>
            <h3 className="text-2xl font-black text-red-400 mt-1">
              ${totalExpensesAmount.toLocaleString('es-CL')}
            </h3>
            <span className="text-[10px] text-zinc-500 block mt-1">
              {filteredExpenses.length} egresos filtrados
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-zinc-900/90 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-400">Pagado con Caja Efectivo</span>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">
              ${expensesCash.toLocaleString('es-CL')}
            </h3>
            <span className="text-[10px] text-zinc-500 block mt-1">Descontado de efectivo físico</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-zinc-900/90 border border-purple-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-400">Pagado con Transferencia/Banco</span>
            <h3 className="text-2xl font-black text-purple-400 mt-1">
              ${expensesTransfer.toLocaleString('es-CL')}
            </h3>
            <span className="text-[10px] text-zinc-500 block mt-1">Descontado de cuenta digital</span>
          </div>
          <div className="p-3 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </section>

      {/* GRÁFICO DE GASTOS POR CATEGORÍA */}
      {categoryData.length > 0 && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-red-400" />
              <span>Distribución de Gastos por Categoría</span>
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" stroke="#a1a1aa" fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} />
                  <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={11} width={140} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '12px' }}
                    formatter={(v: any) => [`$${v.toLocaleString('es-CL')}`]}
                  />
                  <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-4 flex flex-col justify-between">
            <h3 className="text-base font-extrabold text-white">Proporción de Egresos</h3>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`pie-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }}
                    formatter={(v: any) => [`$${v.toLocaleString('es-CL')}`]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
              {categoryData.map((item) => (
                <div key={item.name} className="flex justify-between items-center text-zinc-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="truncate max-w-[130px]">{item.name}</span>
                  </div>
                  <span className="font-bold">${item.value.toLocaleString('es-CL')}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TABLA DE HISTORIAL DE GASTOS */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-lg font-black text-white tracking-tight">Historial de Gastos Registrados</h2>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar gasto por descripción o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            {filteredExpenses.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                No hay gastos registrados en el historial para este filtro.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Fecha</th>
                    <th className="p-4">Categoría</th>
                    <th className="p-4">Descripción / Glosa</th>
                    <th className="p-4">Boleta/Factura</th>
                    <th className="p-4">Medio de Pago</th>
                    <th className="p-4 text-right">Monto</th>
                    <th className="p-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="p-4 text-zinc-400">{exp.date}</td>
                      <td className="p-4">
                        <span
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
                          style={{ backgroundColor: `${CATEGORY_COLORS[exp.category] || '#64748b'}33`, borderColor: CATEGORY_COLORS[exp.category] || '#64748b' }}
                        >
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-white max-w-xs">{exp.description}</td>
                      <td className="p-4 font-mono text-zinc-400 text-[11px]">{exp.receipt_number || '-'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          exp.payment_method === 'transferencia'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {exp.payment_method === 'transferencia' ? 'Transferencia' : 'Efectivo'}
                        </span>
                      </td>
                      <td className="p-4 text-right font-black text-red-400">
                        -${exp.amount.toLocaleString('es-CL')}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-400 transition-colors"
                          title="Eliminar gasto"
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
      </section>

      {/* MODAL REGISTRAR GASTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-red-400" />
                <h3 className="text-base font-extrabold text-white">Registrar Gasto Operacional</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-bold">Categoría de Gasto *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategoryType)}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-500"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-bold">Descripción / Motivo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pago arriendo local mes agosto"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Monto del Gasto ($) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Monto $"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Fecha de Pago</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-bold">Medio de Pago de Salida</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('efectivo')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      paymentMethod === 'efectivo'
                        ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-neon-purple'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    💵 Caja Efectivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transferencia')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      paymentMethod === 'transferencia'
                        ? 'bg-purple-950/60 border-purple-500 text-white shadow-neon-purple'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    💳 Transferencia/Banco
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-bold">N° Comprobante / Boleta (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: BOL-12948"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 hover:opacity-95 text-white font-extrabold shadow-md transition-all disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
