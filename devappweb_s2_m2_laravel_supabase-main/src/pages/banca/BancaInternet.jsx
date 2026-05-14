import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // 1. Importamos Axios

export default function BancaInternet() {
  const navigate = useNavigate();

  // 2. Creamos estados para capturar los inputs y manejar errores
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // 3. Actualizamos la función handleLogin para usar Axios
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Limpiamos errores anteriores

    try {
      // Hacemos la petición POST al API de Laravel
      // (Usuario -> email, Clave Token -> password)
      const response = await axios.post("http://localhost:8000/api/login", {
        email: email,
        password: password,
      });

      // Si es exitoso, Laravel nos responde con status: true
      if (response.data.status) {
        console.log("Login Exitoso:", response.data);
        
        // Opcional: Guardar datos del usuario en localStorage para el Dashboard
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Redirigimos al Dashboard
        navigate('/dashboard');
      }

    } catch (error) {
      console.error("Error en login:", error.response);
      
      // Capturamos el mensaje de error que definimos en Laravel (401)
      if (error.response && error.response.status === 401) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("Ocurrió un error inesperado. Intente más tarde.");
      }
    }
  };

  return (
    <div style={styles.container}>
      
      {/* Contenedor Principal Central */}
      <div style={styles.wrapper}>
        
        {/* LOGO SUPERIOR - Arreglado quitando el filtro */}
        <div style={{ marginBottom: '40px' }}>
          <img src="/img/logo-gnb2.png" alt="Banco GNB" style={{ height: '40px' }} />
        </div>

        <div style={styles.content}>
          {/* COLUMNA IZQUIERDA: Formulario */}
          <div style={styles.formSection}>
            <h3 style={styles.title}>ACCESO A BANCA POR INTERNET</h3>
            
            <form onSubmit={handleLogin}>
              
              {/* Mensaje de Error (si existe) */}
              {errorMessage && (
                <div style={styles.errorAlert}>{errorMessage}</div>
              )}

              {/* Input Usuario (Mapeado a email) */}
              <div style={styles.inputGroup}>
                <input 
                  type="text" 
                  placeholder="Usuario (ej: admin@gnb.com)" 
                  style={styles.input} 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)} // Capturamos el valor
                />
                <div style={styles.iconBox}>👤</div>
              </div>

              {/* Input Clave Token (Mapeado a password) */}
              <div style={styles.inputGroup}>
                <input 
                  type="password" 
                  placeholder="Clave Token (ej: 123456)" 
                  style={styles.input} 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} // Capturamos el valor
                />
                <div style={styles.iconBox}>🔑</div>
              </div>

              {/* Botón */}
              <button type="submit" style={styles.btnContinue}>CONTINUAR</button>
            </form>

            {/* Enlaces Azules */}
            <div style={styles.links}>
              <a href="#" style={styles.link}>Acceder sin token (sólo con contraseña)</a>
              <a href="#" style={styles.link}>Vinculación de token Banca por Internet</a>
              <a href="#" style={styles.link}>Olvidé mi contraseña</a>
            </div>
          </div>

          {/* LÍNEA DIVISORIA */}
          <div style={styles.divider}></div>

          {/* COLUMNA DERECHA: Textos */}
          <div style={styles.infoSection}>
            <h3 style={styles.titleRight}>BIENVENIDO A LA BANCA POR<br/>INTERNET BANCO GNB</h3>
            
            <p style={styles.text}>Una nueva y mejor manera de estar<br/>conectados.</p>
            <p style={styles.text}>Comodidad y rapidez para realizar tus<br/>operaciones con total seguridad, los 365<br/>días del año.</p>
            <p style={styles.text}>Si aún no estás registrado acércate a<br/>cualquiera de nuestras agencias con tu<br/>documento de identidad, solicita tu<br/>afiliación y empieza a disfrutar de los<br/>beneficios.</p>
            <p style={styles.text}>Te esperamos.</p>
          </div>
        </div>

        {/* FOOTER: Teléfonos */}
        <div style={styles.footer}>
          <div style={styles.footerIcon}>☎️</div>
          <div>
            <strong>Lima: (511) 6164722 &nbsp; Provincias: 0801-00088</strong><br/>
            Banco GNB Perú S.A. - R.U.C. 20513074370
          </div>
        </div>

      </div>
    </div>
  );
}

// Estilos (se mantienen igual, solo agregué un estilo de error)
const styles = {
  container: { backgroundColor: "#7AB83F", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: 'Arial, Helvetica, sans-serif' },
  wrapper: { width: "100%", maxWidth: "850px", padding: "20px", position: 'relative' },
  content: { display: "flex", gap: "50px", alignItems: "flex-start" },
  
  // Columna Izquierda
  formSection: { flex: 1, maxWidth: "340px" },
  title: { color: "white", fontSize: "14px", fontWeight: "bold", marginBottom: "20px", letterSpacing: "0.5px" },
  
  // Estilo para la Alerta de Error
  errorAlert: { backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '2px', marginBottom: '15px', fontSize: '13px', border: '1px solid #f5c6cb', textAlign: 'center' },

  // Inputs Blancos con Icono
  inputGroup: { display: "flex", width: "100%", marginBottom: "15px", backgroundColor: "white", borderRadius: "2px", overflow: "hidden" },
  input: { flex: 1, padding: "12px", border: "none", outline: "none", color: "#555", fontSize: '14px' },
  iconBox: { width: "40px", backgroundColor: "#e0e0e0", display: "flex", justifyContent: "center", alignItems: "center", borderLeft: "1px solid #ccc", color: "#666", fontSize: "16px" },
  
  // Botón y Enlaces
  btnContinue: { width: "100%", padding: "12px", backgroundColor: "#0071b9", color: "white", border: "none", fontWeight: "bold", fontSize: "14px", cursor: "pointer", marginTop: "5px", borderRadius: "2px" },
  links: { marginTop: "20px", display: "flex", flexDirection: "column", gap: "6px" },
  link: { color: "#005b9f", fontSize: "13px", textDecoration: "underline", fontWeight: "bold" },
  
  // Línea Divisoria
  divider: { width: "1px", backgroundColor: "rgba(255,255,255,0.4)", minHeight: "350px", marginTop: "10px" },
  
  // Columna Derecha
  infoSection: { flex: 1, color: "white", paddingTop: "10px" },
  titleRight: { fontSize: "14px", fontWeight: "bold", marginBottom: "25px", lineHeight: "1.4", letterSpacing: "0.5px" },
  text: { fontSize: "14px", lineHeight: "1.4", marginBottom: "18px" },

  // Footer
  footer: { marginTop: '80px', color: 'white', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '10px' },
  footerIcon: { backgroundColor: 'white', color: '#7ac043', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px' }
};