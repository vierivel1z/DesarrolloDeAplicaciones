import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  MapPin, User, Lock, Search, Facebook, Instagram, ChevronDown, Menu, X 
} from 'lucide-react'
import Logo from '../ui/Logo.jsx'

export default function PublicHeader() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('personas')

  const topLinks = [
    { label: 'Quiénes Somos', href: '#' },
    { label: 'Banco GNB Sudameris', href: '#' },
    { label: 'Contacto', href: '#' },
    { label: 'Venta de Adjudicados +', href: '#' },
    { label: 'Accesos Directos', href: '#' }
  ]

  const categories = [
    'Cuentas', 'Depósitos', 'Préstamos', 'Proyectos Inmobiliarios', 
    'Tarjetas', 'Seguros', 'Servicios', 'Canales de Atención'
  ]

  return (
    <header className="gnb-public-header">
      {/* 1. Franja Gris/Blanca Superior (Utility Bar) */}
      <div className="gnb-top-utility">
        <div className="gnb-header-container">
          <div className="gnb-utility-left">
            {topLinks.map((link, idx) => (
              <React.Fragment key={link.label}>
                <a href={link.href} className="gnb-utility-link">{link.label}</a>
                {idx < topLinks.length - 1 && <span className="gnb-utility-divider">|</span>}
              </React.Fragment>
            ))}
          </div>
          <div className="gnb-utility-right">
            <div className="gnb-search-box">
              <input type="text" placeholder="Buscar" />
              <Search size={14} className="gnb-search-icon" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Barra Media de Branding y Botones Principales */}
      <div className="gnb-top-main">
        <div className="gnb-header-container">
          <button className="gnb-brand-btn" onClick={() => navigate('/')} aria-label="Banco GNB">
            <Logo size={42} variant="dark" />
          </button>

          <div className="gnb-actions-desktop">
            <a href="#" className="gnb-icon-link">
              <MapPin size={16} className="gnb-action-icon-blue" />
              <span>Red de Agencias</span>
            </a>
            
            <a href="#" className="gnb-icon-link">
              <User size={16} className="gnb-action-icon-blue" />
              <span>Regístrate +</span>
            </a>

            {/* Botón Solicita tu préstamo con tag NUEVO */}
            <div className="gnb-badge-btn-wrapper">
              <span className="gnb-badge-tag-new">NUEVO</span>
              <button className="gnb-btn-blue-outline" onClick={() => navigate('/login')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                Solicita tu préstamo
              </button>
            </div>

            {/* Botón Abre tu cuenta */}
            <button className="gnb-btn-blue-outline" onClick={() => navigate('/login')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
              Abre tu cuenta
            </button>

            {/* Botón Banca por Internet (Lock icon + Green background) */}
            <button className="gnb-btn-internet" onClick={() => navigate('/login')}>
              <Lock size={14} style={{ marginRight: 6 }} />
              Ingresa a Banca por Internet
            </button>
          </div>

          {/* Menú móvil burguer */}
          <button 
            className="gnb-mobile-toggle" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* 3. Franja Verde de Segmentos (Banca Personas, Empresas, etc.) */}
      <div className="gnb-segment-bar">
        <div className="gnb-header-container">
          <div className="gnb-segments">
            <button 
              className={`gnb-segment-tab ${activeTab === 'personas' ? 'active' : ''}`}
              onClick={() => setActiveTab('personas')}
            >
              BANCA PERSONAS
            </button>
            <button 
              className={`gnb-segment-tab ${activeTab === 'empresas' ? 'active' : ''}`}
              onClick={() => setActiveTab('empresas')}
            >
              BANCA EMPRESAS
            </button>
            <button 
              className={`gnb-segment-tab ${activeTab === 'pensionista' ? 'active' : ''}`}
              onClick={() => setActiveTab('pensionista')}
            >
              BANCA PENSIONISTA
            </button>
          </div>
          
          <div className="gnb-social-share">
            <span>Síguenos en:</span>
            <a href="#" aria-label="Facebook"><Facebook size={16} /></a>
            <a href="#" aria-label="Instagram"><Instagram size={16} /></a>
          </div>
        </div>
      </div>

      {/* 4. Barra Blanca Inferior (Submenu) */}
      <div className="gnb-submenu-bar">
        <div className="gnb-header-container gnb-submenu-container">
          {categories.map((cat) => (
            <div key={cat} className="gnb-submenu-item">
              <span>{cat}</span>
              <ChevronDown size={12} className="gnb-submenu-arrow" />
            </div>
          ))}
        </div>
      </div>

      {/* Menú Móvil Desplegable */}
      {mobileMenuOpen && (
        <div className="gnb-mobile-menu">
          <div className="gnb-mobile-actions">
            <button className="gnb-btn-internet w-full" onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>
              <Lock size={14} style={{ marginRight: 6 }} />
              Banca por Internet
            </button>
            <button className="gnb-btn-blue-outline w-full mt-2" onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>
              Abre tu cuenta
            </button>
            <button className="gnb-btn-blue-outline w-full mt-2" onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>
              Solicita tu préstamo
            </button>
          </div>
          
          <div className="gnb-mobile-links">
            <a href="#" className="gnb-mobile-link"><MapPin size={16} style={{ marginRight: 8 }} /> Red de Agencias</a>
            <a href="#" className="gnb-mobile-link"><User size={16} style={{ marginRight: 8 }} /> Regístrate +</a>
            <hr />
            {categories.map((cat) => (
              <a key={cat} href="#" className="gnb-mobile-link justify-between">
                <span>{cat}</span>
                <ChevronDown size={14} />
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
