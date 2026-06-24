import { Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute from './components/layout/PrivateRoute.jsx'
import Header from './components/layout/Header.jsx'
import { useUI } from './context/UIContext.jsx'

import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import CuentasPublicPage from './pages/CuentasPublicPage.jsx'
import HomePage from './pages/HomePage.jsx'
import CuentasAhorroPage from './pages/CuentasAhorroPage.jsx'
import MovimientosPage from './pages/MovimientosPage.jsx'
import CuentasCreditoPage from './pages/CuentasCreditoPage.jsx'
import CuotasCreditoPage from './pages/CuotasCreditoPage.jsx'
import OperacionesPage from './pages/OperacionesPage.jsx'
import TransferenciaPage from './pages/TransferenciaPage.jsx'
import PagoCreditoPage from './pages/PagoCreditoPage.jsx'
import PagoServiciosPage from './pages/PagoServiciosPage.jsx'
import SolicitarCreditoPage from './pages/SolicitarCreditoPage.jsx'
import AdminClientesPage from './pages/AdminClientesPage.jsx'
import AdminCreditosPage from './pages/AdminCreditosPage.jsx'
import AdminPowerBiPage from './pages/AdminPowerBiPage.jsx'

// Layout para las rutas autenticadas: cabecera Banco de la Nación + contenido con margen variable.
function PrivateLayout({ children }) {
  const { sidebarCollapsed } = useUI()
  return (
    <PrivateRoute>
      <Header />
      <main 
        className="bbva-main"
        style={{
          marginLeft: sidebarCollapsed ? '70px' : '250px',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div className="bbva-container">{children}</div>
      </main>
    </PrivateRoute>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cuentas" element={<CuentasPublicPage />} />

      {/* Privadas */}
      <Route path="/inicio" element={<PrivateLayout><HomePage /></PrivateLayout>} />
      <Route path="/cuentas/ahorro" element={<PrivateLayout><CuentasAhorroPage /></PrivateLayout>} />
      <Route path="/cuentas/ahorro/:cod/movimientos" element={<PrivateLayout><MovimientosPage /></PrivateLayout>} />
      <Route path="/cuentas/credito" element={<PrivateLayout><CuentasCreditoPage /></PrivateLayout>} />
      <Route path="/cuentas/credito/:cod/cuotas" element={<PrivateLayout><CuotasCreditoPage /></PrivateLayout>} />

      <Route path="/operaciones" element={<PrivateLayout><OperacionesPage /></PrivateLayout>} />
      <Route path="/operaciones/transferencia" element={<PrivateLayout><TransferenciaPage /></PrivateLayout>} />
      <Route path="/operaciones/pago-credito" element={<PrivateLayout><PagoCreditoPage /></PrivateLayout>} />
      <Route path="/operaciones/pago-credito/:cod" element={<PrivateLayout><PagoCreditoPage /></PrivateLayout>} />
      <Route path="/operaciones/pago-servicios" element={<PrivateLayout><PagoServiciosPage /></PrivateLayout>} />
      <Route path="/creditos/solicitar" element={<PrivateLayout><SolicitarCreditoPage /></PrivateLayout>} />

      {/* Rutas de Administrador */}
      <Route path="/admin/clientes" element={<PrivateLayout><AdminClientesPage /></PrivateLayout>} />
      <Route path="/admin/creditos" element={<PrivateLayout><AdminCreditosPage /></PrivateLayout>} />
      <Route path="/admin/powerbi" element={<PrivateLayout><AdminPowerBiPage /></PrivateLayout>} />

      <Route path="*" element={<Navigate to="/inicio" replace />} />
    </Routes>
  )
}
