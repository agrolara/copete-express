'use client';

import React, { useState } from 'react';
import { useCart, PaymentMethod } from '@/context/CartContext';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  PackageCheck,
  ShoppingBag,
  Sparkles,
  Plus,
  MessageSquare,
  Send,
  Copy,
  Check,
  Settings,
  CreditCard,
  User,
  Phone,
  MapPin,
  X,
  CheckSquare,
  Square,
  RotateCcw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';

export default function AdminDashboardPage() {
  const {
    products,
    promotions,
    sales,
    setProducts,
    whatsappNumber,
    setWhatsappNumber,
    bankDetails,
    setBankDetails,
    createAdminOrder,
    resetAllData,
  } = useCart();

  // Modal para Crear Pedido Manual por WhatsApp (Administradores)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transferencia');

  // Selección de Ítems (tiqueado)
  const [selectedItems, setSelectedItems] = useState<{ [id: string]: { selected: boolean; quantity: number; type: 'product' | 'promotion' } }>({});

  const [generatedSummary, setGeneratedSummary] = useState('');
  const [summaryWhatsappUrl, setSummaryWhatsappUrl] = useState('');
  const [summaryClientWhatsappUrl, setSummaryClientWhatsappUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // State para modal de configuración de WhatsApp y Banco (Super Admin)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editWaNum, setEditWaNum] = useState(whatsappNumber);
  const [editBank, setEditBank] = useState(bankDetails);

  // 1. REQUISITO MÓDULO 4: Alerta de Stock Bajo (< 3 Unidades)
  const criticalStockProducts = products.filter((p) => p.stock < 3);

  // 2. Métricas de Ventas DINÁMICAS (Calculadas directamente de sales del contexto)
  const totalRevenue = sales.reduce((sum, s) => sum + s.total_amount, 0);

  const formattedTotalRevenue = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(totalRevenue);

  // 3. Días Más Vendidos
  const daysOfWeekMap: { [key: string]: number } = {
    Lun: 0,
    Mar: 0,
    Mié: 0,
    Jue: 0,
    Vie: 0,
    Sáb: 0,
    Dom: 0,
  };

  sales.forEach((s) => {
    const date = new Date(s.created_at);
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dayName = dayNames[date.getDay()];
    if (daysOfWeekMap[dayName] !== undefined) {
      daysOfWeekMap[dayName] += s.total_amount;
    }
  });

  const daysData = [
    { day: 'Lun', ventas: daysOfWeekMap['Lun'] },
    { day: 'Mar', ventas: daysOfWeekMap['Mar'] },
    { day: 'Mié', ventas: daysOfWeekMap['Mié'] },
    { day: 'Jue', ventas: daysOfWeekMap['Jue'] },
    { day: 'Vie', ventas: daysOfWeekMap['Vie'] },
    { day: 'Sáb', ventas: daysOfWeekMap['Sáb'] },
    { day: 'Dom', ventas: daysOfWeekMap['Dom'] },
  ];

  // 4. Popularidad de Productos
  const popularityMap: { [name: string]: number } = {};
  sales.forEach((s) => {
    s.items?.forEach((item) => {
      popularityMap[item.item_name] = (popularityMap[item.item_name] || 0) + item.quantity;
    });
  });

  const popularityData = Object.keys(popularityMap).map((name) => ({
    name: name.length > 18 ? name.substring(0, 18) + '...' : name,
    unidades: popularityMap[name],
  }));

  // 5. Salud de Stock
  const healthyCount = products.filter((p) => p.stock >= 3).length;
  const criticalCount = products.filter((p) => p.stock > 0 && p.stock < 3).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  const stockPieData = [
    { name: 'Stock Saludable (>=3)', value: healthyCount, color: '#10b981' },
    { name: 'Stock Crítico (<3)', value: criticalCount, color: '#f59e0b' },
    { name: 'Agotados (0)', value: outOfStockCount, color: '#ef4444' },
  ];

  const handleQuickRestock = (productId: string, amount: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: p.stock + amount } : p))
    );
  };

  const toggleItemSelection = (id: string, type: 'product' | 'promotion') => {
    setSelectedItems((prev) => {
      const current = prev[id] || { selected: false, quantity: 1, type };
      return {
        ...prev,
        [id]: { ...current, selected: !current.selected, type },
      };
    });
  };

  const updateItemQty = (id: string, quantity: number) => {
    setSelectedItems((prev) => {
      const current = prev[id] || { selected: true, quantity: 1, type: 'product' };
      return {
        ...prev,
        [id]: { ...current, quantity: Math.max(1, quantity) },
      };
    });
  };

  const handleProcessAdminOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !deliveryAddress) {
      alert('Por favor ingresa todos los datos del cliente.');
      return;
    }

    const itemsToOrder = Object.entries(selectedItems)
      .filter(([_, value]) => value.selected)
      .map(([id, value]) => ({ id, type: value.type, quantity: value.quantity }));

    if (itemsToOrder.length === 0) {
      alert('Debes tiquear al menos un producto o promoción.');
      return;
    }

    const result = await createAdminOrder(
      customerName,
      customerPhone,
      deliveryAddress,
      paymentMethod,
      itemsToOrder
    );

    if (result.success) {
      setGeneratedSummary(result.summaryText);
      const encodedMsg = encodeURIComponent(result.summaryText);

      const myWaUrl = `https://wa.me/${whatsappNumber.replace('+', '').trim()}?text=${encodedMsg}`;
      setSummaryWhatsappUrl(myWaUrl);

      const clientNum = customerPhone.replace(/[^0-9]/g, '');
      const clientWaUrl = `https://wa.me/${clientNum}?text=${encodedMsg}`;
      setSummaryClientWhatsappUrl(clientWaUrl);
    } else {
      alert(result.message);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setWhatsappNumber(editWaNum);
    setBankDetails(editBank);
    setIsSettingsOpen(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Dashboard & Botones de Acción */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Dashboard Administrador & Pedidos WhatsApp
          </h1>
          <p className="text-xs text-zinc-400">
            Gestiona ventas por WhatsApp, tiquea pedidos, selecciona forma de pago y controla el inventario.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botón Principal: Crear Pedido WhatsApp */}
          <button
            onClick={() => {
              setGeneratedSummary('');
              setSelectedItems({});
              setIsOrderModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 hover:opacity-95 transition-all border border-emerald-400/30"
          >
            <MessageSquare className="w-4 h-4" />
            <span>+ Crear Pedido WhatsApp</span>
          </button>

          {/* Configuración Super Admin */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 transition-colors"
            title="Configurar WhatsApp y Datos Bancarios"
          >
            <Settings className="w-4 h-4 text-purple-400" />
            <span>Ajustes WhatsApp & Banco</span>
          </button>
        </div>
      </div>

      {/* REQUISITO MÓDULO 4: ALERTA DE STOCK BAJO (< 3) BANNER PRIORITARIO */}
      {criticalStockProducts.length > 0 && (
        <section className="p-5 rounded-3xl bg-gradient-to-r from-red-950/80 via-zinc-900 to-orange-950/80 border-2 border-red-500/60 shadow-neon-red space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-red-600/30 text-red-400 border border-red-500/40 animate-pulse">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Alerta de Stock Crítico</span>
                  <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-xs">
                    {criticalStockProducts.length} Productos
                  </span>
                </h3>
                <p className="text-xs text-zinc-300">
                  Menos de 3 unidades en bodega. Reabastece con 1 clic:
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {criticalStockProducts.map((prod) => (
              <div
                key={prod.id}
                className="p-3 rounded-2xl bg-zinc-950/90 border border-red-500/30 flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="text-xs font-bold text-white truncate max-w-[140px]">{prod.name}</h4>
                  <span className="text-[11px] font-extrabold text-red-400">
                    Stock actual: {prod.stock} un.
                  </span>
                </div>
                <button
                  onClick={() => handleQuickRestock(prod.id, 10)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+10 Stock</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* KPI METRIC CARDS - 100% DINÁMICAS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-400">Ventas Totales</span>
            <h3 className="text-2xl font-black text-white mt-1">{formattedTotalRevenue}</h3>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> Actualizado en vivo
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-neon-purple">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-400">Transacciones</span>
            <h3 className="text-2xl font-black text-white mt-1">{sales.length} Pedidos</h3>
            <span className="text-[10px] text-zinc-500 block mt-1">Ventas registradas</span>
          </div>
          <div className="p-3 rounded-2xl bg-orange-600/20 text-orange-400 border border-orange-500/30 shadow-neon-orange">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-400">WhatsApp Destino</span>
            <h3 className="text-sm font-extrabold text-emerald-400 mt-1 truncate">+{whatsappNumber}</h3>
            <span className="text-[10px] text-zinc-500 block mt-1">Configurado</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-400">Packs Promocionales</span>
            <h3 className="text-2xl font-black text-white mt-1">{promotions.length} Promos</h3>
            <span className="text-[10px] text-purple-400 block mt-1">Bundles activos</span>
          </div>
          <div className="p-3 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </section>

      {/* SECCIÓN DE GRÁFICOS INTERACTIVOS (MÓDULO 6) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-white">Días de Mayor Venta</h3>
              <p className="text-xs text-zinc-400">Volumen de ingresos ($) por día de la semana</p>
            </div>
            <div className="p-2 rounded-xl bg-zinc-800 text-zinc-400">
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daysData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="day" stroke="#a1a1aa" fontSize={12} />
                <YAxis stroke="#a1a1aa" fontSize={11} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '12px' }}
                  formatter={(val: any) => [`$${val.toLocaleString('es-CL')}`, 'Ventas']}
                />
                <Bar dataKey="ventas" fill="#a855f7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-white">Salud del Inventario</h3>
            <p className="text-xs text-zinc-400">Proporción de stock saludable vs crítico</p>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stockPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs">
            {stockPieData.map((item) => (
              <div key={item.name} className="flex justify-between items-center text-zinc-300">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
                <span className="font-bold">{item.value} items</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ranking de Productos */}
      <section className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-4">
        <h3 className="text-base font-extrabold text-white">Ranking de Popularidad (Unidades Vendidas)</h3>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={popularityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis type="number" stroke="#a1a1aa" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={11} width={130} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }} />
              <Bar dataKey="unidades" fill="#f97316" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* MODAL CREAR PEDIDO WHATSAPP CON TIQUEADO Y FORMA DE PAGO */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-black text-white">Crear Pedido Manual WhatsApp</h3>
              </div>
              <button onClick={() => setIsOrderModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {generatedSummary ? (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-white">¡Pedido Registrado e Inventario Descontado!</h4>
                    <p className="text-zinc-300">Se ha guardado la venta en el historial y las métricas fueron actualizadas.</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-200 whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {generatedSummary}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href={summaryWhatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Enviar a Mi WhatsApp (Para Reenviar)</span>
                  </a>

                  <a
                    href={summaryClientWhatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-lg transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar Directo al Cliente</span>
                  </a>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{copied ? '¡Copiado!' : 'Copiar Texto al Portapapeles'}</span>
                  </button>
                  <button
                    onClick={() => setGeneratedSummary('')}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs"
                  >
                    Nuevo Pedido
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleProcessAdminOrder} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Nombre Cliente</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Pedro Soto"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Teléfono WhatsApp</label>
                    <input
                      type="tel"
                      required
                      placeholder="+56 9 8765 4321"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Dirección Despacho</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Av Providencia 123"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-purple-400" />
                    <span>Seleccionar Forma de Pago</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      onClick={() => setPaymentMethod('transferencia')}
                      className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                        paymentMethod === 'transferencia'
                          ? 'bg-purple-950/50 border-purple-500 text-white shadow-neon-purple'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'transferencia'}
                        onChange={() => setPaymentMethod('transferencia')}
                        className="accent-purple-500"
                      />
                      <div>
                        <span className="text-xs font-bold block">Transferencia Bancaria</span>
                        <span className="text-[10px] text-zinc-400 font-normal">Incluye datos de cuenta</span>
                      </div>
                    </label>

                    <label
                      onClick={() => setPaymentMethod('efectivo')}
                      className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                        paymentMethod === 'efectivo'
                          ? 'bg-emerald-950/50 border-emerald-500 text-white shadow-neon-purple'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'efectivo'}
                        onChange={() => setPaymentMethod('efectivo')}
                        className="accent-emerald-500"
                      />
                      <div>
                        <span className="text-xs font-bold block">Efectivo al Recibir</span>
                        <span className="text-[10px] text-zinc-400 font-normal">Cobro en domicilio</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-bold text-white block">
                    Tiquea los Productos o Packs que solicitó el cliente:
                  </span>

                  {promotions.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block">
                        Packs Promocionales
                      </span>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {promotions.map((promo) => {
                          const state = selectedItems[promo.id] || { selected: false, quantity: 1 };
                          return (
                            <div
                              key={promo.id}
                              className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                                state.selected
                                  ? 'bg-orange-950/40 border-orange-500/60'
                                  : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                              }`}
                            >
                              <div
                                onClick={() => toggleItemSelection(promo.id, 'promotion')}
                                className="flex items-center gap-2 cursor-pointer flex-1"
                              >
                                {state.selected ? (
                                  <CheckSquare className="w-4 h-4 text-orange-400 shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-zinc-600 shrink-0" />
                                )}
                                <div>
                                  <span className="text-xs font-bold text-white block">{promo.name}</span>
                                  <span className="text-[10px] text-orange-400 font-bold">
                                    ${promo.promo_price.toLocaleString('es-CL')}
                                  </span>
                                </div>
                              </div>

                              {state.selected && (
                                <div className="flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-700">
                                  <span className="text-xs text-zinc-400">Cant:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    value={state.quantity}
                                    onChange={(e) => updateItemQty(promo.id, parseInt(e.target.value) || 1)}
                                    className="w-12 text-center bg-transparent text-xs font-bold text-white focus:outline-none"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">
                      Productos Individuales
                    </span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {products.map((prod) => {
                        const state = selectedItems[prod.id] || { selected: false, quantity: 1 };
                        return (
                          <div
                            key={prod.id}
                            className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                              state.selected
                                ? 'bg-purple-950/40 border-purple-500/60'
                                : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            <div
                              onClick={() => toggleItemSelection(prod.id, 'product')}
                              className="flex items-center gap-2 cursor-pointer flex-1"
                            >
                              {state.selected ? (
                                <CheckSquare className="w-4 h-4 text-purple-400 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-zinc-600 shrink-0" />
                              )}
                              <div>
                                <span className="text-xs font-bold text-white block">{prod.name}</span>
                                <span className="text-[10px] text-zinc-400">
                                  ${prod.price.toLocaleString('es-CL')} (Stock: {prod.stock})
                                </span>
                              </div>
                            </div>

                            {state.selected && (
                              <div className="flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-700">
                                <span className="text-xs text-zinc-400">Cant:</span>
                                <input
                                  type="number"
                                  min="1"
                                  max={prod.stock}
                                  value={state.quantity}
                                  onChange={(e) => updateItemQty(prod.id, parseInt(e.target.value) || 1)}
                                  className="w-12 text-center bg-transparent text-xs font-bold text-white focus:outline-none"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOrderModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-500 shadow-lg hover:opacity-95 transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Generar Resumen WhatsApp y Confirmar Venta</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL CONFIGURACIÓN WHATSAPP & DATOS BANCARIOS */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-extrabold text-white">Configuración Super Administrador</h3>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-white">Número de WhatsApp de Ventas / Destino</label>
                <p className="text-zinc-400 text-[11px]">
                  Número al cual llegarán los carritos armados por clientes en la web (con código de país sin signo +).
                </p>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={editWaNum}
                    onChange={(e) => setEditWaNum(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono"
                    placeholder="56912345678"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-zinc-800">
                <span className="font-bold text-white block">Datos de Transferencia Bancaria</span>
                <p className="text-zinc-400 text-[11px]">
                  Estos datos se incluirán automáticamente en el mensaje de WhatsApp enviado al cliente.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-400 mb-0.5">Banco</label>
                    <input
                      type="text"
                      value={editBank.banco}
                      onChange={(e) => setEditBank({ ...editBank, banco: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-0.5">Tipo de Cuenta</label>
                    <input
                      type="text"
                      value={editBank.tipoCuenta}
                      onChange={(e) => setEditBank({ ...editBank, tipoCuenta: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-0.5">Número de Cuenta</label>
                    <input
                      type="text"
                      value={editBank.numeroCuenta}
                      onChange={(e) => setEditBank({ ...editBank, numeroCuenta: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-0.5">RUT Titular</label>
                    <input
                      type="text"
                      value={editBank.rut}
                      onChange={(e) => setEditBank({ ...editBank, rut: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-400 mb-0.5">Nombre Titular</label>
                    <input
                      type="text"
                      value={editBank.nombre}
                      onChange={(e) => setEditBank({ ...editBank, nombre: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-0.5">Correo de Confirmación</label>
                    <input
                      type="email"
                      value={editBank.email}
                      onChange={(e) => setEditBank({ ...editBank, email: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Opción de Reset general de Datos de Prueba */}
              <div className="pt-3 border-t border-zinc-800 space-y-2">
                <span className="font-bold text-red-400 block">Zona de Limpieza de Datos de Prueba</span>
                <p className="text-zinc-500 text-[11px]">
                  Si deseas eliminar ventas ficticias y restaurar el stock a los valores originales de catálogo:
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('¿Deseas reiniciar todas las ventas ficticias y restaurar el stock de catálogo?')) {
                      resetAllData();
                      setIsSettingsOpen(false);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 font-bold text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer Datos de Prueba</span>
                </button>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Guardar Ajustes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
