import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogOut, UserCog, Eye, EyeOff, ChevronDown, BarChart3, Users, Database, LayoutDashboard, CreditCard, Menu, X, Home, Wallet, ArrowLeftRight } from 'lucide-react'
import { useHBAuth } from '../../hooks/useHBAuth.js'
import { useUI } from '../../context/UIContext.jsx'
import Logo from '../ui/Logo.jsx'

// Pestañas para clientes normales con iconos
const TABS_CLIENTE = [
  { label: 'Inicio', to: '/inicio', match: ['/inicio'], icon: Home },
  { label: 'Cuentas', to: '/cuentas/ahorro', match: ['/cuentas/ahorro'], icon: Wallet },
  { label: 'Préstamos', to: '/cuentas/credito', match: ['/cuentas/credito'], icon: CreditCard },
  { label: 'Operaciones', to: '/operaciones', match: ['/operaciones', '/creditos/solicitar'], icon: ArrowLeftRight },
]

// Pestañas para administradores con iconos
const TABS_ADMIN = [
  { label: 'Dashboard', to: '/inicio', match: ['/inicio'], icon: LayoutDashboard },
  { label: 'Clientes', to: '/admin/clientes', match: ['/admin/clientes'], icon: Users },
  { label: 'Solicitudes', to: '/admin/creditos', match: ['/admin/creditos'], icon: CreditCard },
  { label: 'Power BI', to: '/admin/powerbi', match: ['/admin/powerbi'], icon: BarChart3 },
]

export default function Header() {
  const { user, logout } = useHBAuth()
  const { hideAmounts, toggleHideAmounts, sidebarCollapsed, toggleSidebar } = useUI()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuUser, setMenuUser] = useState(false)

  const isAdmin = user?.codcliente === 'admin'
  const TABS = isAdmin ? TABS_ADMIN : TABS_CLIENTE

  useEffect(() => { 
    setMenuUser(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const iniciales = (user?.nombre || 'A')
    .split(/[\s,]+/).filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase()

  const isActive = (tab) => tab.match.some((m) => location.pathname.startsWith(m))

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50 }}>
      <div className="hb-franja-top" />

      {/* Barra superior Rebrandeada a Rojo BN y reestructurada */}
      <div 
        style={{ 
          background: 'var(--hb-grad)', 
          color: '#ffffff',
          height: '65px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '2px solid #ffcb05'
        }}
      >
        <div 
          style={{ 
            maxWidth: '1180px', 
            width: '100%', 
            padding: '0 20px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between'
          }}
        >
          {/* Bloque Izquierdo: Hamburguesa, Logo, Divisor, Etiqueta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={toggleSidebar}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-label="Alternar menú lateral"
            >
              <Menu size={22} />
            </button>

            <button 
              onClick={() => navigate('/inicio')} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
              aria-label="Ir al inicio"
            >
              <Logo size={32} variant="light" />
            </button>

            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.25)' }} />

            <div style={{
              background: 'rgba(255, 255, 255, 0.12)',
              padding: '3px 9px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: '800',
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              {isAdmin ? 'Módulo Administrativo' : 'Banca por Internet'}
            </div>
          </div>

          {/* Bloque Derecho: Ocultar importes (switch) y Menú de Perfil (dropdown) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            
            {/* Ocultar Importes switch */}
            {!isAdmin && (
              <button 
                onClick={toggleHideAmounts} 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.18)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                title="Ocultar importes"
              >
                {hideAmounts ? <EyeOff size={15} /> : <Eye size={15} />}
                <span>Ocultar importes</span>
                <div style={{
                  width: '28px',
                  height: '14px',
                  borderRadius: '999px',
                  background: hideAmounts ? '#ffcb05' : 'rgba(255,255,255,0.3)',
                  position: 'relative',
                  transition: 'background 0.2s',
                  marginLeft: '4px'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    left: '2px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    transform: hideAmounts ? 'translateX(14px)' : 'translateX(0)',
                    transition: 'transform 0.2s'
                  }} />
                </div>
              </button>
            )}

            {/* Menú Dropdown del Usuario */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setMenuUser((v) => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  background: '#ffcb05',
                  color: '#1f2937', 
                  display: 'grid', 
                  placeItems: 'center', 
                  fontWeight: 'bold',
                  fontSize: '12px'
                }}>
                  {iniciales}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>
                  {primerNombre(user?.nombre)}
                </span>
                <ChevronDown size={14} style={{ opacity: 0.8, transform: menuUser ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
              </button>

              {menuUser && (
                <>
                  <div onClick={() => setMenuUser(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 60 }} />
                  
                  <div 
                    style={{
                      position: 'absolute',
                      top: '115%',
                      right: 0,
                      background: '#ffffff',
                      color: '#1f2937',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                      minWidth: '220px',
                      padding: '16px',
                      zIndex: 70,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid #e5e7eb' }}>
                      <span style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '50%', 
                        background: '#C31A1F', 
                        color: '#ffffff', 
                        display: 'grid', 
                        placeItems: 'center', 
                        fontWeight: 'bold',
                        fontSize: '13px' 
                      }}>
                        {iniciales}
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <strong style={{ fontSize: '12.5px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.nombre}</strong>
                        <small style={{ fontSize: '10.5px', color: '#6b7280' }}>{isAdmin ? 'Administrador' : `Código: ${user?.codcliente}`}</small>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {!isAdmin && (
                        <button 
                          onClick={() => { navigate('/inicio'); setMenuUser(false); }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: '100%',
                            background: 'none',
                            border: 'none',
                            color: '#4b5563',
                            fontSize: '12.5px',
                            fontWeight: '600',
                            padding: '8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; e.currentTarget.style.color = '#C31A1F'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#4b5563'; }}
                        >
                          <UserCog size={14} />
                          <span>Actualizar mis datos</span>
                        </button>
                      )}
                    </div>

                    <button 
                      onClick={handleLogout}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%',
                        background: '#9e1014',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '12.5px',
                        fontWeight: 'bold',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#C31A1F'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#9e1014'}
                    >
                      <LogOut size={14} />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Menú Lateral Fijo y Colapsable (Hamburger Sidebar) */}
      <div 
        style={{
          position: 'fixed',
          top: '65px',
          left: 0,
          bottom: 0,
          width: sidebarCollapsed ? '70px' : '250px',
          background: '#1f2937',
          color: '#ffffff',
          zIndex: 100,
          boxShadow: '2px 0 10px rgba(0,0,0,0.05)',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 0',
          boxSizing: 'border-box',
          borderRight: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        {/* Resumen del Usuario */}
        <div style={{ 
          padding: sidebarCollapsed ? '0 0 16px 0' : '0 16px 16px 16px', 
          borderBottom: '1px solid rgba(255,255,255,0.08)', 
          marginBottom: '20px',
          display: 'flex',
          justifyContent: sidebarCollapsed ? 'center' : 'flex-start'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              width: '38px', 
              height: '38px', 
              borderRadius: '50%', 
              background: '#C31A1F', 
              color: '#fff', 
              display: 'grid', 
              placeItems: 'center', 
              fontWeight: 'bold',
              fontSize: '14px',
              flexShrink: 0
            }}>
              {iniciales}
            </span>
            {!sidebarCollapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user?.nombre}
                </span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                  {isAdmin ? 'Administrador' : user?.codcliente}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Enlaces de Navegación Verticales */}
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '6px', padding: sidebarCollapsed ? '0 8px' : '0 12px' }}>
          {TABS.map((t) => {
            const Icon = t.icon
            const active = isActive(t)
            return (
              <button
                key={t.to}
                onClick={() => navigate(t.to)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  gap: sidebarCollapsed ? '0' : '12px',
                  width: '100%',
                  background: active ? '#C31A1F' : 'transparent',
                  color: active ? '#ffffff' : 'rgba(255,255,255,0.85)',
                  border: 'none',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: active ? 'bold' : '500',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                title={sidebarCollapsed ? t.label : ''}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent'
                }}
              >
                {active && !sidebarCollapsed && (
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: '#ffcb05' }} />
                )}
                {Icon && <Icon size={18} style={{ color: active ? '#ffffff' : 'rgba(255,255,255,0.6)', flexShrink: 0 }} />}
                {!sidebarCollapsed && <span>{t.label}</span>}
              </button>
            )
          })}
        </div>

        {/* Botón de Cerrar Sesión inferior */}
        <div style={{ padding: '20px 12px 0 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              gap: sidebarCollapsed ? '0' : '12px',
              width: '100%',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#ffffff',
              border: 'none',
              padding: '12px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title={sidebarCollapsed ? 'Cerrar sesión' : ''}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(195, 26, 31, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
          >
            <LogOut size={18} style={{ color: '#C31A1F', flexShrink: 0 }} />
            {!sidebarCollapsed && <span>Cerrar sesión</span>}
          </button>
        </div>

      </div>
    </header>
  )
}

function primerNombre(nombre) {
  if (!nombre) return 'Usuario'
  const parts = nombre.split(',')
  const np = (parts[1] || parts[0]).trim().split(/\s+/)[0]
  return np || 'Usuario'
}
