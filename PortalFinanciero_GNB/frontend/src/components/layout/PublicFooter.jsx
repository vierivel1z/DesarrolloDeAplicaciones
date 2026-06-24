import React from 'react'
import { Phone, Clock, MapPin, ExternalLink, BookOpen } from 'lucide-react'

export default function PublicFooter() {
  const nosotrosLinks = [
    { label: '¿Quiénes somos?', href: '#' },
    { label: '60 Años BN', href: '#' },
    { label: 'Directorio de Funcionarios', href: '#' },
    { label: 'Integridad BN', href: '#' },
    { label: 'Buen Gobierno corporativo', href: '#' },
    { label: 'Memoria Anual', href: '#' },
    { label: 'Inclusión Financiera', href: '#' }
  ]

  const informacionInteresLinks = [
    { label: 'Cronograma de pagos', href: '#' },
    { label: 'Tasas y Comisiones', href: '#' },
    { label: 'Ver tu Código Interbancario', href: '#' },
    { label: 'Tipo de Cambio', href: '#' },
    { label: 'Facturación Electrónica', href: '#' },
    { label: 'Fideicomisos', href: '#' },
    { label: 'Enlaces de interés', href: '#' }
  ]

  return (
    <footer className="gnb-public-footer" style={{ background: '#f3f4f6', borderTop: '1px solid #e5e7eb', fontFamily: '"Outfit", sans-serif', width: '100%', color: '#4b5563' }}>
      
      {/* 1. Sección de Columnas */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', display: 'flex', flexWrap: 'wrap', gap: '32px', justifyContent: 'space-between' }}>
        
        {/* Col 1: Nosotros */}
        <div style={{ flex: '1 1 200px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' }}>Nosotros</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {nosotrosLinks.map((link, idx) => (
              <li key={idx} style={{ fontSize: '13px' }}>
                <a href={link.href} style={{ color: '#4b5563', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.color = '#C31A1F'} onMouseLeave={(e) => e.target.style.color = '#4b5563'}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 2: Información de Interés */}
        <div style={{ flex: '1 1 200px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' }}>Información de interés</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {informacionInteresLinks.map((link, idx) => (
              <li key={idx} style={{ fontSize: '13px' }}>
                <a href={link.href} style={{ color: '#4b5563', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.color = '#C31A1F'} onMouseLeave={(e) => e.target.style.color = '#4b5563'}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: Canales y Contáctanos */}
        <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937', marginBottom: '12px' }}>Canales presenciales</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li style={{ fontSize: '13px' }}><a href="#" style={{ color: '#4b5563', textDecoration: 'none' }}>Agentes</a></li>
              <li style={{ fontSize: '13px' }}><a href="#" style={{ color: '#4b5563', textDecoration: 'none' }}>Cajeros</a></li>
              <li style={{ fontSize: '13px' }}><a href="#" style={{ color: '#4b5563', textDecoration: 'none' }}>Agencias</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937', marginBottom: '12px' }}>Contáctanos</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li style={{ fontSize: '13px' }}><a href="#" style={{ color: '#4b5563', textDecoration: 'none' }}>Atención al Cliente</a></li>
              <li style={{ fontSize: '13px' }}><a href="#" style={{ color: '#4b5563', textDecoration: 'none' }}>Mesa de partes digital</a></li>
            </ul>
          </div>
        </div>

        {/* Col 4: Servicio al Cliente */}
        <div style={{ flex: '1 1 250px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' }}>Servicio al Cliente</h4>
          <p style={{ fontSize: '13px', lineHeight: '1.4', marginBottom: '12px' }}>
            Consultas, uso en el extranjero y bloqueo de tarjetas las 24 horas.
          </p>
          <div style={{ fontSize: '13px', marginBottom: '6px' }}>
            Línea gratuita: <strong style={{ color: '#1f2937' }}>0800-10700</strong>
          </div>
          <div style={{ fontSize: '13px', lineHeight: '1.4', marginBottom: '16px' }}>
            Teléfonos: <strong style={{ color: '#1f2937' }}>01-440-5305 / 01-442-4470 / 1820</strong>
          </div>
          
          {/* Libro de Reclamaciones */}
          <div style={{ display: 'inline-block' }}>
            <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', textDecoration: 'none', color: '#1f2937', fontWeight: '600', fontSize: '12.5px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <BookOpen size={18} style={{ color: '#C31A1F' }} />
              <div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#C31A1F' }}>LIBRO DE RECLAMACIONES</div>
                <div style={{ fontSize: '8px', color: '#71717a' }}>Conforme al Código de Protección al Consumidor</div>
              </div>
            </a>
          </div>
        </div>

      </div>

      {/* Franja Roja BN */}
      <div className="gnb-footer-green-bar" style={{ height: '4px', background: '#C31A1F' }} />

      {/* 2. Sección Negra de Oficinas y Transparencia */}
      <div style={{ background: '#374151', color: '#d1d5db', padding: '30px 20px', fontSize: '12px', lineHeight: '1.6' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '24px' }}>
          
          {/* Datos Dirección */}
          <div style={{ flex: '1 1 60%' }}>
            <div style={{ fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
              Banco de la Nación | Sector Economía y Finanzas | Perú
            </div>
            <div>
              <strong>Oficina principal:</strong> Av. Javier Prado Este 2499, San Borja
            </div>
            <div>
              <strong>Atención en oficina principal:</strong> lunes a viernes de 8:30 a 17:30, refrigerio de 13:00 a 14:00
            </div>
            <div>
              <strong>Mesa de partes presencial:</strong> Av. De la Arqueología 130, San Borja, atención: lunes a viernes de 8:30 a 16:30
            </div>
            <div>
              <strong>Central telefónica administrativa:</strong> 01 519 2000
            </div>
          </div>

          {/* Transparencia */}
          <div style={{ flex: '1 1 30%', textAlign: 'right' }}>
            <div style={{ fontWeight: '700', color: '#ffffff', marginBottom: '4px' }}>
              Funcionarios responsables del:
            </div>
            <div>
              Portal de Transparencia y Entrega de Información
            </div>
            <div style={{ marginTop: '8px', color: '#9ca3af', fontSize: '11px' }}>
              Última actualización: 23 de junio del 2026
            </div>
          </div>

        </div>

        {/* Derechos Reservados Centrados */}
        <div style={{ textAlign: 'center', borderTop: '1px solid #4b5563', marginTop: '20px', paddingTop: '16px', color: '#9ca3af', fontSize: '11.5px' }}>
          © BN | Todos los derechos reservados, Banco de la Nación - RUC 20100030595
        </div>
      </div>

    </footer>
  )
}
