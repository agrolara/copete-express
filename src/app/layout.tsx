import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { CartDrawer } from '@/components/shop/CartDrawer';

export const metadata: Metadata = {
  metadataBase: new URL('https://copeteexpress.agrolara.dedyn.io'),
  title: 'Copete Express 24/7 | Tu Previa Organizada en Minutos',
  description:
    'Licores fríos, packs piscoleros, cervezas, destilados y hielo entregados directo en tu puerta. Pide fácil y paga al recibir o por transferencia.',
  keywords: [
    'botilleria delivery',
    'copete express',
    'delivery de copete',
    'piscolas',
    'cervezas heladas',
    'pisco mistral',
    'whisky delivery',
    'packs promociones previa',
  ],
  openGraph: {
    title: 'Copete Express 24/7 | Tu Previa Organizada en Minutos 🚀',
    description:
      'Licores fríos, packs piscoleros, cervezas, destilados y hielo entregados directo en tu puerta en minutos. ¡Haz tu pedido online!',
    url: 'https://copeteexpress.agrolara.dedyn.io',
    siteName: 'Copete Express',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'Copete Express 24/7 - El Producto Más Vendido',
      },
    ],
    locale: 'es_CL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Copete Express 24/7 | Tu Previa Organizada en Minutos 🚀',
    description:
      'Licores fríos, packs piscoleros, destilados y hielo entregados directo en tu puerta en minutos.',
    images: ['/api/og'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-foreground antialiased min-h-screen flex flex-col">
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
