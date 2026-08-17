import { ImageResponse } from 'next/og';
import { getStore } from '@/lib/serverStore';
import { formatImageUrl } from '@/lib/imageUtils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const store = getStore();
    const { products = [], promotions = [], sales = [] } = store;

    // Calcular el Producto o Pack Más Vendido dinámicamente desde el historial de ventas
    const counts: {
      [key: string]: {
        name: string;
        image_url: string;
        price: number;
        category: string;
        count: number;
      };
    } = {};

    sales.forEach((sale) => {
      sale.items?.forEach((item) => {
        const key = item.product_id || item.promotion_id || item.item_name;
        if (!counts[key]) {
          let imageUrl = '';
          let category = 'Licores Premium';
          let price = item.unit_price;

          if (item.product_id) {
            const prod = products.find((p) => p.id === item.product_id);
            if (prod) {
              imageUrl = prod.image_url;
              category = prod.category;
              price = prod.price;
            }
          } else if (item.promotion_id) {
            const promo = promotions.find((pr) => pr.id === item.promotion_id);
            if (promo) {
              imageUrl = promo.image_url;
              category = 'Pack Promocional';
              price = promo.promo_price;
            }
          }

          counts[key] = {
            name: item.item_name,
            image_url:
              imageUrl ||
              'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
            price,
            category,
            count: 0,
          };
        }
        counts[key].count += item.quantity;
      });
    });

    const sorted = Object.values(counts).sort((a, b) => b.count - a.count);
    
    // Si hay ventas, tomar el más vendido; de lo contrario tomar el primer pack o producto
    let topItem = sorted[0];

    if (!topItem) {
      const firstPromo = promotions[0];
      const firstProduct = products[0];

      if (firstPromo) {
        topItem = {
          name: firstPromo.name,
          image_url: firstPromo.image_url,
          price: firstPromo.promo_price,
          category: 'Pack Promocional Destacado',
          count: 0,
        };
      } else if (firstProduct) {
        topItem = {
          name: firstProduct.name,
          image_url: firstProduct.image_url,
          price: firstProduct.price,
          category: firstProduct.category,
          count: 0,
        };
      } else {
        topItem = {
          name: 'Copete Express 24/7',
          image_url:
            'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
          price: 9990,
          category: 'Delivery 24/7',
          count: 0,
        };
      }
    }

    const formattedImage = formatImageUrl(topItem.image_url);

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#09090b',
            backgroundImage:
              'radial-gradient(circle at 25% 25%, rgba(147, 51, 234, 0.25) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(249, 115, 22, 0.2) 0%, transparent 50%)',
            padding: '48px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Columna Izquierda: Imagen Cuadrada del Producto Más Vendido */}
          <div
            style={{
              width: '460px',
              height: '460px',
              borderRadius: '32px',
              overflow: 'hidden',
              display: 'flex',
              border: '4px solid rgba(168, 85, 247, 0.6)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
              position: 'relative',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={formattedImage}
              alt={topItem.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>

          {/* Columna Derecha: Información del Producto y Branding */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              width: '580px',
              height: '460px',
              paddingLeft: '32px',
            }}
          >
            {/* Tag Rotativo Dinámico */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(249, 115, 22, 0.2)',
                border: '1.5px solid rgba(249, 115, 22, 0.8)',
                color: '#fb923c',
                padding: '8px 18px',
                borderRadius: '999px',
                fontSize: '18px',
                fontWeight: 900,
                letterSpacing: '1px',
                width: 'fit-content',
                marginBottom: '16px',
              }}
            >
              🔥 MÁS VENDIDO DE LA SEMANA
            </div>

            {/* Nombre del Producto */}
            <div
              style={{
                fontSize: '40px',
                fontWeight: 900,
                color: '#ffffff',
                lineHeight: 1.15,
                marginBottom: '14px',
                maxHeight: '135px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {topItem.name}
            </div>

            {/* Categoría */}
            <div
              style={{
                fontSize: '20px',
                color: '#c084fc',
                fontWeight: 700,
                marginBottom: '20px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              {topItem.category}
            </div>

            {/* Precio y Logo */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 'auto',
                paddingTop: '20px',
                borderTop: '2px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    color: '#a1a1aa',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  Precio Delivery
                </span>
                <span
                  style={{
                    fontSize: '38px',
                    fontWeight: 900,
                    color: '#4ade80',
                  }}
                >
                  ${topItem.price.toLocaleString('es-CL')}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                }}
              >
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 900,
                    color: '#f43f5e',
                    letterSpacing: '-0.5px',
                  }}
                >
                  COPETE EXPRESS
                </div>
                <span
                  style={{
                    fontSize: '14px',
                    color: '#9333ea',
                    fontWeight: 700,
                  }}
                >
                  Despacho en 30-45 min 🚀
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generando imagen dinámica OG:', error);
    // Fallback imagen estándar
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#09090b',
            color: '#ffffff',
            fontSize: 48,
            fontWeight: 900,
          }}
        >
          COPETE EXPRESS 24/7
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
