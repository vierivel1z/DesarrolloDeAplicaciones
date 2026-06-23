import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FilePlus2, ArrowLeft, RefreshCw, CheckCircle, Play, FileText, CalendarDays } from 'lucide-react'
import { 
  getAdminSolicitudes, 
  adminSolicitarCredito, 
  adminEvaluarSolicitud, 
  adminDesembolsarSolicitud, 
  adminBuscarClientes, 
  adminCrearCliente,
  getAdminSolicitudDetalle,
  adminRechazarSolicitud
} from '../services/adminService.js'
import { toNumber, formatDate } from '../utils/format.js'
import PageLayout from '../components/layout/PageLayout.jsx'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import Alert from '../components/ui/Alert.jsx'
import Money from '../components/ui/Money.jsx'
import Loader from '../components/ui/Loader.jsx'
import Tabla from '../components/ui/Tabla.jsx'

const ACTIVIDADES = [
  { cod: '0111', label: '0111 — Cultivo de cereales (excepto arroz)' },
  { cod: '4711', label: '4711 — Comercio minorista (bodega/abarrotes)' },
  { cod: '4771', label: '4771 — Comercio minorista de prendas de vestir' },
  { cod: '4520', label: '4520 — Mantenimiento y reparación de vehículos' },
  { cod: '5610', label: '5610 — Restaurantes y servicio de comidas' },
  { cod: '4100', label: '4100 — Construcción de edificios' },
  { cod: '4923', label: '4923 — Transporte de carga por carretera' },
  { cod: '9601', label: '9601 — Lavado y limpieza de prendas' },
]

export default function AdminCreditosPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const action = searchParams.get('action')

  if (action === 'solicitar') {
    return <AdminSolicitarCreditoForm />
  }

  return <AdminCreditosList />
}

function AdminSolicitarCreditoForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const pkclienteParam = searchParams.get('pkcliente')
  const nombreClienteParam = searchParams.get('nombre')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [validacion, setValidacion] = useState(null)
  const [result, setResult] = useState(null)

  // Mode: 'existente' or 'nuevo'. Defaults to 'existente'
  const [clientMode, setClientMode] = useState('existente')
  
  // Selected client details
  const [selectedClient, setSelectedClient] = useState(
    pkclienteParam ? { pkcliente: parseInt(pkclienteParam, 10), nombre: nombreClienteParam } : null
  )

  // Client search states
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  // New client form state
  const [clientForm, setClientForm] = useState({
    nomcliente: '',
    numerodocumentoidentidad: '',
    email: '',
    numerotelefonopersonal: '',
    montoingresoneto: '',
    codactividadeconomica: '4711',
    codubigeo: '120101',
  })

  const [form, setForm] = useState({
    montosolicitud: '',
    plazo: '',
    codtipocredito: 'CO',
    codactividadeconomica: '0111',
    montoingresoneto: '',
    con_seguro: true,
    fecha_desembolso: new Date().toISOString().split('T')[0],
    dia_pago: 1,
  })

  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const setCF = (k) => (e) => setClientForm((cf) => ({ ...cf, [k]: e.target.value }))

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    try {
      setSearching(true)
      setError(null)
      const data = await adminBuscarClientes(searchQuery.trim())
      setSearchResults(data)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Error al buscar clientes')
    } finally {
      setSearching(false)
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setValidacion(null)
    setError(null)

    // Validate credit request inputs
    const monto = toNumber(form.montosolicitud)
    const plazo = parseInt(form.plazo, 10)
    const ingreso = toNumber(form.montoingresoneto)
    const dia_pago = parseInt(form.dia_pago, 10)

    if (monto <= 0) { setValidacion('Ingrese un monto de solicitud válido.'); return }
    if (!plazo || plazo <= 0) { setValidacion('Ingrese un plazo (número de cuotas) válido.'); return }
    if (ingreso <= 0) { setValidacion('Ingrese su ingreso neto mensual.'); return }
    if (!form.codactividadeconomica) { setValidacion('Seleccione una actividad económica.'); return }
    if (!dia_pago || dia_pago < 1 || dia_pago > 31) { setValidacion('Día de pago inválido (1-31).'); return }

    // If existing client mode, check that a client was selected
    if (clientMode === 'existente' && !selectedClient) {
      setValidacion('Debe buscar y seleccionar un cliente existente.');
      return
    }

    // If new client mode, validate client details
    if (clientMode === 'nuevo') {
      if (!clientForm.nomcliente.trim()) { setValidacion('Ingrese el nombre completo del nuevo cliente.'); return }
      if (!clientForm.numerodocumentoidentidad.trim() || clientForm.numerodocumentoidentidad.length < 8 || clientForm.numerodocumentoidentidad.length > 12) {
        setValidacion('Ingrese un documento de identidad válido (8-12 caracteres).'); return
      }
      if (!clientForm.email.trim()) { setValidacion('Ingrese el email del nuevo cliente.'); return }
      if (!clientForm.numerotelefonopersonal.trim()) { setValidacion('Ingrese el teléfono del nuevo cliente.'); return }
      const clientIngreso = toNumber(clientForm.montoingresoneto)
      if (clientIngreso <= 0) { setValidacion('Ingrese un ingreso mensual válido para el cliente.'); return }
    }

    try {
      setLoading(true)
      let targetPkCliente = null

      if (clientMode === 'nuevo') {
        // Create the new client first
        const newClientData = await adminCrearCliente({
          nomcliente: clientForm.nomcliente,
          numerodocumentoidentidad: clientForm.numerodocumentoidentidad,
          email: clientForm.email,
          numerotelefonopersonal: clientForm.numerotelefonopersonal,
          montoingresoneto: toNumber(clientForm.montoingresoneto),
          codactividadeconomica: clientForm.codactividadeconomica,
          codubigeo: clientForm.codubigeo,
        })
        targetPkCliente = newClientData.pkcliente
      } else {
        targetPkCliente = selectedClient.pkcliente
      }

      // Now create the credit application
      const data = await adminSolicitarCredito({
        pkcliente: targetPkCliente,
        montosolicitud: monto,
        plazo,
        codtipocredito: form.codtipocredito,
        codactividadeconomica: form.codactividadeconomica,
        montoingresoneto: ingreso,
        con_seguro: form.con_seguro,
        fecha_desembolso: form.fecha_desembolso,
        dia_pago
      })
      setResult(data)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Error al procesar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout>
      <button className="hb-back" onClick={() => navigate(pkclienteParam ? '/admin/clientes' : '/admin/creditos')}>
        <ArrowLeft size={16} /> Volver a {pkclienteParam ? 'Clientes' : 'Solicitudes'}
      </button>
      <h1 className="bbva-page-title">Registrar Crédito (Admin)</h1>
      <p className="bbva-page-sub">
        {selectedClient ? `Cliente: ${selectedClient.nombre}` : 'Crear solicitud para un cliente nuevo o existente'}
      </p>

      {result ? (
        <Card>
          <div className="hb-comprobante">
            <h3>Solicitud registrada</h3>
            <p>Se ha registrado la solicitud {result.codsolicitud}</p>
          </div>
          <div className="bbva-form-actions" style={{ marginTop: 20 }}>
            <button className="bbva-btn" onClick={() => navigate('/admin/creditos')}>Ir a Solicitudes</button>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card de selección/creación de cliente (solo si no viene pre-seleccionado en URL) */}
          {!pkclienteParam && (
            <Card title="Selección de Cliente" icon={<ArrowLeft style={{ transform: 'rotate(90deg)' }} size={18} />}>
              <div className="admin-filter-btns" style={{ marginBottom: 20 }}>
                <button
                  type="button"
                  className={`admin-filter-btn ${clientMode === 'existente' ? 'active' : ''}`}
                  onClick={() => {
                    setClientMode('existente')
                    setSearchResults([])
                    setSearchQuery('')
                    setSelectedClient(null)
                  }}
                >
                  Cliente Existente
                </button>
                <button
                  type="button"
                  className={`admin-filter-btn ${clientMode === 'nuevo' ? 'active' : ''}`}
                  onClick={() => {
                    setClientMode('nuevo')
                    setSelectedClient(null)
                  }}
                >
                  Nuevo Cliente
                </button>
              </div>

              {clientMode === 'existente' ? (
                <div>
                  {selectedClient ? (
                    <div className="hb-alert hb-alert-success" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0 }}>
                      <div>
                        <strong>Cliente seleccionado:</strong> {selectedClient.nombre} (<code>{selectedClient.codcliente}</code>)
                      </div>
                      <button type="button" className="bbva-btn-ghost sm" onClick={() => setSelectedClient(null)}>
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <div>
                      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                        <input
                          type="text"
                          className="hb-input"
                          placeholder="Buscar por código, nombre o documento..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit" className="bbva-btn" disabled={searching}>
                          {searching ? 'Buscando...' : 'Buscar'}
                        </button>
                      </form>

                      {searchResults.length > 0 && (
                        <div style={{ maxHeight: 250, overflowY: 'auto', border: '1px solid var(--hb-border)', borderRadius: '9px' }}>
                          <table className="hb-table" style={{ fontSize: '13.5px' }}>
                            <thead>
                              <tr>
                                <th>Código</th>
                                <th>Nombre</th>
                                <th>Documento</th>
                                <th style={{ textAlign: 'right' }}>Acción</th>
                              </tr>
                            </thead>
                            <tbody>
                              {searchResults.map((c) => (
                                <tr key={c.pkcliente}>
                                  <td><code>{c.codcliente}</code></td>
                                  <td style={{ fontWeight: 600 }}>{c.nombre}</td>
                                  <td>{c.nro_documento}</td>
                                  <td style={{ textAlign: 'right' }}>
                                    <button
                                      type="button"
                                      className="bbva-btn-ghost sm"
                                      style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                      onClick={() => {
                                        setSelectedClient(c)
                                        setForm((prev) => ({ ...prev, montoingresoneto: prev.montoingresoneto || c.montoingresoneto || '' }))
                                      }}
                                    >
                                      Seleccionar
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {searchQuery && searchResults.length === 0 && !searching && (
                        <p className="bbva-empty" style={{ margin: '10px 0' }}>No se encontraron resultados.</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="hb-grid-2">
                    <div className="hb-field">
                      <label htmlFor="new_nom">Nombre completo (ej. Pérez, Juan) *</label>
                      <input id="new_nom" className="hb-input" type="text" value={clientForm.nomcliente} onChange={setCF('nomcliente')} placeholder="Apellidos, Nombres" />
                    </div>
                    <div className="hb-field">
                      <label htmlFor="new_doc">Documento Identidad (DNI/RUC) *</label>
                      <input id="new_doc" className="hb-input" type="text" value={clientForm.numerodocumentoidentidad} onChange={setCF('numerodocumentoidentidad')} placeholder="8 a 12 dígitos" />
                    </div>
                  </div>

                  <div className="hb-grid-2">
                    <div className="hb-field">
                      <label htmlFor="new_email">Email *</label>
                      <input id="new_email" className="hb-input" type="email" value={clientForm.email} onChange={setCF('email')} placeholder="correo@ejemplo.com" />
                    </div>
                    <div className="hb-field">
                      <label htmlFor="new_tel">Teléfono Celular *</label>
                      <input id="new_tel" className="hb-input" type="text" value={clientForm.numerotelefonopersonal} onChange={setCF('numerotelefonopersonal')} placeholder="987654321" />
                    </div>
                  </div>

                  <div className="hb-grid-2">
                    <div className="hb-field">
                      <label htmlFor="new_ingreso">Ingreso Neto Mensual (S/) *</label>
                      <input 
                        id="new_ingreso" 
                        className="hb-input" 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        value={clientForm.montoingresoneto} 
                        onChange={(e) => {
                          setCF('montoingresoneto')(e)
                          setForm(f => ({ ...f, montoingresoneto: e.target.value }))
                        }} 
                      />
                    </div>
                    <div className="hb-field">
                      <label htmlFor="new_actividad">Actividad (CIIU)</label>
                      <select id="new_actividad" className="hb-select" value={clientForm.codactividadeconomica} onChange={setCF('codactividadeconomica')}>
                        {ACTIVIDADES.map((a) => <option key={a.cod} value={a.cod}>{a.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          <Card title="Datos de la Solicitud de Crédito" icon={<FilePlus2 size={18} />}>
            {error && <Alert tipo="error">{error}</Alert>}
            {validacion && <Alert tipo="warn">{validacion}</Alert>}

            <form onSubmit={onSubmit}>
              <div className="hb-grid-2">
                <div className="hb-field">
                  <label htmlFor="monto">Monto Solicitado (S/) *</label>
                  <input id="monto" className="hb-input" type="number" min="1" step="0.01" value={form.montosolicitud} onChange={setF('montosolicitud')} placeholder="0.00" />
                </div>
                <div className="hb-field">
                  <label htmlFor="plazo">Plazo (meses) *</label>
                  <input id="plazo" className="hb-input" type="number" min="1" step="1" value={form.plazo} onChange={setF('plazo')} placeholder="Ej. 12" />
                </div>
              </div>

              <div className="hb-grid-2">
                <div className="hb-field">
                  <label htmlFor="tipo">Tipo de Crédito *</label>
                  <select id="tipo" className="hb-select" value={form.codtipocredito} onChange={setF('codtipocredito')}>
                    <option value="CO">Consumo</option>
                    <option value="ME">Microempresa</option>
                  </select>
                </div>
                <div className="hb-field">
                  <label htmlFor="ingreso">Ingreso Neto Evaluado (S/) *</label>
                  <input 
                    id="ingreso" 
                    className="hb-input" 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    value={form.montoingresoneto} 
                    onChange={setF('montoingresoneto')} 
                    placeholder="0.00" 
                    disabled={clientMode === 'nuevo'} // Autocompletado del nuevo cliente
                  />
                </div>
              </div>

              <div className="hb-field">
                <label htmlFor="actividad">Actividad Económica *</label>
                <select id="actividad" className="hb-select" value={form.codactividadeconomica} onChange={setF('codactividadeconomica')}>
                  {ACTIVIDADES.map((a) => <option key={a.cod} value={a.cod}>{a.label}</option>)}
                </select>
              </div>

              <div className="hb-grid-2">
                <div className="hb-field">
                  <label htmlFor="fecha">Fecha Desembolso *</label>
                  <input id="fecha" className="hb-input" type="date" value={form.fecha_desembolso} onChange={setF('fecha_desembolso')} />
                </div>
                <div className="hb-field">
                  <label htmlFor="dia_pago">Día de Pago (1-31) *</label>
                  <input id="dia_pago" className="hb-input" type="number" min="1" max="31" value={form.dia_pago} onChange={setF('dia_pago')} />
                </div>
              </div>

              <div className="hb-field" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
                <input id="seguro" type="checkbox" checked={form.con_seguro} onChange={setF('con_seguro')} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                <label htmlFor="seguro" style={{ margin: 0, cursor: 'pointer' }}>Incluye Seguro de Desgravamen (TEA 40.92%)</label>
              </div>
              {!form.con_seguro && <p style={{ fontSize: '0.8rem', color: 'var(--hb-text-muted)', marginTop: -6, marginLeft: 28 }}>Sin seguro, la TEA será de 43.92%</p>}

              <button type="submit" className="bbva-btn" disabled={loading} style={{ marginTop: 20, width: '100%' }}>
                <FilePlus2 size={18} /> {loading ? 'Procesando...' : 'Enviar Solicitud'}
              </button>
            </form>
          </Card>
        </div>
      )}
    </PageLayout>
  )
}

function AdminCreditosList() {
  const navigate = useNavigate()
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cronograma, setCronograma] = useState(null)
  const [evaluando, setEvaluando] = useState(null)

  // Modal / Detail states
  const [selectedDetalle, setSelectedDetalle] = useState(null)
  const [detalleLoading, setDetalleLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [rechazando, setRechazando] = useState(false)
  const [desembolsando, setDesembolsando] = useState(false)

  const cargar = () => {
    setLoading(true)
    getAdminSolicitudes()
      .then(setSolicitudes)
      .catch((e) => setError('Error al cargar solicitudes'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargar()
  }, [])

  const handleVerDetalle = async (id) => {
    try {
      setDetalleLoading(true)
      const data = await getAdminSolicitudDetalle(id)
      setSelectedDetalle(data)
      setModalOpen(true)
    } catch (e) {
      alert('Error al cargar el detalle de la solicitud: ' + (e.response?.data?.detail || e.message))
    } finally {
      setDetalleLoading(false)
    }
  }

  const handleAprobarDesdeModal = async (id) => {
    try {
      setEvaluando(id)
      const res = await adminEvaluarSolicitud(id)
      setCronograma({ id, cuotas: res.cronograma, total: res.monto_total })
      setModalOpen(false)
      cargar()
    } catch (e) {
      alert('Error evaluando: ' + (e.response?.data?.detail || e.message))
    } finally {
      setEvaluando(null)
    }
  }

  const handleRechazarDesdeModal = async (id) => {
    if (!confirm('¿Seguro de rechazar esta solicitud de crédito?')) return
    try {
      setRechazando(true)
      await adminRechazarSolicitud(id)
      alert('Solicitud rechazada exitosamente')
      setModalOpen(false)
      cargar()
    } catch (e) {
      alert('Error rechazando: ' + (e.response?.data?.detail || e.message))
    } finally {
      setRechazando(false)
    }
  }

  const handleDesembolsarDesdeModal = async (id) => {
    if (!confirm('¿Seguro de desembolsar esta solicitud? Se abonará el monto a la cuenta de ahorros del cliente.')) return
    try {
      setDesembolsando(true)
      await adminDesembolsarSolicitud(id)
      alert('Desembolso exitoso')
      setModalOpen(false)
      cargar()
    } catch (e) {
      alert('Error desembolsando: ' + (e.response?.data?.detail || e.message))
    } finally {
      setDesembolsando(false)
    }
  }

  const cols = [
    { key: 'codsolicitud', header: 'Solicitud' },
    { key: 'nomcliente', header: 'Cliente' },
    { key: 'monto', header: 'Monto', align: 'right', render: (s) => <Money value={s.monto} /> },
    { key: 'plazo', header: 'Plazo', align: 'center', render: (s) => `${s.plazo}m` },
    { key: 'estado', header: 'Estado', render: (s) => <Badge estado={s.estado} /> },
    { key: 'acciones', header: 'Acciones', render: (s) => (
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          className="bbva-btn-ghost" 
          style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }} 
          onClick={() => handleVerDetalle(s.id)}
          disabled={detalleLoading}
        >
          <Play size={12} /> Evaluar / Ver
        </button>
        {s.pksolicitudestado === 2 && (
          <button 
            className="bbva-btn" 
            style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }} 
            onClick={() => handleDesembolsarDesdeModal(s.id)}
            disabled={desembolsando}
          >
            <CheckCircle size={12} /> Desembolsar
          </button>
        )}
      </div>
    )},
  ]

  const cronoCols = [
    { key: 'nro', header: 'N°', render: (c) => c.nrocuota },
    { key: 'fecha', header: 'Vencimiento', render: (c) => formatDate(c.fecha_vencimiento) },
    { key: 'cuota', header: 'Cuota', align: 'right', render: (c) => <Money value={c.monto_cuota} /> },
    { key: 'capital', header: 'Capital', align: 'right', render: (c) => <Money value={c.capital} /> },
    { key: 'interes', header: 'Interés', align: 'right', render: (c) => <Money value={c.interes} /> },
    { key: 'saldo', header: 'Saldo Cap', align: 'right', render: (c) => <Money value={c.saldo_capital} /> },
  ]

  return (
    <PageLayout>
      <div className="bbva-page-head">
        <div>
          <h1 className="bbva-page-title">Gestión de Créditos</h1>
          <p className="bbva-page-sub">Listado y evaluación de solicitudes</p>
        </div>
        <div className="bbva-page-actions" style={{ display: 'flex', gap: '8px' }}>
          <button className="bbva-btn" onClick={() => navigate('/admin/creditos?action=solicitar')}>
            <FilePlus2 size={14} /> Registrar Solicitud
          </button>
          <button className="bbva-btn-ghost" onClick={cargar} disabled={loading}><RefreshCw size={14} /> Actualizar</button>
        </div>
      </div>

      <Card>
        {error && <Alert tipo="error">{error}</Alert>}
        {loading && solicitudes.length === 0 ? <Loader text="Cargando solicitudes..." /> : (
          <Tabla columns={cols} rows={solicitudes} rowKey={(row) => row.id} emptyText="No hay solicitudes" />
        )}
      </Card>

      {cronograma && (
        <Card title={`Cronograma Generado (Solicitud ID ${cronograma.id})`} icon={<CalendarDays size={18} />} style={{ marginTop: '20px' }}>
          <Tabla columns={cronoCols} rows={cronograma.cuotas} rowKey={(row) => row.nrocuota} />
        </Card>
      )}

      {/* Modal de Detalle y Scoring */}
      <SolicitudDetalleModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        detalle={selectedDetalle}
        onAprobar={handleAprobarDesdeModal}
        onRechazar={handleRechazarDesdeModal}
        onDesembolsar={handleDesembolsarDesdeModal}
        evaluando={evaluando !== null}
        rechazando={rechazando}
        desembolsando={desembolsando}
      />
    </PageLayout>
  )
}

function SolicitudDetalleModal({ isOpen, onClose, detalle, onAprobar, onRechazar, onDesembolsar, evaluando, rechazando, desembolsando }) {
  if (!isOpen || !detalle) return null;

  const { solicitud, cliente, finanzas, scoring } = detalle;

  const getSbsColor = (code) => {
    if (code === '0') return '#73b71c'; // Normal -> verde
    if (code === '1') return '#ff9800'; // CPP -> naranja
    return '#f44336'; // Deficiente/Dudoso/Pérdida -> rojo
  };

  const scorePercentage = Math.max(0, Math.min(100, ((scoring.score - 300) / 550) * 100));

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(7, 33, 70, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1100,
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        width: '100%',
        maxWidth: '850px',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#072146',
          color: '#ffffff',
          borderTopLeftRadius: '15px',
          borderTopRightRadius: '15px',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
              Evaluación de Crédito: {solicitud.codsolicitud}
            </h2>
            <span style={{ fontSize: '0.85rem', opacity: 0.85 }}>
              Cliente: {cliente.nombre}
            </span>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '1.5rem',
              lineHeight: 1,
              padding: 0,
            }}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Fila superior: Perfil Cliente & Detalles de Solicitud */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '20px',
          }}>
            {/* Perfil del Cliente */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px',
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#072146', borderBottom: '2px solid #004481', paddingBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                👤 Perfil del Cliente
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                <div><strong>Código de Cliente:</strong> <code style={{ color: '#004481' }}>{cliente.codcliente}</code></div>
                <div><strong>Documento (DNI/RUC):</strong> {cliente.nro_documento}</div>
                <div><strong>Correo Electrónico:</strong> {cliente.email}</div>
                <div><strong>Teléfono Celular:</strong> {cliente.telefono}</div>
                <div><strong>Ingreso Neto Mensual:</strong> <span style={{ fontWeight: 600, color: '#73b71c' }}>S/ {toNumber(cliente.montoingresoneto).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span></div>
                <div><strong>Actividad Económica:</strong> {cliente.actividad_desc}</div>
              </div>
            </div>

            {/* Detalles de la Solicitud */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px',
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#072146', borderBottom: '2px solid #004481', paddingBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📄 Solicitud de Crédito
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                <div><strong>Tipo de Producto:</strong> {solicitud.producto_tipo}</div>
                <div><strong>Subtipo:</strong> {solicitud.producto_subtipo}</div>
                <div><strong>Monto Solicitado:</strong> <span style={{ fontWeight: 600, color: '#004481' }}>S/ {toNumber(solicitud.monto).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span></div>
                <div><strong>Plazo del Crédito:</strong> {solicitud.plazo} meses</div>
                <div><strong>Tasa de Interés (TEA):</strong> {(toNumber(solicitud.tea) * 100).toFixed(2)}%</div>
                <div><strong>Día de Pago Fijo:</strong> Día {solicitud.dia_pago}</div>
                <div><strong>Fecha Desembolso Planificada:</strong> {solicitud.fecha_desembolso ? formatDate(solicitud.fecha_desembolso) : 'Inmediato'}</div>
              </div>
            </div>
          </div>

          {/* Fila del medio: Financiero & Scoring */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '20px',
          }}>
            {/* Financiero */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px',
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#072146', borderBottom: '2px solid #004481', paddingBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📊 Balance y Riesgo del Cliente
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '6px' }}>
                  <span>Ahorros Totales:</span>
                  <span style={{ fontWeight: 600, color: '#2e7d32' }}>S/ {finanzas.ahorros_total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '6px' }}>
                  <span>Deuda Vigente en el Banco:</span>
                  <span style={{ fontWeight: 600, color: '#c62828' }}>S/ {finanzas.deuda_total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                  <span>Calificación SBS:</span>
                  <span style={{
                    fontWeight: 600,
                    color: '#ffffff',
                    backgroundColor: getSbsColor(finanzas.calificacion_code),
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                  }}>
                    {finanzas.calificacion_sbs}
                  </span>
                </div>
              </div>
            </div>

            {/* Scoring */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#072146', borderBottom: '2px solid #004481', paddingBottom: '4px' }}>
                🎯 Risk Scoring Evaluado
              </h3>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                {/* Score Circular Gauge */}
                <div style={{
                  position: 'relative',
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: `conic-gradient(${scoring.color_evaluacion === 'green' ? '#73b71c' : '#e53935'} ${scorePercentage * 3.6}deg, #e2e8f0 0deg)`,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <div style={{
                    position: 'absolute',
                    width: '74px',
                    height: '74px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#072146', lineHeight: 1 }}>
                      {scoring.score}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>pts</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem', flex: 1 }}>
                  <div><strong>Score Obtenido:</strong> {scoring.score} puntos</div>
                  <div><strong>Mínimo Requerido:</strong> {scoring.score_requerido} puntos</div>
                  <div style={{
                    marginTop: '6px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    backgroundColor: scoring.aprobado_por_score ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${scoring.aprobado_por_score ? '#bbf7d0' : '#fecaca'}`,
                    color: scoring.aprobado_por_score ? '#15803d' : '#b91c1c',
                    fontWeight: 600,
                    textAlign: 'center',
                    fontSize: '0.8rem'
                  }}>
                    {scoring.aprobado_por_score ? '✅ SCORE APTO' : '❌ SCORE INSUFICIENTE'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Banner de dictamen */}
          <div style={{
            backgroundColor: scoring.aprobado_por_score ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${scoring.aprobado_por_score ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <span style={{ fontSize: '1.75rem' }}>
              {scoring.aprobado_por_score ? '🛡️' : '⚠️'}
            </span>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: scoring.aprobado_por_score ? '#166534' : '#991b1b', fontWeight: 600 }}>
                {scoring.evaluacion_sugerida}
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>
                {scoring.aprobado_por_score 
                  ? 'El cliente posee una solvencia crediticia y score por encima del mínimo requerido para este subproducto.'
                  : 'Se recomienda el rechazo automático de la solicitud de crédito debido a un score crediticio desfavorable para mitigar el riesgo de mora.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          backgroundColor: '#f8fafc',
          borderBottomLeftRadius: '15px',
          borderBottomRightRadius: '15px',
        }}>
          <div>
            <button 
              className="bbva-btn-ghost" 
              onClick={onClose}
              style={{ padding: '8px 16px' }}
            >
              Cerrar
            </button>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {solicitud.pksolicitudestado === 1 && (
              <>
                <button 
                  onClick={() => onRechazar(solicitud.id)}
                  disabled={rechazando || evaluando}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '9px',
                    border: '1px solid #ef4444',
                    backgroundColor: '#ffffff',
                    color: '#ef4444',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {rechazando ? 'Rechazando...' : 'Rechazar Solicitud'}
                </button>
                <button 
                  onClick={() => onAprobar(solicitud.id)}
                  disabled={evaluando || rechazando}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '9px',
                    border: 'none',
                    backgroundColor: scoring.aprobado_por_score ? '#73b71c' : '#64748b',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {evaluando ? 'Aprobando...' : 'Aprobar Solicitud'}
                </button>
              </>
            )}
            {solicitud.pksolicitudestado === 2 && (
              <button 
                onClick={() => onDesembolsar(solicitud.id)}
                disabled={desembolsando}
                style={{
                  padding: '8px 16px',
                  borderRadius: '9px',
                  border: 'none',
                  backgroundColor: '#004481',
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {desembolsando ? 'Procesando...' : 'Desembolsar Crédito'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
