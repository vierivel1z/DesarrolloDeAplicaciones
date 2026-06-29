
-- ============================================================
-- BANCO ANDINO - PRUEBAS DE BANDEJAS ADMINISTRATIVAS Y MORA
-- ============================================================

BEGIN;

-- 1. MAKER (INGRESADA) - pksolicitudestado = 1
INSERT INTO dsolicitud (
    codsolicitud, pkcliente, pksolicitudestado, pkmoneda, montosolicitudcredito, 
    plazosolicitudcredito, fechasolicitudcredito, codtiposolicitud, 
    codmotivosolicitud, codlineacredito, pksolicitudsituacion, 
    codtipoperiodo, codtipocuota, pkproducto, pkagencia, codusuing, fechahoracreacion, fechahoraultmodificacion, fecultactualizacion
) VALUES (
    'SOL_TEST_MK', (SELECT pkcliente FROM dcliente LIMIT 1), 1, 1, 5000, 12, NOW(), '01', '01', 'CR', 1, 'ME', 'FC', 1, 1, 'SYS', NOW(), NOW(), NOW()
);

-- 2. CHECKER 1 (EVALUADA_PENDIENTE_FIRMA) - pksolicitudestado = 7
INSERT INTO dsolicitud (
    codsolicitud, pkcliente, pksolicitudestado, pkmoneda, montosolicitudcredito, 
    plazosolicitudcredito, fechasolicitudcredito, score_pd, dti_ratio, comentarios_analista,
    codtiposolicitud, codmotivosolicitud, codlineacredito, pksolicitudsituacion, 
    codtipoperiodo, codtipocuota, pkproducto, pkagencia, codusuing, fechahoracreacion, fechahoraultmodificacion, fecultactualizacion
) VALUES (
    'SOL_TEST_CK1', (SELECT pkcliente FROM dcliente OFFSET 1 LIMIT 1), 7, 1, 15000, 24, NOW(), 85.5, 30.2, 'Evaluado OK por MAKER',
    '01', '01', 'CR', 1, 'ME', 'FC', 1, 1, 'SYS', NOW(), NOW(), NOW()
);

-- 3. CHECKER 2 (APROBADO_LISTO_DESEMBOLSO) - pksolicitudestado = 9
INSERT INTO dsolicitud (
    codsolicitud, pkcliente, pksolicitudestado, pkmoneda, montosolicitudcredito, 
    plazosolicitudcredito, fechasolicitudcredito, score_pd, dti_ratio, comentarios_analista, 
    otp_codigo, tasainterescompensatoria, codtiposolicitud, codmotivosolicitud, 
    codlineacredito, pksolicitudsituacion, codtipoperiodo, codtipocuota, pkproducto, pkagencia, codusuing, fechahoracreacion, fechahoraultmodificacion, fecultactualizacion
) VALUES (
    'SOL_TEST_CK2', (SELECT pkcliente FROM dcliente OFFSET 2 LIMIT 1), 9, 1, 25000, 36, NOW(), 90.0, 25.0, 'Evaluado OK por MAKER', 
    '123456', 15.5, '01', '01', 'CR', 1, 'ME', 'FC', 1, 1, 'SYS', NOW(), NOW(), NOW()
);

-- 4. MORA
UPDATE fagcuentacredito SET diasatrasocredito = 45, montosaldocapital = 5000,
flagcastigado = 'N', flagjudicial = 'N'
WHERE pkcuentacredito = (
    SELECT pkcuentacredito FROM fagcuentacredito ORDER BY pkcuentacredito ASC LIMIT 1
);

UPDATE fagcuentacredito SET diasatrasocredito = 95, montosaldocapital = 12000,
flagcastigado = 'S'
WHERE pkcuentacredito = (
    SELECT pkcuentacredito FROM fagcuentacredito ORDER BY pkcuentacredito ASC OFFSET 1 LIMIT 1
);

COMMIT;
