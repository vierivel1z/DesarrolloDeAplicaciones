import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, PiggyBank, Home, CreditCard,
  ShieldCheck, Shield, HeartPulse
} from 'lucide-react'
import PublicHeader from '../components/layout/PublicHeader.jsx'
import PublicFooter from '../components/layout/PublicFooter.jsx'

export default function LandingPage() {
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)

  // Slides del Carrusel Principal (basado en el Préstamo Multired y campañas reales)
  const SLIDES = [
    {
      title: "Impulsa tus planes con el Préstamo Multired",
      desc: "Tu opción para dar el siguiente paso",
      ctaText: "Conoce más",
      bgImage: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?auto=format&fit=crop&q=80&w=600"
    },
    {
      title: "Tarjeta de Crédito BN para tu día a día",
      desc: "Conócela y acompaña tus compras",
      ctaText: "Conoce más",
      bgImage: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=600"
    },
    {
      title: "¿Eres usuario Android? Actualiza tu dispositivo",
      desc: "Desde el 26 de junio de 2026, la App BN solo será compatible con versiones Android 10 o superior.",
      ctaText: "Más información",
      bgImage: "https://images.unsplash.com/photo-1546054454-aa26e2b734c7?auto=format&fit=crop&q=80&w=600"
    },
    {
      title: "Más coberturas y mejores beneficios en cada uno de nuestros seguros",
      desc: "¡Prevén hoy y asegura tu tranquilidad!",
      ctaText: "¿Quieres saber más?",
      bgImage: "https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&q=80&w=600"
    }
  ]

  // 6 Productos Principales
  const PRODUCTOS = [
    { label: "Préstamo BN", icon: PiggyBank },
    { label: "Crédito Hipotecario", icon: Home },
    { label: "Tarjeta de crédito", icon: CreditCard },
    { label: "Seguro para tarjetas", icon: ShieldCheck },
    { label: "Seguro cuota protegida", icon: Shield },
    { label: "Seguro Oncológico", icon: HeartPulse }
  ]

  // Noticias
  const NOTICIAS = [
    {
      date: "23 de junio del 2026",
      title: "Banco de la Nación busca cubrir 23 plazas para su oficina principal",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400"
    },
    {
      date: "23 de junio del 2026",
      title: "Comunicado: Feriado con motivo la celebración del Inti Raymi y el Dia del Cusco",
      image: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&q=80&w=400"
    },
    {
      date: "23 de junio del 2026",
      title: "Comunicado: Día no laborable compensable el 24 de junio 'Día de San Juan' y el Dia del Campesino en Huánuco...",
      image: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=400"
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="gnb-public-page" style={{ background: '#fcfcfc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicHeader />

      {/* 1. Carrusel Principal (Hero) */}
      <section className="bn-hero-section" style={{ position: 'relative', width: '100%', height: '420px', overflow: 'hidden', background: '#fff' }}>
        {SLIDES.map((slide, idx) => (
          <div 
            key={idx} 
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: idx === currentSlide ? 1 : 0,
              transition: 'opacity 0.6s ease-in-out',
              zIndex: idx === currentSlide ? 2 : 1,
              display: 'flex',
              flexDirection: 'row',
              background: 'linear-gradient(110deg, #7c0000 0%, #bf0909 50%, #bf0909 100%)',
              color: '#fff',
              pointerEvents: idx === currentSlide ? 'auto' : 'none'
            }}
          >
            {/* Contenido Izquierdo */}
            <div style={{ flex: '1 1 50%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 8%', boxSizing: 'border-box', zIndex: 10 }}>
              <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '16px', lineHeight: '1.2', color: '#fff' }}>{slide.title}</h1>
              <p style={{ fontSize: '18px', fontWeight: '400', marginBottom: '28px', opacity: '0.9', color: '#fff' }}>{slide.desc}</p>
              <button 
                onClick={() => navigate('/login')}
                style={{ 
                  alignSelf: 'flex-start',
                  background: '#ffffff', 
                  color: '#bf0909', 
                  border: 'none', 
                  fontWeight: '700', 
                  padding: '10px 24px', 
                  borderRadius: '999px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                  transition: 'transform 0.2s'
                }}
              >
                {slide.ctaText}
              </button>
            </div>

            {/* Imagen Derecha Curvada */}
            <div 
              style={{ 
                flex: '1 1 50%', 
                height: '100%',
                position: 'relative', 
                backgroundImage: `url(${slide.bgImage})`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center',
                borderTopLeftRadius: '420px',
                zIndex: 5
              }}
            />
          </div>
        ))}

        {/* Flechas del Carrusel */}
        <button 
          onClick={() => setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)}
          style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.2)', border: 'none', color: '#fff', borderRadius: '50%', width: '36px', height: '36px', display: 'grid', placeItems: 'center', cursor: 'pointer', zIndex: 10 }}
        >
          <ChevronLeft size={20} />
        </button>
        <button 
          onClick={() => setCurrentSlide((prev) => (prev + 1) % SLIDES.length)}
          style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.2)', border: 'none', color: '#fff', borderRadius: '50%', width: '36px', height: '36px', display: 'grid', placeItems: 'center', cursor: 'pointer', zIndex: 10 }}
        >
          <ChevronRight size={20} />
        </button>

        {/* Indicadores Númericos */}
        <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', alignItems: 'center', zIndex: 10 }}>
          {SLIDES.map((_, index) => (
            <button 
              key={index}
              onClick={() => setCurrentSlide(index)}
              style={{
                background: currentSlide === index ? '#ffffff' : 'transparent',
                border: '2px solid #ffffff',
                color: currentSlide === index ? '#bf0909' : '#ffffff',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'grid',
                placeItems: 'center',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </section>

      {/* 2. Sección: Productos Pensados en Ti */}
      <section style={{ padding: '40px 20px', background: '#ffffff', textAlign: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1f2937', marginBottom: '24px' }}>Productos pensados en ti</h2>
          
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {PRODUCTOS.map((prod, idx) => {
              const Icon = prod.icon
              return (
                <div 
                  key={idx} 
                  onClick={() => navigate('/login')}
                  style={{ 
                    flex: '1 1 150px',
                    maxWidth: '180px',
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    padding: '24px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'transform 0.15s'
                  }}
                >
                  <span style={{ color: '#C31A1F', background: '#fdf2f2', padding: '12px', borderRadius: '50%' }}>
                    <Icon size={28} />
                  </span>
                  <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#4b5563' }}>{prod.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 3. Sección: Banners de Beneficios e Inclusión Financiera */}
      <section style={{ padding: '24px 20px', background: '#fcfcfc' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          
          {/* Banner 1 */}
          <div 
            onClick={() => navigate('/login')}
            style={{ 
              flex: '1 1 45%', 
              background: 'linear-gradient(135deg, #7c0000 0%, #bf0909 100%)', 
              borderRadius: '12px', 
              overflow: 'hidden', 
              cursor: 'pointer',
              display: 'flex',
              color: '#fff',
              minHeight: '200px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', opacity: '0.8', marginBottom: '8px' }}>Conoce BN Beneficios</span>
              <h3 style={{ fontSize: '18px', fontWeight: '700', lineHeight: '1.3' }}>Aprovecha las promociones que te ofrece tu tarjeta Débito BN</h3>
            </div>
            <div style={{ flex: 1, backgroundImage: 'url("https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=300")', backgroundSize: 'cover', backgroundPosition: 'center', borderTopLeftRadius: '100px' }} />
          </div>

          {/* Banner 2 */}
          <div 
            onClick={() => navigate('/login')}
            style={{ 
              flex: '1 1 45%', 
              background: 'linear-gradient(135deg, #7c0000 0%, #bf0909 100%)', 
              borderRadius: '12px', 
              overflow: 'hidden', 
              cursor: 'pointer',
              display: 'flex',
              color: '#fff',
              minHeight: '200px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', opacity: '0.8', marginBottom: '8px' }}>Inclusión Financiera</span>
              <h3 style={{ fontSize: '18px', fontWeight: '700', lineHeight: '1.3' }}>Promoviendo servicios financieros de calidad para todos</h3>
            </div>
            <div style={{ flex: 1, backgroundImage: 'url("https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&q=80&w=300")', backgroundSize: 'cover', backgroundPosition: 'center', borderTopLeftRadius: '100px' }} />
          </div>

        </div>
      </section>

      {/* 4. Sección: Noticias y Alto al Fraude */}
      <section style={{ padding: '40px 20px', background: '#ffffff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>Noticias</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {NOTICIAS.map((noti, idx) => (
              <div 
                key={idx}
                onClick={() => navigate('/login')}
                style={{ 
                  background: '#ffffff', 
                  borderRadius: '10px', 
                  border: '1px solid #e5e7eb', 
                  overflow: 'hidden', 
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ height: '140px', backgroundImage: `url(${noti.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>{noti.date}</span>
                  <h4 style={{ fontSize: '13.5px', fontWeight: '600', color: '#374151', lineHeight: '1.4' }}>{noti.title}</h4>
                </div>
              </div>
            ))}

            <div 
              onClick={() => navigate('/login')}
              style={{ 
                background: '#ffffff', 
                borderRadius: '10px', 
                border: '1px solid #e5e7eb', 
                padding: '24px 20px', 
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '2px solid #C31A1F', padding: '6px 12px', borderRadius: '4px' }}>
                <span style={{ fontWeight: '800', color: '#1f2937', fontSize: '13px' }}>ALTO AL FRAUDE</span>
              </div>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
                Tu seguridad es primero, aprende a detectar fraudes y estafas
              </h4>
              <button style={{ background: '#C31A1F', color: '#ffffff', border: 'none', fontWeight: '700', padding: '8px 20px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                Infórmate aquí
              </button>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}

