import React from 'react'

/**
 * Logo oficial de Banco GNB Perú.
 * Presenta las letras "BANCO GNB" con la fuente y colores oficiales,
 * el isotipo del árbol verde y la palabra "PERÚ" debajo.
 *
 * @param {Object} props
 * @param {number}  [props.size=44]          Tamaño/escala del logotipo.
 * @param {string}  [props.variant='dark']   Variante de color ('dark' o 'light').
 */
export default function Logo({ size = 44, variant = 'dark' }) {
  const scale = size / 44
  const isLight = variant === 'light'
  
  const textColorBanco = isLight ? 'rgba(255, 255, 255, 0.9)' : '#5c5c5c'
  const textColorGnb = isLight ? '#ffffff' : '#0a2e5c' // Azul GNB
  const textColorPeru = isLight ? 'rgba(255, 255, 255, 0.75)' : '#7a7a7a'

  return (
    <div 
      style={{ 
        display: 'inline-flex', 
        flexDirection: 'column', 
        alignItems: 'flex-start', 
        lineHeight: 1,
        fontFamily: '"Outfit", "Inter", "Segoe UI", sans-serif',
        userSelect: 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: `${6 * scale}px` }}>
        <span 
          style={{ 
            fontWeight: 300, 
            fontSize: `${22 * scale}px`, 
            color: textColorBanco,
            letterSpacing: '0.5px'
          }}
        >
          BANCO
        </span>
        <span 
          style={{ 
            fontWeight: 800, 
            fontSize: `${22 * scale}px`, 
            color: textColorGnb,
            letterSpacing: '0.5px',
            marginRight: `${2 * scale}px`
          }}
        >
          GNB
        </span>
        
        {/* Isotipo: Árbol GNB verde */}
        <svg
          width={Math.round(24 * scale)}
          height={Math.round(24 * scale)}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', flexShrink: 0 }}
        >
          <rect width="24" height="24" rx="4" fill="#5cb813" />
          {/* Silueta blanca del árbol */}
          <path
            d="M12 4C9.5 4 8.5 5.5 8.5 7C8.5 7.8 9 8.2 9 8.5C9 8.7 8.2 9 7.5 9C6 9 5 10.5 5 12C5 13.5 6.5 14.5 8 14.5C9 14.5 9.5 14 10 14.5C10.5 15 10.5 16 10.5 17.5C10.5 19 11.2 20 12 20C12.8 20 13.5 19 13.5 17.5C13.5 16 13.5 15 14 14.5C14.5 14 15 14.5 16 14.5C17.5 14.5 19 13.5 19 12C19 10.5 18 9 16.5 9C15.8 9 15 8.7 15 8.5C15 8.2 15.5 7.8 15.5 7C15.5 5.5 14.5 4 12 4Z"
            fill="#ffffff"
          />
          <path d="M11.5 14.5H12.5V19.5H11.5V14.5Z" fill="#ffffff" />
        </svg>
      </div>
      
      <span 
        style={{ 
          fontWeight: 600, 
          fontSize: `${9 * scale}px`, 
          color: textColorPeru,
          letterSpacing: `${4.5 * scale}px`,
          paddingLeft: `${3 * scale}px`,
          marginTop: `-${1 * scale}px`,
          alignSelf: 'stretch',
          textAlign: 'center'
        }}
      >
        PERÚ
      </span>
    </div>
  )
}
