import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FilePlus2, ArrowLeft, ArrowRight, ShieldCheck, Clock } from 'lucide-react'
import { useSolicitudCredito } from '../hooks/useOperaciones.js'
import { toNumber } from '../utils/format.js'
import PageLayout from '../components/layout/PageLayout.jsx'
import Card from '../components/ui/Card.jsx'
import Money from '../components/ui/Money.jsx'
import Badge from '../components/ui/Badge.jsx'
import Alert from '../components/ui/Alert.jsx'
import Comprobante from '../components/ui/Comprobante.jsx'

// Actividades económicas (CIIU) que EXISTEN en dactividadeconomica de la BD.
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

export default function SolicitarCreditoPage() {
  const navigate = useNavigate()
  const { run, loading, error, result, reset } = useSolicitudCredito()
  const [paso, setPaso] = useState('form') // form | confirm
  const [validacion, setValidacion] = useState(null)

  const [form, setForm] = useState({
    montosolicitud: '',
    plazo: '',
    codtipocredito: 'CO',
    codactividadeconomica: '0111',
    montoingresoneto: '',
  })

  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const validar = () => {
    const monto = toNumber(form.montosolicitud)
    const plazo = parseInt(form.plazo, 10)
    const ingreso = toNumber(form.montoingresoneto)

    if (monto <= 0) return 'Ingrese un monto de solicitud válido.'
    if (!plazo || plazo <= 0) return 'Ingrese un plazo (número de cuotas) válido.'
    if (ingreso <= 0) return 'Ingrese su ingreso neto mensual.'
    if (!form.codactividadeconomica) return 'Seleccione una actividad económica.'
    return null
  }

  const irAConfirmar = (e) => {
    e.preventDefault()
    const v = validar()
    setValidacion(v)
    if (!v) setPaso('confirm')
  }

  const confirmar = async () => {
    const monto = toNumber(form.montosolicitud)
    const plazo = parseInt(form.plazo, 10)
    const ingreso = toNumber(form.montoingresoneto)

    try {
      await run({
        montosolicitud: monto,
        plazo,
        codtipocredito: form.codtipocredito,
        codactividadeconomica: form.codactividadeconomica,
        montoingresoneto: ingreso,
      })
    } catch {
      /* mensaje de elegibilidad se muestra vía `error` */
    }
  }

  const nuevaSolicitud = () => {
    reset()
    setPaso('form')
    setForm({ montosolicitud: '', plazo: '', codtipocredito: 'CO', codactividadeconomica: '0111', montoingresoneto: '' })
  }

  const renderStepper = (currentStep) => {
    const isPaso1 = currentStep === 'form'
    const isPaso2 = currentStep === 'confirm'
    const isPaso3 = currentStep === 'result'

    return (
      <div className="bn-stepper">
        <div className="bn-stepper-line" />
        <div 
          className="bn-stepper-line-fill" 
          style={{ width: isPaso1 ? '0%' : isPaso2 ? '50%' : '100%' }} 
        />
        
        <div className={`bn-step ${isPaso1 ? 'active' : (isPaso2 || isPaso3 ? 'completed' : '')}`}>
          <div className="bn-step-circle">1</div>
          <span className="bn-step-label">Datos de Crédito</span>
        </div>
        
        <div className={`bn-step ${isPaso2 ? 'active' : (isPaso3 ? 'completed' : '')}`}>
          <div className="bn-step-circle">2</div>
          <span className="bn-step-label">Evaluación</span>
        </div>
        
        <div className={`bn-step ${isPaso3 ? 'active' : ''}`}>
          <div className="bn-step-circle">3</div>
          <span className="bn-step-label">Resultado</span>
        </div>
      </div>
    )
  }

  return (
    <PageLayout
      title="Solicitud de crédito digital"
      subtitle="Operaciones › Solicitar préstamo"
      actions={
        <button className="bbva-btn-ghost sm" onClick={() => navigate('/operaciones')}>
          <ArrowLeft size={14} /> Volver a Operaciones
        </button>
      }
    >
      {renderStepper(result ? 'result' : paso)}

      {result ? (
        <Comprobante
          titulo="Solicitud registrada con éxito"
          mensaje={result.mensaje}
          filas={[
            { label: 'Código de solicitud', value: result.codsolicitud },
            { label: 'Estado', value: <Badge estado={result.estado} /> },
            { label: 'Monto solicitado', value: <Money value={result.montosolicitud} /> },
            { label: 'Plazo solicitado', value: `${result.plazo} cuotas` },
          ]}
          nota="Su solicitud pasará por evaluación del banco (core financiero). Le notificaremos el resultado."
          acciones={[
            { label: 'Nueva solicitud', onClick: nuevaSolicitud },
            { label: 'Ir al inicio', primary: true, onClick: () => navigate('/inicio') },
          ]}
        />
      ) : (
        <Card title="Datos de la solicitud" icon={<FilePlus2 size={18} style={{ color: '#C31A1F' }} />}>
          {validacion && <Alert tipo="warn">{validacion}</Alert>}

          {paso === 'confirm' ? (
            <div className="bbva-confirm">
              <p className="bbva-confirm-lead">Revisa los datos antes de enviar la solicitud a evaluación:</p>
              {error && <Alert tipo="error">{error}</Alert>}
              <dl className="hb-dl">
                <div><dt>Monto solicitado</dt><dd><Money value={form.montosolicitud} /></dd></div>
                <div><dt>Plazo</dt><dd>{form.plazo} meses / cuotas</dd></div>
                <div><dt>Tipo de crédito</dt><dd>{form.codtipocredito === 'CO' ? 'Consumo' : 'Microempresa'}</dd></div>
                <div><dt>Ingreso neto mensual</dt><dd><Money value={form.montoingresoneto} /></dd></div>
                <div><dt>Actividad económica</dt><dd>{ACTIVIDADES.find(a => a.cod === form.codactividadeconomica)?.label}</dd></div>
              </dl>
              <div className="bbva-form-actions">
                <button className="bbva-btn-gray" onClick={() => setPaso('form')} disabled={loading}>Volver</button>
                <button className="bbva-btn" onClick={confirmar} disabled={loading}>
                  <ShieldCheck size={18} /> {loading ? 'Enviando solicitud…' : 'Enviar a evaluación'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={irAConfirmar}>
              <div className="hb-grid-2">
                <div className="hb-field">
                  <label htmlFor="monto" className="hb-field-label">Monto solicitado (S/)</label>
                  <input id="monto" className="hb-input" type="number" min="1" step="0.01"
                    placeholder="0.00" value={form.montosolicitud} onChange={setF('montosolicitud')} />
                </div>
                <div className="hb-field">
                  <label htmlFor="plazo" className="hb-field-label">Plazo (n° de cuotas / meses)</label>
                  <input id="plazo" className="hb-input" type="number" min="1" step="1"
                    placeholder="12" value={form.plazo} onChange={setF('plazo')} />
                </div>
              </div>

              <div className="hb-grid-2" style={{ marginTop: '16px' }}>
                <div className="hb-field">
                  <label htmlFor="tipo" className="hb-field-label">Tipo de crédito</label>
                  <select id="tipo" className="hb-select" value={form.codtipocredito} onChange={setF('codtipocredito')}>
                    <option value="CO">CO — Consumo</option>
                    <option value="ME">ME — Microempresa</option>
                  </select>
                </div>
                <div className="hb-field">
                  <label htmlFor="ingreso" className="hb-field-label">Ingreso neto mensual (S/)</label>
                  <input id="ingreso" className="hb-input" type="number" min="0" step="0.01"
                    placeholder="0.00" value={form.montoingresoneto} onChange={setF('montoingresoneto')} />
                </div>
              </div>

              <div className="hb-field" style={{ marginTop: '16px' }}>
                <label htmlFor="actividad" className="hb-field-label">Actividad económica (CIIU)</label>
                <select id="actividad" className="hb-select" value={form.codactividadeconomica} onChange={setF('codactividadeconomica')}>
                  {ACTIVIDADES.map((a) => (
                    <option key={a.cod} value={a.cod}>{a.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: '24px' }}>
                <button type="submit" className="bbva-btn">
                  Continuar <ArrowRight size={18} />
                </button>
              </div>
            </form>
          )}
        </Card>
      )}
    </PageLayout>
  )
}

