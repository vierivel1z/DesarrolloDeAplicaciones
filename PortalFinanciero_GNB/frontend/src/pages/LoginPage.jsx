import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { CreditCard, Fingerprint, Lock, LogIn, ArrowLeft, Phone } from 'lucide-react'
import { useHBAuth } from '../hooks/useHBAuth.js'
import { extractError } from '../utils/format.js'
import Alert from '../components/ui/Alert.jsx'
import loginLogo from '../images/image.png'

export default function LoginPage() {
  const { loginToken, isAuthenticated } = useHBAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // Número de tarjeta / usuario que pudo venir desde el landing.
  const [tarjeta, setTarjeta] = useState(location.state?.tarjeta || '')
  const [tokenStr, setTokenStr] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Si ya hay sesión, va directo a la banca.
  useEffect(() => {
    if (isAuthenticated) navigate('/inicio', { replace: true })
  }, [isAuthenticated, navigate])

  const adminRoles = ['admin', 'maker01', 'checker1_01', 'checker2_01', 'comite01', 'superadmin01']
  const isAdmin = adminRoles.includes(tarjeta.trim().toLowerCase())

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    setLoading(true)
    try {
      // El backend autentica con la tarjeta/usuario (codcliente) + el token.
      await loginToken(tarjeta.trim(), tokenStr)
      navigate('/inicio', { replace: true })
    } catch (err) {
      setError(extractError(err, 'No se pudo iniciar sesión.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="gnb-login-screen">
      {/* Top Bar with Back Button */}
      <div className="gnb-login-top-bar">
        <Link to="/" className="gnb-login-back-btn">
          <ArrowLeft size={16} /> Regresar
        </Link>
      </div>

      {/* Main Body */}
      <div className="gnb-login-body-wrapper">
        <div className="gnb-login-body">
          {/* Left Column: Form */}
          <div className="gnb-login-left">
            <img src={loginLogo} alt="Banco GNB" style={{ height: '46px', width: 'auto', alignSelf: 'flex-start', marginTop: '15px', marginBottom: '55px' }} />
            <h2>Acceso a Banca por Internet</h2>
            
            {error && <Alert tipo="error">{error}</Alert>}

            <form onSubmit={onSubmit}>
              <div className="gnb-login-field">
                <label htmlFor="tarjeta">N° de tarjeta de ahorros / Usuario</label>
                <div className="gnb-login-input-wrapper">
                  <input
                    id="tarjeta"
                    className="gnb-login-input"
                    placeholder="Ej. cli000001"
                    autoComplete="username"
                    value={tarjeta}
                    onChange={(e) => setTarjeta(e.target.value)}
                    autoFocus
                    required
                  />
                  <CreditCard size={18} className="gnb-login-input-icon" />
                </div>
              </div>

              <div className="gnb-login-field">
                <label htmlFor="tokenStr">Token Digital</label>
                <div className="gnb-login-input-wrapper">
                  <input
                    id="tokenStr"
                    type="password"
                    className="gnb-login-input"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={tokenStr}
                    onChange={(e) => setTokenStr(e.target.value)}
                    required
                  />
                  <Lock size={18} className="gnb-login-input-icon" />
                </div>
              </div>

              <button type="submit" className="gnb-login-btn" disabled={loading}>
                <LogIn size={18} />
                {loading ? 'Ingresando…' : 'Continuar'}
              </button>
            </form>

            <div className="gnb-login-links-blue">
              <Link to="/login-password" style={{ textDecoration: 'none' }}>
                <button type="button" className="gnb-login-link-blue">Acceder sin token (sólo con contraseña)</button>
              </Link>
              <button type="button" className="gnb-login-link-blue">Vinculación de token Banca por Internet</button>
              <button type="button" className="gnb-login-link-blue">Olvidé mi contraseña</button>
            </div>

            <div style={{ marginTop: '10px', marginBottom: '15px' }}>
                <span style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.75)' }}>
                  Prueba Token: tarjeta <strong>cli000001</strong> · token <strong>token1234</strong>
                </span>
            </div>

            {/* Bank Info Block matching the user's reference image */}
            <div className="gnb-login-bank-info-block">
              <div className="gnb-login-footer-phone-icon">
                <Phone size={18} fill="#7AB83F" stroke="none" />
              </div>
              <div className="gnb-login-bank-info-text">
                <div>Lima: (511) 6164722 &nbsp; Provincias: 0801-00088</div>
                <div>Banco GNB Perú S.A. - R.U.C. 20513074370</div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="gnb-login-divider" />

          {/* Right Column: Information */}
          <div className="gnb-login-right">
            <h2>Bienvenido a la Banca por Internet Banco GNB</h2>
            <p className="gnb-login-subtitle">Una nueva y mejor manera de estar conectados.</p>
            <p>Comodidad y rapidez para realizar tus operaciones con total seguridad, los 365 días del año.</p>
            <p>Si aún no estás registrado acércate a cualquiera de nuestras agencias con tu documento de identidad, solicita tu afiliación y empieza a disfrutar de los beneficios.</p>
            <p>Te esperamos.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

