import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, ArrowLeft, CheckCircle } from 'lucide-react'
import PageLayout from '../components/layout/PageLayout.jsx'
import Card from '../components/ui/Card.jsx'
import { hbApi } from '../services/api.js'

export default function AltaClientePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [exito, setExito] = useState(null)
  
  const [formData, setFormData] = useState({
    nomcliente: '',
    numerodocumentoidentidad: '',
    email: '',
    numerotelefonopersonal: '',
    montoingresoneto: '',
    tipo_cuenta: 'AHORRO_ROLANDO'
  })

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setExito(null)
    try {
      const { data } = await hbApi.post('/admin/clientes/crear', formData)
      setExito(data)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Error al crear cliente.')
    } finally {
      setLoading(false)
    }
  }

  if (exito) {
    return (
      <PageLayout>
        <div className="bbva-hello">
          <h1>Alta Exitosa</h1>
        </div>
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <CheckCircle size={64} color="var(--hb-green)" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ color: 'var(--hb-green)' }}>Cliente Registrado Exitosamente</h2>
            <p><strong>{exito.nombre}</strong> ha sido dado de alta.</p>
            <hr style={{ margin: '1rem 0' }} />
            <p><strong>Código de Cliente:</strong> {exito.codcliente}</p>
            <p><strong>Cuenta asignada:</strong> {exito.nro_cuenta} ({exito.cuenta_ahorro})</p>
            <p><strong>CCI:</strong> {exito.cci}</p>
            <div style={{ background: '#f5f7f9', padding: '1rem', marginTop: '1rem', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 0.5rem', color: 'var(--hb-blue)' }}><strong>Código de Invitación (UUID):</strong></p>
              <code style={{ fontSize: '1.1rem', userSelect: 'all' }}>{exito.codigo_invitacion}</code>
              <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#666' }}>Entregue este código al cliente para el Enrolamiento Digital.</p>
            </div>
            <button className="bbva-btn bbva-btn--primary" style={{ marginTop: '2rem' }} onClick={() => navigate('/admin/clientes')}>
              Volver al Directorio
            </button>
          </div>
        </Card>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="bbva-hello">
        <button className="bbva-btn-ghost" onClick={() => navigate('/admin/clientes')} style={{ marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> Volver
        </button>
        <h1>Alta de Cliente en Ventanilla</h1>
        <p>Apertura de cuentas pasivas e inicio del onboarding digital.</p>
      </div>

      <Card title="Datos del Cliente" icon={<UserPlus size={18} />}>
        {error && <div className="bbva-empty" style={{ color: 'var(--hb-red)', marginBottom: '1rem' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} className="bbva-form">
          <div className="bbva-form-group">
            <label>Nombres y Apellidos</label>
            <input name="nomcliente" value={formData.nomcliente} onChange={handleChange} required className="bbva-input" />
          </div>
          <div className="bbva-form-group">
            <label>Nro. Documento de Identidad (DNI/CE)</label>
            <input name="numerodocumentoidentidad" value={formData.numerodocumentoidentidad} onChange={handleChange} required className="bbva-input" />
          </div>
          <div className="bbva-form-group">
            <label>Email</label>
            <input name="email" type="email" value={formData.email} onChange={handleChange} required className="bbva-input" />
          </div>
          <div className="bbva-form-group">
            <label>Teléfono Celular</label>
            <input name="numerotelefonopersonal" value={formData.numerotelefonopersonal} onChange={handleChange} required className="bbva-input" />
          </div>
          <div className="bbva-form-group">
            <label>Ingreso Neto Mensual (S/)</label>
            <input name="montoingresoneto" type="number" step="0.01" value={formData.montoingresoneto} onChange={handleChange} required className="bbva-input" />
          </div>
          <div className="bbva-form-group">
            <label>Tipo de Cuenta a Aperturar</label>
            <select name="tipo_cuenta" value={formData.tipo_cuenta} onChange={handleChange} className="bbva-input">
              <option value="AHORRO_ROLANDO">Ahorro Rolando (Mantenimiento S/ 0.00, TEA 4.50%)</option>
              <option value="AHORRO_TRADICIONAL">Ahorro Tradicional (Requiere saldo min. S/ 1,000)</option>
            </select>
          </div>
          <button type="submit" className="bbva-btn bbva-btn--primary" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? 'Creando Cliente...' : 'Crear Cliente y Enviar Invitación'}
          </button>
        </form>
      </Card>
    </PageLayout>
  )
}
