export type UserRole = 'admin' | 'customer';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  cost_price?: number; // Costo unitario de adquisición para cálculo de márgenes y utilidades
  stock: number;
  image_url: string;
  is_active: boolean;
  created_at?: string;
}

export interface PromotionItem {
  id?: string;
  promotion_id?: string;
  product_id: string;
  quantity: number;
  product?: Product;
}

export interface Promotion {
  id: string;
  name: string;
  description: string;
  promo_price: number;
  image_url: string;
  is_active: boolean;
  items?: PromotionItem[];
  created_at?: string;
}

export type CartItemType = 'product' | 'promotion';

export interface CartItem {
  id: string; // product or promotion ID
  type: CartItemType;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  max_stock: number;
  items_summary?: string; // e.g., "1x Alto + 1x Coca + 1x Hielo"
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id?: string;
  promotion_id?: string;
  quantity: number;
  unit_price: number;
  cost_price?: number; // Costo unitario al momento de la venta
  item_name: string;
}

export interface Sale {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  payment_method?: 'transferencia' | 'efectivo';
  total_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  items?: SaleItem[];
}

// 1. ESTRUCTURAS PARA INGRESO DE FACTURAS DE COMPRA E INVENTARIO
export interface InvoiceItem {
  id: string;
  product_id: string;
  product_name: string;
  category?: string;
  quantity: number;
  cost_price: number;       // Valor unitario de costo neto de la factura
  total_cost: number;       // quantity * cost_price
  selling_price?: number;   // Precio de venta sugerido al público
  is_new_product?: boolean; // Indica si se creó un nuevo ítem en el catálogo
}

export interface Invoice {
  id: string;
  invoice_number: string;   // Número de Factura / Folio
  supplier_name: string;    // Emisor / Proveedor (ej: Distribuidora CCU, Concha y Toro, etc.)
  supplier_rut?: string;    // RUT del proveedor
  invoice_date: string;     // Fecha de emisión de la factura
  created_at: string;       // Fecha de registro en el sistema
  payment_method: 'transferencia' | 'efectivo'; // Forma de pago de la factura
  total_amount: number;     // Total de la factura
  items: InvoiceItem[];     // Detalle de productos de la factura
  notes?: string;
}

// 2. ESTRUCTURAS PARA GASTOS OPERACIONALES
export type ExpenseCategoryType =
  | 'Arriendo'
  | 'Sueldos y Turnos'
  | 'Servicios Básicos (Luz/Agua/Internet)'
  | 'Bolsas y Empaques'
  | 'Combustible y Flete Delivery'
  | 'Publicidad y Marketing'
  | 'Mantenimiento y Reparaciones'
  | 'Otros Gastos';

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategoryType | string;
  description: string;
  amount: number;
  payment_method: 'efectivo' | 'transferencia'; // De dónde salió el dinero (Caja física o Banco)
  receipt_number?: string; // Boleta/Factura del gasto
  created_at: string;
}

// 3. RESUMEN Y ARQUEO DE CAJA
export interface CashSummary {
  cashInHand: number;      // Efectivo en caja física
  bankTransfer: number;    // Dinero en banco por transferencias
  totalAvailable: number;  // Saldo total disponible
  salesCash: number;       // Ingresos por ventas en efectivo
  salesTransfer: number;   // Ingresos por ventas en transferencia
  expensesCash: number;    // Egresos por gastos en efectivo
  expensesTransfer: number;// Egresos por gastos en transferencia
}

export interface SalesByDayOfWeek {
  day: string;
  salesCount: number;
  totalRevenue: number;
}

export interface ProductPopularity {
  name: string;
  type: 'product' | 'promotion';
  totalSold: number;
  revenue: number;
}

export interface StockStatusSummary {
  healthy: number;   // stock >= 3
  critical: number;  // 0 < stock < 3
  outOfStock: number;// stock === 0
}
