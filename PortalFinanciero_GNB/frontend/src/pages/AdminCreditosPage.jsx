import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FilePlus2, ArrowLeft, RefreshCw, CheckCircle, Play, FileText, CalendarDays } from 'lucide-react'
import { getAdminSolicitudes, adminSolicitarCredito, adminEvaluarSolicitud, adminDesembolsarSolicitud } from '../services/adminService.js'
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
  const pkcliente = searchParams.get('pkcliente')
  const nombreCliente = searchParams.get('nombre')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [validacion, setValidacion] = useState(null)
  const [result, setResult] = useState(null)

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

  const onSubmit = async (e) => {
    e.preventDefault()
    setValidacion(null)
    setError(null)

    const monto = toNumber(form.montosolicitud)
    const plazo = parseInt(form.plazo, 10)
    const ingreso = toNumber(form.montoingresoneto)
    const dia_pago = parseInt(form.dia_pago, 10)

    if (monto <= 0) { setValidacion('Ingrese un monto de solicitud válido.'); return }
    if (!plazo || plazo <= 0) { setValidacion('Ingrese un plazo (número de cuotas) válido.'); return }
    if (ingreso <= 0) { setValidacion('Ingrese su ingreso neto mensual.'); return }
    if (!form.codactividadeconomica) { setValidacion('Seleccione una actividad económica.'); return }
    if (!dia_pago || dia_pago < 1 || dia_pago > 31) { setValidacion('Día de pago inválido (1-31).'); return }

    try {
      setLoading(true)
      const data = await adminSolicitarCredito({
        pkcliente: parseInt(pkcliente, 10),
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
      setError(err?.response?.data?.detail || 'Error al solicitar el crédito')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout>
      <button className="hb-back" onClick={() => navigate('/admin/clientes')}>
        <ArrowLeft size={16} /> Volver a Clientes
      </button>
      <h1 className="bbva-page-title">Registrar Crédito (Admin)</h1>
      <p className="bbva-page-sub">Cliente: {nombreCliente}</p>

      {result ? (
        <Card>
          <div className="hb-comprobante">
            <h3>Solicitud registrada</h3>
            <p>Se ha registrado la solicitud {result.codsolicitud}</p>
          </div>
          <div className="bbva-form-actions">
            <button className="bbva-btn" onClick={() => navigate('/admin/creditos')}>Ir a Solicitudes</button>
          </div>
        </Card>
      ) : (
        <Card title="Datos de la Solicitud" icon={<FilePlus2 size={18} />}>
          {error && <Alert tipo="error">{error}</Alert>}
          {validacion && <Alert tipo="warn">{validacion}</Alert>}

          <form onSubmit={onSubmit}>
            <div className="hb-grid-2">
              <div className="hb-field">
                <label htmlFor="monto">Monto (S/)</label>
                <input id="monto" className="hb-input" type="number" min="1" step="0.01" value={form.montosolicitud} onChange={setF('montosolicitud')} />
              </div>
              <div className="hb-field">
                <label htmlFor="plazo">Plazo (meses)</label>
                <input id="plazo" className="hb-input" type="number" min="1" step="1" value={form.plazo} onChange={setF('plazo')} />
              </div>
            </div>

            <div className="hb-grid-2">
              <div className="hb-field">
                <label htmlFor="tipo">Tipo</label>
                <select id="tipo" className="hb-select" value={form.codtipocredito} onChange={setF('codtipocredito')}>
                  <option value="CO">Consumo</option>
                  <option value="ME">Microempresa</option>
                </select>
              </div>
              <div className="hb-field">
                <label htmlFor="ingreso">Ingreso (S/)</label>
                <input id="ingreso" className="hb-input" type="number" min="0" step="0.01" value={form.montoingresoneto} onChange={setF('montoingresoneto')} />
              </div>
            </div>

            <div className="hb-field">
              <label htmlFor="actividad">Actividad (CIIU)</label>
              <select id="actividad" className="hb-select" value={form.codactividadeconomica} onChange={setF('codactividadeconomica')}>
                {ACTIVIDADES.map((a) => <option key={a.cod} value={a.cod}>{a.label}</option>)}
              </select>
            </div>

            <div className="hb-grid-2">
              <div className="hb-field">
                <label htmlFor="fecha">Fecha Desembolso</label>
                <input id="fecha" className="hb-input" type="date" value={form.fecha_desembolso} onChange={setF('fecha_desembolso')} />
              </div>
              <div className="hb-field">
                <label htmlFor="dia_pago">Día de Pago (1-31)</label>
                <input id="dia_pago" className="hb-input" type="number" min="1" max="31" value={form.dia_pago} onChange={setF('dia_pago')} />
              </div>
            </div>

            <div className="hb-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <input id="seguro" type="checkbox" checked={form.con_seguro} onChange={setF('con_seguro')} style={{ width: 20, height: 20 }} />
              <label htmlFor="seguro" style={{ margin: 0 }}>Incluye Seguro de Desgravamen (TEA 40.92%)</label>
            </div>
            {!form.con_seguro && <p style={{ fontSize: '0.8rem', color: 'var(--hb-text-muted)', marginTop: -10 }}>Sin seguro, la TEA será de 43.92%</p>}

            <button type="submit" className="bbva-btn" disabled={loading} style={{ marginTop: 20 }}>
              <FilePlus2 size={18} /> {loading ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </form>
        </Card>
      )}
    </PageLayout>
  )
}

function AdminCreditosList() {
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
        <div className="bbva-page-actions">
          <button className="bbva-btn-ghost" onClick={cargar} disabled={loading}><RefreshCw size={14} /> Actualizar</button>
        </div>
      </div>

      <Card>
        {error && <Alert tipo="error">{error}</Alert>}
        {loading && solicitudes.length === 0 ? <Loader text="Cargando solicitudes..." /> : (
          <Tabla columns={cols} rows={solicitudes} rowKey="id" emptyText="No hay solicitudes" />
        )}
      </Card>

      {cronograma && (
        <Card title={`Cronograma Generado (Solicitud ID ${cronograma.id})`} icon={<CalendarDays size={18} />} style={{ marginTop: '20px' }}>
          <Tabla columns={cronoCols} rows={cronograma.cuotas} rowKey="nrocuota" />
        </Card>
      )}
    </PageLayout>
  )
}
