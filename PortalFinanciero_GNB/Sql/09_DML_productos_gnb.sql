-- ============================================================
-- BANCO GNB PERÚ - ACTUALIZACIÓN DE PRODUCTOS PASIVOS (AHORROS)
-- NO TRUNCAMOS PARA NO BORRAR FCUENTAAHORRO
-- ============================================================

BEGIN;

-- 1. Actualizamos "Ahorro Básico" a "Cuenta de Ahorro Tradicional"
UPDATE DPRODUCTOAHORRO 
SET DESTIPOPRODUCTO = 'Banca Personas', DESTIPOSUBPRODUCTO = 'Cuenta de Ahorro Tradicional', DESCARACTERISTICA = 'Interés escalonado mensual (1.00% - 2.50% MN)'
WHERE CODTIPOSUBPRODUCTO = '01' AND CODTIPOPRODUCTO = 'AC';

-- 2. Actualizamos "Ahorro Plus" a "Cuenta de Ahorro Rolando" (Estrella)
UPDATE DPRODUCTOAHORRO 
SET DESTIPOPRODUCTO = 'Banca Personas', DESTIPOSUBPRODUCTO = 'Cuenta de Ahorro Rolando', DESCARACTERISTICA = 'Estrella. Capitalización diaria (4.50% MN / 1.00% ME)'
WHERE CODTIPOSUBPRODUCTO = '02' AND CODTIPOPRODUCTO = 'AC';

-- 3. Actualizamos "Cuenta Sueldo"
UPDATE DPRODUCTOAHORRO 
SET DESTIPOPRODUCTO = 'Banca Personas', DESTIPOSUBPRODUCTO = 'Cuenta Sueldo', DESCARACTERISTICA = 'Sin comisiones, para abono de haberes'
WHERE CODTIPOSUBPRODUCTO = '03' AND CODTIPOPRODUCTO = 'AC';

-- 4. Actualizamos "Cuenta Mujer Emprendedora" a "Cuenta Corriente"
UPDATE DPRODUCTOAHORRO 
SET DESTIPOPRODUCTO = 'Banca Personas', DESTIPOSUBPRODUCTO = 'Cuenta Corriente', DESCARACTERISTICA = 'Transaccional sin interés. Mantenimiento por saldo bajo'
WHERE CODTIPOSUBPRODUCTO = '04' AND CODTIPOPRODUCTO = 'AC';

-- 5. Añadimos los productos corporativos y el resto
INSERT INTO DPRODUCTOAHORRO (CODTIPOPRODUCTO, CODTIPOSUBPRODUCTO, CODCARACTERISTICA, DESTIPOPRODUCTO, DESTIPOSUBPRODUCTO, DESCARACTERISTICA) VALUES
('CT','01','01','Banca Personas','Cuenta CTS','Obligatoria por ley, tasas altas hasta 5.50%'),
('AC','05','01','Banca Personas','Cuenta Experiencia','Para jubilados, retiros ilimitados'),
('AP','01','01','Banca Personas','Cuenta Ahorro Hipotecario','Para calificar a crédito inmobiliario'),
('AC','06','01','Banca Personas','Cuenta Transaccional','Saldo cero, para desembolso y cobro automático'),
('EM','01','01','Banca Empresas','Cuenta Corriente Empresas','Flujo de caja corporativo, sin interés'),
('EM','02','01','Banca Empresas','Cuenta de Ahorros Empresas','Genera intereses para liquidez de la empresa'),
('EM','03','01','Banca Empresas','Cuenta Mix','Chequeras y transferencias, gana interés por flujo diario'),
('EM','04','01','Banca Empresas','Cuenta Empresarial Remunerada','Interés preferencial para saldos > S/10k o US$50k')
ON CONFLICT DO NOTHING;

COMMIT;
