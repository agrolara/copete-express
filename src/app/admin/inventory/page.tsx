'use client';

import React, { useState, useMemo } from 'react';
import { useCart } from '@/context/CartContext';
import { Product, InventoryMovement, InventoryMovementType } from '@/types';
import {
  Boxes,
  Package,
  Plus,
  Minus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  FileSpreadsheet,
  RefreshCw,
  SlidersHorizontal,
  ClipboardCheck,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Layers,
  Calendar,
  X,
  Check,
  ArrowRight,
  ShieldAlert,
  Info,
} from 'lucide-react';

type TabType = 'stock' | 'reconciliation' | 'kardex';

export default function AdminInventoryPage() {
  const {
    products,
    inventoryMovements,
    globalLowStockThreshold,
    adjustStock,
    reconcilePhysicalStock,
    updateProductMinStockAlert,
    setGlobalLowStockThreshold,
  } = useCart();

  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>('stock');

  // Search & Filters for Tab 1 (Stock)
  const [stockSearch, setStockSearch] = useState('');
  const [stockCategoryFilter, setStockCategoryFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'healthy' | 'critical' | 'out'>('all');

  // Modal Ajuste Rápido
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<Product | null>(null);
  const [adjustOperation, setAdjustOperation] = useState<'add' | 'subtract'>('subtract');
  const [adjustQuantity, setAdjustQuantity] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>('Merma / Producto Dañado');
  const [adjustCustomReason, setAdjustCustomReason] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);
  const [adjustFeedback, setAdjustFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Modal Configuración de Alertas
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [tempGlobalThreshold, setTempGlobalThreshold] = useState(globalLowStockThreshold || 6);

  // Tab 2 (Conteo Físico / Reconciliación)
  const [countSearch, setCountSearch] = useState('');
  const [countCategoryFilter, setCountCategoryFilter] = useState('all');
  const [physicalCounts, setPhysicalCounts] = useState<{ [productId: string]: number }>({});
  const [reconciliationReason, setReconciliationReason] = useState('Auditoría periódica de conteo físico');
  const [reconciliationNotes, setReconciliationNotes] = useState('');
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileFeedback, setReconcileFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [isConfirmReconciliationOpen, setIsConfirmReconciliationOpen] = useState(false);

  // Tab 3 (Kardex / Historial)
  const [kardexSearch, setKardexSearch] = useState('');
  const [kardexTypeFilter, setKardexTypeFilter] = useState<string>('all');
  const [kardexTimeFilter, setKardexTimeFilter] = useState<'all' | 'today' | 'week' | 'month' | 'specific_date'>('all');
  const [kardexSelectedDate, setKardexSelectedDate] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });

  // Categorías Únicas
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Resumen Métrico de Inventario
  const metrics = useMemo(() => {
    let totalUnits = 0;
    let totalCostValue = 0;
    let criticalCount = 0;
    let outOfStockCount = 0;

    products.forEach((p) => {
      totalUnits += p.stock;
      const unitCost = p.cost_price || Math.round(p.price * 0.6);
      totalCostValue += p.stock * unitCost;

      const threshold = p.min_stock_alert ?? globalLowStockThreshold ?? 6;
      if (p.stock === 0) {
        outOfStockCount++;
      } else if (p.stock < threshold) {
        criticalCount++;
      }
    });

    return {
      totalUnits,
      totalCostValue,
      criticalCount,
      outOfStockCount,
      totalMovements: inventoryMovements.length,
    };
  }, [products, inventoryMovements, globalLowStockThreshold]);

  // Filtro de Productos para Tab 1
  const filteredStockProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(stockSearch.toLowerCase());

      const matchCategory = stockCategoryFilter === 'all' || p.category === stockCategoryFilter;

      const threshold = p.min_stock_alert ?? globalLowStockThreshold ?? 6;
      let matchStatus = true;
      if (stockStatusFilter === 'healthy') {
        matchStatus = p.stock >= threshold;
      } else if (stockStatusFilter === 'critical') {
        matchStatus = p.stock > 0 && p.stock < threshold;
      } else if (stockStatusFilter === 'out') {
        matchStatus = p.stock === 0;
      }

      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, stockSearch, stockCategoryFilter, stockStatusFilter, globalLowStockThreshold]);

  // Filtro de Productos para Tab 2 (Conteo Físico)
  const filteredCountProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(countSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(countSearch.toLowerCase());

      const matchCategory = countCategoryFilter === 'all' || p.category === countCategoryFilter;

      return matchSearch && matchCategory;
    });
  }, [products, countSearch, countCategoryFilter]);

  // Diferencias calculadas para Reconciliación
  const reconciliationDifferences = useMemo(() => {
    const diffs: { product: Product; system: number; counted: number; diff: number }[] = [];
    products.forEach((p) => {
      const counted = physicalCounts[p.id] !== undefined ? physicalCounts[p.id] : p.stock;
      const diff = counted - p.stock;
      if (diff !== 0) {
        diffs.push({
          product: p,
          system: p.stock,
          counted,
          diff,
        });
      }
    });
    return diffs;
  }, [products, physicalCounts]);

  // Filtro para Tab 3 (Kardex)
  const filteredKardexMovements = useMemo(() => {
    return inventoryMovements.filter((m) => {
      // Filtro de búsqueda
      const matchSearch =
        m.product_name.toLowerCase().includes(kardexSearch.toLowerCase()) ||
        m.reason.toLowerCase().includes(kardexSearch.toLowerCase()) ||
        (m.notes && m.notes.toLowerCase().includes(kardexSearch.toLowerCase())) ||
        (m.category && m.category.toLowerCase().includes(kardexSearch.toLowerCase()));

      // Filtro de tipo
      const matchType =
        kardexTypeFilter === 'all' ||
        m.movement_type === kardexTypeFilter ||
        (kardexTypeFilter === 'merma_perdida' && (m.movement_type === 'merma' || m.movement_type === 'perdida'));

      // Filtro de fecha
      let matchDate = true;
      if (kardexTimeFilter !== 'all') {
        const movDate = new Date(m.created_at);
        const now = new Date();

        if (kardexTimeFilter === 'today') {
          matchDate =
            movDate.getFullYear() === now.getFullYear() &&
            movDate.getMonth() === now.getMonth() &&
            movDate.getDate() === now.getDate();
        } else if (kardexTimeFilter === 'week') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          matchDate = movDate >= sevenDaysAgo;
        } else if (kardexTimeFilter === 'month') {
          matchDate =
            movDate.getFullYear() === now.getFullYear() && movDate.getMonth() === now.getMonth();
        } else if (kardexTimeFilter === 'specific_date' && kardexSelectedDate) {
          const [targetYear, targetMonth, targetDay] = kardexSelectedDate.split('-').map(Number);
          matchDate =
            movDate.getFullYear() === targetYear &&
            movDate.getMonth() + 1 === targetMonth &&
            movDate.getDate() === targetDay;
        }
      }

      return matchSearch && matchType && matchDate;
    });
  }, [inventoryMovements, kardexSearch, kardexTypeFilter, kardexTimeFilter, kardexSelectedDate]);

  // Manejar apertura de modal de ajuste
  const openAdjustModal = (product?: Product) => {
    if (product) {
      setSelectedProductForAdjust(product);
    } else if (products.length > 0) {
      setSelectedProductForAdjust(products[0]);
    }
    setAdjustOperation('subtract');
    setAdjustQuantity(1);
    setAdjustReason('Merma / Producto Dañado');
    setAdjustCustomReason('');
    setAdjustNotes('');
    setAdjustFeedback(null);
    setIsAdjustModalOpen(true);
  };

  // Ejecutar Ajuste de Stock
  const handleExecuteAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForAdjust) return;

    const qty = Number(adjustQuantity);
    if (isNaN(qty) || qty <= 0) {
      setAdjustFeedback({ success: false, message: 'La cantidad debe ser mayor a 0.' });
      return;
    }

    const effectiveReason =
      adjustReason === 'Otro motivo' ? adjustCustomReason.trim() || 'Ajuste manual sin especificar' : adjustReason;

    let movType: InventoryMovementType = 'ajuste_manual';
    if (adjustReason.includes('Merma')) movType = 'merma';
    else if (adjustReason.includes('Pérdida')) movType = 'perdida';
    else if (adjustReason.includes('Devolución')) movType = 'devolucion';
    else if (adjustReason.includes('Consumo')) movType = 'consumo_interno';
    else if (adjustReason.includes('Conteo')) movType = 'conteo_fisico';

    const delta = adjustOperation === 'add' ? qty : -qty;

    setIsSubmittingAdjust(true);
    try {
      const res = await adjustStock(
        selectedProductForAdjust.id,
        delta,
        effectiveReason,
        movType,
        adjustNotes
      );
      setAdjustFeedback(res);
      if (res.success) {
        setTimeout(() => {
          setIsAdjustModalOpen(false);
          setAdjustFeedback(null);
        }, 1200);
      }
    } catch (err: any) {
      setAdjustFeedback({ success: false, message: err.message || 'Error al ejecutar ajuste.' });
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  // Manejar cambio de conteo físico en la tabla
  const handlePhysicalCountChange = (productId: string, valStr: string) => {
    const val = parseInt(valStr, 10);
    setPhysicalCounts((prev) => ({
      ...prev,
      [productId]: isNaN(val) ? 0 : Math.max(0, val),
    }));
  };

  // Inicializar conteos con stock actual
  const handleResetCountsToCurrent = () => {
    const initial: { [key: string]: number } = {};
    products.forEach((p) => {
      initial[p.id] = p.stock;
    });
    setPhysicalCounts(initial);
    setReconcileFeedback(null);
  };

  // Ejecutar Reconciliación Masiva
  const handleExecuteReconciliation = async () => {
    setIsReconciling(true);
    try {
      const itemsToReconcile = reconciliationDifferences.map((d) => ({
        productId: d.product.id,
        countedStock: d.counted,
        reason: reconciliationReason.trim() || 'Auditoría periódica de conteo físico',
        notes: reconciliationNotes.trim() || `Diferencia de conteo: ${d.diff > 0 ? '+' : ''}${d.diff} un.`,
      }));

      const res = await reconcilePhysicalStock(itemsToReconcile);
      setReconcileFeedback(res);
      setIsConfirmReconciliationOpen(false);
    } catch (err: any) {
      setReconcileFeedback({ success: false, message: err.message || 'Error al reconciliar inventario.' });
    } finally {
      setIsReconciling(false);
    }
  };

  // Guardar Umbral Global
  const handleSaveGlobalThreshold = () => {
    setGlobalLowStockThreshold(tempGlobalThreshold);
    setIsSettingsModalOpen(false);
  };

  // Exportar Kardex a CSV
  const handleExportKardexCSV = () => {
    const headers = [
      'Fecha',
      'Hora',
      'Producto',
      'Categoria',
      'Tipo de Movimiento',
      'Variacion',
      'Stock Anterior',
      'Stock Resultante',
      'Motivo / Justificacion',
      'Notas',
    ];

    const rows = filteredKardexMovements.map((m) => {
      const d = new Date(m.created_at);
      const fecha = d.toLocaleDateString('es-CL');
      const hora = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
      return [
        `"${fecha}"`,
        `"${hora}"`,
        `"${m.product_name.replace(/"/g, '""')}"`,
        `"${m.category || ''}"`,
        `"${m.movement_type}"`,
        m.quantity_change > 0 ? `+${m.quantity_change}` : `${m.quantity_change}`,
        m.previous_stock,
        m.resulting_stock,
        `"${m.reason.replace(/"/g, '""')}"`,
        `"${(m.notes || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Kardex_Inventario_CopeteExpress_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Formato Moneda
  const formatCLP = (val: number) => `$${Math.round(val).toLocaleString('es-CL')}`;

  // Helper Badge Movimiento
  const renderMovementBadge = (type: InventoryMovementType) => {
    switch (type) {
      case 'venta':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <TrendingDown className="w-3 h-3" /> Venta
          </span>
        );
      case 'factura':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-3 h-3" /> Factura Compra
          </span>
        );
      case 'merma':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3" /> Merma / Daño
          </span>
        );
      case 'perdida':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
            <ShieldAlert className="w-3 h-3" /> Pérdida
          </span>
        );
      case 'conteo_fisico':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <ClipboardCheck className="w-3 h-3" /> Conteo Físico
          </span>
        );
      case 'devolucion':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <RefreshCw className="w-3 h-3" /> Devolución / Anulación
          </span>
        );
      case 'consumo_interno':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sparkles className="w-3 h-3" /> Consumo Interno
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
            <Boxes className="w-3 h-3" /> Ajuste Manual
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                Control y Ajuste de Inventario
              </h1>
              <p className="text-xs text-zinc-400">
                Kardex con trazabilidad completa, ajustes con justificación, reconciliación física y alertas
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
            <span>Alertas (Min: {globalLowStockThreshold} un.)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('reconciliation');
              if (Object.keys(physicalCounts).length === 0) handleResetCountsToCurrent();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 text-xs font-semibold border border-purple-500/40 transition-colors"
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Conteo Físico</span>
          </button>

          <button
            onClick={() => openAdjustModal()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-neon-purple transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Ajuste Rápido</span>
          </button>
        </div>
      </div>

      {/* METRICAS DE RESUMEN */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs font-semibold">Unidades en Bodega</span>
            <Package className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{metrics.totalUnits.toLocaleString('es-CL')}</div>
          <p className="text-[11px] text-zinc-500 mt-1">En {products.length} productos registrados</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs font-semibold">Valor al Costo</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{formatCLP(metrics.totalCostValue)}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Capital activo en mercadería</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs font-semibold">Stock Crítico (&lt; {globalLowStockThreshold})</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{metrics.criticalCount}</div>
          <p className="text-[11px] text-zinc-500 mt-1">{metrics.outOfStockCount} productos agotados</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs font-semibold">Kardex Trazable</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{metrics.totalMovements}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Movimientos auditados</p>
        </div>
      </div>

      {/* PESTAÑAS PRINCIPALES */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-1">
        <button
          onClick={() => setActiveTab('stock')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all ${
            activeTab === 'stock'
              ? 'bg-zinc-900 text-purple-400 border-t-2 border-purple-500 border-x border-zinc-800'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Existencias y Ajuste Rápido</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-zinc-800 text-zinc-300">
            {products.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('reconciliation');
            if (Object.keys(physicalCounts).length === 0) handleResetCountsToCurrent();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all ${
            activeTab === 'reconciliation'
              ? 'bg-zinc-900 text-purple-400 border-t-2 border-purple-500 border-x border-zinc-800'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Conteo Físico y Reconciliación</span>
          {reconciliationDifferences.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/30">
              {reconciliationDifferences.length} dif.
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('kardex')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all ${
            activeTab === 'kardex'
              ? 'bg-zinc-900 text-purple-400 border-t-2 border-purple-500 border-x border-zinc-800'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Historial y Kardex</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-zinc-800 text-zinc-300">
            {inventoryMovements.length}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: EXISTENCIAS Y AJUSTE RÁPIDO */}
      {/* ======================================================== */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          {/* BARRA DE BÚSQUEDA Y FILTROS */}
          <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800 flex flex-col md:flex-row items-center gap-3 justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por producto o categoría..."
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
              <select
                value={stockCategoryFilter}
                onChange={(e) => setStockCategoryFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-purple-500"
              >
                <option value="all">Todas las Categorías</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
                <button
                  onClick={() => setStockStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    stockStatusFilter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setStockStatusFilter('healthy')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    stockStatusFilter === 'healthy' ? 'bg-emerald-950 text-emerald-400' : 'text-zinc-400 hover:text-emerald-400'
                  }`}
                >
                  Saludable
                </button>
                <button
                  onClick={() => setStockStatusFilter('critical')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    stockStatusFilter === 'critical' ? 'bg-amber-950 text-amber-400' : 'text-zinc-400 hover:text-amber-400'
                  }`}
                >
                  Crítico (&lt; {globalLowStockThreshold})
                </button>
                <button
                  onClick={() => setStockStatusFilter('out')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    stockStatusFilter === 'out' ? 'bg-red-950 text-red-400' : 'text-zinc-400 hover:text-red-400'
                  }`}
                >
                  Agotados (0)
                </button>
              </div>
            </div>
          </div>

          {/* TABLA DE PRODUCTOS E INVENTARIO */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Producto</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Costo Neto</th>
                    <th className="py-3 px-4">Precio Venta</th>
                    <th className="py-3 px-4">Margen</th>
                    <th className="py-3 px-4">Stock Bodega</th>
                    <th className="py-3 px-4">Alerta Mínima</th>
                    <th className="py-3 px-4 text-right">Acciones de Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredStockProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-zinc-500">
                        No se encontraron productos con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredStockProducts.map((p) => {
                      const cost = p.cost_price || Math.round(p.price * 0.6);
                      const margin = p.price > 0 ? Math.round(((p.price - cost) / p.price) * 100) : 0;
                      const threshold = p.min_stock_alert ?? globalLowStockThreshold ?? 6;

                      let stockBadge = (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {p.stock} un.
                        </span>
                      );

                      if (p.stock === 0) {
                        stockBadge = (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                            <AlertCircle className="w-3.5 h-3.5" /> Agotado (0 un.)
                          </span>
                        );
                      } else if (p.stock < threshold) {
                        stockBadge = (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <AlertTriangle className="w-3.5 h-3.5" /> {p.stock} un. (Crítico)
                          </span>
                        );
                      }

                      return (
                        <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="py-3 px-4 font-semibold text-white">
                            <div className="flex items-center gap-3">
                              {p.image_url ? (
                                <img
                                  src={p.image_url}
                                  alt={p.name}
                                  className="w-9 h-9 rounded-lg object-cover bg-zinc-950 border border-zinc-800 shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                                  <Package className="w-4 h-4" />
                                </div>
                              )}
                              <div>
                                <span className="block font-bold">{p.name}</span>
                                {p.is_active === false && (
                                  <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-zinc-800 text-zinc-400">
                                    Oculto en catálogo
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-zinc-400">{p.category}</td>
                          <td className="py-3 px-4 font-medium text-zinc-300">{formatCLP(cost)}</td>
                          <td className="py-3 px-4 font-bold text-white">{formatCLP(p.price)}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                              {margin}%
                            </span>
                          </td>
                          <td className="py-3 px-4">{stockBadge}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                defaultValue={p.min_stock_alert ?? globalLowStockThreshold ?? 6}
                                onBlur={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  if (!isNaN(val)) updateProductMinStockAlert(p.id, val);
                                }}
                                className="w-14 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-center text-xs text-white focus:outline-none focus:border-purple-500"
                                title="Alerta mínima específica para este producto"
                              />
                              <span className="text-[10px] text-zinc-500">un.</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openAdjustModal(p)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-bold border border-purple-500/30 transition-all"
                                title="Ajustar stock sumando o restando unidades con justificación"
                              >
                                <ArrowUpDown className="w-3 h-3" />
                                <span>Ajustar (+/-)</span>
                              </button>

                              <button
                                onClick={() => {
                                  setKardexSearch(p.name);
                                  setActiveTab('kardex');
                                }}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition-colors"
                                title="Ver trazabilidad de movimientos en Kardex"
                              >
                                <Clock className="w-3 h-3" />
                                <span>Kardex</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: CONTEO FÍSICO Y RECONCILIACIÓN MASIVA */}
      {/* ======================================================== */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-4">
          <div className="bg-purple-950/30 border border-purple-500/30 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ClipboardCheck className="w-6 h-6 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-bold text-white">Módulo de Auditoría y Reconciliación Física</h2>
                <p className="text-xs text-purple-200/80 mt-0.5">
                  Ingresa el conteo físico real de bodega. Las diferencias se calcularán en tiempo real y quedarán
                  auditadas en el Kardex.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetCountsToCurrent}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 transition-colors"
              >
                Restablecer a Stock Actual
              </button>
              <button
                disabled={reconciliationDifferences.length === 0}
                onClick={() => setIsConfirmReconciliationOpen(true)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  reconciliationDifferences.length > 0
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-neon-purple cursor-pointer'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Aplicar Reconciliación ({reconciliationDifferences.length} cambios)</span>
              </button>
            </div>
          </div>

          {reconcileFeedback && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
                reconcileFeedback.success
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-950/40 border-red-500/30 text-red-300'
              }`}
            >
              <span>{reconcileFeedback.message}</span>
              <button onClick={() => setReconcileFeedback(null)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* BARRA DE FILTROS TAB 2 */}
          <div className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row items-center gap-3 justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Filtrar producto por nombre..."
                value={countSearch}
                onChange={(e) => setCountSearch(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <select
              value={countCategoryFilter}
              onChange={(e) => setCountCategoryFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-purple-500 w-full sm:w-auto"
            >
              <option value="all">Todas las Categorías</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* TABLA DE CONTEO FÍSICO */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Producto</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4 text-center">Stock Sistema</th>
                    <th className="py-3 px-4 text-center w-36">Conteo Físico Real</th>
                    <th className="py-3 px-4 text-center">Diferencia</th>
                    <th className="py-3 px-4 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredCountProducts.map((p) => {
                    const counted = physicalCounts[p.id] !== undefined ? physicalCounts[p.id] : p.stock;
                    const diff = counted - p.stock;

                    let diffBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                        = 0 (Coincide)
                      </span>
                    );

                    if (diff > 0) {
                      diffBadge = (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <TrendingUp className="w-3.5 h-3.5" /> +{diff} un. (Sobrante)
                        </span>
                      );
                    } else if (diff < 0) {
                      diffBadge = (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          <TrendingDown className="w-3.5 h-3.5" /> {diff} un. (Faltante)
                        </span>
                      );
                    }

                    return (
                      <tr key={p.id} className={diff !== 0 ? 'bg-purple-950/10' : 'hover:bg-zinc-800/30'}>
                        <td className="py-3 px-4 font-semibold text-white">
                          <div className="flex items-center gap-3">
                            {p.image_url ? (
                              <img
                                src={p.image_url}
                                alt={p.name}
                                className="w-8 h-8 rounded-lg object-cover bg-zinc-950 border border-zinc-800 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                                <Package className="w-3.5 h-3.5" />
                              </div>
                            )}
                            <span className="font-bold">{p.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-zinc-400">{p.category}</td>
                        <td className="py-3 px-4 text-center font-bold text-zinc-300">{p.stock} un.</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handlePhysicalCountChange(p.id, String(Math.max(0, counted - 1)))}
                              className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 border border-zinc-700"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={counted}
                              onChange={(e) => handlePhysicalCountChange(p.id, e.target.value)}
                              className="w-16 bg-zinc-950 border border-zinc-700 rounded-lg py-1 text-center text-xs font-extrabold text-white focus:outline-none focus:border-purple-500"
                            />
                            <button
                              type="button"
                              onClick={() => handlePhysicalCountChange(p.id, String(counted + 1))}
                              className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 border border-zinc-700"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">{diffBadge}</td>
                        <td className="py-3 px-4 text-right font-medium">
                          {diff !== 0 ? (
                            <span className="text-[11px] text-amber-400 font-bold">Pendiente reconciliar</span>
                          ) : (
                            <span className="text-[11px] text-zinc-500">Conforme</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: HISTORIAL Y KARDEX DE MOVIMIENTOS */}
      {/* ======================================================== */}
      {activeTab === 'kardex' && (
        <div className="space-y-4">
          {/* BARRA DE FILTROS KARDEX */}
          <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 flex flex-col lg:flex-row items-center gap-3 justify-between">
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por producto, motivo o notas..."
                value={kardexSearch}
                onChange={(e) => setKardexSearch(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center flex-wrap gap-2 w-full lg:w-auto">
              <select
                value={kardexTypeFilter}
                onChange={(e) => setKardexTypeFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-purple-500"
              >
                <option value="all">Todos los Movimientos</option>
                <option value="venta">Ventas</option>
                <option value="factura">Facturas de Compra</option>
                <option value="merma">Mermas / Daños</option>
                <option value="perdida">Pérdidas</option>
                <option value="conteo_fisico">Conteos Físicos</option>
                <option value="devolucion">Devoluciones / Anulaciones</option>
                <option value="ajuste_manual">Ajustes Manuales</option>
                <option value="consumo_interno">Consumo Interno</option>
              </select>

              <select
                value={kardexTimeFilter}
                onChange={(e) => setKardexTimeFilter(e.target.value as any)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-purple-500"
              >
                <option value="all">Todo el Historial</option>
                <option value="today">Hoy</option>
                <option value="week">Últimos 7 días</option>
                <option value="month">Este Mes</option>
                <option value="specific_date">📅 Día Específico</option>
              </select>

              {kardexTimeFilter === 'specific_date' && (
                <input
                  type="date"
                  value={kardexSelectedDate}
                  onChange={(e) => setKardexSelectedDate(e.target.value)}
                  className="bg-zinc-950 border border-purple-500/50 rounded-xl px-3 py-1.5 text-xs text-purple-300 font-bold focus:outline-none"
                />
              )}

              <button
                onClick={handleExportKardexCSV}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-colors"
                title="Descargar historial filtrado en formato CSV compatible con Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

          {/* TABLA KARDEX */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Fecha / Hora</th>
                    <th className="py-3 px-4">Producto</th>
                    <th className="py-3 px-4">Tipo Movimiento</th>
                    <th className="py-3 px-4 text-center">Variación</th>
                    <th className="py-3 px-4 text-center">Stock (Ant → Res)</th>
                    <th className="py-3 px-4">Motivo / Justificación</th>
                    <th className="py-3 px-4">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredKardexMovements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-500">
                        No hay movimientos registrados en el Kardex con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredKardexMovements.map((m) => {
                      const d = new Date(m.created_at);
                      const fechaStr = d.toLocaleDateString('es-CL', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      });
                      const horaStr = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

                      const isPositive = m.quantity_change > 0;

                      return (
                        <tr key={m.id} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">
                            <span className="font-semibold text-white block">{fechaStr}</span>
                            <span className="text-[10px] text-zinc-500">{horaStr}</span>
                          </td>
                          <td className="py-3 px-4 font-bold text-white">
                            <span>{m.product_name}</span>
                            {m.category && <span className="block text-[10px] text-zinc-400 font-normal">{m.category}</span>}
                          </td>
                          <td className="py-3 px-4">{renderMovementBadge(m.movement_type)}</td>
                          <td className="py-3 px-4 text-center font-extrabold">
                            <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                              {isPositive ? `+${m.quantity_change}` : m.quantity_change} un.
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap font-medium text-zinc-400">
                            <span>{m.previous_stock}</span>
                            <ArrowRight className="w-3 h-3 inline mx-1.5 text-zinc-600" />
                            <span className="font-bold text-white">{m.resulting_stock}</span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-zinc-200">
                            {m.reason}
                          </td>
                          <td className="py-3 px-4 text-zinc-400 italic text-[11px]">
                            {m.notes || '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: AJUSTE MANUAL DE STOCK CON JUSTIFICACIÓN */}
      {/* ======================================================== */}
      {isAdjustModalOpen && selectedProductForAdjust && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-3xl p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setIsAdjustModalOpen(false)}
              className="absolute right-5 top-5 p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <ArrowUpDown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Ajuste Manual de Inventario</h3>
                <p className="text-xs text-zinc-400">Registra entradas o salidas con justificación obligatoria</p>
              </div>
            </div>

            <form onSubmit={handleExecuteAdjust} className="space-y-4">
              {/* SELECCIÓN DE PRODUCTO */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Producto a Ajustar</label>
                <select
                  value={selectedProductForAdjust.id}
                  onChange={(e) => {
                    const found = products.find((p) => p.id === e.target.value);
                    if (found) setSelectedProductForAdjust(found);
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-bold"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock Actual: {p.stock} un.)
                    </option>
                  ))}
                </select>
              </div>

              {/* TIPO DE OPERACIÓN (+ o -) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Tipo de Operación</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAdjustOperation('subtract')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      adjustOperation === 'subtract'
                        ? 'bg-rose-950/60 border-rose-500/60 text-rose-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Minus className="w-4 h-4" />
                    <span>Disminuir / Salida (-)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustOperation('add')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      adjustOperation === 'add'
                        ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Aumentar / Entrada (+)</span>
                  </button>
                </div>
              </div>

              {/* CANTIDAD DE UNIDADES Y PREVISUALIZACIÓN */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Cantidad de Unidades</label>
                  <input
                    type="number"
                    min="1"
                    value={adjustQuantity}
                    onChange={(e) => setAdjustQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Stock Resultante</label>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs flex items-center justify-between">
                    <span className="text-zinc-400">{selectedProductForAdjust.stock} un.</span>
                    <ArrowRight className="w-3 h-3 text-zinc-600" />
                    <span className="font-extrabold text-purple-300">
                      {Math.max(
                        0,
                        selectedProductForAdjust.stock + (adjustOperation === 'add' ? adjustQuantity : -adjustQuantity)
                      )}{' '}
                      un.
                    </span>
                  </div>
                </div>
              </div>

              {/* MOTIVO OBLIGATORIO */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Motivo de Ajuste <span className="text-rose-400">*</span>
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                >
                  <option value="Merma / Producto Dañado">Merma / Producto Dañado (Vencimiento, rotura)</option>
                  <option value="Pérdida / Extravío">Pérdida / Extravío en bodega</option>
                  <option value="Ajuste por Conteo Físico / Auditoría">Ajuste por Conteo Físico / Auditoría</option>
                  <option value="Devolución de Cliente">Devolución de Cliente</option>
                  <option value="Consumo Interno / Degustación">Consumo Interno / Promoción</option>
                  <option value="Corrección de Inventario">Corrección de Inventario</option>
                  <option value="Otro motivo">Otro motivo (Especificar)</option>
                </select>
              </div>

              {adjustReason === 'Otro motivo' && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Especificar Motivo</label>
                  <input
                    type="text"
                    placeholder="Describe el motivo del ajuste..."
                    value={adjustCustomReason}
                    onChange={(e) => setAdjustCustomReason(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              )}

              {/* OBSERVACIONES OPCIONALES */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Observaciones Adicionales</label>
                <textarea
                  rows={2}
                  placeholder="Detalles adicionales, responsable, número de incidente..."
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              {adjustFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs font-medium ${
                    adjustFeedback.success
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {adjustFeedback.message}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold border border-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjust}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-neon-purple transition-all"
                >
                  {isSubmittingAdjust ? 'Guardando...' : 'Confirmar Ajuste y Kardex'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIRMACIÓN DE RECONCILIACIÓN MASIVA */}
      {/* ======================================================== */}
      {isConfirmReconciliationOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirmar Reconciliación Masiva</h3>
                <p className="text-xs text-zinc-400">Se aplicarán ajustes a {reconciliationDifferences.length} producto(s)</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Motivo de Auditoría</label>
                <input
                  type="text"
                  value={reconciliationReason}
                  onChange={(e) => setReconciliationReason(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Observaciones</label>
                <input
                  type="text"
                  placeholder="Ej: Auditoría quincenal turno noche"
                  value={reconciliationNotes}
                  onChange={(e) => setReconciliationNotes(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-zinc-900/60 rounded-xl border border-zinc-800">
                {reconciliationDifferences.map((d) => (
                  <div key={d.product.id} className="flex items-center justify-between text-xs py-1 border-b border-zinc-800/40 last:border-0">
                    <span className="font-semibold text-zinc-200 truncate max-w-[200px]">{d.product.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500">{d.system} un.</span>
                      <ArrowRight className="w-3 h-3 text-zinc-600" />
                      <span className="font-bold text-white">{d.counted} un.</span>
                      <span className={`font-extrabold text-[11px] ${d.diff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ({d.diff > 0 ? `+${d.diff}` : d.diff})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsConfirmReconciliationOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold border border-zinc-800"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={isReconciling}
                onClick={handleExecuteReconciliation}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-neon-purple transition-all"
              >
                {isReconciling ? 'Aplicando...' : 'Confirmar y Actualizar Bodega'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIGURACIÓN DE ALERTAS DE STOCK */}
      {/* ======================================================== */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsSettingsModalOpen(false)}
              className="absolute right-5 top-5 p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Configuración de Stock Crítico</h3>
                <p className="text-xs text-zinc-400">Define los umbrales de alerta para abastecimiento</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Umbral Global de Stock Bajo (Unidades)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={tempGlobalThreshold}
                  onChange={(e) => setTempGlobalThreshold(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm font-extrabold text-white focus:outline-none focus:border-purple-500"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Cualquier producto con stock inferior a este número generará alertas de stock crítico en el Dashboard
                  y en el panel, a menos que tenga un umbral específico personalizado.
                </p>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold border border-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveGlobalThreshold}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-neon-purple transition-all"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
