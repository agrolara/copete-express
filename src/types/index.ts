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
  item_name: string;
}

export interface Sale {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  total_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  items?: SaleItem[];
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
