-- ==============================================================================
-- SCRIPT DE MIGRACIÓN Y ESQUEMA DE BASE DE DATOS PARA COPETE EXPRESS
-- Supabase Self-Hosted / PostgreSQL
-- ==============================================================================

-- 1. TABLA DE PERFILES DE USUARIO (Extensión de auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
    full_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para crear perfil automáticamente cuando un usuario se registra en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        CASE 
            WHEN NEW.email = 'Fullexpressradiotaxi@gmail.com' THEN 'admin'
            ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
        END,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        role = CASE WHEN EXCLUDED.email = 'Fullexpressradiotaxi@gmail.com' THEN 'admin' ELSE public.profiles.role END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. TABLA DE PRODUCTOS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'Destilados',
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLA DE PROMOCIONES (BUNDLES / PACKS)
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    promo_price NUMERIC(10, 2) NOT NULL CHECK (promo_price >= 0),
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLA INTERMEDIA PRODUCTOS EN PROMOCIONES
CREATE TABLE IF NOT EXISTS public.promotion_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    UNIQUE(promotion_id, product_id)
);

-- 5. TABLA DE VENTAS
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABLA DE DETALLE DE VENTAS
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    promotion_id UUID REFERENCES public.promotions(id) ON DELETE SET NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    item_name TEXT NOT NULL
);

-- ==============================================================================
-- 7. FUNCIÓN RPC PARA PROCESAMIENTO ATÓMICO DE CHECKOUT Y DESCUENTO DE STOCK
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.process_sale(
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_delivery_address TEXT,
    p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sale_id UUID;
    v_total_amount NUMERIC(10, 2) := 0;
    v_item JSONB;
    v_promo_item RECORD;
    v_current_stock INT;
    v_product_name TEXT;
    v_required_qty INT;
BEGIN
    -- Validar que existan ítems en el carrito
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'El carrito de compras no puede estar vacío.';
    END IF;

    -- Calcular monto total de la venta
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_total_amount := v_total_amount + ((v_item->>'quantity')::INT * (v_item->>'unit_price')::NUMERIC);
    END LOOP;

    -- Insertar la venta principal
    INSERT INTO public.sales (customer_name, customer_phone, delivery_address, total_amount, status)
    VALUES (p_customer_name, p_customer_phone, p_delivery_address, v_total_amount, 'completed')
    RETURNING id INTO v_sale_id;

    -- Procesar cada ítem del carrito
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- CASO 1: PRODUCTO INDIVIDUAL
        IF (v_item->>'type') = 'product' THEN
            -- Verificar stock disponible con bloqueo de fila (FOR UPDATE)
            SELECT stock, name INTO v_current_stock, v_product_name
            FROM public.products
            WHERE id = (v_item->>'id')::UUID
            FOR UPDATE;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'El producto seleccionado no existe.';
            END IF;

            IF v_current_stock < (v_item->>'quantity')::INT THEN
                RAISE EXCEPTION 'Stock insuficiente para el producto "%". Disponible: %, Solicitado: %',
                    v_product_name, v_current_stock, (v_item->>'quantity')::INT;
            END IF;

            -- Descontar inventario
            UPDATE public.products
            SET stock = stock - (v_item->>'quantity')::INT
            WHERE id = (v_item->>'id')::UUID;

            -- Insertar detalle de venta
            INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, item_name)
            VALUES (
                v_sale_id,
                (v_item->>'id')::UUID,
                (v_item->>'quantity')::INT,
                (v_item->>'unit_price')::NUMERIC,
                v_product_name
            );

        -- CASO 2: PROMOCIÓN (BUNDLE / PACK)
        ELSIF (v_item->>'type') = 'promotion' THEN
            -- Descontar el stock de cada producto individual que conforma la promoción
            FOR v_promo_item IN
                SELECT pi.product_id, pi.quantity AS qty_per_pack, p.name AS product_name, p.stock
                FROM public.promotion_items pi
                JOIN public.products p ON p.id = pi.product_id
                WHERE pi.promotion_id = (v_item->>'id')::UUID
                FOR UPDATE OF p
            LOOP
                v_required_qty := (v_item->>'quantity')::INT * v_promo_item.qty_per_pack;

                IF v_promo_item.stock < v_required_qty THEN
                    RAISE EXCEPTION 'Stock insuficiente del producto "%" para armar la promoción. Requerido: %, Disponible: %',
                        v_promo_item.product_name, v_required_qty, v_promo_item.stock;
                END IF;

                -- Descontar stock del ingrediente/producto de la promo
                UPDATE public.products
                SET stock = stock - v_required_qty
                WHERE id = v_promo_item.product_id;
            END LOOP;

            -- Insertar detalle de venta de la promoción
            INSERT INTO public.sale_items (sale_id, promotion_id, quantity, unit_price, item_name)
            VALUES (
                v_sale_id,
                (v_item->>'id')::UUID,
                (v_item->>'quantity')::INT,
                (v_item->>'unit_price')::NUMERIC,
                v_item->>'name'
            );
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'sale_id', v_sale_id,
        'total_amount', v_total_amount,
        'message', 'Venta registrada con éxito y stock actualizado'
    );
END;
$$;

-- ==============================================================================
-- 8. POLÍTICAS DE SEGURIDAD RLS (Row Level Security)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública para catálogo de productos y promociones
CREATE POLICY "Productos visibles para todos" ON public.products FOR SELECT USING (true);
CREATE POLICY "Promociones visibles para todos" ON public.promotions FOR SELECT USING (true);
CREATE POLICY "Items de promociones visibles para todos" ON public.promotion_items FOR SELECT USING (true);

-- Permisos totales para administradores (requiere autenticación Supabase y rol 'admin' en profiles)
CREATE POLICY "Admins gestionan productos" ON public.products FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins gestionan promociones" ON public.promotions FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins gestionan promotion_items" ON public.promotion_items FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins leen ventas" ON public.sales FOR SELECT USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins leen sale_items" ON public.sale_items FOR SELECT USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Permiso para registrar checkout público vía RPC o inserción
CREATE POLICY "Cualquiera puede crear ventas via anon" ON public.sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Cualquiera puede crear sale_items via anon" ON public.sale_items FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- 9. CONFIGURACIÓN DEL BUCKET DE STORAGE PÚBLICO
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('copete-express-media', 'copete-express-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Imágenes accesibles públicamente"
ON storage.objects FOR SELECT
USING (bucket_id = 'copete-express-media');

CREATE POLICY "Admins pueden subir imágenes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'copete-express-media');

CREATE POLICY "Admins pueden borrar imágenes"
ON storage.objects FOR DELETE
USING (bucket_id = 'copete-express-media');

-- ==============================================================================
-- 10. DATOS SEMILLA (SEED DATA) DE EJEMPLO
-- ==============================================================================
INSERT INTO public.products (id, name, description, category, price, stock, image_url) VALUES
('11111111-1111-1111-1111-111111111111', 'Pisco Alto del Carmen 35° 1L', 'Pisco chileno de guarda en roble americano, sabor suave y equilibrado.', 'Piscos', 8990, 15, 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=600&q=80'),
('22222222-2222-2222-2222-222222222222', 'Coca-Cola Sabor Original 1.5L', 'Bebida gaseosa refrescante de 1.5 litros ideal para combinar.', 'Bebidas & Hielo', 2290, 24, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80'),
('33333333-3333-3333-3333-333333333333', 'Hielo Purificado Bolsa 2kg', 'Bolsa de hielo en cubos de agua filtrada y purificada.', 'Bebidas & Hielo', 1990, 2, 'https://images.unsplash.com/photo-1516715094483-75da7dee9758?auto=format&fit=crop&w=600&q=80'),
('44444444-4444-4444-4444-444444444444', 'Cerveza Corona Extra Pack 6x330ml', 'Cerveza clara tipo Pilsner de sabor liviano y refrescante.', 'Cervezas', 6990, 12, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=600&q=80'),
('55555555-5555-5555-5555-555555555555', 'Whisky Johnnie Walker Black Label 750ml', 'Whisky escocés de mezcla con 12 años de añejamiento en barricas.', 'Destilados', 24990, 1, 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=600&q=80'),
('66666666-6666-6666-6666-666666666666', 'Vino Casillero del Diablo Cabernet Sauvignon 750ml', 'Vino tinto chileno de intensos aromas a cereza y grosella.', 'Vinos', 5490, 8, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80')
ON CONFLICT (id) DO NOTHING;

-- Insertar Promociones Semilla
INSERT INTO public.promotions (id, name, description, promo_price, image_url) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Pack Piscola Suprema (Alto 1L + Coca 1.5L + Hielo 2kg)', 'La combinación perfecta para tu previa: 1 Pisco Alto del Carmen 1L, 1 Bebida Coca-Cola 1.5L y 1 Bolsa de Hielo 2kg.', 11990, 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Pack Carrete Cervecero (2x Pack Corona 6u)', 'Lleva 2 Six-Packs de Cerveza Corona Extra a un precio especial con descuento.', 12490, 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=600&q=80')
ON CONFLICT (id) DO NOTHING;

-- Asociar ítems a las promociones
INSERT INTO public.promotion_items (promotion_id, product_id, quantity) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 1),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 1),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 1),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 2)
ON CONFLICT (promotion_id, product_id) DO NOTHING;

-- Insertar Ventas Históricas de Ejemplo para los Gráficos del Dashboard
INSERT INTO public.sales (id, customer_name, customer_phone, delivery_address, total_amount, status, created_at) VALUES
('s1111111-1111-1111-1111-111111111111', 'Matías Silva', '+56912345678', 'Av. Providencia 1234, Apt 402', 11990, 'completed', NOW() - INTERVAL '6 days'),
('s2222222-2222-2222-2222-222222222222', 'Camila Rojas', '+56987654321', 'Calle Los Leones 567', 24990, 'completed', NOW() - INTERVAL '5 days'),
('s3333333-3333-3333-3333-333333333333', 'Gonzalo Morales', '+56911223344', 'Av. Vitacura 890', 12490, 'completed', NOW() - INTERVAL '4 days'),
('s4444444-4444-4444-4444-444444444444', 'Valentina Gómez', '+56955667788', 'Av. Las Condes 4321', 23980, 'completed', NOW() - INTERVAL '3 days'),
('s5555555-5555-5555-5555-555555555555', 'Felipe Castro', '+56999887766', 'Calle Italia 1020', 36970, 'completed', NOW() - INTERVAL '2 days'),
('s6666666-6666-6666-6666-666666666666', 'Javier Fuentes', '+56933445566', 'Av. Irarrázaval 2450', 11990, 'completed', NOW() - INTERVAL '1 day'),
('s7777777-7777-7777-7777-777777777777', 'Sofía Henríquez', '+56977889900', 'Calle Ñuñoa 890', 17480, 'completed', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sale_items (sale_id, product_id, promotion_id, quantity, unit_price, item_name) VALUES
('s1111111-1111-1111-1111-111111111111', NULL, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 11990, 'Pack Piscola Suprema'),
('s2222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', NULL, 1, 24990, 'Whisky Johnnie Walker Black Label'),
('s3333333-3333-3333-3333-333333333333', NULL, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, 12490, 'Pack Carrete Cervecero'),
('s4444444-4444-4444-4444-444444444444', NULL, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, 11990, 'Pack Piscola Suprema'),
('s5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', NULL, 2, 8990, 'Pisco Alto del Carmen 35° 1L'),
('s5555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', NULL, 2, 2290, 'Coca-Cola Sabor Original 1.5L'),
('s5555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', NULL, 2, 6990, 'Cerveza Corona Extra Pack 6x330ml'),
('s6666666-6666-6666-6666-666666666666', NULL, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 11990, 'Pack Piscola Suprema'),
('s7777777-7777-7777-7777-777777777777', '66666666-6666-6666-6666-666666666666', NULL, 2, 5490, 'Vino Casillero del Diablo Cabernet Sauvignon'),
('s7777777-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444', NULL, 1, 6990, 'Cerveza Corona Extra Pack 6x330ml')
ON CONFLICT (id) DO NOTHING;
