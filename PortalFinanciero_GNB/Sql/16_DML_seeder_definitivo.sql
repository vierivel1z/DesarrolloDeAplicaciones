-- =========================================================================
-- BANCO GNB PERU - SEEDER DEFINITIVO DE PRUEBAS COMPLETAS (ROLES Y MORA)
-- =========================================================================

BEGIN;

-- Asegurar recreación correcta de fgestiones_cobranza para evitar tipos incorrectos
DROP TABLE IF EXISTS fgestiones_cobranza CASCADE;

CREATE TABLE fgestiones_cobranza (
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

CREATE INDEX IF NOT EXISTS idx_fgestiones_solicitud ON fgestiones_cobranza(id_solicitud);
CREATE INDEX IF NOT EXISTS idx_fgestiones_fecha ON fgestiones_cobranza(fecha_contacto);


-- 0. Limpieza previa de registros de prueba anteriores
DELETE FROM foperaciones WHERE pkcuentacredito IN (10001, 10002, 10003, 10004, 10005, 10006, 10007);
DELETE FROM fagcuentacredito WHERE pkcuentacredito IN (10001, 10002, 10003, 10004, 10005, 10006, 10007);
DELETE FROM dcuentacredito WHERE pkcuentacredito IN (10001, 10002, 10003, 10004, 10005, 10006, 10007);
DELETE FROM dsolicitud WHERE codsolicitud LIKE 'SOL_SEED_%';

-- Asegurar descripciones limpias de calificaciones internas en UTF-8
UPDATE dcalificacioncrediticia SET descalificacioncrediticia = 'Normal' WHERE pkcalificacioncrediticia = 1;
UPDATE dcalificacioncrediticia SET descalificacioncrediticia = 'Con Problemas Potenciales (CPP)' WHERE pkcalificacioncrediticia = 2;
UPDATE dcalificacioncrediticia SET descalificacioncrediticia = 'Deficiente' WHERE pkcalificacioncrediticia = 3;
UPDATE dcalificacioncrediticia SET descalificacioncrediticia = 'Dudoso' WHERE pkcalificacioncrediticia = 4;
UPDATE dcalificacioncrediticia SET descalificacioncrediticia = 'Pérdida' WHERE pkcalificacioncrediticia = 5;

-- 1. Población de Semáforo SBS para DNIs reales de clientes de prueba
INSERT INTO sbs_central_riesgo (dni, semaforo) VALUES
('11200001', 0), -- Cliente 1: Normal
('11200002', 1), -- Cliente 2: CPP
('11200003', 2), -- Cliente 3: Deficiente (Maker Reject)
('11200004', 3), -- Cliente 4: Dudoso (Maker Reject)
('11200005', 4), -- Cliente 5: Pérdida (Maker Reject)
('11200006', 0), -- Cliente 6: Normal
('11200007', 0), -- Cliente 7: Normal
('11200008', 0), -- Cliente 8: Normal
('11200009', 0), -- Cliente 9: Normal
('11200010', 0), -- Cliente 10: Normal
('11200011', 0), -- Cliente 11: Normal
('11200012', 0)  -- Cliente 12: Normal
ON CONFLICT (dni) DO UPDATE SET semaforo = EXCLUDED.semaforo;

-- 2. Configurar ingresos y datos laborales reales de clientes de prueba
UPDATE dcliente SET tipo_trabajador = 'D', fecha_ingreso_laboral = '2020-01-15' WHERE pkcliente IN (1, 3, 5, 7, 9, 11);
UPDATE dcliente SET tipo_trabajador = 'I', fecha_ingreso_laboral = '2019-11-20' WHERE pkcliente IN (2, 4, 6, 8, 10, 12);

INSERT INTO fclientefuenteingreso (pkcliente, periodomes, montofuenteingreso, pkactividadeconomicacliente, fecultactualizacion) VALUES
(1, 202512, 3500.00, 11, NOW()),
(2, 202512, 4000.00, 11, NOW()),
(3, 202512, 3500.00, 11, NOW()),
(6, 202512, 1000.00, 11, NOW()),
(7, 202512, 5000.00, 11, NOW()),
(8, 202512, 6000.00, 11, NOW()),
(9, 202512, 7000.00, 11, NOW()),
(10, 202512, 5500.00, 11, NOW()),
(11, 202512, 8000.00, 11, NOW()),
(12, 202512, 5000.00, 11, NOW())
ON CONFLICT (pkcliente, periodomes) DO UPDATE SET montofuenteingreso = EXCLUDED.montofuenteingreso;

-- 3. Crear solicitudes en diferentes niveles para pruebas de roles

-- A. MAKER (INGRESADA = pksolicitudestado = 1)
-- SOL_SEED_MK_OK1: Aprobable (DTI bajo, SBS Normal)
INSERT INTO dsolicitud (
    pksolicitud, codsolicitud, pkcliente, pksolicitudestado, pkmoneda, montosolicitudcredito, 
    plazosolicitudcredito, nrocuotasolicitud, fechasolicitudcredito, codtiposolicitud, destiposolicitud, codmotivosolicitud, 
    codlineacredito, pksolicitudsituacion, flaglibreamortizacioncredito, nrodiasgracia,
    codtipoperiodo, codtipocuota, pkproducto, pkagencia, pkasesor,
    codusuing, codususol, fechahoracreacion, fechahoraultmodificacion, fecultactualizacion
) VALUES (
    10001, 'SOL_SEED_MK_OK1', 1, 1, 1, 12000, 
    12, 12, CURRENT_DATE, '01', 'Credito Nuevo', '01',
    'CR', 1, 'N', 0,
    'ME', 'FC', 1, 1, 1,
    'SYS', 'HB', NOW(), NOW(), NOW()
);

-- SOL_SEED_MK_OK2: Aprobable (DTI bajo, SBS CPP/Alerta)
INSERT INTO dsolicitud (
    pksolicitud, codsolicitud, pkcliente, pksolicitudestado, pkmoneda, montosolicitudcredito, 
    plazosolicitudcredito, nrocuotasolicitud, fechasolicitudcredito, codtiposolicitud, destiposolicitud, codmotivosolicitud, 
    codlineacredito, pksolicitudsituacion, flaglibreamortizacioncredito, nrodiasgracia,
    codtipoperiodo, codtipocuota, pkproducto, pkagencia, pkasesor,
    codusuing, codususol, fechahoracreacion, fechahoraultmodificacion, fecultactualizacion
) VALUES (
    10002, 'SOL_SEED_MK_OK2', 2, 1, 1, 15000, 
    24, 24, CURRENT_DATE, '01', 'Credito Nuevo', '01',
    'CR', 1, 'N', 0,
    'ME', 'FC', 1, 1, 1,
    'SYS', 'HB', NOW(), NOW(), NOW()
);

-- SOL_SEED_MK_DTI: No Aprobable (DTI > 40% debido a ingresos de S/ 1000 y monto solicitado S/ 75,000)
INSERT INTO dsolicitud (
    pksolicitud, codsolicitud, pkcliente, pksolicitudestado, pkmoneda, montosolicitudcredito, 
    plazosolicitudcredito, nrocuotasolicitud, fechasolicitudcredito, codtiposolicitud, destiposolicitud, codmotivosolicitud, 
    codlineacredito, pksolicitudsituacion, flaglibreamortizacioncredito, nrodiasgracia,
    codtipoperiodo, codtipocuota, pkproducto, pkagencia, pkasesor,
    codusuing, codususol, fechahoracreacion, fechahoraultmodificacion, fecultactualizacion
) VALUES (
    10003, 'SOL_SEED_MK_DTI', 6, 1, 1, 75000, 
    12, 12, CURRENT_DATE, '01', 'Credito Nuevo', '01',
    'CR', 1, 'N', 0,
    'ME', 'FC', 1, 1, 1,
    'SYS', 'HB', NOW(), NOW(), NOW()
);

-- SOL_SEED_MK_SBS: No Aprobable (Semáforo SBS >= 2 para Cliente 3)
INSERT INTO dsolicitud (
    pksolicitud, codsolicitud, pkcliente, pksolicitudestado, pkmoneda, montosolicitudcredito, 
    plazosolicitudcredito, nrocuotasolicitud, fechasolicitudcredito, codtiposolicitud, destiposolicitud, codmotivosolicitud, 
    codlineacredito, pksolicitudsituacion, flaglibreamortizacioncredito, nrodiasgracia,
    codtipoperiodo, codtipocuota, pkproducto, pkagencia, pkasesor,
    codusuing, codususol, fechahoracreacion, fechahoraultmodificacion, fecultactualizacion
) VALUES (
    10004, 'SOL_SEED_MK_SBS', 3, 1, 1, 10000, 
    12, 12, CURRENT_DATE, '01', 'Credito Nuevo', '01',
    'CR', 1, 'N', 0,
    'ME', 'FC', 1, 1, 1,
    'SYS', 'HB', NOW(), NOW(), NOW()
);


-- B. CHECKER 1 (EVALUADA_PENDIENTE_FIRMA = pksolicitudestado = 7)
-- SOL_SEED_CK1_N1: Nivel 1 (Monto <= S/ 15,000)
INSERT INTO dsolicitud (
    pksolicitud, codsolicitud, pkcliente, pksolicitudestado, pkmoneda, montosolicitudcredito, 
    plazosolicitudcredito, nrocuotasolicitud, fechasolicitudcredito, score_pd, dti_ratio, comentarios_analista,
    codtiposolicitud, destiposolicitud, codmotivosolicitud, codlineacredito, pksolicitudsituacion, flaglibreamortizacioncredito, nrodiasgracia,
    codtipoperiodo, codtipocuota, pkproducto, pkagencia, pkasesor,
    codusuing, codususol, fechahoracreacion, fechahoraultmodificacion, fecultactualizacion
) VALUES (
    10005, 'SOL_SEED_CK1_N1', 7, 7, 1, 10000, 
    12, 12, CURRENT_DATE, 88.5, 25.4, 'Pre-aprobado Maker Nivel 1',
    '01', 'Credito Nuevo', '01', 'CR', 1, 'N', 0,
    'ME', 'FC', 1, 1, 1,
    'SYS', 'HB', NOW(), NOW(), NOW()
);

-- SOL_SEED_CK1_N2: Nivel 2 (Monto <= S/ 50,000)
INSERT INTO dsolicitud (
    pksolicitud, codsolicitud, pkcliente, pksolicitudestado, pkmoneda, montosolicitudcredito, 
    plazosolicitudcredito, nrocuotasolicitud, fechasolicitudcredito, score_pd, dti_ratio, comentarios_analista,
    codtiposolicitud, destiposolicitud, codmotivosolicitud, codlineacredito, pksolicitudsituacion, flaglibreamortizacioncredito, nrodiasgracia,
    codtipoperiodo, codtipocuota, pkproducto, pkagencia, pkasesor,
    codusuing, codususol, fechahoracreacion, fechahoraultmodificacion, fecultactualizacion
) VALUES (
    10006, 'SOL_SEED_CK1_N2', 8, 7, 1, 35000, 
    24, 24, CURRENT_DATE, 90.0, 31.2, 'Pre-aprobado Maker Nivel 2',
    '01', 'Credito Nuevo', '01', 'CR', 1, 'N', 0,
    'ME', 'FC', 1, 1, 1,
    'SYS', 'HB', NOW(), NOW(), NOW()
);

-- SOL_SEED_CK1_N3: Nivel 3 (Monto > S/ 50,000; Debería derivar a Comité en Checker 1)
INSERT INTO dsolicitud (
    pksolicitud, codsolicitud, pkcliente, pksolicitudestado, pkmoneda, montosolicitudcredito, 
    plazosolicitudcredito, nrocuotasolicitud, fechasolicitudcredito, score_pd, dti_ratio, comentarios_analista,
    codtiposolicitud, destiposolicitud, codmotivosolicitud, codlineacredito, pksolicitudsituacion, flaglibreamortizacioncredito, nrodiasgracia,
    codtipoperiodo, codtipocuota, pkproducto, pkagencia, pkasesor,
    codusuing, codususol, fechahoracreacion, fechahoraultmodificacion, fecultactualizacion
) VALUES (
    10007, 'SOL_SEED_CK1_N3', 9, 7, 1, 60000, 
    36, 36, CURRENT_DATE, 92.5, 34.8, 'Pre-aprobado Maker Nivel 3 para Comité',
    '01', 'Credito Nuevo', '01', 'CR', 1, 'N', 0,
    'ME', 'FC', 1, 1, 1,
    'SYS', 'HB', NOW(), NOW(), NOW()
);


-- C. CHECKER 2 (APROBADO_LISTO_DESEMBOLSO = pksolicitudestado = 9 / PENDIENTE_FIRMA_COMITE = pksolicitudestado = 10)
-- SOL_SEED_CK2_AL: Aprobado Listo Desembolso (Checker 2 puede desembolsar)
INSERT INTO dsolicitud (
    pksolicitud, codsolicitud, pkcliente, pksolicitudestado, pkmoneda, montosolicitudcredito, 
    plazosolicitudcredito, nrocuotasolicitud, fechasolicitudcredito, score_pd, dti_ratio, comentarios_analista, 
    otp_codigo, tasainterescompensatoria, codtiposolicitud, destiposolicitud, codmotivosolicitud, 
    codlineacredito, pksolicitudsituacion, flaglibreamortizacioncredito, nrodiasgracia,
    codtipoperiodo, codtipocuota, pkproducto, pkagencia, pkasesor,
    codusuing, codususol, fechahoracreacion, fechahoraultmodificacion, fecultactualizacion
) VALUES (
    10008, 'SOL_SEED_CK2_AL', 10, 9, 1, 15000, 
    12, 12, CURRENT_DATE, 89.0, 27.5, 'Listo para desembolso contable', 
    '123456', 15.5, '01', 'Credito Nuevo', '01', 
    'CR', 1, 'N', 0,
    'ME', 'FC', 1, 1, 1,
    'SYS', 'HB', NOW(), NOW(), NOW()
);

-- SOL_SEED_CK2_FC: Esperando firma de Comité (Checker 2 / Comité debe firmar)
INSERT INTO dsolicitud (
    pksolicitud, codsolicitud, pkcliente, pksolicitudestado, pkmoneda, montosolicitudcredito, 
    plazosolicitudcredito, nrocuotasolicitud, fechasolicitudcredito, score_pd, dti_ratio, comentarios_analista, 
    otp_codigo, tasainterescompensatoria, codtiposolicitud, destiposolicitud, codmotivosolicitud, 
    codlineacredito, pksolicitudsituacion, flaglibreamortizacioncredito, nrodiasgracia,
    codtipoperiodo, codtipocuota, pkproducto, pkagencia, pkasesor,
    firma_checker1_user, firma_checker1_fecha,
    codusuing, codususol, fechahoracreacion, fechahoraultmodificacion, fecultactualizacion
) VALUES (
    10009, 'SOL_SEED_CK2_FC', 11, 10, 1, 55000, 
    24, 24, CURRENT_DATE, 91.0, 33.5, 'Escalado por Checker 1', 
    '654321', 17.5, '01', 'Credito Nuevo', '01', 
    'CR', 1, 'N', 0,
    'ME', 'FC', 1, 1, 1,
    'checker1_01', NOW(),
    'SYS', 'HB', NOW(), NOW(), NOW()
);


-- 4. Creación de Cuentas de Crédito en Mora y sus Gestiones de Prueba

-- A. DClienteCuentas de Crédito asociadas
INSERT INTO dcuentacredito (pkcuentacredito, codcuentacredito, codlineacredito, pkcliente, nrocronograma, fecultactualizacion) VALUES
(10001, 'CRED_SEED_M01', 'CR', 1, 1, NOW()),
(10002, 'CRED_SEED_M02', 'CR', 2, 1, NOW()),
(10003, 'CRED_SEED_M03', 'CR', 6, 1, NOW()),
(10004, 'CRED_SEED_M04', 'CR', 7, 1, NOW()),
(10005, 'CRED_SEED_M05', 'CR', 8, 1, NOW()),
(10006, 'CRED_SEED_M06', 'CR', 9, 1, NOW()),
(10007, 'CRED_SEED_M07', 'CR', 11, 1, NOW());

-- B. Clonar fact registros de prueba usando SELECT de un registro válido de la DB
-- Clona Preventiva (10001) - 5 días atraso, cliente 1
INSERT INTO fagcuentacredito (
    periodomes, pkcuentacredito, pksolicitud, pkestadocredito, nrocuotas, nrodias, nrodiasgracias, diafechafija,
    codtipocuota, codtipoperiodo, flaglibreamortizacion, montoaprobadocredito, montocapitaldesembolsado, montocapitalpagado,
    montointeresprogramado, montointeresalafecha, montointerespagado, montomoraprogramada, montomorapagada, montogastoprogramado, montogastopagado,
    pkproducto, pkrecurso, pksubrecurso, pkmoneda, pkmodalidad, codplazo, codlineacredito, nrotasacompensatoria, tasainterescompensatoria, nrotasamoratoria, tasainteresmoratoria,
    diasatrasocredito, fechaculminacioncredito, fechageneracioncredito, fechadesembolsocredito, tipocambiodesembolso, pkgrupocredito, flagrefinanciado, flagreestructurado, flagreprogramado,
    flagjudicial, flagcastigado, pkactividadeconomica, montosaldonormal, montosaldovencido, flagnuevorecurrente, montocostoefectivo, pktipotasacompensatoria, pktipotasamoratoria,
    pkcliente, nrocronograma, pkcondicioncontable, flagclientenuevobancoandino, flagclientenuevo, flagclientecartera, pkcalificacioncrediticiainterna, pkcalificacioncrediticiaexterna,
    fechaingresojudicial, montocapitalinicio, montointeresinicio, montomorainicio, montogastoinicio, nrodiasatrasoinicio,
    montosaldocapital, montosaldointeres, montosaldomoratorio, montosaldogasto,
    car_vig_capital, car_vig_int_compensatorio, car_vig_int_moratorio, car_vig_gastos,
    car_ven_capital, car_ven_int_compensatorio, car_ven_int_moratorio, car_ven_gastos,
    car_ref_capital, car_ref_int_compensatorio, car_ref_int_moratorio, car_ref_gastos,
    car_rep_capital, car_rep_int_compensatorio, car_rep_int_moratorio, car_rep_gastos,
    car_jud_capital, car_jud_int_compensatorio, car_jud_int_moratorio, car_jud_gastos,
    car_cas_capital, car_cas_int_compensatorio, car_cas_int_moratorio, car_cas_gastos,
    car_con_capital, car_con_int_compensatorio, car_con_int_moratorio, car_con_gastos,
    saldodiferido, saldodevengado, saldoprovisiones, montosaldocliente, pkagencia, pkjeferegional, pkadministrador, pkasesor, pkasesornivel, fecultactualizacion
)
SELECT 
    202512, 10001, 10001, 1, 12, 360, 0, 15,
    'FC', 'ME', 'N', 12000.0, 12000.0, 2000.0,
    800.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
    1, 1, 1, 1, 1, '12', 'CR', 'T00001', 0.4392, 'T00002', 0.0,
    5, CURRENT_DATE + 360, CURRENT_DATE, CURRENT_DATE, 1.0, 1, 'N', 'N', 'N',
    'N', 'N', 1, 10000.0, 0.0, 'R', 0.4392, 1, 1,
    1, 1, 1, 'N', 'N', 'Y', 1, 1,
    NULL, 12000.0, 0.0, 0.0, 0.0, 0,
    10000.0, 0.0, 0.0, 0.0,
    10000.0, 0.0, 0.0, 0.0,
    0.0, 0.0, 0.0, 0.0,
    0.0, 0.0, 0.0, 0.0,
    0.0, 0.0, 0.0, 0.0,
    0.0, 0.0, 0.0, 0.0,
    0.0, 0.0, 0.0, 0.0,
    0.0, 0.0, 0.0, 0.0,
    0.0, 0.0, 0.0, 10800.0,
    1, 1, 1, 1, 1, NOW();

-- Clona Temprana (10002) - 25 días atraso, cliente 2
INSERT INTO fagcuentacredito (
    periodomes, pkcuentacredito, pksolicitud, pkestadocredito, nrocuotas, nrodias, nrodiasgracias, diafechafija,
    codtipocuota, codtipoperiodo, flaglibreamortizacion, montoaprobadocredito, montocapitaldesembolsado, montocapitalpagado,
    montointeresprogramado, montointeresalafecha, montointerespagado, montomoraprogramada, montomorapagada, montogastoprogramado, montogastopagado,
    pkproducto, pkrecurso, pksubrecurso, pkmoneda, pkmodalidad, codplazo, codlineacredito, nrotasacompensatoria, tasainterescompensatoria, nrotasamoratoria, tasainteresmoratoria,
    diasatrasocredito, fechaculminacioncredito, fechageneracioncredito, fechadesembolsocredito, tipocambiodesembolso, pkgrupocredito, flagrefinanciado, flagreestructurado, flagreprogramado,
    flagjudicial, flagcastigado, pkactividadeconomica, montosaldonormal, montosaldovencido, flagnuevorecurrente, montocostoefectivo, pktipotasacompensatoria, pktipotasamoratoria,
    pkcliente, nrocronograma, pkcondicioncontable, flagclientenuevobancoandino, flagclientenuevo, flagclientecartera, pkcalificacioncrediticiainterna, pkcalificacioncrediticiaexterna,
    fechaingresojudicial, montocapitalinicio, montointeresinicio, montomorainicio, montogastoinicio, nrodiasatrasoinicio,
    montosaldocapital, montosaldointeres, montosaldomoratorio, montosaldogasto,
    car_vig_capital, car_vig_int_compensatorio, car_vig_int_moratorio, car_vig_gastos,
    car_ven_capital, car_ven_int_compensatorio, car_ven_int_moratorio, car_ven_gastos,
    car_ref_capital, car_ref_int_compensatorio, car_ref_int_moratorio, car_ref_gastos,
    car_rep_capital, car_rep_int_compensatorio, car_rep_int_moratorio, car_rep_gastos,
    car_jud_capital, car_jud_int_compensatorio, car_jud_int_moratorio, car_jud_gastos,
    car_cas_capital, car_cas_int_compensatorio, car_cas_int_moratorio, car_cas_gastos,
    car_con_capital, car_con_int_compensatorio, car_con_int_moratorio, car_con_gastos,
    saldodiferido, saldodevengado, saldoprovisiones, montosaldocliente, pkagencia, pkjeferegional, pkadministrador, pkasesor, pkasesornivel, fecultactualizacion
)
SELECT 
    202512, 10002, 10002, pkestadocredito, 24, 720, 0, 15,
    codtipocuota, codtipoperiodo, flaglibreamortizacion, 15000, 15000, 1000,
    1200, 0, 0, 0, 0, 0, 0,
    pkproducto, pkrecurso, pksubrecurso, pkmoneda, pkmodalidad, '24', codlineacredito, nrotasacompensatoria, tasainterescompensatoria, nrotasamoratoria, tasainteresmoratoria,
    25, -- 25 días de atraso
    fechaculminacioncredito, fechageneracioncredito, fechadesembolsocredito, tipocambiodesembolso, pkgrupocredito, flagrefinanciado, flagreestructurado, flagreprogramado,
    'N', 'N', -- flagjudicial, flagcastigado
    pkactividadeconomica, montosaldonormal, montosaldovencido, flagnuevorecurrente, montocostoefectivo, pktipotasacompensatoria, pktipotasamoratoria,
    2, -- cliente 2
    nrocronograma, pkcondicioncontable, flagclientenuevobancoandino, flagclientenuevo, flagclientecartera, 
    2, -- calificación: CPP
    pkcalificacioncrediticiaexterna, NULL,
    15000, 0, 0, 0, 0,
    14000, 0, 0, 0,
    car_vig_capital, car_vig_int_compensatorio, car_vig_int_moratorio, car_vig_gastos,
    car_ven_capital, car_ven_int_compensatorio, car_ven_int_moratorio, car_ven_gastos,
    car_ref_capital, car_ref_int_compensatorio, car_ref_int_moratorio, car_ref_gastos,
    car_rep_capital, car_rep_int_compensatorio, car_rep_int_moratorio, car_rep_gastos,
    car_jud_capital, car_jud_int_compensatorio, car_jud_int_moratorio, car_jud_gastos,
    car_cas_capital, car_cas_int_compensatorio, car_cas_int_moratorio, car_cas_gastos,
    car_con_capital, car_con_int_compensatorio, car_con_int_moratorio, car_con_gastos,
    saldodiferido, saldodevengado, saldoprovisiones, 15200,
    pkagencia, pkjeferegional, pkadministrador, pkasesor, pkasesornivel, NOW()
FROM fagcuentacredito LIMIT 1;

-- Clona Tardía (10003) - 95 días atraso, cliente 6
INSERT INTO fagcuentacredito (
    periodomes, pkcuentacredito, pksolicitud, pkestadocredito, nrocuotas, nrodias, nrodiasgracias, diafechafija,
    codtipocuota, codtipoperiodo, flaglibreamortizacion, montoaprobadocredito, montocapitaldesembolsado, montocapitalpagado,
    montointeresprogramado, montointeresalafecha, montointerespagado, montomoraprogramada, montomorapagada, montogastoprogramado, montogastopagado,
    pkproducto, pkrecurso, pksubrecurso, pkmoneda, pkmodalidad, codplazo, codlineacredito, nrotasacompensatoria, tasainterescompensatoria, nrotasamoratoria, tasainteresmoratoria,
    diasatrasocredito, fechaculminacioncredito, fechageneracioncredito, fechadesembolsocredito, tipocambiodesembolso, pkgrupocredito, flagrefinanciado, flagreestructurado, flagreprogramado,
    flagjudicial, flagcastigado, pkactividadeconomica, montosaldonormal, montosaldovencido, flagnuevorecurrente, montocostoefectivo, pktipotasacompensatoria, pktipotasamoratoria,
    pkcliente, nrocronograma, pkcondicioncontable, flagclientenuevobancoandino, flagclientenuevo, flagclientecartera, pkcalificacioncrediticiainterna, pkcalificacioncrediticiaexterna,
    fechaingresojudicial, montocapitalinicio, montointeresinicio, montomorainicio, montogastoinicio, nrodiasatrasoinicio,
    montosaldocapital, montosaldointeres, montosaldomoratorio, montosaldogasto,
    car_vig_capital, car_vig_int_compensatorio, car_vig_int_moratorio, car_vig_gastos,
    car_ven_capital, car_ven_int_compensatorio, car_ven_int_moratorio, car_ven_gastos,
    car_ref_capital, car_ref_int_compensatorio, car_ref_int_moratorio, car_ref_gastos,
    car_rep_capital, car_rep_int_compensatorio, car_rep_int_moratorio, car_rep_gastos,
    car_jud_capital, car_jud_int_compensatorio, car_jud_int_moratorio, car_jud_gastos,
    car_cas_capital, car_cas_int_compensatorio, car_cas_int_moratorio, car_cas_gastos,
    car_con_capital, car_con_int_compensatorio, car_con_int_moratorio, car_con_gastos,
    saldodiferido, saldodevengado, saldoprovisiones, montosaldocliente, pkagencia, pkjeferegional, pkadministrador, pkasesor, pkasesornivel, fecultactualizacion
)
SELECT 
    202512, 10003, 10003, pkestadocredito, 12, 360, 0, 15,
    codtipocuota, codtipoperiodo, flaglibreamortizacion, 75000, 75000, 5000,
    4500, 0, 0, 0, 0, 0, 0,
    pkproducto, pkrecurso, pksubrecurso, pkmoneda, pkmodalidad, '12', codlineacredito, nrotasacompensatoria, tasainterescompensatoria, nrotasamoratoria, tasainteresmoratoria,
    95, -- 95 días de atraso
    fechaculminacioncredito, fechageneracioncredito, fechadesembolsocredito, tipocambiodesembolso, pkgrupocredito, flagrefinanciado, flagreestructurado, flagreprogramado,
    'N', 'N', -- flagjudicial, flagcastigado
    pkactividadeconomica, montosaldonormal, montosaldovencido, flagnuevorecurrente, montocostoefectivo, pktipotasacompensatoria, pktipotasamoratoria,
    6, -- cliente 6
    nrocronograma, pkcondicioncontable, flagclientenuevobancoandino, flagclientenuevo, flagclientecartera, 
    4, -- calificación: Dudoso
    pkcalificacioncrediticiaexterna, NULL,
    75000, 0, 0, 0, 0,
    70000, 0, 0, 0,
    car_vig_capital, car_vig_int_compensatorio, car_vig_int_moratorio, car_vig_gastos,
    car_ven_capital, car_ven_int_compensatorio, car_ven_int_moratorio, car_ven_gastos,
    car_ref_capital, car_ref_int_compensatorio, car_ref_int_moratorio, car_ref_gastos,
    car_rep_capital, car_rep_int_compensatorio, car_rep_int_moratorio, car_rep_gastos,
    car_jud_capital, car_jud_int_compensatorio, car_jud_int_moratorio, car_jud_gastos,
    car_cas_capital, car_cas_int_compensatorio, car_cas_int_moratorio, car_cas_gastos,
    car_con_capital, car_con_int_compensatorio, car_con_int_moratorio, car_con_gastos,
    saldodiferido, saldodevengado, saldoprovisiones, 74500,
    pkagencia, pkjeferegional, pkadministrador, pkasesor, pkasesornivel, NOW()
FROM fagcuentacredito LIMIT 1;

-- Clona Judicial por Aplicar (10004) - 135 días atraso, cliente 7
INSERT INTO fagcuentacredito (
    periodomes, pkcuentacredito, pksolicitud, pkestadocredito, nrocuotas, nrodias, nrodiasgracias, diafechafija,
    codtipocuota, codtipoperiodo, flaglibreamortizacion, montoaprobadocredito, montocapitaldesembolsado, montocapitalpagado,
    montointeresprogramado, montointeresalafecha, montointerespagado, montomoraprogramada, montomorapagada, montogastoprogramado, montogastopagado,
    pkproducto, pkrecurso, pksubrecurso, pkmoneda, pkmodalidad, codplazo, codlineacredito, nrotasacompensatoria, tasainterescompensatoria, nrotasamoratoria, tasainteresmoratoria,
    diasatrasocredito, fechaculminacioncredito, fechageneracioncredito, fechadesembolsocredito, tipocambiodesembolso, pkgrupocredito, flagrefinanciado, flagreestructurado, flagreprogramado,
    flagjudicial, flagcastigado, pkactividadeconomica, montosaldonormal, montosaldovencido, flagnuevorecurrente, montocostoefectivo, pktipotasacompensatoria, pktipotasamoratoria,
    pkcliente, nrocronograma, pkcondicioncontable, flagclientenuevobancoandino, flagclientenuevo, flagclientecartera, pkcalificacioncrediticiainterna, pkcalificacioncrediticiaexterna,
    fechaingresojudicial, montocapitalinicio, montointeresinicio, montomorainicio, montogastoinicio, nrodiasatrasoinicio,
    montosaldocapital, montosaldointeres, montosaldomoratorio, montosaldogasto,
    car_vig_capital, car_vig_int_compensatorio, car_vig_int_moratorio, car_vig_gastos,
    car_ven_capital, car_ven_int_compensatorio, car_ven_int_moratorio, car_ven_gastos,
    car_ref_capital, car_ref_int_compensatorio, car_ref_int_moratorio, car_ref_gastos,
    car_rep_capital, car_rep_int_compensatorio, car_rep_int_moratorio, car_rep_gastos,
    car_jud_capital, car_jud_int_compensatorio, car_jud_int_moratorio, car_jud_gastos,
    car_cas_capital, car_cas_int_compensatorio, car_cas_int_moratorio, car_cas_gastos,
    car_con_capital, car_con_int_compensatorio, car_con_int_moratorio, car_con_gastos,
    saldodiferido, saldodevengado, saldoprovisiones, montosaldocliente, pkagencia, pkjeferegional, pkadministrador, pkasesor, pkasesornivel, fecultactualizacion
)
SELECT 
    202512, 10004, 10005, pkestadocredito, 12, 360, 0, 15,
    codtipocuota, codtipoperiodo, flaglibreamortizacion, 10000, 10000, 1000,
    600, 0, 0, 0, 0, 0, 0,
    pkproducto, pkrecurso, pksubrecurso, pkmoneda, pkmodalidad, '12', codlineacredito, nrotasacompensatoria, tasainterescompensatoria, nrotasamoratoria, tasainteresmoratoria,
    135, -- 135 días de atraso (>120 para Judicial)
    fechaculminacioncredito, fechageneracioncredito, fechadesembolsocredito, tipocambiodesembolso, pkgrupocredito, flagrefinanciado, flagreestructurado, flagreprogramado,
    'N', 'N', -- flagjudicial, flagcastigado
    pkactividadeconomica, montosaldonormal, montosaldovencido, flagnuevorecurrente, montocostoefectivo, pktipotasacompensatoria, pktipotasamoratoria,
    7, -- cliente 7
    nrocronograma, pkcondicioncontable, flagclientenuevobancoandino, flagclientenuevo, flagclientecartera, 
    4, -- calificación: Dudoso
    pkcalificacioncrediticiaexterna, NULL,
    10000, 0, 0, 0, 0,
    9000, 0, 0, 0,
    car_vig_capital, car_vig_int_compensatorio, car_vig_int_moratorio, car_vig_gastos,
    car_ven_capital, car_ven_int_compensatorio, car_ven_int_moratorio, car_ven_gastos,
    car_ref_capital, car_ref_int_compensatorio, car_ref_int_moratorio, car_ref_gastos,
    car_rep_capital, car_rep_int_compensatorio, car_rep_int_moratorio, car_rep_gastos,
    car_jud_capital, car_jud_int_compensatorio, car_jud_int_moratorio, car_jud_gastos,
    car_cas_capital, car_cas_int_compensatorio, car_cas_int_moratorio, car_cas_gastos,
    car_con_capital, car_con_int_compensatorio, car_con_int_moratorio, car_con_gastos,
    saldodiferido, saldodevengado, saldoprovisiones, 9600,
    pkagencia, pkjeferegional, pkadministrador, pkasesor, pkasesornivel, NOW()
FROM fagcuentacredito LIMIT 1;

-- Clona Judicial Aplicado (10005) - 150 días atraso, cliente 8
INSERT INTO fagcuentacredito (
    periodomes, pkcuentacredito, pksolicitud, pkestadocredito, nrocuotas, nrodias, nrodiasgracias, diafechafija,
    codtipocuota, codtipoperiodo, flaglibreamortizacion, montoaprobadocredito, montocapitaldesembolsado, montocapitalpagado,
    montointeresprogramado, montointeresalafecha, montointerespagado, montomoraprogramada, montomorapagada, montogastoprogramado, montogastopagado,
    pkproducto, pkrecurso, pksubrecurso, pkmoneda, pkmodalidad, codplazo, codlineacredito, nrotasacompensatoria, tasainterescompensatoria, nrotasamoratoria, tasainteresmoratoria,
    diasatrasocredito, fechaculminacioncredito, fechageneracioncredito, fechadesembolsocredito, tipocambiodesembolso, pkgrupocredito, flagrefinanciado, flagreestructurado, flagreprogramado,
    flagjudicial, flagcastigado, pkactividadeconomica, montosaldonormal, montosaldovencido, flagnuevorecurrente, montocostoefectivo, pktipotasacompensatoria, pktipotasamoratoria,
    pkcliente, nrocronograma, pkcondicioncontable, flagclientenuevobancoandino, flagclientenuevo, flagclientecartera, pkcalificacioncrediticiainterna, pkcalificacioncrediticiaexterna,
    fechaingresojudicial, montocapitalinicio, montointeresinicio, montomorainicio, montogastoinicio, nrodiasatrasoinicio,
    montosaldocapital, montosaldointeres, montosaldomoratorio, montosaldogasto,
    car_vig_capital, car_vig_int_compensatorio, car_vig_int_moratorio, car_vig_gastos,
    car_ven_capital, car_ven_int_compensatorio, car_ven_int_moratorio, car_ven_gastos,
    car_ref_capital, car_ref_int_compensatorio, car_ref_int_moratorio, car_ref_gastos,
    car_rep_capital, car_rep_int_compensatorio, car_rep_int_moratorio, car_rep_gastos,
    car_jud_capital, car_jud_int_compensatorio, car_jud_int_moratorio, car_jud_gastos,
    car_cas_capital, car_cas_int_compensatorio, car_cas_int_moratorio, car_cas_gastos,
    car_con_capital, car_con_int_compensatorio, car_con_int_moratorio, car_con_gastos,
    saldodiferido, saldodevengado, saldoprovisiones, montosaldocliente, pkagencia, pkjeferegional, pkadministrador, pkasesor, pkasesornivel, fecultactualizacion
)
SELECT 
    202512, 10005, 10006, pkestadocredito, 24, 720, 0, 15,
    codtipocuota, codtipoperiodo, flaglibreamortizacion, 35000, 35000, 5000,
    2500, 0, 0, 0, 0, 0, 0,
    pkproducto, pkrecurso, pksubrecurso, pkmoneda, pkmodalidad, '24', codlineacredito, nrotasacompensatoria, tasainterescompensatoria, nrotasamoratoria, tasainteresmoratoria,
    150, -- 150 días de atraso
    fechaculminacioncredito, fechageneracioncredito, fechadesembolsocredito, tipocambiodesembolso, pkgrupocredito, flagrefinanciado, flagreestructurado, flagreprogramado,
    'S', 'N', -- flagjudicial = S (Pase a Judicial ya aplicado)
    pkactividadeconomica, montosaldonormal, montosaldovencido, flagnuevorecurrente, montocostoefectivo, pktipotasacompensatoria, pktipotasamoratoria,
    8, -- cliente 8
    nrocronograma, pkcondicioncontable, flagclientenuevobancoandino, flagclientenuevo, flagclientecartera, 
    4, -- calificación: Dudoso
    pkcalificacioncrediticiaexterna, CURRENT_DATE,
    35000, 0, 0, 0, 0,
    30000, 0, 0, 0,
    car_vig_capital, car_vig_int_compensatorio, car_vig_int_moratorio, car_vig_gastos,
    car_ven_capital, car_ven_int_compensatorio, car_ven_int_moratorio, car_ven_gastos,
    car_ref_capital, car_ref_int_compensatorio, car_ref_int_moratorio, car_ref_gastos,
    car_rep_capital, car_rep_int_compensatorio, car_rep_int_moratorio, car_rep_gastos,
    car_jud_capital, car_jud_int_compensatorio, car_jud_int_moratorio, car_jud_gastos,
    car_cas_capital, car_cas_int_compensatorio, car_cas_int_moratorio, car_cas_gastos,
    car_con_capital, car_con_int_compensatorio, car_con_int_moratorio, car_con_gastos,
    saldodiferido, saldodevengado, saldoprovisiones, 32500,
    pkagencia, pkjeferegional, pkadministrador, pkasesor, pkasesornivel, NOW()
FROM fagcuentacredito LIMIT 1;

-- Clona Castigo por Aplicar (10006) - 195 días atraso, cliente 9
INSERT INTO fagcuentacredito (
    periodomes, pkcuentacredito, pksolicitud, pkestadocredito, nrocuotas, nrodias, nrodiasgracias, diafechafija,
    codtipocuota, codtipoperiodo, flaglibreamortizacion, montoaprobadocredito, montocapitaldesembolsado, montocapitalpagado,
    montointeresprogramado, montointeresalafecha, montointerespagado, montomoraprogramada, montomorapagada, montogastoprogramado, montogastopagado,
    pkproducto, pkrecurso, pksubrecurso, pkmoneda, pkmodalidad, codplazo, codlineacredito, nrotasacompensatoria, tasainterescompensatoria, nrotasamoratoria, tasainteresmoratoria,
    diasatrasocredito, fechaculminacioncredito, fechageneracioncredito, fechadesembolsocredito, tipocambiodesembolso, pkgrupocredito, flagrefinanciado, flagreestructurado, flagreprogramado,
    flagjudicial, flagcastigado, pkactividadeconomica, montosaldonormal, montosaldovencido, flagnuevorecurrente, montocostoefectivo, pktipotasacompensatoria, pktipotasamoratoria,
    pkcliente, nrocronograma, pkcondicioncontable, flagclientenuevobancoandino, flagclientenuevo, flagclientecartera, pkcalificacioncrediticiainterna, pkcalificacioncrediticiaexterna,
    fechaingresojudicial, montocapitalinicio, montointeresinicio, montomorainicio, montogastoinicio, nrodiasatrasoinicio,
    montosaldocapital, montosaldointeres, montosaldomoratorio, montosaldogasto,
    car_vig_capital, car_vig_int_compensatorio, car_vig_int_moratorio, car_vig_gastos,
    car_ven_capital, car_ven_int_compensatorio, car_ven_int_moratorio, car_ven_gastos,
    car_ref_capital, car_ref_int_compensatorio, car_ref_int_moratorio, car_ref_gastos,
    car_rep_capital, car_rep_int_compensatorio, car_rep_int_moratorio, car_rep_gastos,
    car_jud_capital, car_jud_int_compensatorio, car_jud_int_moratorio, car_jud_gastos,
    car_cas_capital, car_cas_int_compensatorio, car_cas_int_moratorio, car_cas_gastos,
    car_con_capital, car_con_int_compensatorio, car_con_int_moratorio, car_con_gastos,
    saldodiferido, saldodevengado, saldoprovisiones, montosaldocliente, pkagencia, pkjeferegional, pkadministrador, pkasesor, pkasesornivel, fecultactualizacion
)
SELECT 
    202512, 10006, 10007, pkestadocredito, 36, 1080, 0, 15,
    codtipocuota, codtipoperiodo, flaglibreamortizacion, 60000, 60000, 10000,
    5000, 0, 0, 0, 0, 0, 0,
    pkproducto, pkrecurso, pksubrecurso, pkmoneda, pkmodalidad, '36', codlineacredito, nrotasacompensatoria, tasainterescompensatoria, nrotasamoratoria, tasainteresmoratoria,
    195, -- 195 días atraso (>180 días listo para Castigo Contable)
    fechaculminacioncredito, fechageneracioncredito, fechadesembolsocredito, tipocambiodesembolso, pkgrupocredito, flagrefinanciado, flagreestructurado, flagreprogramado,
    'S', 'N', -- flagjudicial = S, flagcastigado = N (Listo para que Superadmin aplique Castigo)
    pkactividadeconomica, montosaldonormal, montosaldovencido, flagnuevorecurrente, montocostoefectivo, pktipotasacompensatoria, pktipotasamoratoria,
    9, -- cliente 9
    nrocronograma, pkcondicioncontable, flagclientenuevobancoandino, flagclientenuevo, flagclientecartera, 
    5, -- calificación: Pérdida
    pkcalificacioncrediticiaexterna, CURRENT_DATE,
    60000, 0, 0, 0, 0,
    50000, 0, 0, 0,
    car_vig_capital, car_vig_int_compensatorio, car_vig_int_moratorio, car_vig_gastos,
    car_ven_capital, car_ven_int_compensatorio, car_ven_int_moratorio, car_ven_gastos,
    car_ref_capital, car_ref_int_compensatorio, car_ref_int_moratorio, car_ref_gastos,
    car_rep_capital, car_rep_int_compensatorio, car_rep_int_moratorio, car_rep_gastos,
    car_jud_capital, car_jud_int_compensatorio, car_jud_int_moratorio, car_jud_gastos,
    car_cas_capital, car_cas_int_compensatorio, car_cas_int_moratorio, car_cas_gastos,
    car_con_capital, car_con_int_compensatorio, car_con_int_moratorio, car_con_gastos,
    saldodiferido, saldodevengado, saldoprovisiones, 55000,
    pkagencia, pkjeferegional, pkadministrador, pkasesor, pkasesornivel, NOW()
FROM fagcuentacredito LIMIT 1;

-- Clona Castigo Aplicado (10007) - 220 días atraso, cliente 11
INSERT INTO fagcuentacredito (
    periodomes, pkcuentacredito, pksolicitud, pkestadocredito, nrocuotas, nrodias, nrodiasgracias, diafechafija,
    codtipocuota, codtipoperiodo, flaglibreamortizacion, montoaprobadocredito, montocapitaldesembolsado, montocapitalpagado,
    montointeresprogramado, montointeresalafecha, montointerespagado, montomoraprogramada, montomorapagada, montogastoprogramado, montogastopagado,
    pkproducto, pkrecurso, pksubrecurso, pkmoneda, pkmodalidad, codplazo, codlineacredito, nrotasacompensatoria, tasainterescompensatoria, nrotasamoratoria, tasainteresmoratoria,
    diasatrasocredito, fechaculminacioncredito, fechageneracioncredito, fechadesembolsocredito, tipocambiodesembolso, pkgrupocredito, flagrefinanciado, flagreestructurado, flagreprogramado,
    flagjudicial, flagcastigado, pkactividadeconomica, montosaldonormal, montosaldovencido, flagnuevorecurrente, montocostoefectivo, pktipotasacompensatoria, pktipotasamoratoria,
    pkcliente, nrocronograma, pkcondicioncontable, flagclientenuevobancoandino, flagclientenuevo, flagclientecartera, pkcalificacioncrediticiainterna, pkcalificacioncrediticiaexterna,
    fechaingresojudicial, montocapitalinicio, montointeresinicio, montomorainicio, montogastoinicio, nrodiasatrasoinicio,
    montosaldocapital, montosaldointeres, montosaldomoratorio, montosaldogasto,
    car_vig_capital, car_vig_int_compensatorio, car_vig_int_moratorio, car_vig_gastos,
    car_ven_capital, car_ven_int_compensatorio, car_ven_int_moratorio, car_ven_gastos,
    car_ref_capital, car_ref_int_compensatorio, car_ref_int_moratorio, car_ref_gastos,
    car_rep_capital, car_rep_int_compensatorio, car_rep_int_moratorio, car_rep_gastos,
    car_jud_capital, car_jud_int_compensatorio, car_jud_int_moratorio, car_jud_gastos,
    car_cas_capital, car_cas_int_compensatorio, car_cas_int_moratorio, car_cas_gastos,
    car_con_capital, car_con_int_compensatorio, car_con_int_moratorio, car_con_gastos,
    saldodiferido, saldodevengado, saldoprovisiones, montosaldocliente, pkagencia, pkjeferegional, pkadministrador, pkasesor, pkasesornivel, fecultactualizacion
)
SELECT 
    202512, 10007, 10009, pkestadocredito, 24, 720, 0, 15,
    codtipocuota, codtipoperiodo, flaglibreamortizacion, 55000, 55000, 0,
    4500, 0, 0, 0, 0, 0, 0,
    pkproducto, pkrecurso, pksubrecurso, pkmoneda, pkmoneda, '24', codlineacredito, nrotasacompensatoria, tasainterescompensatoria, nrotasamoratoria, tasainteresmoratoria,
    220, -- 220 días de atraso
    fechaculminacioncredito, fechageneracioncredito, fechadesembolsocredito, tipocambiodesembolso, pkgrupocredito, flagrefinanciado, flagreestructurado, flagreprogramado,
    'S', 'S', -- flagjudicial = S, flagcastigado = S (Castigo ya aplicado)
    pkactividadeconomica, montosaldonormal, montosaldovencido, flagnuevorecurrente, montocostoefectivo, pktipotasacompensatoria, pktipotasamoratoria,
    11, -- cliente 11
    nrocronograma, pkcondicioncontable, flagclientenuevobancoandino, flagclientenuevo, flagclientecartera, 
    5, -- calificación: Pérdida
    pkcalificacioncrediticiaexterna, CURRENT_DATE,
    55000, 0, 0, 0, 0,
    0, 0, 0, 0, -- montosaldocapital = 0 (Castigado)
    car_vig_capital, car_vig_int_compensatorio, car_vig_int_moratorio, car_vig_gastos,
    car_ven_capital, car_ven_int_compensatorio, car_ven_int_moratorio, car_ven_gastos,
    car_ref_capital, car_ref_int_compensatorio, car_ref_int_moratorio, car_ref_gastos,
    car_rep_capital, car_rep_int_compensatorio, car_rep_int_moratorio, car_rep_gastos,
    car_jud_capital, car_jud_int_compensatorio, car_jud_int_moratorio, car_jud_gastos,
    car_cas_capital, car_cas_int_compensatorio, car_cas_int_moratorio, car_cas_gastos,
    car_con_capital, car_con_int_compensatorio, car_con_int_moratorio, car_con_gastos,
    saldodiferido, saldodevengado, saldoprovisiones, 0,
    pkagencia, pkjeferegional, pkadministrador, pkasesor, pkasesornivel, NOW()
FROM fagcuentacredito LIMIT 1;


-- 5. Poblar fgestiones_cobranza con los 3 casos solicitados (Compromiso de pago, No contesta, Ilocalizable)

-- Caso A: Compromiso de Pago
INSERT INTO fgestiones_cobranza (
    id_solicitud, usuario_gestor, canal_contacto, codigo_respuesta, comentarios, fecha_compromiso_pago, monto_comprometido
) VALUES (
    10001, 'admin', 'TELEFONICO', 'COMPROMISO_PAGO', 'El cliente confirma que pagará la cuota atrasada este fin de semana.', CURRENT_DATE + INTERVAL '5 days', 1500.00
);

-- Caso B: No Contesta
INSERT INTO fgestiones_cobranza (
    id_solicitud, usuario_gestor, canal_contacto, codigo_respuesta, comentarios, fecha_compromiso_pago, monto_comprometido
) VALUES (
    10002, 'admin', 'SMS', 'NO_CONTESTA', 'Se envió SMS recordando vencimiento. No se obtuvo respuesta.', NULL, NULL
);

-- Caso C: Ilocalizable
INSERT INTO fgestiones_cobranza (
    id_solicitud, usuario_gestor, canal_contacto, codigo_respuesta, comentarios, fecha_compromiso_pago, monto_comprometido
) VALUES (
    10003, 'admin', 'VISITA_DOMICILIARIA', 'ILOCALIZABLE', 'Se visitó el domicilio registrado pero el cliente no vive más ahí según el actual inquilino.', NULL, NULL
);

-- =========================================================================
-- GENERADOR DINÁMICO DE CRONOGRAMAS FALTANTES EN FPLANPAGOMES
-- =========================================================================
CREATE OR REPLACE FUNCTION generate_missing_installments() RETURNS void AS $$
DECLARE
    rec RECORD;
    i INT;
    cuota_monto NUMERIC;
    capital_cuota NUMERIC;
    interes_cuota NUMERIC;
    saldo_cap NUMERIC;
    fecha_venc DATE;
    esta_pagada DATE;
    estado_cuota CHAR(2);
    atraso INT;
BEGIN
    FOR rec IN 
        SELECT c.pkcuentacredito, c.pksolicitud, c.nrocuotas, c.montoaprobadocredito,
               c.tasainterescompensatoria, c.pkproducto, c.pkmoneda, c.pkcliente,
               c.pkagencia, c.pkasesor, c.fechadesembolsocredito, c.diasatrasocredito,
               c.flagcastigado, c.flagjudicial, c.montosaldocapital, c.periodomes
        FROM fagcuentacredito c
        WHERE NOT EXISTS (
            SELECT 1 FROM fplanpagomes f WHERE f.pkcuentacredito = c.pkcuentacredito
        )
    LOOP
        -- Calcular cuota fija aproximada (Método Francés)
        DECLARE
            r NUMERIC := rec.tasainterescompensatoria / 12.0;
            n INT := rec.nrocuotas;
            factor NUMERIC;
        BEGIN
            IF r > 0 AND n > 0 THEN
                factor := (r * power(1 + r, n)) / (power(1 + r, n) - 1);
                cuota_monto := round(rec.montoaprobadocredito * factor, 2);
            ELSE
                cuota_monto := round(rec.montoaprobadocredito / COALESCE(NULLIF(n, 0), 1), 2);
            END IF;
        END;

        saldo_cap := rec.montoaprobadocredito;

        FOR i IN 1..rec.nrocuotas LOOP
            fecha_venc := rec.fechadesembolsocredito + (i * INTERVAL '1 month');
            
            interes_cuota := round(saldo_cap * (rec.tasainterescompensatoria / 12.0), 2);
            capital_cuota := cuota_monto - interes_cuota;
            IF capital_cuota > saldo_cap OR i = rec.nrocuotas THEN
                capital_cuota := saldo_cap;
                cuota_monto := capital_cuota + interes_cuota;
            END IF;

            saldo_cap := saldo_cap - capital_cuota;

            -- Determinar estado y pago según los días de atraso de la cuenta
            IF rec.flagcastigado = 'S' THEN
                esta_pagada := NULL;
                estado_cuota := '02';
                atraso := rec.diasatrasocredito;
            ELSIF fecha_venc < CURRENT_DATE - (rec.diasatrasocredito * INTERVAL '1 day') THEN
                esta_pagada := fecha_venc + INTERVAL '5 days';
                estado_cuota := '01';
                atraso := 0;
            ELSIF fecha_venc < CURRENT_DATE THEN
                esta_pagada := NULL;
                estado_cuota := '02';
                atraso := EXTRACT(DAY FROM (CURRENT_DATE - fecha_venc))::INT;
            ELSE
                esta_pagada := NULL;
                estado_cuota := '01';
                atraso := 0;
            END IF;

            INSERT INTO fplanpagomes (
                periodomes, pkcuentacredito, codplanpago, nrocuota, pksolicitud,
                pkestadocredito, pkproducto, pkmoneda, pkcliente, pkagencia, pkasesor,
                codestadocuota, fechavencimientopagocuota, fechapagocuota,
                montocuota, montosaldo, montomora,
                montointeresprogramado, montocapitalprogramado, montosaldocapital,
                diasatrasocuota, fecultactualizacion
            ) VALUES (
                rec.periodomes, rec.pkcuentacredito, 'P' || rec.pkcuentacredito || '-' || i, i, rec.pksolicitud,
                1, rec.pkproducto, rec.pkmoneda, rec.pkcliente, rec.pkagencia, rec.pkasesor,
                estado_cuota, fecha_venc, esta_pagada,
                cuota_monto, CASE WHEN esta_pagada IS NULL THEN cuota_monto ELSE 0.0 END, 0.0,
                interes_cuota, capital_cuota, saldo_cap,
                atraso, NOW()
            );
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT generate_missing_installments();
DROP FUNCTION generate_missing_installments();

COMMIT;
