import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogOut, UserCog, Eye, EyeOff, ChevronDown, BarChart3, Users, Database, LayoutDashboard, CreditCard } from 'lucide-react'
import { useHBAuth } from '../../hooks/useHBAuth.js'
import { useUI } from '../../context/UIContext.jsx'
import Logo from '../ui/Logo.jsx'

// Pestañas para clientes normales
const TABS_CLIENTE = [
  { label: 'Inicio', to: '/inicio', match: ['/inicio'] },
  { label: 'Cuentas', to: '/cuentas/ahorro', match: ['/cuentas/ahorro'] },
  { label: 'Préstamos', to: '/cuentas/credito', match: ['/cuentas/credito'] },
  { label: 'Operaciones', to: '/operaciones', match: ['/operaciones', '/creditos/solicitar'] },
]

// Pestañas para administradores
const TABS_ADMIN = [
  { label: 'Dashboard', to: '/inicio', match: ['/inicio'], icon: LayoutDashboard },
  { label: 'Clientes', to: '/admin/clientes', match: ['/admin/clientes'], icon: Users },
  { label: 'Solicitudes', to: '/admin/creditos', match: ['/admin/creditos'], icon: CreditCard },
  { label: 'Power BI', to: '/admin/powerbi', match: ['/admin/powerbi'], icon: BarChart3 },
]

export default function Header() {
  const { user, logout } = useHBAuth()
  const { hideAmounts, toggleHideAmounts } = useUI()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuUser, setMenuUser] = useState(false)

  const isAdmin = user?.codcliente === 'admin'
  const TABS = isAdmin ? TABS_ADMIN : TABS_CLIENTE

  useEffect(() => { setMenuUser(false) }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const iniciales = (user?.nombre || 'A')
    .split(/[\s,]+/).filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase()

  const isActive = (tab) => tab.match.some((m) => location.pathname.startsWith(m))

  return (
    <header>
      <div className="hb-franja-top" />

      {/* Barra superior */}
      <div className="bbva-topbar">
        <div className="bbva-topbar-inner">
          <button className="bbva-brand" onClick={() => navigate('/inicio')} aria-label="Inicio">
            <Logo size={36} variant="light" subtitle={isAdmin ? 'ADMINISTRACIÓN' : 'BANCA POR INTERNET'} />
          </button>

          <div className="bbva-topbar-right">
            {/* Sólo el cliente puede ocultar importes */}
            {!isAdmin && (
              <button className="bbva-hide-toggle" onClick={toggleHideAmounts} title="Ocultar importes">
                {hideAmounts ? <EyeOff size={16} /> : <Eye size={16} />}
                <span>Ocultar importes</span>
                <span className={`bbva-switch ${hideAmounts ? 'on' : ''}`}>
                  <span className="bbva-switch-dot" />
                </span>
              </button>
            )}

            {isAdmin && (
              <span className="hb-admin-badge">
                <Database size={13} /> Panel Administrativo
              </span>
            )}

            <div className="bbva-user-wrap">
              <button className="bbva-user" onClick={() => setMenuUser((v) => !v)}>
                <span className={`bbva-avatar ${isAdmin ? 'bbva-avatar--admin' : ''}`}>{iniciales}</span>
                <span className="bbva-user-text">
                  <strong>{user?.nombre || 'Usuario'}</strong>
                  <small>{isAdmin ? 'Administrador' : user?.codcliente}</small>
                </span>
                <ChevronDown size={16} />
              </button>
              {menuUser && (
                <div className="bbva-user-menu">
                  {!isAdmin && (
                    <button onClick={() => navigate('/inicio')}>
                      <UserCog size={16} /> Actualiza tus datos
                    </button>
                  )}
                  <button onClick={handleLogout}>
                    <LogOut size={16} /> Salir
                  </button>
                </div>
              )}
            </div>

            <button className="bbva-salir" onClick={handleLogout}>
              <LogOut size={16} /> Salir
            </button>
          </div>
        </div>
      </div>

      {/* Barra de pestañas */}
      <nav className="bbva-tabs">
        <div className="bbva-tabs-inner">
          {TABS.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.to}
                className={`bbva-tab ${isActive(t) ? 'active' : ''}`}
                onClick={() => navigate(t.to)}
              >
                {Icon && <Icon size={14} style={{ marginRight: '5px', verticalAlign: 'middle' }} />}
                {t.label}
              </button>
            )
          })}
        </div>
      </nav>
    </header>
  )
}
