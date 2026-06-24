import React from 'react'

/**
 * Logo oficial de Banco de la Nación.
 * Presenta el símbolo oficial (escarapela/cinta roja BN) y el texto correspondiente.
 *
 * @param {Object} props
 * @param {number}  [props.size=44]          Tamaño/escala del logotipo.
 * @param {string}  [props.variant='dark']   Variante de color ('dark' o 'light').
 * @param {string}  [props.subtitle]         Subtítulo opcional para el encabezado (ej. Banca por Internet).
 */
export default function Logo({ size = 44, variant = 'dark', subtitle }) {
  const scale = size / 44
  const isLight = variant === 'light'
  
  const textColorBanco = isLight ? '#ffffff' : '#1f2937'
  const textColorNacion = isLight ? '#ffffff' : '#C31A1F'
  const textColorSub = isLight ? 'rgba(255, 255, 255, 0.8)' : '#64748b'

  return (
    <div 
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: `${10 * scale}px`,
        fontFamily: '"Outfit", "Inter", sans-serif',
        userSelect: 'none',
        textAlign: 'left'
      }}
    >
      {/* Símbolo BN: Onda/Cinta Roja */}
      <svg
        width={Math.round(36 * scale)}
        height={Math.round(36 * scale)}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', flexShrink: 0 }}
      >
        <path
          d="M20,80 C15,80 10,70 15,50 C25,25 50,15 70,15 C85,15 90,25 80,45 C65,70 40,85 20,80 Z"
          fill="#C31A1F"
        />
        <path
          d="M35,65 C40,45 60,30 75,30 C85,30 87,35 80,48 C70,68 50,80 35,65 Z"
          fill={isLight ? '#e52c31' : '#ffffff'}
          opacity="0.9"
        />
      </svg>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
        <span style={{ fontWeight: 800, fontSize: `${18 * scale}px`, color: textColorBanco, letterSpacing: '-0.3px' }}>
          Banco
        </span>
        <span style={{ fontWeight: 500, fontSize: `${15 * scale}px`, color: textColorNacion, letterSpacing: '-0.2px' }}>
          de la Nación
        </span>
        {subtitle && (
          <span style={{ fontWeight: 600, fontSize: `${8.5 * scale}px`, color: textColorSub, letterSpacing: '0.5px', marginTop: `${3 * scale}px`, textTransform: 'uppercase' }}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  )
}
