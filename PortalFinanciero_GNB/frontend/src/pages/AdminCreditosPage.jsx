import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FilePlus2, ArrowLeft, RefreshCw, CheckCircle, Play, FileText, CalendarDays } from 'lucide-react'
import { getAdminSolicitudes, adminSolicitarCredito, adminEvaluarSolicitud, adminDesembolsarSolicitud, adminBuscarClientes, adminCrearCliente } from '../services/adminService.js'
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
    codtipocredito: 'FACIL',
    codactividadeconomica: '0111',
    montoingresoneto: '',
    con_seguro: true,
    tipo_desgravamen: 'estandar',
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
        con_seguro: form.tipo_desgravamen !== 'ninguno',
        tipo_desgravamen: form.tipo_desgravamen === 'ninguno' ? 'estandar' : form.tipo_desgravamen,
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
                  <label htmlFor="tipo">Producto de Crédito *</label>
                  <select id="tipo" className="hb-select" value={form.codtipocredito} onChange={setF('codtipocredito')}>
                    <option value="FACIL">Préstamo Fácil (Desde 8.99%)</option>
                    <option value="LIBRE">Libre Disponibilidad (Desde 10.50%)</option>
                    <option value="ESTANDAR">Personal Estándar (Desde 13.00%)</option>
                    <option value="CONVENIO">Por Convenio (Desde 15.00%)</option>
                    <option value="YAPE">Billetera Digital (Desde 29.00%)</option>
                    <option value="ME">Microempresa</option>
                    <option value="CO">Consumo General</option>
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

              <div className="hb-field" style={{ marginTop: 10 }}>
                <label htmlFor="desgravamen">Seguro de Desgravamen *</label>
                <select id="desgravamen" className="hb-select" value={form.tipo_desgravamen} onChange={setF('tipo_desgravamen')}>
                  <option value="estandar">Individual (0.0738% mensual)</option>
                  <option value="rescate">Con Rescate (0.175% mensual)</option>
                  <option value="ninguno">Sin Seguro (Sujeto a evaluación)</option>
                </select>
              </div>

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

  const handleEvaluar = async (id) => {
    try {
      setEvaluando(id)
      const res = await adminEvaluarSolicitud(id)
      setCronograma({ id, cuotas: res.cronograma, total: res.monto_total })
      cargar()
    } catch (e) {
      alert('Error evaluando: ' + (e.response?.data?.detail || e.message))
    } finally {
      setEvaluando(null)
    }
  }

  const handleDesembolsar = async (id) => {
    if (!confirm('¿Seguro de desembolsar esta solicitud? Se abonará el monto a la cuenta de ahorros.')) return
    try {
      setLoading(true)
      await adminDesembolsarSolicitud(id)
      alert('Desembolso exitoso')
      cargar()
    } catch (e) {
      alert('Error desembolsando: ' + (e.response?.data?.detail || e.message))
    } finally {
      setLoading(false)
    }
  }

  const cols = [
    { key: 'codsolicitud', header: 'Solicitud' },
    { key: 'nomcliente', header: 'Cliente' },
    { key: 'monto', header: 'Monto', align: 'right', render: (s) => <Money value={s.monto} /> },
    { key: 'plazo', header: 'Plazo', align: 'center', render: (s) => `${s.plazo}m` },
    { key: 'estado', header: 'Estado', render: (s) => <Badge estado={s.estado} /> },
    { key: 'evaluacion', header: 'Evaluación (Scoring/RDS)', render: (s) => {
      if (!s.desmotivosolicitud) return '-';
      try {
        const ev = JSON.parse(s.desmotivosolicitud);
        const colorRDS = ev.semaforo_rds === 'Rojo' ? 'red' : (ev.semaforo_rds === 'Amarillo' ? 'amber' : 'green');
        const colorScore = ev.aprobado_scoring ? 'green' : 'red';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
            <div><Badge estado={`PD: ${ev.score_pd_porcentaje}%`} tone={colorScore} /></div>
            <div><Badge estado={`RDS: ${ev.rds_porcentaje}%`} tone={colorRDS} /></div>
          </div>
        );
      } catch (e) {
        return <span style={{ fontSize: '0.8rem' }}>{s.desmotivosolicitud}</span>;
      }
    }},
    { key: 'acciones', header: 'Acciones', render: (s) => (
      <div style={{ display: 'flex', gap: '8px' }}>
        {s.pksolicitudestado === 1 && (
          <button className="bbva-btn-ghost" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => handleEvaluar(s.id)} disabled={evaluando === s.id}>
            <Play size={14} /> Evaluar
          </button>
        )}
        {s.pksolicitudestado === 2 && (
          <button className="bbva-btn" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => handleDesembolsar(s.id)}>
            <CheckCircle size={14} /> Desembolsar
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
    </PageLayout>
  )
}
