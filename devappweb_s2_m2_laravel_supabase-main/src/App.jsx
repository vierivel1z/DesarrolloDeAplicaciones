import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import BancaInternet from "./pages/banca/BancaInternet";
import Dashboard from "./pages/dashboard/Dashboard";
import Registro from "./pages/banca/Registro"; // <-- 1. Agregamos la importación aquí

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Vistas Públicas */}
        <Route path="/" element={<Home />} />
        
        {/* 2. Línea corregida con la sintaxis exacta de React Router */}
        <Route path="/registro" element={<Registro />} />
        
        {/* Flujo de Acceso */}
        <Route path="/banca-por-internet" element={<BancaInternet />} />

        {/* Vistas Privadas */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}