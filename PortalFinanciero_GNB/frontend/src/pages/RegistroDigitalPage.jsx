import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Mail, Smartphone, Lock, Image as ImageIcon, QrCode } from 'lucide-react'
import Card from '../components/ui/Card.jsx'
import { hbApi } from '../services/api.js'

export default function RegistroDigitalPage() {
  const navigate = useNavigate()
  const [paso, setPaso] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Estado del Wizard
  const [codigoInvitacion, setCodigoInvitacion] = useState('')
  const [clienteInfo, setClienteInfo] = useState(null)
  const [pinSms, setPinSms] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [selloId, setSelloId] = useState(null)

  const sellos = [
    { id: 1, name: 'Candado Seguro', icon: '🔒' },
    { id: 2, name: 'Escudo Protector', icon: '🛡️' },
    { id: 3, name: 'Llave Maestra', icon: '🔑' },
    { id: 4, name: 'Casa Fuerte', icon: '🏠' }
  ]

  const validarInvitacion = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data } = await hbApi.post('/onboarding/validar-invitacion', { codigo_invitacion: codigoInvitacion })
      setClienteInfo(data)
      setPaso(2)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Código inválido.')
    } finally {
      setLoading(false)
    }
  }

  const validarSms = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await hbApi.post('/onboarding/validar-sms', { pkcliente: clienteInfo.pkcliente, pin_sms: pinSms })
      setPaso(3)
    } catch (err) {
      setError(err?.response?.data?.detail || 'PIN incorrecto.')
    } finally {
      setLoading(false)
    }
  }

  const configurarCredenciales = (e) => {
    e.preventDefault()
    if (username.length < 5 || password.length < 8) {
      setError('El usuario debe tener al menos 5 caracteres y la contraseña 8.')
      return
    }
    setError(null)
    setPaso(4)
  }

  const seleccionarSello = (id) => {
    setSelloId(id)
    setPaso(5)
  }

  const finalizarRegistro = async () => {
    setLoading(true)
    setError(null)
    try {
      await hbApi.post('/onboarding/completar-registro', {
        pkcliente: clienteInfo.pkcliente,
        username,
        password,
        sello_seguridad_id: selloId
      })
      setPaso(6)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Error al completar el registro.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f4f4f4', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#0a2e5c', margin: 0, fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={32} color="var(--hb-green)" /> Enrolamiento Digital GNB
        </h1>
        <p style={{ color: '#666' }}>Active sus canales digitales de forma segura.</p>
      </div>

      <Card style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
        
        {/* PASO 1: INVITACIÓN */}
        {paso === 1 && (
          <form onSubmit={validarInvitacion} className="bbva-form">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#0a2e5c' }}>
              <Mail size={24} /> 1. Código de Invitación
            </h2>
            <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Ingrese el código UUID de 36 caracteres que recibió en su correo al abrir su cuenta en ventanilla. (Vigencia 48h)
            </p>
            {error && <div className="bbva-empty" style={{ color: 'var(--hb-red)' }}>{error}</div>}
            <div className="bbva-form-group">
              <label>Código de Invitación</label>
              <input type="text" value={codigoInvitacion} onChange={(e) => setCodigoInvitacion(e.target.value)} required className="bbva-input" placeholder="ej. 123e4567-e89b-12d3-a456-426614174000" />
            </div>
            <button type="submit" className="bbva-btn bbva-btn--primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Validando...' : 'Siguiente Paso'}
            </button>
          </form>
        )}

        {/* PASO 2: SMS PIN */}
        {paso === 2 && (
          <form onSubmit={validarSms} className="bbva-form">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#0a2e5c' }}>
              <Smartphone size={24} /> 2. Validación Biométrica / SMS
            </h2>
            <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Hola <strong>{clienteInfo?.nombre}</strong>. Hemos enviado un PIN a su celular registrado.
            </p>
            {error && <div className="bbva-empty" style={{ color: 'var(--hb-red)' }}>{error}</div>}
            <div className="bbva-form-group">
              <label>PIN SMS (4 dígitos)</label>
              <input type="text" value={pinSms} onChange={(e) => setPinSms(e.target.value)} required maxLength={4} className="bbva-input" style={{ fontSize: '1.5rem', letterSpacing: '0.5rem', textAlign: 'center' }} />
            </div>
            <button type="submit" className="bbva-btn bbva-btn--primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Verificando...' : 'Confirmar Identidad'}
            </button>
          </form>
        )}

        {/* PASO 3: CREDENCIALES */}
        {paso === 3 && (
          <form onSubmit={configurarCredenciales} className="bbva-form">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#0a2e5c' }}>
              <Lock size={24} /> 3. Crear Credenciales
            </h2>
            <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Defina su usuario y contraseña para acceder a la Banca por Internet.
            </p>
            {error && <div className="bbva-empty" style={{ color: 'var(--hb-red)' }}>{error}</div>}
            <div className="bbva-form-group">
              <label>Nombre de Usuario (Min. 5 caracteres)</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={5} className="bbva-input" />
            </div>
            <div className="bbva-form-group">
              <label>Contraseña Segura (Min. 8 caracteres)</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="bbva-input" />
            </div>
            <button type="submit" className="bbva-btn bbva-btn--primary" style={{ width: '100%' }}>
              Continuar
            </button>
          </form>
        )}

        {/* PASO 4: SELLO DE SEGURIDAD */}
        {paso === 4 && (
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#0a2e5c' }}>
              <ImageIcon size={24} /> 4. Sello de Seguridad
            </h2>
            <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Seleccione una imagen. Esta imagen aparecerá siempre al iniciar sesión para protegerle contra el Phishing.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {sellos.map(sello => (
                <div 
                  key={sello.id}
                  onClick={() => seleccionarSello(sello.id)}
                  style={{ 
                    border: '2px solid #ccc', borderRadius: '8px', padding: '2rem', 
                    textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease',
                    background: '#fff'
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'var(--hb-blue)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = '#ccc'}
                >
                  <span style={{ fontSize: '3rem' }}>{sello.icon}</span>
                  <p style={{ margin: '0.5rem 0 0', fontWeight: 'bold', color: '#333' }}>{sello.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PASO 5: TOKEN DIGITAL */}
        {paso === 5 && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#0a2e5c' }}>
              <QrCode size={24} /> 5. Token Digital
            </h2>
            <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Para aprobar transferencias, sincronice su Token Digital. Abra la App GNB Móvil y escanee este código.
            </p>
            
            <div style={{ background: '#fff', border: '1px solid #ddd', padding: '1rem', display: 'inline-block', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=GNB_TOKEN_SYNC" alt="QR Token" />
            </div>
            
            {error && <div className="bbva-empty" style={{ color: 'var(--hb-red)' }}>{error}</div>}

            <button onClick={finalizarRegistro} className="bbva-btn bbva-btn--primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Finalizando...' : 'He sincronizado mi Token, Finalizar Registro'}
            </button>
          </div>
        )}

        {/* PASO 6: ÉXITO */}
        {paso === 6 && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <ShieldCheck size={64} color="var(--hb-green)" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ color: 'var(--hb-green)', marginBottom: '1rem' }}>¡Enrolamiento Exitoso!</h2>
            <p style={{ color: '#666', marginBottom: '2rem' }}>
              Su cuenta y canales digitales están 100% activos y seguros.
            </p>
            <button onClick={() => navigate('/login')} className="bbva-btn bbva-btn--primary" style={{ width: '100%' }}>
              Ir a Iniciar Sesión
            </button>
          </div>
        )}
      </Card>
    </div>
  )
}
