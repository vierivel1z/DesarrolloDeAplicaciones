import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import BancaInternet from "./pages/banca/BancaInternet";
import Dashboard from "./pages/dashboard/Dashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Vistas Públicas */}
        <Route path="/" element={<Home />} />
        
        {/* Flujo de Acceso */}
        <Route path="/banca-por-internet" element={<BancaInternet />} />

        {/* Vistas Privadas */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}