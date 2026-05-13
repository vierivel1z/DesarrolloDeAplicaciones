import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cuentas, setCuentas] = useState([]);

  useEffect(() => {
    // 1. Verificamos si el usuario está logueado
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      // Si intentan entrar sin loguearse, los pateamos al login
      navigate('/banca-por-internet');
    }

    // 2. Intentamos cargar las cuentas desde Laravel
    axios.get("http://localhost:8000/api/cuentas")
      .then(res => setCuentas(res.data))
      .catch(err => {
        console.log("Usando datos de prueba (API de cuentas aún no creada)");
        // MOCK: Datos falsos temporales para que el diseño se vea bonito
        setCuentas([
          { id: 1, tipo_cuenta: 'Cuenta Ahorro Rolando', numero_cuenta: '000-123456-789', saldo: '15,420.50' },
          { id: 2, tipo_cuenta: 'Cuenta Sueldo', numero_cuenta: '000-987654-321', saldo: '3,210.00' }
        ]);
      });
  }, [navigate]);

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('user'); // Borramos sus datos
    navigate('/banca-por-internet'); // Lo enviamos al login verde
  };

  if (!user) return null; // Evita parpadeos mientras valida la sesión

  return (
    <div style={styles.page}>
      
      {/* BARRA SUPERIOR (HEADER) */}
      <header style={styles.header}>
        <div style={styles.logoArea}>
           {/* Simulamos el logo en la barra */}
           <h2 style={{ margin: 0, color: 'white', fontSize: '20px', letterSpacing: '1px' }}>
             BANCO <strong style={{ color: '#7ac043' }}>GNB</strong>
           </h2>
        </div>
        
        <div style={styles.userArea}>
          <span style={{ marginRight: '20px', fontSize: '14px' }}>
            Último acceso: Hoy, 10:30 a.m.
          </span>
          <button onClick={handleLogout} style={styles.btnLogout}>
            Cerrar Sesión 🚪
          </button>
        </div>
      </header>

      <div style={styles.layout}>
        
        {/* MENÚ LATERAL (SIDEBAR) */}
        <aside style={styles.sidebar}>
          <ul style={styles.menu}>
            <li style={styles.menuItemActive}>📊 Mis Productos</li>
            <li style={styles.menuItem}>💸 Transferencias</li>
            <li style={styles.menuItem}>📄 Pago de Servicios</li>
            <li style={styles.menuItem}>💳 Tarjetas de Crédito</li>
            <li style={styles.menuItem}>⚙️ Configuración</li>
          </ul>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main style={styles.mainContent}>
          
          <div style={styles.welcomeBox}>
            <h1 style={{ margin: 0, color: '#005b9f', fontSize: '24px' }}>
              ¡Hola, {user.name}! 👋
            </h1>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>Bienvenido a tu Banca por Internet</p>
          </div>

          <h2 style={{ color: '#333', fontSize: '18px', marginBottom: '20px' }}>Tus Cuentas</h2>
          
          {/* GRILLA DE CUENTAS */}
          <div style={styles.gridCuentas}>
            {cuentas.length === 0 ? (
              <p style={{ color: '#666' }}>No tienes cuentas registradas.</p>
            ) : (
              cuentas.map(cuenta => (
                <div key={cuenta.id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <span style={styles.tipoCuenta}>{cuenta.tipo_cuenta}</span>
                    <span style={{ color: '#7ac043', fontWeight: 'bold' }}>Activa</span>
                  </div>
                  
                  <div style={{ marginTop: '15px' }}>
                    <p style={styles.numeroCuenta}>N° {cuenta.numero_cuenta}</p>
                    <p style={styles.labelSaldo}>Saldo Disponible</p>
                    <h2 style={styles.saldo}>
                      <span style={{ fontSize: '20px', marginRight: '5px', color: '#666' }}>S/</span> 
                      {cuenta.saldo}
                    </h2>
                  </div>

                  <div style={styles.cardFooter}>
                    <button style={styles.btnAction}>Ver Movimientos</button>
                  </div>
                </div>
              ))
            )}
          </div>

        </main>
      </div>
    </div>
  );
}

// ESTILOS MODERNOS Y PROFESIONALES
const styles = {
  page: { fontFamily: 'Arial, Helvetica, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  
  // Header
  header: { backgroundColor: '#005b9f', color: 'white', height: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 30px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', zIndex: 10 },
  logoArea: { display: 'flex', alignItems: 'center' },
  userArea: { display: 'flex', alignItems: 'center' },
  btnLogout: { backgroundColor: 'transparent', border: '1px solid white', color: 'white', padding: '6px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.3s' },
  
  // Layout Principal
  layout: { display: 'flex', flex: 1 },
  
  // Sidebar
  sidebar: { width: '250px', backgroundColor: 'white', borderRight: '1px solid #ddd', padding: '20px 0' },
  menu: { listStyle: 'none', padding: 0, margin: 0 },
  menuItem: { padding: '15px 25px', color: '#555', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '14px', transition: '0.2s' },
  menuItemActive: { padding: '15px 25px', color: '#005b9f', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '14px', fontWeight: 'bold', backgroundColor: '#eef6fc', borderLeft: '4px solid #7ac043' },
  
  // Contenido Principal
  mainContent: { flex: 1, padding: '40px' },
  welcomeBox: { marginBottom: '30px', backgroundColor: 'white', padding: '20px 30px', borderRadius: '8px', borderLeft: '5px solid #005b9f', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' },
  
  // Tarjetas de Cuentas
  gridCuentas: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "25px" },
  card: { backgroundColor: "white", borderRadius: "8px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", borderTop: "4px solid #7ac043", display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', padding: '15px 20px', borderBottom: '1px solid #eee', backgroundColor: '#fafafa' },
  tipoCuenta: { color: '#005b9f', fontWeight: 'bold', fontSize: '14px' },
  numeroCuenta: { color: '#888', fontSize: '13px', margin: '0 20px 10px 20px' },
  labelSaldo: { color: '#555', fontSize: '12px', margin: '0 20px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  saldo: { color: '#333', fontSize: '28px', margin: '5px 20px 20px 20px' },
  cardFooter: { padding: '15px 20px', backgroundColor: '#f9f9f9', borderTop: '1px solid #eee', textAlign: 'center' },
  btnAction: { backgroundColor: 'white', color: '#005b9f', border: '1px solid #005b9f', padding: '8px 20px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }
};