import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function Home() {
  // Asegúrate de tener tus imágenes guardadas en public/img/
  const banners = [
    "/img/banner1.jpg", 
    "/img/banner2.jpg"
  ];
  
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1));

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#555', backgroundColor: '#fff', minWidth: '1200px' }}>
      
      {/* 1. Barra Superior Gris */}
      <div style={{ borderBottom: '1px solid #ddd', fontSize: '11px', color: '#888', padding: '8px 0' }}>
        <div style={styles.containerRight}>
          <span style={styles.link}>Quiénes Somos</span> <span style={styles.sep}>|</span>
          <span style={styles.link}>Banco GNB Sudameris</span> <span style={styles.sep}>|</span>
          <span style={styles.link}>Contacto</span> <span style={styles.sep}>|</span>
          <span style={styles.link}>Venta de Adjudicados +</span> <span style={styles.sep}>|</span>
          <span style={styles.link}>Accesos Directos <span style={styles.arrow}>▼</span></span> <span style={styles.sep}>|</span>
          <span style={styles.link}>Buscar 🔍</span>
        </div>
      </div>

      {/* 2. Cabecera Principal */}
      <header style={{ padding: '25px 0' }}>
        <div style={{ ...styles.container, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <div>
             {/* RUTA DE TU LOGO */}
            <img src="/img/logo-gnb.png" alt="Banco GNB" style={{ height: '45px' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '12px', cursor: 'pointer' }}>📍 Red de Agencias</span>
            <span style={{ fontSize: '12px', cursor: 'pointer' }}><Link to="/registro">👤 Regístrate +</Link></span>
            
            <button style={styles.btnOutlineBlue}>
              <strong style={{ fontSize: '14px', marginRight: '5px' }}>S/</strong> Solicita tu<br/>préstamo
            </button>
            <button style={styles.btnSolidBlue}>
              <span style={{ fontSize: '16px', marginRight: '5px' }}>💳</span> Abre tu<br/>cuenta
            </button>
            
            <Link to="/banca-por-internet" style={styles.btnGreen}>
              🔒 Ingresa a Banca<br/>por Internet
            </Link>
          </div>
        </div>
      </header>

      {/* BLOQUE CENTRAL: Contiene Nav, Subnav y Carrusel alineados a la perfección */}
      <div style={styles.contentWrapper}>
        
        {/* 3. Barra de Navegación Verde */}
        <nav style={styles.greenNav}>
          <div style={{ display: 'flex', gap: '40px', paddingLeft: '20px', height: '100%' }}>
            
            <div style={styles.navItemActive}>
              BANCA PERSONAS
              {/* Este div crea el piquito verde hacia abajo */}
              <div style={styles.activeTriangle}></div>
            </div>
            
            <div style={styles.navItem}>BANCA EMPRESAS</div>
            <div style={styles.navItem}>BANCA PENSIONISTA</div>
          </div>
          
          <div style={{ paddingRight: '20px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            Síguenos en: 
            <span style={{ backgroundColor: '#3b5998', color: 'white', padding: '2px 5px', borderRadius: '3px', fontWeight: 'bold' }}>f</span> 
            <span style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', color: 'white', padding: '2px 5px', borderRadius: '3px', fontWeight: 'bold' }}>ig</span>
          </div>
        </nav>

        {/* 4. Submenú Blanco */}
        <div style={styles.subNav}>
          <span style={styles.subNavItem}>Cuentas <span style={styles.arrow}>▼</span></span>
          <span style={styles.subNavItem}>Depósitos <span style={styles.arrow}>▼</span></span>
          <span style={styles.subNavItem}>Préstamos <span style={styles.arrow}>▼</span></span>
          <span style={styles.subNavItem}>Proyectos Inmobiliarios <span style={styles.arrow}>▼</span></span>
          <span style={styles.subNavItem}>Tarjetas <span style={styles.arrow}>▼</span></span>
          <span style={styles.subNavItem}>Seguros <span style={styles.arrow}>▼</span></span>
          <span style={styles.subNavItem}>Servicios <span style={styles.arrow}>▼</span></span>
          <span style={styles.subNavItem}>Canales de Atención <span style={styles.arrow}>▼</span></span>
        </div>

        {/* 5. CARRUSEL GIGANTE */}
        <div style={styles.carouselContainer}>
          <img src={banners[currentSlide]} alt={`Banner ${currentSlide}`} style={styles.carouselImage} />
          
          <button onClick={prevSlide} style={{ ...styles.arrowBtn, left: '10px' }}>&#10094;</button>
          <button onClick={nextSlide} style={{ ...styles.arrowBtn, right: '10px' }}>&#10095;</button>
          
          <div style={styles.sliderDots}>
            {banners.map((_, i) => (
              <span key={i} onClick={() => setCurrentSlide(i)} style={currentSlide === i ? styles.dotActive : styles.dot}></span>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

// Estilos
const styles = {
  // Contenedores Principales (Ancho exacto para que todo encaje)
  container: { width: '1100px', margin: '0 auto' },
  containerRight: { width: '1100px', margin: '0 auto', textAlign: 'right' },
  contentWrapper: { width: '1100px', margin: '0 auto', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  
  // Elementos pequeños
  link: { cursor: 'pointer' },
  sep: { margin: '0 8px', color: '#ccc' },
  arrow: { fontSize: '8px', color: '#999', marginLeft: '3px' },

  // Botones
  btnOutlineBlue: { backgroundColor: 'white', color: '#005b9f', border: '1px solid #005b9f', borderRadius: '4px', padding: '6px 12px', display: 'flex', alignItems: 'center', fontSize: '11px', cursor: 'pointer', textAlign: 'left', lineHeight: '1.2' },
  btnSolidBlue: { backgroundColor: '#005b9f', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', display: 'flex', alignItems: 'center', fontSize: '11px', cursor: 'pointer', textAlign: 'left', lineHeight: '1.2' },
  btnGreen: { backgroundColor: '#7ac043', color: 'white', border: 'none', borderRadius: '4px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', textDecoration: 'none', fontWeight: 'bold', textAlign: 'left', lineHeight: '1.2' },
  
  // Barra Verde
  greenNav: { backgroundColor: '#7ac043', color: 'white', height: '45px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: '5px', borderTopRightRadius: '5px' },
  navItem: { display: 'flex', alignItems: 'center', cursor: 'pointer', height: '100%', fontWeight: 'normal' },
  navItemActive: { display: 'flex', alignItems: 'center', cursor: 'pointer', height: '100%', position: 'relative', fontWeight: 'bold' },
  activeTriangle: { position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '8px solid #7ac043', zIndex: 10 },
  
  // Submenú Blanco
  subNav: { backgroundColor: 'white', padding: '15px 20px', display: 'flex', gap: '25px', fontSize: '12px', borderLeft: '1px solid #eee', borderRight: '1px solid #eee' },
  subNavItem: { cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#666' },
  
  // Carrusel (Se ajustará perfecto al marco de 1100px)
  carouselContainer: { width: '100%', height: '420px', position: 'relative', overflow: 'hidden', backgroundColor: '#eef2f5' },
  carouselImage: { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' },
  arrowBtn: { position: 'absolute', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'transparent', color: '#005b9f', border: 'none', fontSize: '45px', cursor: 'pointer', padding: '10px', textShadow: '0 0 5px rgba(255,255,255,0.8)' },
  
  // Puntitos del Carrusel
  sliderDots: { position: 'absolute', bottom: '15px', width: '100%', textAlign: 'center' },
  dot: { display: 'inline-block', width: '12px', height: '12px', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '50%', margin: '0 6px', cursor: 'pointer' },
  dotActive: { display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#7ac043', borderRadius: '50%', margin: '0 6px', cursor: 'pointer', border: '2px solid white' }
};