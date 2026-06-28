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

export async function adminEvaluarSolicitud(id, payload, role = 'MAKER') {
  const { data } = await hbApi.post(`/admin/creditos/${id}/evaluar`, payload, {
    headers: { 'X-User-Role': role }
  })
  return data
}

export async function adminEnviarOtp(id, payload, role = 'CHECKER_1') {
  const { data } = await hbApi.post(`/admin/creditos/${id}/enviar-otp`, payload, {
    headers: { 'X-User-Role': role }
  })
  return data
}

export async function adminDesembolsarSolicitud(id, role = 'CHECKER_2') {
  const { data } = await hbApi.post(`/admin/creditos/${id}/desembolsar`, {}, {
    headers: { 'X-User-Role': role }
  })
  return data
}

export async function adminConfigurarParametros(payload, role = 'SUPERADMIN') {
  const { data } = await hbApi.put(`/admin/creditos/parametros`, payload, {
    headers: { 'X-User-Role': role }
  })
  return data
}

export async function adminBuscarClientes(q) {
  const { data } = await hbApi.get('/admin/clientes/buscar', { params: { q } })
  return data
}

export async function adminCrearCliente(payload) {
  const { data } = await hbApi.post('/admin/clientes/crear', payload)
  return data
}

export async function adminEjecutarEodAhorros() {
  const { data } = await hbApi.post('/admin/eod/ahorros')
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
