import React from 'react'
import { Phone, Clock, MapPin, ExternalLink } from 'lucide-react'

export default function PublicFooter() {
  const customerServiceLinks = [
    { label: 'Información sobre Reclamos y Requerimientos', href: '#' },
    { label: 'Formulario para ingreso de reclamo', href: '#' },
    { label: 'Atención 24 hrs. - Bloqueos Tarjeta Crédito o Débito', href: '#' },
    { label: 'Conducta de Mercado', href: '#' },
    { label: 'Atención Preferencial', href: '#' },
    { label: 'Prevención de Lavado de Activos', href: '#' },
    { label: 'Canal Anticorrupción', href: '#' },
    { label: 'Transparencia Fiscal', href: '#' },
    { label: 'Portal de Orientación y Servicios al Ciudadano (SBS)', href: '#' },
    { label: 'Formulario para ingreso de consultas y/o sugerencias', href: '#' },
    { label: 'Avisos importantes', href: '#' },
    { label: 'Servicios Notariales', href: '#' },
    { label: 'Atención 24 x 7', href: '#' }
  ]

  return (
    <footer className="gnb-public-footer" id="footer">
      <div className="gnb-footer-container">
        
        {/* Columna Izquierda: Horarios */}
        <div className="gnb-footer-col-horarios">
          <h4 className="gnb-footer-heading">Horario de Atención</h4>
          
          <div className="gnb-horario-block">
            <span className="gnb-horario-sub">Banca por Teléfono</span>
            <div className="gnb-horario-item">
              <Phone size={14} className="gnb-horario-icon" />
              <span>Lima: <strong>(01) 616 - 4722</strong></span>
            </div>
            <div className="gnb-horario-item">
              <Phone size={14} className="gnb-horario-icon" />
              <span>Provincia: <strong>0801 - 00088</strong></span>
            </div>
            <div className="gnb-horario-item">
              <Clock size={14} className="gnb-horario-icon" />
              <span>Lun. a Vie. 9:00 a.m. a 6:30 p.m. / Sáb. 9:00 a.m. a 1:00 p.m.</span>
            </div>
          </div>

          <div className="gnb-horario-block">
            <span className="gnb-horario-sub">Red de Agencias</span>
            <div className="gnb-horario-item">
              <MapPin size={14} className="gnb-horario-icon" />
              <span>Lun. a Vie. 9:00 a.m. a 6:00 p.m. / Sáb. 9:00 a.m. a 12:00 p.m.</span>
            </div>
            <div className="gnb-horario-item">
              <MapPin size={14} className="gnb-horario-icon" />
              <span>Av. República de Panamá 3055, San Isidro, Lima - Perú</span>
            </div>
          </div>
        </div>

        {/* Columna Centro: Servicio al Cliente */}
        <div className="gnb-footer-col-servicio">
          <h4 className="gnb-footer-heading">Servicio al Cliente</h4>
          <ul className="gnb-footer-list">
            {customerServiceLinks.map((link, idx) => (
              <li key={idx} className="gnb-footer-list-item">
                <a href={link.href} className="gnb-footer-link">
                  {link.label}
                  {link.label.includes('SBS') && <ExternalLink size={10} style={{ marginLeft: 4, display: 'inline' }} />}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Columna Derecha: Libro de Reclamaciones / Sitemap */}
        <div className="gnb-footer-col-reclamaciones">
          {/* Libro de Reclamaciones Badge */}
          <div className="gnb-libro-badge">
            <a href="#" className="gnb-libro-link">
              <div className="gnb-libro-box">
                <span className="gnb-libro-title">LIBRO DE RECLAMACIONES</span>
                <div className="gnb-libro-icon-row">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                    <path d="M6 6h10M6 10h10M6 14h10" />
                  </svg>
                  <span className="gnb-libro-sub">Conforme al Código de Protección al Consumidor</span>
                </div>
              </div>
            </a>
          </div>

          <div className="gnb-footer-sitemap">
            <a href="#">Mapa del Sitio</a>
            <a href="#">Términos de Uso</a>
            <a href="#">Privacidad</a>
          </div>
        </div>

      </div>

      {/* Franja Verde Superior del Sub-Footer */}
      <div className="gnb-footer-green-bar" />

      {/* Sub-Footer: Derechos Reservados */}
      <div className="gnb-footer-bottom">
        <div className="gnb-footer-container gnb-bottom-row">
          <span>Banco GNB Perú S.A. - RUC 20513074370</span>
          <span>Todos los derechos reservados © 2026 Banco GNB Sudameris S.A.</span>
          <span>Agencia Digital: Zav Group.</span>
        </div>
      </div>
    </footer>
  )
}
