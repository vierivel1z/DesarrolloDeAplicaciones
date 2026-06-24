import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Search, ChevronDown, Menu, X } from 'lucide-react'
import Logo from '../ui/Logo.jsx'

export default function PublicHeader() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('clientes')

  return (
    <header className="gnb-public-header" style={{ fontFamily: '"Outfit", sans-serif', width: '100%', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
      
      {/* 1. Utility Top Bar: República del Perú and Segments */}
      <div className="gnb-top-official-bar" style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb', fontSize: '11px', color: '#4b5563', padding: '6px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px' }}>🇵🇪</span>
            <span style={{ fontWeight: 600, color: '#111827' }}>República del Perú</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button 
              onClick={() => setActiveTab('clientes')} 
              style={{ 
                background: activeTab === 'clientes' ? '#ffffff' : 'transparent', 
                border: 'none', 
                borderBottom: activeTab === 'clientes' ? '2px solid #C31A1F' : 'none',
                color: activeTab === 'clientes' ? '#111827' : '#4b5563',
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: activeTab === 'clientes' ? '700' : '500',
                cursor: 'pointer'
              }}
            >
              Clientes
            </button>
            <button 
              onClick={() => setActiveTab('ciudadanos')} 
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: '#4b5563', 
                padding: '4px 12px', 
                fontSize: '11px',
                fontWeight: '500',
                cursor: 'pointer' 
              }}
            >
              Ciudadanos
            </button>
            <button 
              onClick={() => setActiveTab('gobierno')} 
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: '#4b5563', 
                padding: '4px 12px', 
                fontSize: '11px',
                fontWeight: '500',
                cursor: 'pointer' 
              }}
            >
              Entidades del Gobierno
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <a href="#" style={{ color: '#4b5563', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Portal de Transparencia
              <span style={{ background: '#C31A1F', color: '#fff', fontSize: '9px', fontWeight: 'bold', padding: '1px 5px', borderRadius: '50%' }}>PT</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div style={{ padding: '12px 20px', background: '#ffffff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Logo Banco de la Nación */}
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Logo size={38} variant="dark" />
          </Link>

          {/* Desktop Menu */}
          <nav className="gnb-nav-desktop-main" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <a href="#" style={{ color: '#1f2937', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13.5px' }}>
              Productos y Servicios <ChevronDown size={12} />
            </a>
            <a href="#" style={{ color: '#1f2937', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13.5px' }}>
              Canales Digitales <ChevronDown size={12} />
            </a>
            <a href="#" style={{ color: '#1f2937', fontWeight: '600', textDecoration: 'none', fontSize: '13.5px' }}>
              BN Beneficios
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#4b5563', cursor: 'pointer', fontWeight: '600', fontSize: '13.5px' }}>
              <Search size={14} />
              <span>Buscar</span>
            </div>
          </nav>

          {/* Desktop Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Button Págalo.pe */}
            <a 
              href="https://pagalo.pe" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                background: '#9e1014', 
                color: '#ffffff', 
                textDecoration: 'none',
                fontWeight: '700', 
                padding: '6px 14px', 
                borderRadius: '999px',
                fontSize: '12.5px',
                display: 'inline-flex',
                alignItems: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <span style={{ fontStyle: 'italic', marginRight: '2px' }}>págalo</span>
              <span style={{ fontSize: '9px', verticalAlign: 'super' }}>.pe</span>
            </a>

            {/* Button Banca por Internet */}
            <button 
              onClick={() => navigate('/login')}
              style={{ 
                background: '#C31A1F', 
                color: '#ffffff', 
                border: 'none',
                fontWeight: '700', 
                padding: '6px 16px', 
                borderRadius: '999px',
                fontSize: '12.5px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              Banca por Internet
            </button>

            {/* Mobile menu toggle */}
            <button 
              className="gnb-mobile-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1f2937', padding: '4px' }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div style={{ padding: '16px', background: '#ffffff', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
              style={{ width: '100%', background: '#C31A1F', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '700' }}
            >
              Banca por Internet
            </button>
            <a 
              href="https://pagalo.pe" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ width: '100%', background: '#9e1014', color: '#fff', display: 'block', textAlign: 'center', textDecoration: 'none', padding: '10px', borderRadius: '8px', fontWeight: '700' }}
            >
              págalo.pe
            </a>
            <hr style={{ border: '0', borderTop: '1px solid #e5e7eb' }} />
            <a href="#" style={{ color: '#1f2937', fontWeight: '600', textDecoration: 'none', padding: '6px 0', display: 'block' }}>Productos y Servicios</a>
            <a href="#" style={{ color: '#1f2937', fontWeight: '600', textDecoration: 'none', padding: '6px 0', display: 'block' }}>Canales Digitales</a>
            <a href="#" style={{ color: '#1f2937', fontWeight: '600', textDecoration: 'none', padding: '6px 0', display: 'block' }}>BN Beneficios</a>
          </div>
        </div>
      )}
    </header>
  )
}
