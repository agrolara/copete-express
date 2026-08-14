import { createClient } from '@supabase/supabase-js';
import { Product, Promotion, Sale } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const STORAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'copete-express-media';

// Datos de demostración iniciales (Fallback cuando Supabase no esté configurado localmente)
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Pisco Alto del Carmen 35° 1L',
    description: 'Pisco chileno de guarda en roble americano, sabor suave y equilibrado.',
    category: 'Piscos',
    price: 8990,
    cost_price: 5500,
    stock: 15,
    image_url: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Coca-Cola Sabor Original 1.5L',
    description: 'Bebida gaseosa refrescante de 1.5 litros ideal para combinar.',
    category: 'Bebidas & Hielo',
    price: 2290,
    cost_price: 1200,
    stock: 24,
    image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Hielo Purificado Bolsa 2kg',
    description: 'Bolsa de hielo en cubos de agua filtrada y purificada.',
    category: 'Bebidas & Hielo',
    price: 1990,
    cost_price: 600,
    stock: 2, // Stock crítico (< 3)
    image_url: 'https://images.unsplash.com/photo-1516715094483-75da7dee9758?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Cerveza Corona Extra Pack 6x330ml',
    description: 'Cerveza clara tipo Pilsner de sabor liviano y refrescante.',
    category: 'Cervezas',
    price: 6990,
    cost_price: 4200,
    stock: 12,
    image_url: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Whisky Johnnie Walker Black Label 750ml',
    description: 'Whisky escocés de mezcla con 12 años de añejamiento en barricas.',
    category: 'Destilados',
    price: 24990,
    cost_price: 16500,
    stock: 1, // Stock crítico (< 3)
    image_url: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    name: 'Vino Casillero del Diablo Cabernet 750ml',
    description: 'Vino tinto chileno de intensos aromas a cereza y grosella.',
    category: 'Vinos',
    price: 5490,
    cost_price: 3200,
    stock: 8,
    image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    name: 'Vodka Absolut Original 750ml',
    description: 'Vodka sueco de grano entero, destilación continua pura.',
    category: 'Destilados',
    price: 13990,
    cost_price: 8900,
    stock: 0, // Agotado
    image_url: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  }
];

export const INITIAL_PROMOTIONS: Promotion[] = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Pack Piscola Suprema',
    description: '1 Pisco Alto del Carmen 1L + 1 Bebida Coca-Cola 1.5L + 1 Bolsa Hielo 2kg',
    promo_price: 11990,
    image_url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80',
    is_active: true,
    items: [
      { product_id: '11111111-1111-1111-1111-111111111111', quantity: 1 },
      { product_id: '22222222-2222-2222-2222-222222222222', quantity: 1 },
      { product_id: '33333333-3333-3333-3333-333333333333', quantity: 1 },
    ],
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    name: 'Pack Carrete Cervecero 12U',
    description: '2 Packs Cerveza Corona Extra 6x330ml con super descuento.',
    promo_price: 12490,
    image_url: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=600&q=80',
    is_active: true,
    items: [
      { product_id: '44444444-4444-4444-4444-444444444444', quantity: 2 },
    ],
  }
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 's1111111-1111-1111-1111-111111111111',
    customer_name: 'Matías Silva',
    customer_phone: '+56912345678',
    delivery_address: 'Av. Providencia 1234, Apt 402',
    total_amount: 11990,
    status: 'completed',
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    items: [
      { id: 'item1', sale_id: 's1', promotion_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', quantity: 1, unit_price: 11990, item_name: 'Pack Piscola Suprema' }
    ]
  },
  {
    id: 's2222222-2222-2222-2222-222222222222',
    customer_name: 'Camila Rojas',
    customer_phone: '+56987654321',
    delivery_address: 'Calle Los Leones 567',
    total_amount: 24990,
    status: 'completed',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    items: [
      { id: 'item2', sale_id: 's2', product_id: '55555555-5555-5555-5555-555555555555', quantity: 1, unit_price: 24990, item_name: 'Whisky Johnnie Walker Black Label' }
    ]
  },
  {
    id: 's3333333-3333-3333-3333-333333333333',
    customer_name: 'Gonzalo Morales',
    customer_phone: '+56911223344',
    delivery_address: 'Av. Vitacura 890',
    total_amount: 12490,
    status: 'completed',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    items: [
      { id: 'item3', sale_id: 's3', promotion_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', quantity: 1, unit_price: 12490, item_name: 'Pack Carrete Cervecero' }
    ]
  },
  {
    id: 's4444444-4444-4444-4444-444444444444',
    customer_name: 'Valentina Gómez',
    customer_phone: '+56955667788',
    delivery_address: 'Av. Las Condes 4321',
    total_amount: 23980,
    status: 'completed',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    items: [
      { id: 'item4', sale_id: 's4', promotion_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', quantity: 2, unit_price: 11990, item_name: 'Pack Piscola Suprema' }
    ]
  },
  {
    id: 's5555555-5555-5555-5555-555555555555',
    customer_name: 'Felipe Castro',
    customer_phone: '+56999887766',
    delivery_address: 'Calle Italia 1020',
    total_amount: 36970,
    status: 'completed',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    items: [
      { id: 'item5', sale_id: 's5', product_id: '11111111-1111-1111-1111-111111111111', quantity: 2, unit_price: 8990, item_name: 'Pisco Alto del Carmen 35° 1L' },
      { id: 'item6', sale_id: 's5', product_id: '22222222-2222-2222-2222-222222222222', quantity: 2, unit_price: 2290, item_name: 'Coca-Cola Sabor Original 1.5L' },
      { id: 'item7', sale_id: 's5', product_id: '44444444-4444-4444-4444-444444444444', quantity: 2, unit_price: 6990, item_name: 'Cerveza Corona Extra Pack 6x330ml' }
    ]
  },
  {
    id: 's6666666-6666-6666-6666-666666666666',
    customer_name: 'Javier Fuentes',
    customer_phone: '+56933445566',
    delivery_address: 'Av. Irarrázaval 2450',
    total_amount: 11990,
    status: 'completed',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    items: [
      { id: 'item8', sale_id: 's6', promotion_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', quantity: 1, unit_price: 11990, item_name: 'Pack Piscola Suprema' }
    ]
  },
  {
    id: 's7777777-7777-7777-7777-777777777777',
    customer_name: 'Sofía Henríquez',
    customer_phone: '+56977889900',
    delivery_address: 'Calle Ñuñoa 890',
    total_amount: 17970,
    status: 'completed',
    created_at: new Date().toISOString(),
    items: [
      { id: 'item9', sale_id: 's7', product_id: '66666666-6666-6666-6666-666666666666', quantity: 2, unit_price: 5490, item_name: 'Vino Casillero del Diablo' },
      { id: 'item10', sale_id: 's7', product_id: '44444444-4444-4444-4444-444444444444', quantity: 1, unit_price: 6990, item_name: 'Cerveza Corona Extra Pack 6x330ml' }
    ]
  }
];
