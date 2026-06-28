import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FilePlus2, ArrowLeft, Clock, UploadCloud } from 'lucide-react'
import { useSolicitudCredito } from '../hooks/useOperaciones.js'
import { toNumber } from '../utils/format.js'
import api from '../services/api.js'
import PageLayout from '../components/layout/PageLayout.jsx'
import Card from '../components/ui/Card.jsx'
import Money from '../components/ui/Money.jsx'
import Badge from '../components/ui/Badge.jsx'
import Alert from '../components/ui/Alert.jsx'

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
  const [validacion, setValidacion] = useState(null)
  
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    montosolicitud: '',
    plazo: '',
    codtipocredito: 'FACIL',
    codactividadeconomica: '0111',
    montoingresoneto: '',
    tipo_desgravamen: 'estandar'
  })

  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const onDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setValidacion(null)

    const monto = toNumber(form.montosolicitud)
    const plazo = parseInt(form.plazo, 10)
    const ingreso = toNumber(form.montoingresoneto)

    if (monto <= 0) { setValidacion('Ingrese un monto de solicitud válido.'); return }
    if (!plazo || plazo <= 0) { setValidacion('Ingrese un plazo (número de cuotas) válido.'); return }
    if (ingreso <= 0) { setValidacion('Ingrese su ingreso neto mensual.'); return }
    if (!form.codactividadeconomica) { setValidacion('Seleccione una actividad económica.'); return }
    if (!file) { setValidacion('Debe subir el documento de sustento de ingresos (PDF/Imagen).'); return }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      
      const uploadRes = await api.post('/creditos/upload-documento', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      const secure_url = uploadRes.data.secure_url
      setUploading(false)

      await run({
        monto,
        plazo,
        codtipocredito: form.codtipocredito,
        codactividadeconomica: form.codactividadeconomica,
        ingreso_neto_mensual: ingreso,
        archivo_sustento_url: secure_url,
        numero_documento: "No provisto", // Esto debería venir del auth si es necesario
        moneda: "PEN"
      })
    } catch (err) {
      setUploading(false)
      setValidacion(err.response?.data?.detail || 'Error al procesar la solicitud.')
    }
  }

  const nuevaSolicitud = () => {
    reset()
    setFile(null)
    setForm({ montosolicitud: '', plazo: '', codtipocredito: 'FACIL', codactividadeconomica: '0111', montoingresoneto: '', tipo_desgravamen: 'estandar' })
  }

  return (
    <PageLayout>
      <button className="hb-back" onClick={() => navigate('/operaciones')}>
        <ArrowLeft size={16} /> Volver a Operaciones
      </button>
      <h1 className="bbva-page-title">Solicitud de Crédito de Consumo (GNB)</h1>
      <p className="bbva-page-sub">Operaciones › Solicitar préstamo</p>

      {result ? (
        <Card>
          <div className="hb-comprobante">
            <h3>Solicitud registrada</h3>
            <p style={{ marginTop: 0 }}>{result.mensaje}</p>
            <dl className="hb-dl">
              <div><dt>Código de solicitud</dt><dd>{result.codsolicitud}</dd></div>
              <div><dt>Estado</dt><dd><Badge estado={result.estado} /></dd></div>
              <div><dt>Monto solicitado</dt><dd><Money value={result.monto} /></dd></div>
              <div><dt>Plazo</dt><dd>{result.plazo} cuotas</dd></div>
            </dl>
            <p style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--hb-amber)', fontSize: 13, marginBottom: 0 }}>
              <Clock size={15} /> Su solicitud pasará por evaluación del banco. Le notificaremos para la firma del contrato.
            </p>
          </div>
          <div className="bbva-form-actions">
            <button className="bbva-btn-gray" onClick={nuevaSolicitud}>Nueva solicitud</button>
            <button className="bbva-btn" onClick={() => navigate('/inicio')}>Ir al inicio</button>
          </div>
        </Card>
      ) : (
        <Card title="Datos de la solicitud" icon={<FilePlus2 size={18} />}>
          {error && <Alert tipo="error">{error}</Alert>}
          {validacion && <Alert tipo="warn">{validacion}</Alert>}

          <form onSubmit={onSubmit}>
            <div className="hb-grid-2">
              <div className="hb-field">
                <label htmlFor="monto">Monto solicitado (S/)</label>
                <input id="monto" className="hb-input" type="number" min="1" step="0.01"
                  placeholder="0.00" value={form.montosolicitud} onChange={setF('montosolicitud')} />
              </div>
              <div className="hb-field">
                <label htmlFor="plazo">Plazo (n° de cuotas / meses)</label>
                <input id="plazo" className="hb-input" type="number" min="1" step="1"
                  placeholder="12" value={form.plazo} onChange={setF('plazo')} />
              </div>
            </div>

            <div className="hb-grid-2">
              <div className="hb-field">
                <label htmlFor="tipo">Producto de Crédito *</label>
                <select id="tipo" className="hb-select" value={form.codtipocredito} onChange={setF('codtipocredito')}>
                  <option value="FACIL">Préstamo Fácil</option>
                  <option value="LIBRE">Libre Disponibilidad</option>
                  <option value="ESTANDAR">Personal Estándar</option>
                  <option value="CONVENIO">Por Convenio</option>
                </select>
              </div>
              <div className="hb-field">
                <label htmlFor="ingreso">Ingreso neto mensual declarado (S/)</label>
                <input id="ingreso" className="hb-input" type="number" min="0" step="0.01"
                  placeholder="0.00" value={form.montoingresoneto} onChange={setF('montoingresoneto')} />
              </div>
            </div>

            <div className="hb-grid-1" style={{marginBottom: 20}}>
              <label>Sustento de Ingresos (PDF/Imagen)</label>
              <div 
                onDragOver={onDragOver} 
                onDragLeave={onDragLeave} 
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: isDragging ? '2px dashed var(--hb-blue)' : '2px dashed #ccc',
                  borderRadius: '8px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: isDragging ? 'rgba(0,68,129,0.05)' : '#fafafa',
                  transition: 'all 0.2s'
                }}
              >
                <UploadCloud size={32} color={isDragging ? 'var(--hb-blue)' : '#888'} style={{margin: '0 auto 10px'}} />
                {file ? (
                  <p style={{margin: 0, fontWeight: 500, color: 'var(--hb-blue)'}}>{file.name}</p>
                ) : (
                  <p style={{margin: 0, color: '#666'}}>
                    Arrastra tu archivo aquí o <strong>haz clic para examinar</strong>
                  </p>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  style={{display: 'none'}} 
                  accept="application/pdf,image/*"
                />
              </div>
            </div>

            <button type="submit" className="bbva-btn" disabled={loading || uploading}>
              <FilePlus2 size={18} />
              {uploading ? 'Subiendo documento...' : loading ? 'Enviando solicitud…' : 'Enviar solicitud'}
            </button>
          </form>
        </Card>
      )}
    </PageLayout>
  )
}
