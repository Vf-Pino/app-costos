TECHNICAL BRIEF: SISTEMA ANALÍTICO DE CONTROL DE COSTOS Y P&G GASTRONÓMICO
1. Título de la Tarea (Alcance)
Desarrollo de un sistema analítico síncrono y desacoplado para la gestión de flujos de caja, control de umbrales financieros por semáforos, mitigación de desfases temporales de gastos y persistencia de históricos mensuales de Pérdidas y Ganancias (P&G), estructurado mediante aislamiento de esquemas en base de datos.

2. Contexto (El "Por qué" y el "Dónde")
Este software es un sistema completamente Greenfield (nuevo) diseñado para un único establecimiento gastronómico (Casa Bistro). Su objetivo principal es resolver la ceguera financiera mensual mediante la captura directa y manual de datos de caja diarios y facturas de proveedores, de manera independiente a cualquier software POS de facturación o comandas que ya posea el restaurante.

El núcleo de valor radica en la capacidad de comparar el gasto acumulado en tiempo real contra los umbrales financieros ideales definidos en la industria, emitiendo alertas preventivas inteligentes antes del cierre del ciclo fiscal mensual y almacenando registros históricos inmutables para análisis comparativos intermensuales. Para permitir la futura integración de otros proyectos de software independientes en el mismo servidor sin colisiones de datos, toda la persistencia se encapsulará en un esquema propio.

3. Flujo de Navegación del Administrador (User Flow & UX)
El sistema debe estructurarse bajo una arquitectura plana de navegación de dos niveles únicos para garantizar la máxima agilidad operativa desde dispositivos móviles:

Pantalla de Autenticación (Login): Puerta de entrada obligatoria. Tras validar credenciales mediante Supabase Auth, redirige directamente al Dashboard Principal.

Menú de Navegación Persistente (Navbar): Una barra de navegación fija en la parte inferior (en dispositivos móviles) o lateral (en escritorio) con tres accesos directos:

Vista 1: Dashboard Real-Time (Pantalla Principal): Despliega el P&G del mes actual con los semáforos acumulados de control. Es una interfaz exclusivamente de lectura y análisis visual.

Vista 2: Centro de Registro Rápido: Contiene la cuadrícula o grilla de botones táctiles para la inserción de datos. Al presionar cualquier botón, se despliega un componente modal (ventana emergente) que permite capturar el monto e información requerida. Al guardar, el modal se cierra y el usuario permanece en el Centro de Registro.

Vista 3: Consola Histórica y Comparativa: Interfaz que dispone de filtros para seleccionar periodos (Mes/Año Origen vs. Mes/Año Destino) para procesar y renderizar las tablas analíticas de variaciones.

4. Requerimientos Técnicos (Especificación Operativa)
A. Stack Tecnológico Base
Frontend: Next.js 14+ (App Router) utilizando TypeScript para el tipado estricto y Tailwind CSS para la interfaz adaptativa (Mobile-First).

Backend & Base de Datos: Supabase (PostgreSQL) como Backend-as-a-Service, utilizando Supabase Auth para la autenticación y Row Level Security (RLS).

B. Modelo de Datos Relacional (Esquema SQL - Supabase Multi-Proyecto)
El agente de programación debe ejecutar de manera exacta las siguientes estructuras en la base de datos PostgreSQL:

SQL
-- =========================================================================
-- REESTRUCTURACIÓN DE BASE DE DATOS MEDIANTE ESQUEMAS (MULTI-PROYECTO)
-- =========================================================================

-- 1. Creación del esquema exclusivo para el módulo analítico de Casa Bistro
create schema if not exists casa_bistro_analitica;

-- Habilitar extensión para UUIDs en el entorno
create extension if not exists "uuid-ossp";

-- 2. TABLA DE INGRESOS DIARIOS
create table casa_bistro_analitica.ingresos_diarios (
  id uuid default gen_random_uuid() primary key,
  fecha date not null default current_date,
  monto_neto numeric(12, 4) not null check (monto_neto >= 0),
  creado_en timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TABLA DE EGRESOS Y COSTOS (Materia prima y variables)
create table casa_bistro_analitica.egresos_costos (
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
create table casa_bistro_analitica.proyecciones_gastos (
  id uuid default gen_random_uuid() primary key,
  rubro varchar(50) unique not null,
  monto_proyectado_mensual numeric(12, 4) not null check (monto_proyectado_mensual >= 0)
);

-- 5. TABLA DE CONFIGURACIÓN DE METAS (Límites de control de semáforos)
create table casa_bistro_analitica.metas_control (
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
C. Lógica de Negocio Financiera
Fórmulas de Agregación para el Mes en Curso:
Venta Neta Acumulada (V 
n
​
 ): ∑monto_neto de casa_bistro_analitica.ingresos_diarios del mes actual.

Gasto Real por Rubro (G 
r
​
 ): ∑monto de casa_bistro_analitica.egresos_costos agrupado por rubro_principal para el mes actual.

Porcentaje Real del Rubro (P 
r
​
 ): Calculado dinámicamente mediante la fórmula:

P 
r
​
 =( 
V 
n
​
 
G 
r
​
 
​
 )×100
Cálculo de Utilidad Neta Real (U 
n
​
 ):

U 
n
​
 =V 
n
​
 −∑G 
r
​
  (de todos los rubros del mes)
5. Blindaje Lógico: Solución a Puntos Débiles de Negocio
El programador debe implementar obligatoriamente las siguientes capas de abstracción para evitar fallas lógicas operativas en el restaurante:

A. Mitigación del Efecto "Inicio de Mes" en Gastos Fijos (Arriendo y Servicios)
Para evitar falsos positivos de semáforos en Rojo los primeros días del mes debido al peso de los gastos fijos sobre una venta acumulada aún baja, el sistema debe aplicar una lógica de evaluación diferida:

Los semáforos de los rubros fijos (Arriendo y Servicios) permanecerán en estado Informativo / Neutro (Gris u opaco) durante los primeros 14 días calendario del mes.

A partir del día 15, el sistema evaluará el semáforo comparando el gasto real ejecutado contra el porcentaje de la meta prorrateado de acuerdo a los días transcurridos, o directamente frente al cierre proyectado de ventas.

B. Módulo de Contrabalanceo y Auditoría Inmediata de Errores
Para subsanar errores humanos de digitación manual en las facturas, la interfaz del Centro de Registro Rápido debe incluir, justo debajo de la grilla de botones, un componente de Auditoría Express:

Debe renderizar en formato de lista compacta las últimas 5 transacciones ingresadas (tanto ingresos como egresos) ordenadas cronológicamente de forma descendente.

Cada fila debe contar con un botón de Eliminar (Trash icon) que ejecute un borrado físico (delete) en la base de datos tras una confirmación, actualizando los semáforos del dashboard de manera inmediata.

C. Suavizado de Desfase Temporal en Nóminas Quincenales
Para evitar que el semáforo de nómina simule un falso e irreal estado Verde (0%) entre los días 1 y 14 de cada mes, se implementará un modelo de gasto teórico devengado:

El backend tomará el valor guardado en la tabla casa_bistro_analitica.proyecciones_gastos para los rubros de nómina.

En el Dashboard, el semáforo de nómina diaria calculará un porcentaje ponderado dinámico basado en los días transcurridos del mes actual hasta que se encuentre el egreso real registrado en la tabla egresos_costos. Al ingresarse el pago real quincenal, el sistema sustituirá el valor teórico por el valor real de forma síncrona.

6. Constraints / Restricciones y Seguridad (El "Cerco")
Aislamiento Obligatorio por Esquema: Todas las consultas, mutaciones y llamadas de API ejecutadas desde el frontend en Next.js deben apuntar de manera explícita al esquema casa_bistro_analitica. Las políticas de seguridad Row Level Security (RLS) deben configurarse estrictamente sobre este esquema para asegurar que este cliente no tenga acceso a futuros esquemas del servidor.

Prohibición de Credenciales y API Keys en el Frontend: Queda estrictamente prohibido incrustar cadenas de texto o credenciales de Supabase en código duro (hardcoded) dentro del lado del cliente. Toda variable de conexión sensible debe ser inyectada exclusivamente a través de variables de entorno seguras (.env.local) y procesada en componentes del servidor de Next.js.

Prohibición de Código Hardcoded en la UI: Todos los porcentajes de control, listas de categorías y subcategorías de mercancía deben ser consumidos desde la base de datos o mapeados a través de enumeraciones estructuradas (enums) en TypeScript. No se permiten comparaciones basadas en texto plano crudo dentro de los componentes visuales.

Tipado Estricto de Datos: Queda estrictamente prohibido el uso de tipos de datos de evasión como any en TypeScript. Todos los modelos de la base de datos deben ser mapeados a interfaces TypeScript nativas.

Precisión Monetaria de Cuatro Decimales: Todos los cálculos matemáticos internos de costos, porcentajes y utilidades deben procesarse utilizando precisión de cuatro decimales (numeric(12,4)) en PostgreSQL para evitar la pérdida de centavos en la sumatoria acumulada de gastos menores. El redondeo a dos decimales comerciales se aplicará exclusivamente en la capa de renderizado visual de la interfaz.

Aislamiento de Entradas de Mercancía: La columna subcategoria dentro de la tabla de egresos solo puede ser poblada si el rubro_principal es idéntico a 'Mercancia'. Cualquier intento de inserción contraria debe ser rechazado por la base de datos a través de los constraints definidos.

7. Definition of Done / DoD (Criterios de Aceptación)
El desarrollo del sistema se considerará finalizado única y exclusivamente cuando cumpla de manera verificable con los siguientes ítems técnicos:

[ ] Persistencia y Reactividad de Datos: Un registro ingresado a través de cualquiera de los botones manuales del modal de registro debe impactar de forma síncrona el porcentaje del Semáforo correspondiente en el Dashboard y recalcular la Utilidad Neta de manera instantánea.

[ ] Eficacia del Segmentador de Nómina: El sistema debe discriminar correctamente el impacto de la nómina, asignando de manera diferenciada los ingresos quincenales al umbral del 18% operativo o al 7% administrativo según la selección del formulario.

[ ] Histórico Inmutable Intermensual: Al realizar una consulta en la pantalla de análisis comparativo, el sistema debe ser capaz de agrupar dinámicamente los registros pasados por formato YYYY-MM, calcular la variación porcentual entre dos periodos y desplegar la tabla comparativa de variaciones sin alterar ni sobreescribir las filas originales de la base de datos.

[ ] Validación de Capas de Suavizado y Auditoría: Se debe evidenciar mediante pruebas funcionales que los semáforos fijos no se corrompen en el día 1, que la nómina calcula su proporcionalidad teórica, y que el botón de eliminar de la lista de auditoría express reajusta los valores en tiempo real.

[ ] Despliegue y Compilación Limpia: El código fuente debe compilar en modo de producción (next build) con cero errores en la consola de TypeScript, sin fugas de API keys en las herramientas de desarrollo del navegador y pasar las pruebas de linteo estático configuradas en el entorno.