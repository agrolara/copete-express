'use client';

import React, { useState, useMemo } from 'react';
import { useCart } from '@/context/CartContext';
import { Invoice, InvoiceItem, Product } from '@/types';
import { formatImageUrl } from '@/lib/imageUtils';
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  Package,
  Calendar,
  Building2,
  CreditCard,
  Search,
  Eye,
  X,
  Check,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Sparkles,
  Layers,
  ShoppingBag,
} from 'lucide-react';

export default function AdminInvoicesPage() {
  const { products, invoices, addInvoice, updateInvoice, deleteInvoice } = useCart();

  // Estados para nuevo ingreso / edición de factura (EN UNA SOLA PLANA)
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [supplierRut, setSupplierRut] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'transferencia' | 'efectivo'>('transferencia');
  const [notes, setNotes] = useState('');

  // Ítems de la factura en edición
  const [invoiceItems, setInvoiceItems] = useState<
    Array<{
      id: string;
      product_id: string;
      product_name: string;
      category: string;
      quantity: number;
      cost_price: number;
      selling_price: number;
      is_new_product: boolean;
      image_url?: string;
    }>
  >([]);

  // Constructor directo integrado de ítems (Sin Modales Flotantes)
  const [itemMode, setItemMode] = useState<'existing' | 'new'>('existing');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Piscos');
  const [newProductCost, setNewProductCost] = useState<number>(0);
  const [newProductPrice, setNewProductPrice] = useState<number>(0);
  const [itemQuantity, setItemQuantity] = useState<number>(12);
  const [itemCost, setItemCost] = useState<number>(0);
  const [itemSellingPrice, setItemSellingPrice] = useState<number>(0);

  // Estados para ver detalle de factura
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Formato monetario que soporta decimales
  const formatMoney = (val: number) => {
    return (
      '$' +
      Number(val || 0).toLocaleString('es-CL', {
        minimumFractionDigits: val % 1 !== 0 ? 2 : 0,
        maximumFractionDigits: 2,
      })
    );
  };

  // Productos ordenados ALFABÉTICAMENTE A-Z para todas las listas desplegables
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );
  }, [products]);

  // Proveedores frecuentes extraídos de las facturas previas
  const frequentSuppliers = useMemo(() => {
    const suppliers = new Set<string>();
    invoices.forEach((i) => {
      if (i.supplier_name) suppliers.add(i.supplier_name);
    });
    return Array.from(suppliers);
  }, [invoices]);

  // Total calculado de la factura actual
  const currentInvoiceTotal = useMemo(() => {
    const total = invoiceItems.reduce((sum, item) => sum + item.cost_price * item.quantity, 0);
    return Math.round(total * 100) / 100;
  }, [invoiceItems]);

  // Métricas generales de facturas
  const totalInvoicedAmount = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  }, [invoices]);

  const totalUnitsPurchased = useMemo(() => {
    return invoices.reduce((sum, inv) => {
      return sum + inv.items.reduce((iSum, it) => iSum + it.quantity, 0);
    }, 0);
  }, [invoices]);

  // Abrir formulario plano para crear nueva factura limpia
  const handleOpenCreateInvoice = () => {
    setEditingInvoiceId(null);
    setSupplierName('');
    setSupplierRut('');
    setInvoiceNumber('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('transferencia');
    setNotes('');
    setInvoiceItems([]);
    setSelectedInvoice(null);
    setIsNewInvoiceOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Abrir formulario plano para editar factura existente
  const handleOpenEditInvoice = (inv: Invoice) => {
    setEditingInvoiceId(inv.id);
    setSupplierName(inv.supplier_name);
    setSupplierRut(inv.supplier_rut || '');
    setInvoiceNumber(inv.invoice_number);
    setInvoiceDate(inv.invoice_date);
    setPaymentMethod(inv.payment_method);
    setNotes(inv.notes || '');
    setInvoiceItems(
      inv.items.map((it) => ({
        id: it.id || crypto.randomUUID(),
        product_id: it.product_id,
        product_name: it.product_name,
        category: it.category || 'Otros',
        quantity: it.quantity,
        cost_price: it.cost_price,
        selling_price: it.selling_price || 0,
        is_new_product: !!it.is_new_product,
      }))
    );
    setSelectedInvoice(null);
    setIsNewInvoiceOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Manejar selección de producto existente para auto-rellenar costo y precio
  const handleSelectExistingProduct = (productId: string) => {
    setSelectedProductId(productId);
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      setItemCost(prod.cost_price || Math.round(prod.price * 0.6));
      setItemSellingPrice(prod.price);
    }
  };

  // Agregar ítem al listado temporal de la factura
  const handleAddDirectItemToInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    if (itemMode === 'new') {
      if (!newProductName.trim()) {
        alert('Ingresa el nombre del nuevo producto.');
        return;
      }
      if (newProductCost <= 0) {
        alert('Ingresa un costo unitario válido mayor a $0.');
        return;
      }

      const generatedId = crypto.randomUUID();
      setInvoiceItems((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          product_id: generatedId,
          product_name: newProductName.trim(),
          category: newProductCategory,
          quantity: Math.max(1, itemQuantity),
          cost_price: Number(newProductCost),
          selling_price: newProductPrice > 0 ? Number(newProductPrice) : Math.round(newProductCost * 1.4),
          is_new_product: true,
        },
      ]);

      // Reset
      setNewProductName('');
      setNewProductCost(0);
      setNewProductPrice(0);
      setItemQuantity(12);
    } else {
      if (!selectedProductId) {
        alert('Selecciona un producto del catálogo.');
        return;
      }
      const prod = products.find((p) => p.id === selectedProductId);
      if (!prod) return;

      setInvoiceItems((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          product_id: prod.id,
          product_name: prod.name,
          category: prod.category,
          quantity: Math.max(1, itemQuantity),
          cost_price: itemCost > 0 ? Number(itemCost) : prod.cost_price || 0,
          selling_price: itemSellingPrice > 0 ? Number(itemSellingPrice) : prod.price,
          is_new_product: false,
        },
      ]);

      setSelectedProductId('');
      setItemCost(0);
      setItemSellingPrice(0);
      setItemQuantity(12);
    }
  };

  const handleRemoveInvoiceItem = (index: number) => {
    setInvoiceItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItemQuantity = (index: number, qty: number) => {
    setInvoiceItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: Math.max(1, qty) } : item))
    );
  };

  const handleUpdateItemCost = (index: number, cost: number) => {
    setInvoiceItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, cost_price: Math.max(0, cost) } : item))
    );
  };

  // Guardar o Actualizar Factura
  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      alert('Ingresa el nombre o razón social del proveedor.');
      return;
    }
    if (!invoiceNumber.trim()) {
      alert('Ingresa el número de factura o folio.');
      return;
    }
    if (invoiceItems.length === 0) {
      alert('Debes agregar al menos un producto a la factura.');
      return;
    }

    setLoading(true);

    const newProductsToRegister: Product[] = [];
    const formattedInvoiceItems: InvoiceItem[] = [];

    invoiceItems.forEach((item) => {
      if (item.is_new_product) {
        const newProduct: Product = {
          id: item.product_id,
          name: item.product_name,
          category: item.category,
          description: '',
          price: item.selling_price,
          cost_price: item.cost_price,
          stock: 0,
          image_url: item.image_url || 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=600&q=80',
          is_active: true,
        };
        newProductsToRegister.push(newProduct);
      }

      formattedInvoiceItems.push({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        category: item.category,
        quantity: item.quantity,
        cost_price: item.cost_price,
        total_cost: Math.round(item.cost_price * item.quantity * 100) / 100,
        selling_price: item.selling_price,
        is_new_product: item.is_new_product,
      });
    });

    const invoicePayload: Invoice = {
      id: editingInvoiceId || crypto.randomUUID(),
      invoice_number: invoiceNumber.trim(),
      supplier_name: supplierName.trim(),
      supplier_rut: supplierRut.trim(),
      invoice_date: invoiceDate,
      total_amount: currentInvoiceTotal,
      payment_method: paymentMethod,
      notes: notes.trim(),
      items: formattedInvoiceItems,
      created_at: new Date().toISOString(),
    };

    if (editingInvoiceId) {
      await updateInvoice(invoicePayload, newProductsToRegister);
    } else {
      await addInvoice(invoicePayload, newProductsToRegister);
    }

    setLoading(false);
    setIsNewInvoiceOpen(false);
    setEditingInvoiceId(null);
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (confirm('¿Estás seguro de eliminar esta factura? El stock cargado por esta factura será revertido.')) {
      await deleteInvoice(invoiceId, true);
      if (selectedInvoice?.id === invoiceId) {
        setSelectedInvoice(null);
      }
    }
  };

  // Filtrado de facturas históricas
  const filteredInvoices = invoices.filter((inv) => {
    const term = searchTerm.toLowerCase();
    return (
      inv.invoice_number.toLowerCase().includes(term) ||
      inv.supplier_name.toLowerCase().includes(term) ||
      (inv.supplier_rut && inv.supplier_rut.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-purple-400" />
            <span>Módulo de Facturas y Abastecimiento</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Registra y edita facturas de compra para actualizar automáticamente el stock y los costos unitarios del inventario.
          </p>
        </div>

        {!isNewInvoiceOpen && (
          <button
            onClick={handleOpenCreateInvoice}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black shadow-neon-purple hover:opacity-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Ingresar Nueva Factura</span>
          </button>
        )}
      </div>

      {/* Tarjetas de Métricas de Abastecimiento */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-zinc-900/90 border border-purple-500/40 shadow-neon-purple flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300">Total Facturado</span>
            <h3 className="text-3xl font-black text-white mt-1.5">{formatMoney(totalInvoicedAmount)}</h3>
            <span className="text-[11px] text-purple-400 font-bold block mt-1">
              {invoices.length} facturas registradas
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-zinc-900/90 border border-orange-500/40 shadow-neon-orange flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-300">Proveedores Activos</span>
            <h3 className="text-3xl font-black text-orange-400 mt-1.5">{frequentSuppliers.length} Proveedores</h3>
            <span className="text-[11px] text-zinc-400 block mt-1">Empresas emisoras registradas</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-zinc-900/90 border border-emerald-500/40 shadow-neon-emerald flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Unidades Abastecidas</span>
            <h3 className="text-3xl font-black text-emerald-400 mt-1.5">
              +{totalUnitsPurchased.toLocaleString('es-CL')} un.
            </h3>
            <span className="text-[11px] text-emerald-400 font-bold block mt-1">Mercadería cargada a bodega</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
            <Package className="w-6 h-6" />
          </div>
        </div>
      </section>

      {/* FORMULARIO DIRECTO EN LA PÁGINA (EN UNA MISMA PLANA - SIN POPUPS NI SCROLLBARS CORTADOS) */}
      {isNewInvoiceOpen && (
        <section className="p-6 sm:p-8 rounded-3xl bg-zinc-900 border-2 border-purple-500/50 shadow-2xl space-y-6 animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">
                  {editingInvoiceId ? `Editar Factura #${invoiceNumber}` : 'Ingresar Factura de Proveedor'}
                </h2>
                <p className="text-xs text-zinc-400">
                  Todo en una sola plana: ingresa emisor, folio, productos con costos exactos y medio de pago.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsNewInvoiceOpen(false);
                setEditingInvoiceId(null);
              }}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              title="Cerrar formulario"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveInvoice} className="space-y-6">
            {/* FILA 1: DATOS DE ENCABEZADO DE LA FACTURA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">Emisor / Proveedor *</label>
                <input
                  type="text"
                  required
                  list="suppliers-list"
                  placeholder="Ej: Distribuidora Dorsal L"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
                <datalist id="suppliers-list">
                  {frequentSuppliers.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">RUT Proveedor</label>
                <input
                  type="text"
                  placeholder="Ej: 96.541.230-8"
                  value={supplierRut}
                  onChange={(e) => setSupplierRut(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">N° Factura / Folio *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 1141050"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">Fecha Emisión *</label>
                <input
                  type="date"
                  required
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* FILA 2: MEDIO DE PAGO Y NOTAS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-orange-400" />
                  <span>Medio de Pago de la Factura</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transferencia')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      paymentMethod === 'transferencia'
                        ? 'bg-purple-950/60 border-purple-500 text-white shadow-neon-purple'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    💳 Transferencia Bancaria
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('efectivo')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      paymentMethod === 'efectivo'
                        ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-neon-purple'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    💵 Efectivo de Caja
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">Notas u Observaciones (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Descuento por volumen incluido"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* FILA 3: CONSTRUCTOR INTEGRADO DE PRODUCTOS (PLANO Y DIRECTO) */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-400" />
                  <span>Agregar Productos a la Factura</span>
                </h3>

                {/* Switch Existente vs Nuevo */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setItemMode('existing')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      itemMode === 'existing'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Catálogo Existente (A-Z)
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemMode('new')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      itemMode === 'new'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    + Crear Nuevo Producto
                  </button>
                </div>
              </div>

              {/* Formulario Rápido de Agregar Ítem */}
              {itemMode === 'existing' ? (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                      Seleccionar Producto (Orden A-Z) *
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => handleSelectExistingProduct(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value="">-- Elige un producto --</option>
                      {sortedProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stock: {p.stock} un. | Costo: {formatMoney(p.cost_price || 0)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1 text-center">
                      Cantidad (un.)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-2 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-center text-white font-mono font-bold text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1 text-center">
                      Costo Unit. ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={itemCost || ''}
                      onChange={(e) => setItemCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-center text-white font-mono font-bold text-xs"
                      placeholder="Costo con decimales"
                    />
                  </div>

                  <div className="sm:col-span-3 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddDirectItemToInvoice}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Agregar a Factura</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                      Nombre Nuevo Producto *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Tequila Especial 750ml"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Categoría</label>
                    <select
                      value={newProductCategory}
                      onChange={(e) => setNewProductCategory(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white"
                    >
                      <option value="Piscos">Piscos</option>
                      <option value="Cervezas">Cervezas</option>
                      <option value="Destilados">Destilados</option>
                      <option value="Vinos">Vinos</option>
                      <option value="Bebidas & Hielo">Bebidas & Hielo</option>
                      <option value="Snacks & Otros">Snacks & Otros</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1 text-center">
                      Cantidad (un.)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-2 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-center text-white font-mono font-bold text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1 text-center">
                      Costo Unit. ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="865.50"
                      value={newProductCost || ''}
                      onChange={(e) => setNewProductCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-center text-white font-mono font-bold text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddDirectItemToInvoice}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Crear y Agregar</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tabla de Productos de la Factura */}
              {invoiceItems.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-xs space-y-2">
                  <Package className="w-8 h-8 mx-auto text-zinc-600" />
                  <p className="font-semibold text-zinc-400">Aún no has agregado ningún producto a esta factura.</p>
                  <p className="text-[11px] text-zinc-500">
                    Utiliza la barra superior para agregar productos del catálogo o crear nuevos productos.
                  </p>
                </div>
              ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3">Producto</th>
                        <th className="p-3">Tipo</th>
                        <th className="p-3 text-center">Cantidad (un.)</th>
                        <th className="p-3 text-right">Costo Unit. ($)</th>
                        <th className="p-3 text-right">Total Ítem ($)</th>
                        <th className="p-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                      {invoiceItems.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-zinc-950/40 transition-colors">
                          <td className="p-3 font-bold text-white">{item.product_name}</td>
                          <td className="p-3">
                            {item.is_new_product ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                Nuevo Producto
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] font-bold">
                                Catálogo Existente
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center font-extrabold text-white">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItemQuantity(idx, parseInt(e.target.value) || 1)}
                              className="w-16 px-2 py-1 text-center bg-zinc-950 border border-zinc-700 rounded-lg text-white font-mono"
                            />
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-orange-400">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.cost_price}
                              onChange={(e) => handleUpdateItemCost(idx, parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 text-right bg-zinc-950 border border-zinc-700 rounded-lg text-white font-mono"
                            />
                          </td>
                          <td className="p-3 text-right font-mono font-black text-white">
                            {formatMoney(item.cost_price * item.quantity)}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveInvoiceItem(idx)}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/60 transition-colors"
                              title="Quitar ítem"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Totalizador de la Factura */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-zinc-900 border border-purple-500/30 gap-4">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-bold block">Ítems Agregados:</span>
                    <span className="text-base font-black text-white">{invoiceItems.length} productos</span>
                  </div>
                  <div className="h-8 w-px bg-zinc-800" />
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-bold block">Total Unidades:</span>
                    <span className="text-base font-black text-emerald-400">
                      +{invoiceItems.reduce((s, it) => s + it.quantity, 0)} un.
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-zinc-400 uppercase font-bold block">Total a Pagar Factura:</span>
                  <span className="text-2xl font-black text-purple-400 font-mono">
                    {formatMoney(currentInvoiceTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN: GUARDAR / CANCELAR */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsNewInvoiceOpen(false);
                  setEditingInvoiceId(null);
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={loading || invoiceItems.length === 0}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-sm shadow-neon-purple hover:opacity-95 disabled:opacity-50 transition-all"
              >
                <Check className="w-5 h-5" />
                <span>{editingInvoiceId ? 'Guardar Cambios de la Factura' : 'Guardar y Cargar Stock a Bodega'}</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Historial de Facturas Registradas */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Buscar factura por N° folio, proveedor o RUT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <span className="text-xs text-zinc-400 font-medium">
            Mostrando {filteredInvoices.length} de {invoices.length} facturas
          </span>
        </div>

        {invoices.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-zinc-900 border-2 border-dashed border-zinc-800 space-y-3">
            <FileText className="w-10 h-10 mx-auto text-purple-400" />
            <h3 className="text-base font-bold text-white">No hay facturas ingresadas</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Ingresa las facturas de tus distribuidores para cargar mercadería y valorizar el costo real del inventario.
            </p>
            <button
              onClick={handleOpenCreateInvoice}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Ingresar Primera Factura</span>
            </button>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">N° Factura</th>
                    <th className="p-4">Proveedor / Emisor</th>
                    <th className="p-4">Fecha</th>
                    <th className="p-4">Medio de Pago</th>
                    <th className="p-4 text-center">Ítems</th>
                    <th className="p-4 text-right">Total Factura ($)</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="p-4 font-mono font-bold text-purple-400">#{inv.invoice_number}</td>
                      <td className="p-4">
                        <span className="font-extrabold text-white block">{inv.supplier_name}</span>
                        {inv.supplier_rut && (
                          <span className="text-[11px] text-zinc-500 font-mono">{inv.supplier_rut}</span>
                        )}
                      </td>
                      <td className="p-4 text-zinc-400">{inv.invoice_date}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            inv.payment_method === 'transferencia'
                              ? 'bg-purple-950/60 border-purple-500/40 text-purple-300'
                              : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                          }`}
                        >
                          {inv.payment_method === 'transferencia' ? '💳 Transferencia' : '💵 Efectivo'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-1 rounded-lg bg-zinc-950 text-zinc-300 font-mono text-[11px] font-bold">
                          {inv.items.length} productos
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-black text-white text-sm">
                        {formatMoney(inv.total_amount)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                            title="Ver Detalle Factura"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditInvoice(inv)}
                            className="p-2 rounded-xl bg-purple-950/60 hover:bg-purple-900 text-purple-300 transition-colors"
                            title="Editar Factura"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteInvoice(inv.id)}
                            className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-400 transition-colors"
                            title="Eliminar Factura"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* SECCIÓN DETALLE DE FACTURA SELECCIONADA (PLANO Y ELEGANTE) */}
      {selectedInvoice && (
        <section className="p-6 sm:p-8 rounded-3xl bg-zinc-900 border-2 border-purple-500/40 shadow-2xl space-y-6 animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-600/20 text-purple-400">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  Detalle Factura #{selectedInvoice.invoice_number} - {selectedInvoice.supplier_name}
                </h3>
                <p className="text-xs text-zinc-400">
                  Emitida el {selectedInvoice.invoice_date} | Pagada con{' '}
                  <strong className="text-white">
                    {selectedInvoice.payment_method === 'transferencia' ? 'Transferencia' : 'Efectivo'}
                  </strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenEditInvoice(selectedInvoice)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar Factura</span>
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Producto</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3 text-center">Cantidad</th>
                  <th className="p-3 text-right">Costo Unitario ($)</th>
                  <th className="p-3 text-right">Total Ítem ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {selectedInvoice.items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-zinc-900/40">
                    <td className="p-3 font-bold text-white">{it.product_name}</td>
                    <td className="p-3 text-zinc-400">{it.category || 'Licores'}</td>
                    <td className="p-3 text-center font-extrabold text-white">{it.quantity} un.</td>
                    <td className="p-3 text-right font-mono font-bold text-orange-400">
                      {formatMoney(it.cost_price)}
                    </td>
                    <td className="p-3 text-right font-mono font-black text-white">
                      {formatMoney(it.cost_price * it.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-zinc-500">
              Total productos ingresados:{' '}
              <strong className="text-white">
                {selectedInvoice.items.reduce((s, it) => s + it.quantity, 0)} unidades
              </strong>
            </span>
            <div className="text-right">
              <span className="text-xs text-zinc-400 block font-bold">Total Factura:</span>
              <span className="text-2xl font-black text-purple-400 font-mono">
                {formatMoney(selectedInvoice.total_amount)}
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
