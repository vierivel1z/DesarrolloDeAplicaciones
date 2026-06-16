import hbApi from './hb_api.js'

/**
 * Servicio de administración.
 * Todos los endpoints requieren un token JWT con tipo === 'admin'.
 */

/** KPIs globales, distribución de productos, cartera SBS y grupos de mora. */
export async function getAdminStats() {
  const { data } = await hbApi.get('/admin/stats')
  return data
}

/** Listado de todos los clientes del banco con conteo de productos. */
export async function getAdminClientes() {
  const { data } = await hbApi.get('/admin/clientes')
  return data
}
export async function getAdminSolicitudes() {
  const { data } = await hbApi.get('/admin/solicitudes')
  return data
}

export async function adminSolicitarCredito(payload) {
  const { data } = await hbApi.post('/admin/creditos/solicitar', payload)
  return data
}

export async function adminEvaluarSolicitud(id) {
  const { data } = await hbApi.post(`/admin/solicitudes/${id}/evaluar`)
  return data
}

export async function adminDesembolsarSolicitud(id) {
  const { data } = await hbApi.post(`/admin/solicitudes/${id}/desembolsar`)
  return data
}

// ── Power BI flat exports ────────────────────────────────────────────────────

export async function getPbClientes() {
  const { data } = await hbApi.get('/admin/powerbi/clientes')
  return data
}

export async function getPbAhorros() {
  const { data } = await hbApi.get('/admin/powerbi/ahorros')
  return data
}

export async function getPbCreditos() {
  const { data } = await hbApi.get('/admin/powerbi/creditos')
  return data
}

export async function getPbOperaciones() {
  const { data } = await hbApi.get('/admin/powerbi/operaciones')
  return data
}
