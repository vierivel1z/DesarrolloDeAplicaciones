import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Lock, ShieldCheck, AlertCircle, RefreshCw, FileText, ChevronDown } from 'lucide-react'
import { useHBAuth } from '../hooks/useHBAuth.js'
import { extractError } from '../utils/format.js'
import Alert from '../components/ui/Alert.jsx'
import Logo from '../components/ui/Logo.jsx'

const CAPTCHAS = ['PEW4N', 'BN89X', 'TK47Y', 'MN32B', 'RX78W']

export default function LoginPage() {
  const { login, isAuthenticated } = useHBAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [tarjeta, setTarjeta] = useState(location.state?.tarjeta || '')
  const [dni, setDni] = useState('')
  const [password, setPassword] = useState('')
  const [userCaptcha, setUserCaptcha] = useState('')
  const [captchaCode, setCaptchaCode] = useState(CAPTCHAS[0])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Teclado virtual
  const keyboardKeys = ['5', '2', '1', '7', '9', '0', '4', '8', '3', '6']

  useEffect(() => {
    if (isAuthenticated) navigate('/inicio', { replace: true })
  }, [isAuthenticated, navigate])

  const changeCaptcha = () => {
    const nextIdx = (CAPTCHAS.indexOf(captchaCode) + 1) % CAPTCHAS.length
    setCaptchaCode(CAPTCHAS[nextIdx])
  }

  const handleVirtualKey = (val) => {
    if (password.length < 6) {
      setPassword((prev) => prev + val)
    }
  }

  const handleClear = () => {
    setPassword('')
  }

  const isAdmin = tarjeta.trim().toLowerCase() === 'admin'

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validar Captcha
    if (userCaptcha.trim().toUpperCase() !== captchaCode) {
      setError('El texto de la imagen (Captcha) es incorrecto.')
      return
    }

    // El DNI se valida en el front solo para clientes normales
    if (!isAdmin && !/^\d{8}$/.test(dni.trim())) {
      setError('Ingresa un DNI válido de 8 dígitos.')
      return
    }

    setLoading(true)
    try {
      await login(tarjeta.trim(), password)
      navigate('/inicio', { replace: true })
    } catch (err) {
      setError(extractError(err, 'No se pudo iniciar sesión.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bn-login-page" style={{ background: '#eaeaea', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, sans-serif' }}>
      
      {/* 1. Header superior con la franja roja y el logo colgado */}
      <div style={{ height: '6px', background: '#C31A1F', width: '100%' }}></div>
      <header style={{ background: '#ffffff', height: '65px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #d4d4d8', position: 'relative' }}>
        <div style={{ maxWidth: '1000px', width: '100%', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
          
          {/* Logo Multired Virtual colgado */}
          <div style={{ 
            background: '#C31A1F', 
            color: '#fff', 
            padding: '8px 24px 12px 24px', 
            borderBottomLeftRadius: '14px', 
            borderBottomRightRadius: '14px',
            boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
            textAlign: 'center',
            alignSelf: 'flex-start',
            zIndex: 10,
            marginTop: '-6px'
          }}>
            <div style={{ fontSize: '18px', fontWeight: '900', fontStyle: 'italic', letterSpacing: '-0.5px', color: '#ffcb05', fontFamily: 'Arial, sans-serif' }}>
              multired
            </div>
            <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '-2px', color: '#ffffff', fontFamily: 'Arial, sans-serif' }}>
              Virtual
            </div>
          </div>

          {/* Logo Banco de la Nación */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Logo size={34} variant="dark" />
          </div>
        </div>
      </header>

      {/* 2. Cuerpo Principal */}
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px', background: '#eaeaea' }}>
        
        {/* Zona Segura */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C31A1F', marginBottom: '16px', fontWeight: 'bold', fontSize: '16px' }}>
          <Lock size={18} style={{ color: '#71717a' }} strokeWidth={2.5} />
          <span>Usted se encuentra en una zona segura</span>
        </div>

        {/* Card Formulario */}
        <div style={{ 
          maxWidth: '650px', 
          width: '100%', 
          background: '#ffffff', 
          borderRadius: '6px', 
          border: '1px solid #cccccc', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
          padding: '28px 32px',
          boxSizing: 'border-box'
        }}>
          
          {error && <Alert tipo="error">{error}</Alert>}

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            
            {/* Campo Seleccione */}
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px', width: '100%' }}>
              <label style={{ width: '190px', textAlign: 'right', paddingRight: '16px', paddingTop: '4px', fontSize: '11px', fontWeight: 'bold', color: '#555555' }}>
                Seleccione:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                <div style={{ position: 'relative', width: '250px' }}>
                  <select 
                    disabled
                    style={{ 
                      width: '100%', 
                      height: '26px', 
                      border: '1px solid #b1b1b1', 
                      borderRadius: '4px', 
                      background: '#ffffff', 
                      fontSize: '11px', 
                      fontWeight: '600',
                      padding: '2px 28px 2px 8px', 
                      appearance: 'none', 
                      outline: 'none',
                      color: '#1f2937'
                    }}
                  >
                    <option>Multired Global Débito</option>
                  </select>
                  <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '24px', background: '#9e1014', borderTopRightRadius: '4px', borderBottomRightRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <div style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '5px solid #ffffff' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Número de tarjeta */}
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px', width: '100%' }}>
              <label htmlFor="tarjeta" style={{ width: '190px', textAlign: 'right', paddingRight: '16px', paddingTop: '4px', fontSize: '11px', fontWeight: 'bold', color: '#555555' }}>
                Número de tarjeta:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                <input 
                  id="tarjeta"
                  type="text" 
                  placeholder=""
                  value={tarjeta}
                  onChange={(e) => setTarjeta(e.target.value)}
                  required
                  style={{ 
                    width: '250px',
                    height: '26px',
                    border: '1px solid #b1b1b1', 
                    borderRadius: '4px', 
                    padding: '2px 8px', 
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Tipo y N° Documento */}
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px', width: '100%' }}>
              <label htmlFor="dni" style={{ width: '190px', textAlign: 'right', paddingRight: '16px', paddingTop: '4px', fontSize: '11px', fontWeight: 'bold', color: '#555555' }}>
                Tipo y N° Documento:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1 }}>
                <div style={{ position: 'relative', width: '100px' }}>
                  <select 
                    value="DNI"
                    disabled
                    style={{ 
                      width: '100%', 
                      height: '26px', 
                      border: '1px solid #b1b1b1', 
                      borderRadius: '4px', 
                      background: '#ffffff', 
                      fontSize: '11px', 
                      fontWeight: '600',
                      padding: '2px 28px 2px 8px', 
                      appearance: 'none', 
                      outline: 'none',
                      color: '#1f2937'
                    }}
                  >
                    <option value="DNI">DNI</option>
                  </select>
                  <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '24px', background: '#9e1014', borderTopRightRadius: '4px', borderBottomRightRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <div style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '5px solid #ffffff' }} />
                  </div>
                </div>
                <input 
                  id="dni"
                  type="text" 
                  maxLength={8}
                  placeholder=""
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                  required={!isAdmin}
                  style={{ 
                    width: '142px', 
                    height: '26px',
                    border: '1px solid #b1b1b1', 
                    borderRadius: '4px', 
                    padding: '2px 8px', 
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Clave de Internet usando Teclado Virtual */}
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px', width: '100%' }}>
              <label style={{ width: '190px', textAlign: 'right', paddingRight: '16px', paddingTop: '4px', fontSize: '11px', fontWeight: 'bold', color: '#555555', lineHeight: '1.3' }}>
                Ingresa tu clave usando el teclado virtual:
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexGrow: 1 }}>
                
                {/* Teclado Virtual Grid (90px) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 28px)', gap: '2px', width: '88px', userSelect: 'none' }}>
                  {['5', '2', '1', '7', '9', '0', '4', '8', '3', '6'].map((key) => (
                    <button 
                      key={key} 
                      type="button"
                      onClick={() => handleVirtualKey(key)}
                      style={{ 
                        width: '28px', 
                        height: '24px', 
                        background: '#f2f2f2', 
                        border: '1px solid #aaaaaa', 
                        borderRadius: '3px', 
                        fontSize: '12px', 
                        fontWeight: 'bold',
                        color: '#333333', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      {key}
                    </button>
                  ))}
                  <button 
                    type="button" 
                    onClick={handleClear}
                    style={{ 
                      gridColumn: 'span 2', 
                      width: '58px', 
                      height: '24px', 
                      background: '#444444', 
                      color: '#ffffff', 
                      border: '1px solid #444444', 
                      borderRadius: '3px', 
                      fontSize: '9px', 
                      fontWeight: 'bold', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    LIMPIAR
                  </button>
                </div>

                {/* Enlaces del medio (140px) */}
                <div style={{ width: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '50px' }}>
                  <a href="#" style={{ fontSize: '10.5px', color: '#C31A1F', textDecoration: 'none', fontWeight: 'bold', display: 'flex', gap: '3px', alignItems: 'flex-start' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: '1px' }}>
                      <circle cx="9" cy="15" r="5" fill="#f59e0b" />
                      <path d="M13 11L18 6M18 6L20 8M18 6L16 4" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="9" cy="15" r="2" fill="#ffffff" />
                    </svg>
                    <span style={{ textDecoration: 'underline' }}>Genera tu Clave de Internet</span>
                  </a>
                  <span style={{ color: '#6b7280', fontSize: '9px', marginTop: '2px', display: 'block', paddingLeft: '17px' }}>
                    Ingresa tu Clave de Internet (06 dígitos)
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px', paddingLeft: '17px' }}>
                    <div style={{ width: '13px', height: '13px', borderRadius: '50%', background: '#C31A1F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '9px', fontWeight: 'bold', flexShrink: 0 }}>!</div>
                    <a href="#" style={{ fontSize: '10.5px', color: '#C31A1F', textDecoration: 'underline', fontWeight: 'bold' }}>Olvidé mi clave</a>
                  </div>
                </div>

                {/* Password Input a la derecha (100px) */}
                <input 
                  type="password" 
                  placeholder=""
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ 
                    width: '100px',
                    height: '26px',
                    border: '1px solid #b1b1b1', 
                    borderRadius: '4px', 
                    padding: '2px 8px', 
                    fontSize: '12px',
                    background: '#ffffff',
                    outline: 'none',
                    textAlign: 'center',
                    letterSpacing: '3px',
                    fontWeight: 'bold'
                  }}
                />

              </div>
            </div>

            {/* Captcha */}
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px', width: '100%' }}>
              <label htmlFor="captcha" style={{ width: '190px', textAlign: 'right', paddingRight: '16px', paddingTop: '4px', fontSize: '11px', fontWeight: 'bold', color: '#555555' }}>
                Ingresa el texto de la imagen:
              </label>
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexGrow: 1 }}>
                
                {/* Caja del captcha (90px) */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '88px' }}>
                  <div style={{ 
                    width: '88px', 
                    height: '32px', 
                    background: '#f0f0f0', 
                    border: '1px solid #b1b1b1', 
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '15px', 
                    fontWeight: '900', 
                    fontStyle: 'italic', 
                    color: '#374151', 
                    letterSpacing: '2px',
                    fontFamily: 'Courier New, monospace',
                    userSelect: 'none',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
                    backgroundSize: '4px 4px',
                    backgroundImage: 'linear-gradient(45deg, #e5e5e5 25%, transparent 25%, transparent 75%, #e5e5e5 75%, #e5e5e5), linear-gradient(45deg, #e5e5e5 25%, transparent 25%, transparent 75%, #e5e5e5 75%, #e5e5e5)',
                    backgroundPosition: '0 0, 2px 2px'
                  }}>
                    <span style={{ transform: 'rotate(-3deg) translateY(-1px)', textShadow: '1px 1px 0px #ffffff' }}>
                      {captchaCode}
                    </span>
                  </div>
                  <button 
                    type="button" 
                    onClick={changeCaptcha} 
                    style={{ background: 'none', border: 'none', color: '#C31A1F', fontSize: '10px', textDecoration: 'underline', cursor: 'pointer', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '2px', padding: 0 }}
                  >
                    <RefreshCw size={10} /> Cambiar texto
                  </button>
                </div>

                {/* Espaciador del medio (140px) */}
                <div style={{ width: '140px', height: '10px' }} />

                {/* Captcha input a la derecha (100px) */}
                <input 
                  id="captcha"
                  type="text" 
                  maxLength={5}
                  value={userCaptcha}
                  onChange={(e) => setUserCaptcha(e.target.value)}
                  placeholder=""
                  required
                  style={{ 
                    width: '100px', 
                    height: '26px',
                    border: '1px solid #b1b1b1', 
                    borderRadius: '4px', 
                    padding: '2px 8px', 
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Botón Ingresar */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  background: '#9e1014', 
                  color: '#ffffff', 
                  border: 'none', 
                  fontWeight: 'bold', 
                  padding: '6px 36px', 
                  borderRadius: '20px', 
                  fontSize: '12px', 
                  cursor: 'pointer',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}
              >
                {loading ? 'INGRESANDO…' : 'INGRESAR'}
              </button>
            </div>

          </form>

          {/* Dotted Divider & Guides */}
          <div style={{ borderTop: '1px dotted #aaaaaa', margin: '20px 0 14px 0' }} />
          
          <div style={{ textAlign: 'center' }}>
            <a href="#" style={{ fontSize: '11px', color: '#0284c7', textDecoration: 'underline', fontWeight: 'bold' }}>Recomendaciones de Seguridad</a>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px' }}>
              <a href="#" style={{ fontSize: '10.5px', color: '#4b5563', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                <span style={{ color: '#C31A1F', fontSize: '12px' }}>■</span>
                <span>Guía Cuenta de Ahorro</span>
              </a>
              <a href="#" style={{ fontSize: '10.5px', color: '#4b5563', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                <span style={{ color: '#C31A1F', fontSize: '12px' }}>■</span>
                <span>Guía Cuentas Corrientes</span>
              </a>
            </div>
          </div>

          {/* Prueba Credenciales Box */}
          <div style={{ marginTop: '16px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '8px 12px', fontSize: '10.5px', color: '#6b7280', lineHeight: '1.4' }}>
            {isAdmin ? (
              <span>Acceso admin: Tarjeta <strong>admin</strong> · Clave virtual <strong>admin1234</strong></span>
            ) : (
              <span>Prueba: Tarjeta <strong>cli000001</strong> · DNI <strong>12345678</strong> · Clave virtual <strong>demo1234</strong> (Ingresa escribiendo o usando el teclado virtual)</span>
            )}
          </div>

        </div>

      </main>

      {/* 3. Footer del Login */}
      <footer style={{ background: '#eaeaea', borderTop: '1px solid #cccccc', padding: '20px 20px', fontSize: '10px', color: '#666666', textAlign: 'center', lineHeight: '1.5' }}>
        <div style={{ fontWeight: 'bold', color: '#444444', marginBottom: '3px' }}>
          Banco de la Nación | Ministerio de Economía y Finanzas
        </div>
        <div>
          Oficina Principal: Av. Javier Prado Este 2499, San Borja. Central Telefónica: 518 2000
        </div>
        <div>
          Atención en Oficinas Administrativas: Lunes a Viernes de 08:30 a 17:30. Refrigerio de: 13:00-14:00.
        </div>
        <div>
          Atención en Oficina de Trámite Documentario: Lunes a Viernes de 8:30 a 16:30 (horario corrido)
        </div>
      </footer>

    </div>
  )
}

