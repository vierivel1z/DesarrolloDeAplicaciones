import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api"; // 1. Usamos nuestra instancia configurada de Axios

export default function Registro() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensajeError, setMensajeError] = useState("");
  
  // Estado para controlar el Modal
  const [showModal, setShowModal] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMensajeError(""); 

    try {
      // 2. Apuntamos al endpoint usando 'api'
      const response = await api.post("/register", {
        name, email, password
      });
      
      if (response.data.status) {
        // 🔑 ¡MAGIA DE SESIÓN TRAS REGISTRO!
        // Guardamos el token y el usuario que Laravel generó automáticamente
        localStorage.setItem('GNB_TOKEN', response.data.access_token);
        localStorage.setItem('GNB_USER', JSON.stringify(response.data.user));

        // Activamos el Modal de éxito
        setShowModal(true);
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.errors) {
        // Captura errores específicos de validación de Laravel (ej: correo ya tomado)
        const errores = error.response.data.errors;
        setMensajeError(Object.values(errores).flat().join(" "));
      } else {
        setMensajeError("El correo ya está en uso o los datos son inválidos.");
      }
    }
  };

  const irAlDashboard = () => {
    setShowModal(false);
    // 🚀 Al hacer clic, va DIRECTO al Dashboard sin pasar por el Login verde
    navigate('/dashboard'); 
  };

  return (
    <div style={{ backgroundColor: "#7ac043", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: 'Arial' }}>
      
      {/* FORMULARIO DE REGISTRO */}
      <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "8px", width: "100%", maxWidth: "400px", boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }}>
        <h2 style={{ color: "#005b9f", textAlign: "center", marginBottom: "20px" }}>Abre tu Cuenta GNB</h2>
        
        {mensajeError && <p style={{ color: '#d9534f', fontSize: '14px', textAlign: 'center', backgroundColor: '#fdf7f7', padding: '10px', borderRadius: '4px' }}>{mensajeError}</p>}
        
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="text" placeholder="Nombre completo" required value={name} onChange={(e) => setName(e.target.value)} style={styles.input} />
          <input type="email" placeholder="Correo (Usuario)" required value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} />
          <input type="password" placeholder="Crea una Clave (mín 6)" required minLength="6" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} />
          <button type="submit" style={styles.btnAzul}>Crear Cuenta y Recibir Bono</button>
        </form>
        
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <Link to="/banca-por-internet" style={{ color: "#005b9f", fontSize: "14px", textDecoration: 'none', fontWeight: 'bold' }}>Ya tengo cuenta, ingresar</Link>
        </div>
      </div>

      {/* MODAL DE ÉXITO */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.checkCircle}>
              <span style={{ fontSize: '40px', color: 'white' }}>✓</span>
            </div>
            
            <h2 style={{ color: '#333', marginTop: '20px', marginBottom: '10px' }}>¡Registro Exitoso!</h2>
            <p style={{ color: '#666', lineHeight: '1.5', marginBottom: '25px' }}>
              Tu usuario ha sido creado. Te hemos asignado una <strong>Cuenta de Ahorro Digital</strong> con un bono de bienvenida de <strong>S/ 1,500.00</strong> en Supabase para que pruebes la plataforma.
            </p>
            
            {/* 3. Cambiamos la función al botón para ir al Dashboard */}
            <button onClick={irAlDashboard} style={styles.btnVerde}>
              Ir a mi Cuenta Bancaria
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// Los estilos (const styles) se quedan EXACTAMENTE IGUALES a como los tenías.
// ESTILOS
const styles = {
  input: { padding: "12px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "14px", outline: 'none' },
  btnAzul: { padding: "12px", backgroundColor: "#005b9f", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: '15px' },
  
  // Estilos del Modal
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: 'white', padding: '40px', borderRadius: '12px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', animation: 'fadeIn 0.3s ease-out' },
  checkCircle: { width: '80px', height: '80px', backgroundColor: '#7ac043', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto', boxShadow: '0 4px 10px rgba(122, 192, 67, 0.3)' },
  btnVerde: { width: '100%', padding: "12px", backgroundColor: "#7ac043", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: '15px' }
};