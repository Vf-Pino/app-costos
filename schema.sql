-- =========================================================================
-- REESTRUCTURACIÓN DE BASE DE DATOS MEDIANTE ESQUEMAS (MULTI-PROYECTO)
-- =========================================================================

-- 1. Creación del esquema exclusivo para el módulo analítico de Casa Bistro
create schema if not exists casa_bistro_analitica;

-- Habilitar extensión para UUIDs en el entorno
create extension if not exists "uuid-ossp";

-- 2. TABLA DE INGRESOS DIARIOS
create table if not exists casa_bistro_analitica.ingresos_diarios (
  id uuid default gen_random_uuid() primary key,
  fecha date not null default current_date,
  monto_neto numeric(12, 4) not null check (monto_neto >= 0),
  creado_en timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TABLA DE EGRESOS Y COSTOS (Materia prima y variables)
create table if not exists casa_bistro_analitica.egresos_costos (
  id uuid default gen_random_uuid() primary key,
  fecha date not null default current_date,
  rubro_principal varchar(50) not null, 
  subcategoria varchar(50),             
  proveedor varchar(100),               
  monto numeric(12, 4) not null check (monto >= 0),
  creado_en timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint check_rubro_valido check (
    rubro_principal in (
      'Mercancia', 'Nomina Operativa', 'Nomina Administrativa', 
      'Arriendo', 'Servicios', 'Publicidad', 'Mantenimiento', 'Otros'
    )
  ),
  constraint check_subcategoria_mercancia check (
    (rubro_principal = 'Mercancia' and subcategoria in ('Carnes', 'Quesos', 'Legumbres', 'Bebidas', 'Aseo', 'Desechables')) or
    (rubro_principal <> 'Mercancia' and subcategoria is null)
  )
);

-- 4. TABLA DE PROYECCIONES DE GASTOS (Para mitigación de desfases temporales)
create table if not exists casa_bistro_analitica.proyecciones_gastos (
  id uuid default gen_random_uuid() primary key,
  rubro varchar(50) unique not null,
  monto_proyectado_mensual numeric(12, 4) not null check (monto_proyectado_mensual >= 0)
);

-- 5. TABLA DE CONFIGURACIÓN DE METAS (Límites de control de semáforos)
create table if not exists casa_bistro_analitica.metas_control (
  id uuid default gen_random_uuid() primary key,
  rubro varchar(50) unique not null,
  porcentaje_limite numeric(5, 2) not null check (porcentaje_limite >= 0)
);

-- =========================================================================
-- POBLACIÓN DE METAS INICIALES DENTRO DEL ESQUEMA
-- =========================================================================

insert into casa_bistro_analitica.metas_control (rubro, porcentaje_limite) values
  ('Mercancia', 35.00),
  ('Nomina Operativa', 18.00),
  ('Nomina Administrativa', 7.00),
  ('Arriendo', 12.00),
  ('Servicios', 5.00),
  ('Publicidad', 5.00),
  ('Mantenimiento', 1.00),
  ('Otros', 1.00)
on conflict (rubro) do update set porcentaje_limite = excluded.porcentaje_limite;

-- =========================================================================
-- POBLACIÓN DE PROYECCIONES INICIALES DE GASTOS (Valores base de Nómina y Fijos)
-- =========================================================================

insert into casa_bistro_analitica.proyecciones_gastos (rubro, monto_proyectado_mensual) values
  ('Nomina Operativa', 1800000.0000),
  ('Nomina Administrativa', 700000.0000)
on conflict (rubro) do update set monto_proyectado_mensual = excluded.monto_proyectado_mensual;

-- =========================================================================
-- HABILITACIÓN Y CONFIGURACIÓN DE ROW LEVEL SECURITY (RLS)
-- =========================================================================

-- Habilitar RLS en todas las tablas del esquema
alter table casa_bistro_analitica.ingresos_diarios enable row level security;
alter table casa_bistro_analitica.egresos_costos enable row level security;
alter table casa_bistro_analitica.proyecciones_gastos enable row level security;
alter table casa_bistro_analitica.metas_control enable row level security;

-- Políticas de acceso para usuarios autenticados

-- 1. ingresos_diarios
drop policy if exists "Permitir todo a usuarios autenticados en ingresos_diarios" on casa_bistro_analitica.ingresos_diarios;
create policy "Permitir todo a usuarios autenticados en ingresos_diarios"
  on casa_bistro_analitica.ingresos_diarios
  for all
  to authenticated
  using (true)
  with check (true);

-- 2. egresos_costos
drop policy if exists "Permitir todo a usuarios autenticados en egresos_costos" on casa_bistro_analitica.egresos_costos;
create policy "Permitir todo a usuarios autenticados en egresos_costos"
  on casa_bistro_analitica.egresos_costos
  for all
  to authenticated
  using (true)
  with check (true);

-- 3. proyecciones_gastos
drop policy if exists "Permitir todo a usuarios autenticados en proyecciones_gastos" on casa_bistro_analitica.proyecciones_gastos;
create policy "Permitir todo a usuarios autenticados en proyecciones_gastos"
  on casa_bistro_analitica.proyecciones_gastos
  for all
  to authenticated
  using (true)
  with check (true);

-- 4. metas_control
drop policy if exists "Permitir todo a usuarios autenticados en metas_control" on casa_bistro_analitica.metas_control;
create policy "Permitir todo a usuarios autenticados en metas_control"
  on casa_bistro_analitica.metas_control
  for all
  to authenticated
  using (true)
  with check (true);

-- =========================================================================
-- PERMISOS DE ACCESO AL ESQUEMA Y TABLAS (PARA SUPABASE / POSTGREST API)
-- =========================================================================

-- Conceder permiso de uso del esquema a los roles de Supabase API
grant usage on schema casa_bistro_analitica to anon, authenticated, service_role;

-- Conceder todos los privilegios sobre las tablas existentes
grant all privileges on all tables in schema casa_bistro_analitica to anon, authenticated, service_role;

-- Conceder privilegios sobre secuencias (en caso de autoincrementales)
grant all privileges on all sequences in schema casa_bistro_analitica to anon, authenticated, service_role;

-- Configurar privilegios por defecto para futuras tablas en este esquema
alter default privileges in schema casa_bistro_analitica grant all on tables to anon, authenticated, service_role;
alter default privileges in schema casa_bistro_analitica grant all on sequences to anon, authenticated, service_role;

