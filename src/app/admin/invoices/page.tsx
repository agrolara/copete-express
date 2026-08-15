'use client';

import React, { useState, useMemo } from 'react';
import { useCart } from '@/context/CartContext';
import { Invoice, InvoiceItem, Product } from '@/types';
import {
  FileText,
  Plus,
  Trash2,
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
} from 'lucide-react';

export default function AdminInvoicesPage() {
  const { products, invoices, addInvoice, deleteInvoice } = useCart();

  // Estados para nuevo ingreso de factura
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
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

  // Modal para agregar producto existente o crear producto nuevo dentro de la factura
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [isCreatingNewProduct, setIsCreatingNewProduct] = useState(false);
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
    return invoiceItems.reduce((sum, item) => sum + item.cost_price * item.quantity, 0);
  }, [invoiceItems]);

  // Manejar selección de producto existente para auto-rellenar costo y precio
  const handleSelectExistingProduct = (productId: string) => {
    setSelectedProductId(productId);
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      setItemCost(prod.cost_price || Math.round(prod.price * 0.6));
      setItemSellingPrice(prod.price);
    }
  };

  // Agregar ítem a la lista de la factura
  const handleAddItemToInvoice = () => {
    if (isCreatingNewProduct) {
      if (!newProductName.trim() || newProductCost <= 0) {
        alert('Ingresa el nombre del nuevo producto y su costo unitario.');
        return;
      }
      const tempId = crypto.randomUUID();
      setInvoiceItems((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          product_id: tempId,
          product_name: newProductName.trim(),
          category: newProductCategory,
          quantity: Math.max(1, itemQuantity),
          cost_price: newProductCost,
          selling_price: newProductPrice || Math.round(newProductCost * 1.5),
          is_new_product: true,
          image_url: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=600&q=80',
        },
      ]);
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
          cost_price: itemCost > 0 ? itemCost : prod.cost_price || 0,
          selling_price: itemSellingPrice > 0 ? itemSellingPrice : prod.price,
          is_new_product: false,
        },
      ]);
    }

    // Reset modal de ítem
    setIsItemModalOpen(false);
    setSelectedProductId('');
    setIsCreatingNewProduct(false);
    setNewProductName('');
    setNewProductCost(0);
    setNewProductPrice(0);
    setItemQuantity(12);
  };

  const handleRemoveInvoiceItem = (index: number) => {
    setInvoiceItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Guardar Factura e Impactar Inventario
  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim() || !invoiceNumber.trim()) {
      alert('Ingresa el nombre del emisor/proveedor y el número de factura.');
      return;
    }
    if (invoiceItems.length === 0) {
      alert('Debes agregar al menos un producto a la factura.');
      return;
    }

    setLoading(true);

    // Preparar nuevos productos si los hay
    const newProductsToRegister: Product[] = [];
    const formattedInvoiceItems: InvoiceItem[] = [];

    invoiceItems.forEach((item) => {
      if (item.is_new_product) {
        const newProduct: Product = {
          id: item.product_id,
          name: item.product_name,
          category: item.category,
          description: `${item.product_name} ingresado mediante factura #${invoiceNumber}`,
          price: item.selling_price,
          cost_price: item.cost_price,
          stock: 0, // addInvoice sumará la cantidad
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
        total_cost: item.cost_price * item.quantity,
        selling_price: item.selling_price,
        is_new_product: item.is_new_product,
      });
    });

    const result = await addInvoice(
      {
        invoice_number: invoiceNumber.trim(),
        supplier_name: supplierName.trim(),
        supplier_rut: supplierRut.trim(),
        invoice_date: invoiceDate,
        payment_method: paymentMethod,
        total_amount: currentInvoiceTotal,
        items: formattedInvoiceItems,
        notes: notes.trim(),
      },
      newProductsToRegister
    );

    setLoading(false);

    if (result.success) {
      alert(result.message);
      setIsNewInvoiceOpen(false);
      setSupplierName('');
      setSupplierRut('');
      setInvoiceNumber('');
      setNotes('');
      setInvoiceItems([]);
    } else {
      alert(result.message);
    }
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    if (confirm('¿Deseas eliminar esta factura de compra y revertir el stock sumado al inventario?')) {
      deleteInvoice(invoiceId, true);
      if (selectedInvoice?.id === invoiceId) {
        setSelectedInvoice(null);
      }
    }
  };

  // Filtrado de historial de facturas
  const filteredInvoices = useMemo(() => {
    return invoices.filter(
      (inv) =>
        inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.items.some((it) => it.product_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [invoices, searchTerm]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-purple-400" />
            <span>Ingreso de Facturas & Abastecimiento</span>
          </h1>
          <p className="text-xs text-zinc-400">
            Método principal para ingresar mercadería, registrar facturas de proveedores, crear nuevos productos y actualizar costos unitarios.
          </p>
        </div>

        <button
          onClick={() => {
            setInvoiceItems([]);
            setIsNewInvoiceOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 text-white font-extrabold text-xs shadow-neon-purple hover:opacity-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Ingresar Nueva Factura</span>
        </button>
      </div>

      {/* MODAL / FORMULARIO PRINCIPAL DE INGRESO DE FACTURA */}
      {isNewInvoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-black text-white">Ingresar Factura de Proveedor</h3>
              </div>
              <button onClick={() => setIsNewInvoiceOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="space-y-6">
              {/* Datos de Encabezado de Factura */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Emisor / Proveedor *
                  </label>
                  <input
                    type="text"
                    required
                    list="suppliers-list"
                    placeholder="Ej: Distribuidora CCU"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                  <datalist id="suppliers-list">
                    {frequentSuppliers.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">RUT Proveedor</label>
                  <input
                    type="text"
                    placeholder="Ej: 96.541.230-8"
                    value={supplierRut}
                    onChange={(e) => setSupplierRut(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    N° de Factura / Folio *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: FAC-10294"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Fecha Emisión *</label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Forma de Pago y Notas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5">
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
                          ? 'bg-purple-950/50 border-purple-500 text-white shadow-neon-purple'
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
                          ? 'bg-emerald-950/50 border-emerald-500 text-white shadow-neon-purple'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      💵 Efectivo de Caja
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Observaciones / Glosa</label>
                  <input
                    type="text"
                    placeholder="Ej: Reposición de fin de semana..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* TABLA DE ÍTEMS DE LA FACTURA */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Package className="w-4 h-4 text-purple-400" />
                    <span>Productos de la Factura ({invoiceItems.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProductId('');
                      setIsCreatingNewProduct(false);
                      setIsItemModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Agregar Producto a la Factura</span>
                  </button>
                </div>

                {invoiceItems.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-xs space-y-2">
                    <Package className="w-8 h-8 mx-auto text-zinc-600" />
                    <p>Aún no has agregado ningún producto a esta factura.</p>
                    <p className="text-[11px] text-zinc-600">
                      Haz clic en &quot;+ Agregar Producto&quot; para seleccionar del catálogo o crear nuevos productos.
                    </p>
                  </div>
                ) : (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3">Producto</th>
                          <th className="p-3">Tipo</th>
                          <th className="p-3 text-center">Cantidad</th>
                          <th className="p-3 text-right">Costo Unitario ($)</th>
                          <th className="p-3 text-right">Total Ítem ($)</th>
                          <th className="p-3 text-right">Precio Venta Catálogo</th>
                          <th className="p-3 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                        {invoiceItems.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-zinc-900/40">
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
                            <td className="p-3 text-center font-extrabold text-white">+{item.quantity} un.</td>
                            <td className="p-3 text-right font-mono text-orange-400">
                              ${item.cost_price.toLocaleString('es-CL')}
                            </td>
                            <td className="p-3 text-right font-mono font-extrabold text-white">
                              ${(item.cost_price * item.quantity).toLocaleString('es-CL')}
                            </td>
                            <td className="p-3 text-right font-mono text-zinc-400">
                              ${item.selling_price.toLocaleString('es-CL')}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveInvoiceItem(idx)}
                                className="p-1 rounded-lg text-red-400 hover:bg-red-950/60 transition-colors"
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
              </div>

              {/* Total y Botones de Acción */}
              <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-400">Total Factura:</span>
                  <span className="text-2xl font-black text-purple-400">
                    ${currentInvoiceTotal.toLocaleString('es-CL')}
                  </span>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsNewInvoiceOpen(false)}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || invoiceItems.length === 0}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 text-white font-black text-xs shadow-neon-purple hover:opacity-95 transition-all disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{loading ? 'Procesando...' : 'Guardar Factura y Actualizar Stock'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL PARA SELECCIONAR O CREAR PRODUCTO EN LA FACTURA */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-extrabold text-white">Agregar Producto a la Factura</h3>
              <button onClick={() => setIsItemModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toggle entre Producto Existente vs Crear Nuevo Producto */}
            <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setIsCreatingNewProduct(false)}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  !isCreatingNewProduct ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Catálogo Existente
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingNewProduct(true)}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  isCreatingNewProduct ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                + Crear Nuevo Producto
              </button>
            </div>

            {isCreatingNewProduct ? (
              /* FORMULARIO CREAR NUEVO PRODUCTO DIRECTO EN LA FACTURA */
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Nombre del Nuevo Producto *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Tequila José Cuervo Especial 750ml"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-bold">Categoría</label>
                    <select
                      value={newProductCategory}
                      onChange={(e) => setNewProductCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                    >
                      <option value="Piscos">Piscos</option>
                      <option value="Cervezas">Cervezas</option>
                      <option value="Destilados">Destilados</option>
                      <option value="Vinos">Vinos</option>
                      <option value="Bebidas & Hielo">Bebidas & Hielo</option>
                      <option value="Snacks & Otros">Snacks & Otros</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-bold">Cantidad Comprada *</label>
                    <input
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-bold">Costo Unitario ($) *</label>
                    <input
                      type="number"
                      min="0"
                      value={newProductCost || ''}
                      onChange={(e) => setNewProductCost(parseInt(e.target.value) || 0)}
                      placeholder="Costo en factura"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-bold">Precio Venta Público ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={newProductPrice || ''}
                      onChange={(e) => setNewProductPrice(parseInt(e.target.value) || 0)}
                      placeholder="Precio catálogo"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* SELECCIÓN DE PRODUCTO EXISTENTE DEL CATÁLOGO */
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Seleccionar Producto del Catálogo *</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleSelectExistingProduct(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                  >
                    <option value="">-- Elige un producto --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock Actual: {p.stock} un. | Costo: ${p.cost_price || 0})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-bold">Cantidad Facturada</label>
                    <input
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-bold">Costo Unit. Factura ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={itemCost || ''}
                      onChange={(e) => setItemCost(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-bold">Precio Venta ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={itemSellingPrice || ''}
                      onChange={(e) => setItemSellingPrice(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddItemToInvoice}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-colors"
              >
                Agregar a Factura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HISTORIAL DE FACTURAS INGRESADAS */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-white tracking-tight">Historial de Facturas de Compra</h2>
            <p className="text-xs text-zinc-400">Registro histórico de todas las compras y abastecimientos a proveedores.</p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por folio, proveedor o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            {filteredInvoices.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                No hay facturas registradas en el historial.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Folio / Factura</th>
                    <th className="p-4">Proveedor / Emisor</th>
                    <th className="p-4">Fecha Factura</th>
                    <th className="p-4 text-center">Ítems</th>
                    <th className="p-4">Medio de Pago</th>
                    <th className="p-4 text-right">Monto Total</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-purple-400">{inv.invoice_number}</td>
                      <td className="p-4 font-extrabold text-white">{inv.supplier_name}</td>
                      <td className="p-4 text-zinc-400">{inv.invoice_date}</td>
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 font-bold text-[11px]">
                          {inv.items.length} productos
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.payment_method === 'transferencia'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {inv.payment_method === 'transferencia' ? 'Transferencia' : 'Efectivo'}
                        </span>
                      </td>
                      <td className="p-4 text-right font-black text-white">
                        ${inv.total_amount.toLocaleString('es-CL')}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white transition-colors"
                          title="Ver Detalle Factura"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-400 transition-colors"
                          title="Eliminar factura y revertir stock"
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

      {/* MODAL DETALLE DE FACTURA */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-extrabold text-white">
                  Detalle Factura #{selectedInvoice.invoice_number}
                </h3>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Proveedor:</span>
                  <span className="font-bold text-white">{selectedInvoice.supplier_name}</span>
                </div>
                {selectedInvoice.supplier_rut && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">RUT:</span>
                    <span className="text-zinc-300 font-mono">{selectedInvoice.supplier_rut}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-400">Fecha de Emisión:</span>
                  <span className="text-zinc-300">{selectedInvoice.invoice_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Medio de Pago:</span>
                  <span className="font-bold text-purple-400 uppercase">{selectedInvoice.payment_method}</span>
                </div>
                {selectedInvoice.notes && (
                  <div className="pt-1 text-zinc-400 italic">
                    &quot;{selectedInvoice.notes}&quot;
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">Productos Comprados:</h4>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {selectedInvoice.items.map((it) => (
                    <div
                      key={it.id}
                      className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex justify-between items-center"
                    >
                      <div>
                        <span className="font-bold text-white block">{it.product_name}</span>
                        <span className="text-zinc-500 text-[10px]">
                          +{it.quantity} un. x ${it.cost_price.toLocaleString('es-CL')}
                        </span>
                      </div>
                      <span className="font-mono font-extrabold text-white">
                        ${it.total_cost.toLocaleString('es-CL')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-between items-center text-sm">
                <span className="font-bold text-white">Total Factura:</span>
                <span className="text-xl font-black text-purple-400">
                  ${selectedInvoice.total_amount.toLocaleString('es-CL')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
