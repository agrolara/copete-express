---
title: "Copete Express - Plataforma E-Commerce & POS Delivery Nocturno"
slug: "copete-express"
category: "E-Commerce & Gestión Financiera"
client: "Copete Express SpA"
date: "2026-08"
status: "Producción"
liveUrl: "https://copeteexpress.agrolara.dedyn.io"
adminUrl: "https://copeteexpress.agrolara.dedyn.io/admin"
githubUrl: "https://github.com/agrolara/copete-express"
featuredImage: "https://copeteexpress.agrolara.dedyn.io/api/og"
tags:
  - "Next.js 14"
  - "TypeScript"
  - "Tailwind CSS"
  - "Supabase PostgreSQL"
  - "Supabase Realtime"
  - "Supabase Storage"
  - "Coolify"
  - "Docker"
  - "WhatsApp API"
---

# Copete Express: Delivery E-Commerce & Panel de Control Financiero

Plataforma integral de comercio electrónico y gestión operativa diseñada para licorerías y servicios de delivery express nocturno. Combina una vitrina digital de alta conversión con checkout directo a WhatsApp, sincronización multi-dispositivo en tiempo real y un potente panel de administración para el control de inventario, facturación de compras, arqueo de caja y analítica de utilidades.

## 🚀 Características Principales

### 1. Vitrina de Ventas y Experiencia de Usuario (UI/UX)
- **Catálogo Dinámico e Inteligente:** Visualización de productos individuales y packs promocionales con soporte para imágenes verticales en formato estilizado 3:4 (ideal para botellas y latas).
- **Algoritmo de Rotación de Más Vendidos:** Cálculo dinámico del producto estrella de la semana basado en el historial de transacciones.
- **Carrito y Checkout WhatsApp:** Flujo de compra optimizado que genera automáticamente el mensaje estructurado para WhatsApp con detalle de ítems, dirección y montos.

### 2. Panel Administrativo & POS WhatsApp
- **Generador de Pedidos Manuales:** Creación rápida de pedidos recibidos por chat con selección de productos/packs, forma de pago (Efectivo / Transferencia) y aplicación de **descuentos personalizados** (% o monto fijo).
- **Control de Inventario y Stock Crítico:** Descuento automático de inventario por compras individuales o compuestas (packs), con alertas de bajo stock (<3 unidades).
- **Módulo de Facturas de Abastecimiento:** Registro de facturas de proveedores (CCU, Concha y Toro, etc.) con cálculo de costos unitarios e incremento automático de stock.
- **Arqueo de Caja y Finanzas:** Conciliación en tiempo real de ingresos por Efectivo y Transferencia, registro de gastos operacionales y gráficos de utilidad neta semanal y mensual.

### 3. Arquitectura Tecnológica & Datos
- **Frontend & Backend:** Next.js 14 (App Router, Server Components y Route Handlers) en modo Standalone.
- **Base de Datos & Tiempo Real:** PostgreSQL alojado en Supabase con suscripción WebSockets (Supabase Realtime) para propagación instantánea de cambios entre múltiples dispositivos.
- **Almacenamiento Multimedia:** Supabase Storage (`copete-express-media`) con URLs públicas optimizadas.
- **Infraestructura:** Docker Multi-stage runner desplegado de forma continua en Coolify con proxy inverso Traefik y certificados SSL automáticos.
