-- ============================================================================
-- SQL PARA CREAR 3 BOLSOS DE MEDICAMENTOS
-- ============================================================================
-- Proyecto: TRIAGE360
-- Fecha: 01 Abril 2026
-- Descripción: 3 Bolsos idénticos con inventario completo
-- Cada bolso: 26 medicamentos (11 inyectables + 12 orales + 3 aerosoles)
-- Total registros: 78 (26 × 3)
-- ============================================================================

-- Limpiar datos anteriores de bolsos (si existen)
DELETE FROM contenedores_medicamentos WHERE tipo = 'bolso';

-- ============================================================================
-- CREAR TABLA TEMPORAL CON INVENTARIO BASE
-- ============================================================================

CREATE TEMP TABLE inventario_bolso (
  nombre_insumo TEXT,
  cajon TEXT,
  stock INT,
  minimo INT,
  unidad TEXT
);

-- CAJA 1 - INYECTABLES (11 items)
INSERT INTO inventario_bolso VALUES
('Ondansetrón 4mg', 'Caja 1 · Inyectables', 3, 2, 'amp.'),
('Clorfenamina 10mg', 'Caja 1 · Inyectables', 4, 2, 'amp.'),
('Viadil 5mg', 'Caja 1 · Inyectables', 2, 2, 'amp.'),
('Dexametasona 4mg', 'Caja 1 · Inyectables', 5, 2, 'amp.'),
('Metoclopramida 10mg', 'Caja 1 · Inyectables', 4, 2, 'amp.'),
('Betametasona 4mg', 'Caja 1 · Inyectables', 3, 2, 'amp.'),
('Esomeprazol 40mg', 'Caja 1 · Inyectables', 2, 2, 'amp.'),
('Hidrocortisona 100mg', 'Caja 1 · Inyectables', 2, 1, 'vial'),
('Ketorolaco 30mg', 'Caja 1 · Inyectables', 4, 3, 'amp.'),
('Ketoprofeno 100mg', 'Caja 1 · Inyectables', 3, 2, 'amp.'),
('Metamizol 1gr', 'Caja 1 · Inyectables', 3, 2, 'amp.');

-- CAJA 2 - ORALES (12 items)
INSERT INTO inventario_bolso VALUES
('Ketorolaco S/L 30mg', 'Caja 2 · Orales', 6, 4, 'comp.'),
('Clorfenamina', 'Caja 2 · Orales', 10, 6, 'comp.'),
('Ibuprofeno 600mg', 'Caja 2 · Orales', 12, 8, 'comp.'),
('Viadil', 'Caja 2 · Orales', 1, 1, 'frasco'),
('Paracetamol 500mg', 'Caja 2 · Orales', 20, 10, 'comp.'),
('Loperamida 2mg', 'Caja 2 · Orales', 8, 4, 'comp.'),
('Celecoxib 200mg', 'Caja 2 · Orales', 6, 4, 'comp.'),
('Prednisona 5mg', 'Caja 2 · Orales', 10, 6, 'comp.'),
('Ketoprofeno 200mg', 'Caja 2 · Orales', 8, 4, 'comp.'),
('Desloratadina', 'Caja 2 · Orales', 6, 4, 'comp.'),
('Ondansetrón 4mg oral', 'Caja 2 · Orales', 8, 4, 'comp.'),
('Lágrimas Artificiales', 'Caja 2 · Orales', 2, 1, 'frasco');

-- CAJA 3 - AEROSOLES (3 items)
INSERT INTO inventario_bolso VALUES
('Salbutamol Puff', 'Caja 3 · Aerosoles', 2, 1, 'inhalador'),
('Femoterol Puff', 'Caja 3 · Aerosoles', 1, 1, 'inhalador'),
('Bromuro Puff', 'Caja 3 · Aerosoles', 1, 1, 'inhalador');

-- ============================================================================
-- REPLICAR INVENTARIO EN LOS 3 BOLSOS
-- ============================================================================

INSERT INTO contenedores_medicamentos (tipo, nombre, nombre_insumo, stock, minimo, unidad, cajon, medicamento_id)
SELECT 
  'bolso',
  'Bolso ' || bolso_num,
  ib.nombre_insumo,
  ib.stock,
  ib.minimo,
  ib.unidad,
  ib.cajon,
  NULL
FROM inventario_bolso ib
CROSS JOIN generate_series(1, 3) AS bolso_num;

-- ============================================================================
-- VERIFICACIÓN DE DATOS
-- ============================================================================

-- Resumen por bolso
SELECT nombre, COUNT(*) as total_medicamentos
FROM contenedores_medicamentos
WHERE tipo = 'bolso'
GROUP BY nombre
ORDER BY nombre;

-- Resumen por caja
SELECT nombre, cajon, COUNT(*) as items
FROM contenedores_medicamentos
WHERE tipo = 'bolso'
GROUP BY nombre, cajon
ORDER BY nombre, cajon;

-- Inventario completo del Bolso 1
SELECT nombre, cajon, nombre_insumo, stock, minimo, unidad
FROM contenedores_medicamentos
WHERE tipo = 'bolso' AND nombre = 'Bolso 1'
ORDER BY cajon, nombre_insumo;

-- ============================================================================
-- RESULTADO ESPERADO:
-- Bolso 1: 26 medicamentos (11 inyectables + 12 orales + 3 aerosoles)
-- Bolso 2: 26 medicamentos (11 inyectables + 12 orales + 3 aerosoles)
-- Bolso 3: 26 medicamentos (11 inyectables + 12 orales + 3 aerosoles)
-- TOTAL: 78 registros
-- ============================================================================
