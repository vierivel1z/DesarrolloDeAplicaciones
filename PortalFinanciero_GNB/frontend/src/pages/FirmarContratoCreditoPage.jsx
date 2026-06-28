import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FileSignature, ArrowLeft } from 'lucide-react'
import api from '../services/api.js'
import PageLayout from '../components/layout/PageLayout.jsx'
import Card from '../components/ui/Card.jsx'
import Alert from '../components/ui/Alert.jsx'

export default function FirmarContratoCreditoPage() {
  const navigate = useNavigate()
  const { id } = useParams() // ID de la solicitud
  
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (otp.length !== 6) {
      setError('El código OTP debe tener exactamente 6 dígitos.')
      return
    }

    try {
      setLoading(true)
      const res = await api.post(`/creditos/${id}/firmar-contrato`, { codigo_otp: otp })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al validar el OTP.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout>
      <button className="hb-back" onClick={() => navigate('/operaciones')}>
        <ArrowLeft size={16} /> Volver a Operaciones
      </button>
      <h1 className="bbva-page-title">Firma de Contrato</h1>
      <p className="bbva-page-sub">Operaciones › Validar OTP</p>

      {success ? (
        <Card>
          <div className="hb-comprobante">
            <h3>Contrato firmado exitosamente</h3>
            <p>Su solicitud ha sido aprobada y está lista para el desembolso.</p>
          </div>
          <div className="bbva-form-actions">
            <button className="bbva-btn" onClick={() => navigate('/inicio')}>Ir al inicio</button>
          </div>
        </Card>
      ) : (
        <Card title={`Firma Digital - Solicitud #${id}`} icon={<FileSignature size={18} />}>
          {error && <Alert tipo="error">{error}</Alert>}
          
          <p style={{marginBottom: 20, color: '#444'}}>
            Hemos enviado un código OTP de 6 dígitos a su correo electrónico y celular registrado. 
            Por favor, ingréselo a continuación para aceptar los términos y condiciones del crédito.
          </p>

          <form onSubmit={onSubmit}>
            <div className="hb-field">
              <label htmlFor="otp">Código OTP (6 dígitos)</label>
              <input 
                id="otp" 
                className="hb-input" 
                type="text" 
                maxLength="6"
                placeholder="Ej. 123456" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} 
              />
            </div>

            <button type="submit" className="bbva-btn" disabled={loading || otp.length !== 6}>
              <FileSignature size={18} />
              {loading ? 'Validando...' : 'Firmar Contrato'}
            </button>
          </form>
        </Card>
      )}
    </PageLayout>
  )
}
