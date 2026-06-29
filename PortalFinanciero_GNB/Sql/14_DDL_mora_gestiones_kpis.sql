-- =========================================================================
-- Script 14: Mora, Gestiones de Cobranza y KPIs
-- Criterio 4: Historial de gestiones, penalización y soporte para KPIs
-- =========================================================================

-- 1. Añadir puntos_recompensas a dcliente si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='dcliente' AND column_name='puntos_recompensas') THEN
        ALTER TABLE dcliente ADD COLUMN puntos_recompensas INTEGER DEFAULT 1000 NOT NULL;
    END IF;
END $$;

-- 2. Crear tabla fgestiones_cobranza
CREATE TABLE IF NOT EXISTS fgestiones_cobranza (
    id_gestion SERIAL PRIMARY KEY,
    id_solicitud INTEGER NOT NULL REFERENCES dsolicitud(pksolicitud),
    usuario_gestor VARCHAR(100) NOT NULL,
    fecha_contacto TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    canal_contacto VARCHAR(50) NOT NULL CHECK (canal_contacto IN ('TELEFONICO', 'SMS', 'EMAIL', 'VISITA_DOMICILIARIA')),
    codigo_respuesta VARCHAR(50) NOT NULL CHECK (codigo_respuesta IN ('COMPROMISO_PAGO', 'NO_CONTESTA', 'ILOCALIZABLE')),
    comentarios TEXT,
    fecha_compromiso_pago DATE,
    monto_comprometido NUMERIC(15,2)
);

-- Índices para optimizar consultas de mora
CREATE INDEX IF NOT EXISTS idx_fgestiones_solicitud ON fgestiones_cobranza(id_solicitud);
CREATE INDEX IF NOT EXISTS idx_fgestiones_fecha ON fgestiones_cobranza(fecha_contacto);

-- 3. Soporte Contable para KPIs: Tabla de Provisiones Globales
CREATE TABLE IF NOT EXISTS dprovisiones_banco (
    id_provision SERIAL PRIMARY KEY,
    monto_provisiones_totales NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    fecultactualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insertar registro por defecto si no existe
INSERT INTO dprovisiones_banco (monto_provisiones_totales)
SELECT 1500000.00
WHERE NOT EXISTS (SELECT 1 FROM dprovisiones_banco);
