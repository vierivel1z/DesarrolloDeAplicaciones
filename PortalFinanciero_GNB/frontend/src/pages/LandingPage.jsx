import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CreditCard, Wallet, PiggyBank, Send, Smartphone, ShieldCheck,
  TrendingUp, Clock, MapPin, ArrowRight, Lock, BadgePercent, Briefcase,
  ChevronLeft, ChevronRight
} from 'lucide-react'
import PublicHeader from '../components/layout/PublicHeader.jsx'
import PublicFooter from '../components/layout/PublicFooter.jsx'

const SLIDES = [
  {
    tag: 'Ahorro Digital',
    title: 'Cuenta de Ahorros Rolando',
    desc: 'La cuenta de ahorros que te deposita intereses reales todos los días de manera simple.',
    badgeTitle: 'TREA de Ahorro',
    badgeValue: '4.50% Soles',
    ctaText: 'Más información',
    bgImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=1200',
  },
  {
    tag: 'Financiamiento',
    title: 'Solicita tu Préstamo Personal',
    desc: 'Dinero al instante con aprobación 100% en línea y plazos a tu medida sin colas.',
    badgeTitle: 'TCEA Preferencial',
    badgeValue: 'Desde 12.5%',
    ctaText: 'Solicitar ahora',
    bgImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1200',
  },
  {
    tag: 'Inversión Segura',
    title: 'Crece seguro con Plazo Fijo',
    desc: 'La mejor rentabilidad garantizada del mercado para hacer crecer tus ahorros con tranquilidad.',
    badgeTitle: 'Tasa Efectiva Anual',
    badgeValue: 'Hasta 6.25%',
    ctaText: 'Simular depósito',
    bgImage: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=1200',
  },
  {
    tag: 'Exclusividad GNB',
    title: 'Nueva Tarjeta de Crédito Platinum',
    desc: 'Acumula puntos en todas tus compras y viaja cómodo con accesos a salas VIP de aeropuertos.',
    badgeTitle: 'Membresía Anual',
    badgeValue: 'Cero Costo',
    ctaText: 'Pedir tarjeta',
    bgImage: 'https://images.unsplash.com/photo-1589758438368-0ad531db3366?auto=format&fit=crop&q=80&w=1200',
  },
  {
    tag: 'Banca Personas',
    title: 'Traslada tu Cuenta Sueldo a GNB',
    desc: 'Recibe adelantos de sueldo sin cargos adicionales y realiza retiros interbancarios totalmente gratis.',
    badgeTitle: 'Beneficio Exclusivo',
    badgeValue: 'Cero Comisiones',
    ctaText: 'Cambiarme hoy',
    bgImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1200',
  },
  {
    tag: 'Movilidad',
    title: 'Llévate el Auto de tus Sueños',
    desc: 'Financiamos hasta el 100% de tu vehículo nuevo con las cuotas más bajas y flexibles del mercado.',
    badgeTitle: 'Aprobación Rápida',
    badgeValue: 'En menos de 24h',
    ctaText: 'Cotizar auto',
    bgImage: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=1200',
  },
  {
    tag: 'Banca Digital',
    title: 'Lleva tu banco en tu celular',
    desc: 'Descarga nuestra nueva app Banca Móvil GNB y realiza tus operaciones de forma rápida y segura.',
    badgeTitle: 'App Móvil GNB',
    badgeValue: '100% Gratis',
    ctaText: 'Ver beneficios',
    bgImage: 'https://images.unsplash.com/photo-1563013544-824ae1d704d3?auto=format&fit=crop&q=80&w=1200',
  },
  {
    tag: 'Protección',
    title: 'Protege a quienes más amas hoy',
    desc: 'Asegura la tranquilidad de tu familia con las coberturas más completas de seguros de vida.',
    badgeTitle: 'Costo de Seguro',
    badgeValue: 'Desde S/ 1.00 diario',
    ctaText: 'Conocer planes',
    bgImage: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&q=80&w=1200',
  }
]

const PRODUCTOS = [
  { icon: PiggyBank, color: '#e2132b', titulo: 'Cuenta de Ahorros', desc: 'Maneja tu dinero sin costo de mantenimiento y gana intereses todos los días.' },
  { icon: Wallet, color: '#00a9a5', titulo: 'Cuenta Sueldo', desc: 'Recibe tu sueldo, retira sin comisiones y accede a beneficios exclusivos.' },
  { icon: BadgePercent, color: '#8e24aa', titulo: 'Crédito de Consumo', desc: 'El efectivo que necesitas con tasas preferenciales y cuotas a tu medida.' },
  { icon: Briefcase, color: '#f7941e', titulo: 'Crédito Microempresa', desc: 'Impulsa tu negocio con financiamiento ágil pensado para emprendedores.' },
  { icon: Send, color: '#4caf50', titulo: 'Transferencias', desc: 'Mueve tu dinero entre tus cuentas al instante, las 24 horas del día.' },
  { icon: CreditCard, color: '#e6398b', titulo: 'Tarjeta de Débito', desc: 'Paga y compra en todo el país, en tiendas y por internet, con total seguridad.' },
]

const BENEFICIOS = [
  { icon: Smartphone, titulo: '100% Digital', desc: 'Abre productos y opera desde tu celular, sin ir a una agencia.' },
  { icon: ShieldCheck, titulo: 'Seguro y protegido', desc: 'Tus operaciones viajan cifradas y bajo supervisión de la SBS.' },
  { icon: Clock, titulo: 'Disponible 24/7', desc: 'Consulta saldos, paga cuotas y transfiere a cualquier hora.' },
  { icon: MapPin, titulo: 'Cobertura nacional', desc: 'Presencia en todo el país, brindándote solidez y confianza.' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [promoSlide, setPromoSlide] = useState(0)
  const [currentSecSlide, setCurrentSecSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setPromoSlide((prev) => (prev === 0 ? 1 : 0))
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)
  }

  const nextSecSlide = () => {
    setCurrentSecSlide((prev) => (prev + 1) % securitySlides.length)
  }

  const prevSecSlide = () => {
    setCurrentSecSlide((prev) => (prev - 1 + securitySlides.length) % securitySlides.length)
  }

  const securitySlides = [
    {
      title: "NUEVOS LÍMITES DE CANALES DIGITALES",
      body: "Queremos mantenerte informado sobre nuestras medidas de seguridad. A partir del 27.11.2025 se aplicarán cambios a los límites operativos por Canales digitales (Banca Móvil y Banca por internet) establecidos para Personas Naturales.",
      buttons: [{ label: "Más información", href: "#" }]
    },
    {
      title: "RECHAZO DE OPERACIONES CON TARJETAS REALIZADAS CON LECTURA DE BANDA MAGNÉTICA",
      body: "Banco GNB informa que a partir del 25.10.2024, solo serán aceptadas y aprobadas las operaciones presenciales en terminales POS o ATMs, en el Perú o en el extranjero, que se realicen con lectura de Chip o Contactless (sin contacto).",
      buttons: [
        { label: "Más información", href: "#" },
        { label: "Preguntas frecuentes", href: "#" }
      ]
    },
    {
      title: "BANCO GNB EN EL MERCADO DE CAPITALES PERUANO",
      body: "Banco GNB participa activamente en el Mercado de Capitales Peruano para brindarte mayor respaldo y rentabilidad.",
      buttons: [{ label: "Más información", href: "#" }]
    },
    {
      title: "RETIRO DE CTS",
      body: "Banco GNB pone a su disposición el 100% del importe acumulado en su Cuenta CTS conforme a las normativas legales vigentes.",
      buttons: [{ label: "Más información", href: "#" }]
    },
    {
      title: "ALTERNATIVAS DE PAGO",
      body: "Banco GNB brinda facilidades para sus Clientes con dificultades temporales en el pago de sus créditos con diversas reprogramaciones.",
      buttons: [
        { label: "Preguntas frecuentes", href: "#" },
        { label: "Declaración Jurada", href: "#" }
      ]
    },
    {
      title: "AVISO POR CUENTAS INMOVILIZADAS",
      body: "En cumplimiento de la Resolución SBS No.0657-99, hacemos de su conocimiento que estos activos serán transferidos al Fondo de Seguro de Depósitos.",
      buttons: [{ label: "Más información", href: "#" }]
    },
    {
      title: "RECOMENDACIONES DE SEGURIDAD",
      body: "Te recomendamos algunas prácticas a seguir para mantener tu información de forma segura y confidencial. El banco nunca pedirá tus claves.",
      buttons: [{ label: "Más información", href: "#" }]
    }
  ]

  return (
    <div className="lp-page">
      <PublicHeader />

      {/* ===== HERO CAROUSEL (8 ITEMS) ===== */}
      <section className="gnb-carousel-section">
        {SLIDES.map((slide, index) => (
          <div 
            key={index} 
            className={`gnb-carousel-slide ${index === currentSlide ? 'active' : ''}`}
          >
            {/* Background Image */}
            <img src={slide.bgImage} alt={slide.title} className="gnb-slide-img" />
            <div className="gnb-slide-bg-overlay" />
            
            <div className="gnb-slide-content">
              <div className="gnb-slide-text">
                <span className="gnb-slide-tag">{slide.tag}</span>
                <h1 className="gnb-slide-title">{slide.title}</h1>
                <p className="gnb-slide-desc">{slide.desc}</p>
                
                <div className="gnb-slide-badge-box">
                  <span className="gnb-slide-badge-title">{slide.badgeTitle}</span>
                  <span className="gnb-slide-badge-value">{slide.badgeValue}</span>
                </div>
                
                <div>
                  <button className="gnb-btn-carousel-cta" onClick={() => navigate('/login')}>
                    {slide.ctaText} <ArrowRight size={18} style={{ marginLeft: 6 }} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Left/Right navigation arrows */}
        <button 
          className="gnb-carousel-arrow gnb-carousel-arrow-left" 
          onClick={prevSlide}
          aria-label="Anterior"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          className="gnb-carousel-arrow gnb-carousel-arrow-right" 
          onClick={nextSlide}
          aria-label="Siguiente"
        >
          <ChevronRight size={24} />
        </button>

        {/* Indicators/dots at bottom */}
        <div className="gnb-carousel-dots">
          {SLIDES.map((_, index) => (
            <button 
              key={index} 
              className={`gnb-carousel-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Ir al slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 1. Grid de Tarjetas Promocionales (2 Columnas) */}
      <section className="gnb-promos-grid-section">
        {/* Columna Izquierda: Slider de 2 promos */}
        <div className="gnb-promo-card-carousel">
          <a 
            href="#" 
            className={`gnb-promo-slide ${promoSlide === 0 ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); navigate('/login'); }}
          >
            <img 
              src="https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=600" 
              alt="Red de Agencias" 
              className="gnb-promo-img" 
            />
            <div className="gnb-promo-overlay" />
            <div className="gnb-promo-info">
              <h3 className="gnb-promo-title">Nuestra Red de Agencias</h3>
              <p className="gnb-promo-desc">Conoce nuestras oficinas y horarios de atención a nivel nacional.</p>
            </div>
          </a>
          <a 
            href="#" 
            className={`gnb-promo-slide ${promoSlide === 1 ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); navigate('/login'); }}
          >
            <img 
              src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=600" 
              alt="Responsabilidad Social" 
              className="gnb-promo-img" 
            />
            <div className="gnb-promo-overlay" />
            <div className="gnb-promo-info">
              <h3 className="gnb-promo-title">Responsabilidad Social</h3>
              <p className="gnb-promo-desc">Conoce nuestro compromiso con el desarrollo sostenible del país.</p>
            </div>
          </a>
          
          <div className="gnb-promo-dots">
            <button 
              className={`gnb-promo-dot ${promoSlide === 0 ? 'active' : ''}`}
              onClick={() => setPromoSlide(0)}
              aria-label="Promo 1"
            />
            <button 
              className={`gnb-promo-dot ${promoSlide === 1 ? 'active' : ''}`}
              onClick={() => setPromoSlide(1)}
              aria-label="Promo 2"
            />
          </div>
        </div>

        {/* Columna Derecha: Tarjeta Estática (Banca Simple) */}
        <a 
          href="#" 
          className="gnb-promo-card-static" 
          onClick={(e) => { e.preventDefault(); navigate('/login'); }}
        >
          <img 
            src="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=600" 
            alt="Banca Simple" 
            className="gnb-promo-img" 
          />
          <div className="gnb-promo-overlay" />
          <div className="gnb-promo-info" style={{ padding: 24, position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 }}>
            <h3 className="gnb-promo-title">Banca Simple</h3>
            <p className="gnb-promo-desc">Tus operaciones de forma más rápida, sencilla y sin complicaciones.</p>
          </div>
        </a>
      </section>

      {/* 2. Banner de Campaña de Factoring */}
      <section className="gnb-factoring-section">
        <div className="gnb-factoring-banner">
          <div className="gnb-factoring-content">
            <h2 className="gnb-factoring-title">Factoring Banco GNB</h2>
            <p className="gnb-factoring-desc">
              Obtén liquidez inmediata cobrando tus facturas por cobrar de manera ágil, 
              con tasas competitivas y atención personalizada para tu empresa.
            </p>
          </div>
          <button className="gnb-btn-factoring" onClick={() => navigate('/login')}>
            Conoce más
          </button>
        </div>
      </section>

      {/* 3. Recomendaciones de Seguridad Carousel (7 slides) */}
      <section className="gnb-security-section">
        <div className="gnb-security-header">
          <span className="gnb-security-pre">Recomendaciones de Seguridad</span>
          <h2 className="gnb-security-title">Tu Seguridad es Nuestra Prioridad</h2>
          <div className="gnb-security-line" />
          <p className="gnb-security-desc">
            Te recomendamos algunas prácticas a seguir para mantener tu información de forma segura y confidencial.
          </p>
        </div>

        <div className="gnb-security-carousel">
          {securitySlides.map((slide, idx) => (
            <div 
              key={idx} 
              className={`gnb-security-slide ${idx === currentSecSlide ? 'active' : ''}`}
            >
              <h3 className="gnb-sec-slide-title">{slide.title}</h3>
              <p className="gnb-sec-slide-body">{slide.body}</p>
              
              <div className="gnb-sec-slide-btn-row">
                {slide.buttons.map((btn, bidx) => (
                  <button 
                    key={bidx} 
                    className={bidx === 0 ? "gnb-btn-sec-link" : "gnb-btn-sec-link-outline"}
                    onClick={() => navigate('/login')}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Navigation Arrows */}
          <button 
            className="gnb-security-arrow gnb-security-arrow-left" 
            onClick={prevSecSlide}
            aria-label="Anterior recomendación"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            className="gnb-security-arrow gnb-security-arrow-right" 
            onClick={nextSecSlide}
            aria-label="Siguiente recomendación"
          >
            <ChevronRight size={20} />
          </button>

          {/* Indicators */}
          <div className="gnb-security-dots">
            {securitySlides.map((_, idx) => (
              <button 
                key={idx} 
                className={`gnb-security-dot ${idx === currentSecSlide ? 'active' : ''}`}
                onClick={() => setCurrentSecSlide(idx)}
                aria-label={`Recomendación ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Fila de Enlaces Rápidos (6 Iconos Circulares) */}
      <section className="gnb-quick-links-section">
        <div className="gnb-quick-links-grid">
          
          <a href="#" className="gnb-quick-link-item" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
            <div className="gnb-quick-link-circle">
              <ShieldCheck size={28} />
            </div>
            <span className="gnb-quick-link-label">Banca Simple</span>
          </a>

          <a href="#" className="gnb-quick-link-item" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
            <div className="gnb-quick-link-circle">
              <Briefcase size={28} />
            </div>
            <span className="gnb-quick-link-label">Crédito por Convenios</span>
          </a>

          <a href="#" className="gnb-quick-link-item" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
            <div className="gnb-quick-link-circle">
              <Smartphone size={28} />
            </div>
            <span className="gnb-quick-link-label">Servicio al Cliente</span>
          </a>

          <a href="#" className="gnb-quick-link-item" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
            <div className="gnb-quick-link-circle">
              <MapPin size={28} />
            </div>
            <span className="gnb-quick-link-label">Canales de Atención</span>
          </a>

          <a href="#" className="gnb-quick-link-item" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
            <div className="gnb-quick-link-circle">
              <Smartphone size={28} />
            </div>
            <span className="gnb-quick-link-label">Banca Móvil</span>
          </a>

          <a href="#" className="gnb-quick-link-item" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
            <div className="gnb-quick-link-circle">
              <ShieldCheck size={28} />
            </div>
            <span className="gnb-quick-link-label">Políticas de Seguridad</span>
          </a>

        </div>
      </section>

      <PublicFooter />
    </div>
  )
}

