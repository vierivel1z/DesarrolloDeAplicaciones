import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Receipt, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react'
import { useCreditos, useCuotas } from '../hooks/useCreditos.js'
import { useCuentas } from '../hooks/useCuentas.js'
import { usePagoCuota } from '../hooks/useOperaciones.js'
import { formatDate, toNumber, simboloMoneda } from '../utils/format.js'
import PageLayout from '../components/layout/PageLayout.jsx'
import Card from '../components/ui/Card.jsx'
import Loader from '../components/ui/Loader.jsx'
import Money from '../components/ui/Money.jsx'
import Alert from '../components/ui/Alert.jsx'
import Comprobante from '../components/ui/Comprobante.jsx'

export default function PagoCreditoPage() {
  const { cod } = useParams()
  const navigate = useNavigate()
  const { creditos, loading: lc } = useCreditos()
  const { cuentas, loading: lca, recargar: recargarCuentas } = useCuentas('ahorro')

  const [credito, setCredito] = useState(cod || '')
  const [origen, setOrigen] = useState('')
  const [monto, setMonto] = useState('')
  const [paso, setPaso] = useState('form')
  const [validacion, setValidacion] = useState(null)

  useEffect(() => {
    if (!credito && creditos.length === 1) setCredito(creditos[0].codcuentacredito)
  }, [creditos, credito])
  useEffect(() => {
    if (!origen && cuentas.length === 1) setOrigen(cuentas[0].codcuentaahorro)
  }, [cuentas, origen])

  const { cuotas, loading: lq, recargar: recargarCuotas } = useCuotas(credito)
  const { run, loading: pagando, error, result, reset } = usePagoCuota()

  const proxima = cuotas.find((c) => !c.pagada)
  const cuentaOrigen = cuentas.find((c) => c.codcuentaahorro === origen)
  const simbolo = cuentaOrigen ? simboloMoneda(cuentaOrigen.moneda) : 'S/'

  // El monto por defecto es el de la cuota; el usuario puede editarlo.
  useEffect(() => {
    setMonto(proxima ? String(toNumber(proxima.monto_cuota)) : '')
  }, [proxima?.nrocuota, credito]) // eslint-disable-line react-hooks/exhaustive-deps

  // Monto que efectivamente se cobrará (si está vacío => cuota completa).
  const montoAPagar = monto === '' ? toNumber(proxima?.monto_cuota) : toNumber(monto)
  const saldoInsuficiente = cuentaOrigen && montoAPagar > toNumber(cuentaOrigen.saldo)

  const validar = () => {
    if (!credito) return 'Seleccione el crédito a pagar.'
    if (!origen) return 'Seleccione la cuenta de ahorro de la que se debitará el pago.'
    if (!proxima) return 'Este crédito no tiene cuotas pendientes.'
    if (monto !== '' && toNumber(monto) <= 0) return 'El monto debe ser mayor a cero.'
    if (saldoInsuficiente) return 'Saldo insuficiente en la cuenta de ahorro origen.'
    return null
  }

  const irAConfirmar = (e) => {
    e.preventDefault()
    const v = validar()
    setValidacion(v)
    if (!v) setPaso('confirm')
  }

  const confirmar = async () => {
    try {
      // Si el campo monto quedó vacío, no se envía => el backend paga la cuota completa.
      await run({ codcuentacredito: credito, cuenta_origen: origen, monto: monto === '' ? undefined : toNumber(monto) })
      recargarCuotas()
      recargarCuentas()
    } catch { /* error vía `error` */ }
  }

  const nuevo = () => { reset(); setPaso('form'); recargarCuotas(); recargarCuentas() }

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
          <span className="bn-step-label">Datos de Pago</span>
        </div>
        
        <div className={`bn-step ${isPaso2 ? 'active' : (isPaso3 ? 'completed' : '')}`}>
          <div className="bn-step-circle">2</div>
          <span className="bn-step-label">Confirmación</span>
        </div>
        
        <div className={`bn-step ${isPaso3 ? 'active' : ''}`}>
          <div className="bn-step-circle">3</div>
          <span className="bn-step-label">Constancia Digital</span>
        </div>
      </div>
    )
  }

  const cargando = lc || lca

  return (
    <PageLayout
      title="Pago de crédito"
      subtitle="Operaciones › Pago de crédito"
      actions={
        <button className="bbva-btn-ghost sm" onClick={() => navigate('/operaciones')}>
          <ArrowLeft size={14} /> Volver a Operaciones
        </button>
      }
    >
      {renderStepper(result ? 'result' : paso)}

      {result ? (
        <Comprobante
          titulo="Pago realizado con éxito"
          mensaje={result.mensaje}
          filas={[
            { label: 'Crédito', value: result.codcuentacredito },
            { label: 'N° de cuota', value: result.nrocuota },
            { label: 'Monto', value: <Money value={result.monto_pagado} simbolo={simbolo} /> },
            { label: 'Cuenta debitada', value: result.cuenta_origen || origen },
            { label: 'N° de operación', value: result.pkoperacion },
            { label: 'Op. débito ahorro', value: result.pkoperacion_debito_ahorro ?? '—' },
            { label: 'Kardex', value: result.codkardex },
          ]}
          acciones={[
            { label: 'Realizar otro pago', onClick: nuevo },
            { label: 'Ir al inicio', primary: true, onClick: () => navigate('/inicio') },
          ]}
        />
      ) : (
        <Card title="Pagar cuota de préstamo" icon={<Receipt size={18} style={{ color: '#C31A1F' }} />}>
          {cargando ? (
            <Loader text="Cargando datos…" />
          ) : creditos.length === 0 ? (
            <Alert tipo="info">No registra créditos sobre los cuales pagar cuotas.</Alert>
          ) : paso === 'confirm' ? (
            <div className="bbva-confirm">
              <p className="bbva-confirm-lead">Confirma el pago de la cuota:</p>
              {error && <Alert tipo="error">{error}</Alert>}
              <dl className="hb-dl">
                <div><dt>Crédito</dt><dd>{credito}</dd></div>
                <div><dt>Cuenta a debitar</dt><dd>{origen} · {cuentaOrigen?.tipo}</dd></div>
                <div><dt>N° de cuota</dt><dd>{proxima?.nrocuota}</dd></div>
                <div><dt>Vencimiento</dt><dd>{formatDate(proxima?.fecha_vencimiento)}</dd></div>
                <div><dt>Monto a pagar</dt><dd><Money value={montoAPagar} simbolo={simbolo} /></dd></div>
              </dl>
              <div className="bbva-form-actions">
                <button className="bbva-btn-gray" onClick={() => setPaso('form')} disabled={pagando}>Volver</button>
                <button className="bbva-btn" onClick={confirmar} disabled={pagando}>
                  <ShieldCheck size={18} /> {pagando ? 'Procesando…' : 'Confirmar pago'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={irAConfirmar}>
              {validacion && <Alert tipo="warn">{validacion}</Alert>}

              <div className="hb-field">
                <label htmlFor="credito" className="hb-field-label">Crédito a pagar</label>
                <select id="credito" className="hb-select" value={credito} onChange={(e) => setCredito(e.target.value)}>
                  <option value="">— Seleccione un crédito —</option>
                  {creditos.map((c) => (
                    <option key={c.codcuentacredito} value={c.codcuentacredito}>
                      {c.codcuentacredito} · saldo pendiente {c.pago_pendiente}
                    </option>
                  ))}
                </select>
              </div>

              {credito && (
                lq ? <Loader text="Consultando próxima cuota…" /> : proxima ? (
                  <div className="bbva-cuota-box" style={{ margin: '16px 0', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '800', display: 'block' }}>Próxima cuota a pagar</span>
                    <strong style={{ fontSize: '18px', display: 'block', margin: '4px 0', color: '#1e293b' }}>N° {proxima.nrocuota}</strong>
                    <span style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '8px' }}>vence {formatDate(proxima.fecha_vencimiento)}</span>
                    <Money value={proxima.monto_cuota} style={{ fontSize: '20px', fontWeight: '800', color: '#C31A1F' }} />
                  </div>
                ) : (
                  <div style={{ margin: '16px 0' }}>
                    <Alert tipo="success">Este crédito no tiene cuotas pendientes. ¡Está al día!</Alert>
                  </div>
                )
              )}

              <div className="hb-grid-2" style={{ marginTop: '16px' }}>
                <div className="hb-field">
                  <label htmlFor="origen" className="hb-field-label">Cuenta de ahorro origen (se debita)</label>
                  <select id="origen" className="hb-select" value={origen} onChange={(e) => setOrigen(e.target.value)}>
                    <option value="">— Seleccione una cuenta —</option>
                    {cuentas.map((c) => (
                      <option key={c.codcuentaahorro} value={c.codcuentaahorro}>
                        {c.codcuentaahorro} · {c.tipo} · {simboloMoneda(c.moneda)} {c.saldo}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="hb-field">
                  <label htmlFor="monto" className="hb-field-label">Monto a pagar ({simbolo}) — vacío = cuota completa</label>
                  <input id="monto" className="hb-input" type="number" min="0" step="0.01"
                    placeholder={proxima ? String(toNumber(proxima.monto_cuota)) : '0.00'}
                    value={monto} onChange={(e) => setMonto(e.target.value)} />
                </div>
              </div>

              {cuentaOrigen && (
                <p className="bbva-saldo-hint" style={{ marginTop: '10px' }}>
                  Saldo disponible en origen: <Money value={cuentaOrigen.saldo} simbolo={simbolo} />
                  {saldoInsuficiente && <span style={{ color: 'var(--hb-red)', fontWeight: 600 }}> · saldo insuficiente</span>}
                </p>
              )}

              <div style={{ marginTop: '24px' }}>
                <button type="submit" className="bbva-btn" disabled={!proxima || saldoInsuficiente}>
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

