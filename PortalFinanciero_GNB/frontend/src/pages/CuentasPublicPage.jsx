import React from 'react'
import { Link } from 'react-router-dom'
import PublicHeader from '../components/layout/PublicHeader.jsx'
import PublicFooter from '../components/layout/PublicFooter.jsx'

export default function CuentasPublicPage() {
  return (
    <div className="gnb-public-page">
      <PublicHeader />
      
      {/* Breadcrumb area */}
      <div className="gnb-breadcrumb-bar">
        <div className="gnb-container">
          <span className="breadcrumb"><Link to="/">Inicio</Link> &gt; <Link to="/">Banca Personas</Link> &gt; Cuentas</span>
          <div className="font-resizer">
            <span>Ampliar Texto:</span>
            <button className="btn-size-s">T</button>
            <button className="btn-size-m">T</button>
            <button className="btn-size-l">T</button>
          </div>
        </div>
      </div>

      <div className="gnb-container gnb-cuentas-content">
        {/* Left Sidebar */}
        <aside className="gnb-sidebar">
          <ul className="gnb-sidebar-nav">
            <li><Link to="/cuentas" className="active">&raquo; Cuenta Ahorro Rolando</Link></li>
            <li><Link to="/cuentas">&raquo; Cuenta Corriente</Link></li>
            <li><Link to="/cuentas">&raquo; Cuenta Transaccional</Link></li>
            <li><Link to="/cuentas">&raquo; Cuenta Ahorro</Link></li>
            <li><Link to="/cuentas">&raquo; Cuenta Ahorro Hipotecario</Link></li>
            <li><Link to="/cuentas">&raquo; Cuenta Sueldo</Link></li>
            <li><Link to="/cuentas">&raquo; Cuenta CTS</Link></li>
          </ul>
        </aside>

        {/* Center Main Content */}
        <main className="gnb-main-col">
          <h1 className="gnb-page-title">Cuentas</h1>
          <p className="gnb-page-desc">
            Te ofrecemos diversos tipos de cuenta de acuerdo con las operaciones que realizas y los beneficios que buscas.
          </p>
          <img src="/images/cuentas_hero.png" alt="Personas trabajando" className="gnb-hero-img" />
          
          <h3 className="gnb-section-title">Beneficios</h3>
          <ul className="gnb-benefits-list">
            <li>Mejores tasas de ahorro.</li>
            <li>Depósitos ilimitados en ventanilla.</li>
            <li>Abrir Cuentas ahorro, Depósito a Plazo Opción y Depósito a Plazo Fijo desde la comodidad de tu casa a través de Banca por Internet o Banca Móvil.</li>
            <li>Tarjeta de Débito con chip: más seguro y sin ningún costo de afiliación ni mantenimiento.</li>
            <li><strong>Pago Rápido (micropago) es una nueva funcionalidad</strong> de las Tarjetas de Débito que te permitirá exonerar el ingreso de tu clave para transacciones menores o iguales a S/ 150 en los establecimientos afiliados, esto hará que los clientes ahorren tiempo en cola para pagar y disfruten de una mejor experiencia de compra.<br/><br/>
            En los casos que el cliente no reconozca alguna operación bajo la modalidad de Micro Pagos, el Banco, luego de una evaluación e investigación realizada, se hará responsable por dicha operación siempre que el resultado de la investigación de la misma así lo determine.</li>
            <li>Ahora puedes utilizar tu tarjeta Visa sin contacto donde veas el símbolo de Contactless para pagar con rapidez, facilidad y seguridad en los comercios donde ya son aceptados.</li>
          </ul>
        </main>

        {/* Right Sidebar (Cards) */}
        <aside className="gnb-right-cards">
          
          <div className="gnb-info-card">
            <h4>Cuenta Sueldo</h4>
            <img src="/images/cuenta_sueldo.png" alt="Cuenta Sueldo" />
            <p>Tu sueldo seguro y siempre disponible, sin cobro de mantenimiento.</p>
            <Link to="/cuentas" className="gnb-card-link">Obtén más información &raquo;</Link>
          </div>

          <div className="gnb-info-card">
            <h4>Cuenta Transaccional</h4>
            <img src="/images/cuenta_transaccional.png" alt="Cuenta Transaccional" />
            <p>Retiros gratis y sin límites en cualquier cajero a nivel nacional.</p>
            <Link to="/cuentas" className="gnb-card-link">Conoce más beneficios &raquo;</Link>
          </div>

          <div className="gnb-info-card">
            <h4>Ahorro Hipotecario</h4>
            <img src="/images/cuenta_hipotecaria.png" alt="Ahorro Hipotecario" />
            <p>El primer paso para tener tu casa propia. Financiación en soles o dólares.</p>
            <Link to="/cuentas" className="gnb-card-link">A un click de tu vivienda propia &raquo;</Link>
          </div>

          <div className="gnb-security-notice">
            <p>Estimado cliente, pensando en su seguridad debe tener en cuenta las siguientes consideraciones al realizar sus compras por Internet con su tarjeta de Débito :</p>
            <ul>
              <li>Monto máximo de transacciones diarias es de S/ 1,500 ó $ 500.</li>
              <li>Asimismo, estas transacciones no podrán ser mayor a 5 por día.</li>
            </ul>
          </div>

        </aside>
      </div>

      <PublicFooter />
    </div>
  )
}
