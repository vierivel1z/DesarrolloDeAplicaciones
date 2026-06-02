import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api"; // 1. Reemplazamos axios crudo por nuestra instancia
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cuentas, setCuentas] = useState([]);
  const [saldoTotal, setSaldoTotal] = useState(0);
  const [activeView, setActiveView] = useState('resumen'); 

  const dataGrafico = [
    { mes: 'Ene', saldo: 12000 }, { mes: 'Feb', saldo: 11500 },
    { mes: 'Mar', saldo: 14200 }, { mes: 'Abr', saldo: 13800 },
    { mes: 'May', saldo: 15420 }, { mes: 'Jun', saldo: 19740 }
  ];

  useEffect(() => {
    // 2. Leemos la llave unificada 'GNB_USER' que guardamos al iniciar sesión
    const storedUser = localStorage.getItem('GNB_USER');
    
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      // 3. ¡Mucho más limpio y seguro! 
      // El interceptor adjunta el Token. Laravel sabe exactamente qué usuario es.
      api.get('/cuentas')
        .then(res => {
          // El controlador modificado devuelve directamente el arreglo de cuentas
          setCuentas(res.data);
          
          const totalSoles = res.data
            .filter(c => c.moneda === 'S/')
            .reduce((acc, current) => acc + parseFloat(current.saldo), 0);
          setSaldoTotal(totalSoles);
        })
        .catch(err => {
          console.error("Error cargando cuentas:", err);
          // Si el token expiró o es inválido, limpiamos y mandamos al login
          if (err.response && err.response.status === 401) {
            handleLogout();
          }
        });
    } else {
      navigate('/banca-por-internet');
    }
  }, [navigate]);

  // 4. Limpieza correcta del localStorage al cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('GNB_TOKEN');
    localStorage.removeItem('GNB_USER');
    navigate('/banca-por-internet');
  };

  if (!user) return null;

  // El resto de tu render (return div, header, layout, mainContent, styles) 
  // se mantiene EXACTAMENTE IGUAL.

  return (
    <div style={styles.page}>
      
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.logoArea}>
           <h2 style={{ margin: 0, color: 'white', fontSize: '20px', letterSpacing: '1px' }}>
             BANCO <strong style={{ color: '#7ac043' }}>GNB</strong>
           </h2>
        </div>
        <div style={styles.userArea}>
          <span style={{ marginRight: '20px', fontSize: '13px' }}>Último acceso: Hoy, 10:30 a.m.</span>
          <button onClick={handleLogout} style={styles.btnLogout}>Cerrar Sesión 🚪</button>
        </div>
      </header>

      <div style={styles.layout}>
        
        {/* SIDEBAR (MENÚ LATERAL DINÁMICO) */}
        <aside style={styles.sidebar}>
          <ul style={styles.menu}>
            <li onClick={() => setActiveView('resumen')} style={activeView === 'resumen' ? styles.menuItemActive : styles.menuItem}>📊 Mis Productos</li>
            <li onClick={() => setActiveView('transferencias')} style={activeView === 'transferencias' ? styles.menuItemActive : styles.menuItem}>💸 Transferencias</li>
            <li onClick={() => setActiveView('pagos')} style={activeView === 'pagos' ? styles.menuItemActive : styles.menuItem}>📄 Pago de Servicios</li>
            <li onClick={() => setActiveView('tarjetas')} style={activeView === 'tarjetas' ? styles.menuItemActive : styles.menuItem}>💳 Tarjetas de Crédito</li>
          </ul>
        </aside>

        {/* CONTENIDO PRINCIPAL DINÁMICO */}
        <main style={styles.mainContent}>
          
          {/* =========================================
              VISTA 1: RESUMEN FINANCIERO (Gráficos)
             ========================================= */}
          {activeView === 'resumen' && (
            <>
              <div style={styles.headerDashboard}>
                <div>
                  <h1 style={{ margin: 0, color: '#333', fontSize: '26px' }}>Hola, {user.name}</h1>
                  <p style={{ margin: '5px 0 0 0', color: '#666' }}>Aquí tienes el resumen de tus productos financieros.</p>
                </div>
                
                <div style={styles.saldoTotalCard}>
                  <p style={{ margin: 0, color: '#eef6fc', fontSize: '13px' }}>Patrimonio Total Estimado</p>
                  <h2 style={{ margin: '5px 0 0 0', color: 'white', fontSize: '28px' }}>
                    S/ {saldoTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}
                  </h2>
                </div>
              </div>

              <div style={styles.dashboardGrid}>
                {/* Mis Cuentas */}
                <div style={styles.columnaCuentas}>
                  <h3 style={{ marginTop: 0, color: '#555' }}>Mis Cuentas</h3>
                  {cuentas.map(cuenta => (
                    <div key={cuenta.id} style={styles.cardCuenta}>
                      <div style={styles.cardHeader}>
                        <span style={styles.tipoCuenta}>{cuenta.tipo_cuenta}</span>
                        <span style={{ fontSize: '12px', color: '#888' }}>{cuenta.numero_cuenta}</span>
                      </div>
                      <div style={styles.cardBody}>
                        <p style={styles.labelSaldo}>Saldo Disponible</p>
                        <h2 style={styles.saldo}>
                          <span style={styles.moneda}>{cuenta.moneda}</span> 
                          {parseFloat(cuenta.saldo).toLocaleString('en-US', {minimumFractionDigits: 2})}
                        </h2>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Estadísticas */}
                <div style={styles.columnaEstadisticas}>
                  <div style={styles.cardGrafico}>
                    <h3 style={{ margin: '0 0 20px 0', color: '#555', fontSize: '16px' }}>Evolución de Saldo en Soles</h3>
                    <div style={{ width: '100%', height: 250 }}>
                      <ResponsiveContainer>
                        <AreaChart data={dataGrafico} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#7ac043" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#7ac043" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={(value) => `S/${value/1000}k`} />
                          <Tooltip />
                          <Area type="monotone" dataKey="saldo" stroke="#7ac043" fillOpacity={1} fill="url(#colorSaldo)" strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* =========================================
              VISTA 2: TRANSFERENCIAS
             ========================================= */}
          {activeView === 'transferencias' && (
            <div style={styles.cardVista}>
              <h2 style={styles.tituloVista}>Transferencias a Terceros</h2>
              <hr style={styles.lineaDivisoria}/>
              
              <div style={styles.formulario}>
                <label style={styles.labelForm}>Cuenta de Origen:</label>
                <select style={styles.inputForm}>
                  {cuentas.map(c => <option key={c.id}>{c.tipo_cuenta} - {c.numero_cuenta} (S/ {c.saldo})</option>)}
                </select>

                <label style={styles.labelForm}>Cuenta de Destino (CCI o Número):</label>
                <input type="text" placeholder="Ej: 104-123456-789" style={styles.inputForm} />

                <label style={styles.labelForm}>Monto a Transferir (S/):</label>
                <input type="number" placeholder="0.00" style={styles.inputForm} />

                <button style={styles.btnVerde}>Realizar Transferencia</button>
              </div>
            </div>
          )}

          {/* =========================================
              VISTA 3: PAGO DE SERVICIOS
             ========================================= */}
          {activeView === 'pagos' && (
            <div style={styles.cardVista}>
              <h2 style={styles.tituloVista}>Pago de Servicios</h2>
              <hr style={styles.lineaDivisoria}/>
              
              <div style={styles.formulario}>
                <label style={styles.labelForm}>Seleccione el Servicio:</label>
                <select style={styles.inputForm}>
                  <option>Luz del Sur</option>
                  <option>Enel</option>
                  <option>Sedapal</option>
                  <option>Claro / Movistar</option>
                  <option>Universidad / Instituto</option>
                </select>

                <label style={styles.labelForm}>Código de Suministro / Alumno:</label>
                <input type="text" placeholder="Ej: 1234567" style={styles.inputForm} />

                <button style={styles.btnAzul}>Buscar Recibo</button>
              </div>
            </div>
          )}

          {/* =========================================
              VISTA 4: TARJETAS
             ========================================= */}
          {activeView === 'tarjetas' && (
            <div style={styles.cardVista}>
              <h2 style={styles.tituloVista}>Tarjetas de Crédito</h2>
              <hr style={styles.lineaDivisoria}/>
              <p style={{color: '#666'}}>No tienes tarjetas de crédito asociadas en este momento. Acércate a una agencia para solicitar una.</p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

// ESTILOS (Los mismos de antes + estilos para los formularios nuevos)
const styles = {
  page: { fontFamily: 'Arial, sans-serif', backgroundColor: '#f0f4f8', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: { backgroundColor: '#005b9f', color: 'white', height: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 30px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', zIndex: 10 },
  btnLogout: { backgroundColor: 'transparent', border: '1px solid white', color: 'white', padding: '6px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  layout: { display: 'flex', flex: 1 },
  
  sidebar: { width: '240px', backgroundColor: 'white', borderRight: '1px solid #e1e8ed', padding: '20px 0' },
  menu: { listStyle: 'none', padding: 0, margin: 0 },
  menuItem: { padding: '15px 25px', color: '#555', cursor: 'pointer', borderBottom: '1px solid #f9f9f9', fontSize: '14px' },
  menuItemActive: { padding: '15px 25px', color: '#005b9f', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', backgroundColor: '#eef6fc', borderLeft: '4px solid #7ac043' },
  
  mainContent: { flex: 1, padding: '30px', maxWidth: '1200px', margin: '0 auto', width: '100%' },
  
  headerDashboard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  saldoTotalCard: { backgroundColor: '#005b9f', padding: '20px 30px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,91,159,0.3)', minWidth: '250px', textAlign: 'right' },
  
  dashboardGrid: { display: 'flex', gap: '30px', flexWrap: 'wrap' },
  columnaCuentas: { flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '15px' },
  columnaEstadisticas: { flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: '20px' },
  
  cardCuenta: { backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', borderLeft: '4px solid #7ac043' },
  cardHeader: { backgroundColor: '#fafafa', padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tipoCuenta: { color: '#005b9f', fontWeight: 'bold', fontSize: '15px' },
  cardBody: { padding: '20px' },
  labelSaldo: { margin: 0, color: '#888', fontSize: '12px', textTransform: 'uppercase' },
  saldo: { margin: '5px 0 0 0', color: '#333', fontSize: '26px' },
  moneda: { fontSize: '18px', color: '#666', marginRight: '5px' },
  
  cardGrafico: { backgroundColor: 'white', borderRadius: '10px', padding: '25px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },

  // Estilos Nuevos para Vistas de Transferencia y Pagos
  cardVista: { backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  tituloVista: { color: '#005b9f', marginTop: 0, marginBottom: '15px', fontSize: '22px' },
  lineaDivisoria: { border: 'none', borderTop: '1px solid #eee', marginBottom: '25px' },
  formulario: { display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px' },
  labelForm: { fontSize: '14px', color: '#555', fontWeight: 'bold' },
  inputForm: { padding: '12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', outline: 'none' },
  btnVerde: { padding: '14px', backgroundColor: '#7ac043', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', fontSize: '15px' },
  btnAzul: { padding: '14px', backgroundColor: '#005b9f', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', fontSize: '15px' }
};