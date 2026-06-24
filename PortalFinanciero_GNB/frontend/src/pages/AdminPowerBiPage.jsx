import { useState } from 'react'
import {
  BarChart3, Link2, Database, CheckCircle2, Copy, ExternalLink,
  Globe, Server, Key, ChevronDown, ChevronRight,
} from 'lucide-react'
import PageLayout from '../components/layout/PageLayout.jsx'
import Card from '../components/ui/Card.jsx'

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8002'

const ENDPOINTS = [
  {
    id: 'clientes',
    label: 'Clientes',
    url: `${BASE_URL}/admin/powerbi/clientes`,
    desc: 'Listado plano de todos los clientes del banco con datos demográficos.',
    campos: ['codcliente', 'nombres', 'apellidos', 'tipo_documento', 'nro_documento', 'email', 'telefono', 'estado', 'fecha_registro'],
  },
  {
    id: 'ahorros',
    label: 'Cuentas de Ahorro',
    url: `${BASE_URL}/admin/powerbi/ahorros`,
    desc: 'Todas las cuentas de ahorro con saldos actuales, tasa y tipo de producto.',
    campos: ['codcuentaahorro', 'codcliente', 'cliente', 'tipo', 'moneda', 'saldo', 'tasa', 'estado', 'fecha_apertura'],
  },
  {
    id: 'creditos',
    label: 'Cartera de Créditos',
    url: `${BASE_URL}/admin/powerbi/creditos`,
    desc: 'Cartera completa de créditos con saldos, mora, calificación SBS y tasas.',
    campos: ['codcuentacredito', 'codcliente', 'cliente', 'monto_otorgado', 'saldo_capital', 'pago_pendiente', 'tasa_tea', 'plazo_meses', 'dias_atraso', 'calificacion_sbs', 'estado', 'fecha_desembolso'],
  },
  {
    id: 'operaciones',
    label: 'Transacciones',
    url: `${BASE_URL}/admin/powerbi/operaciones`,
    desc: 'Historial de transacciones bancarias (últimas 5,000) para análisis de flujos.',
    campos: ['codoperacion', 'tipo_operacion', 'monto', 'moneda', 'fecha_operacion', 'descripcion', 'codcliente', 'cliente'],
  },
]

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button className="pbi-copy-btn" onClick={handleCopy} title="Copiar URL">
      {copied ? <CheckCircle2 size={14} color="#73b71c" /> : <Copy size={14} />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  )
}

function CollapsibleStep({ number, title, children }) {
  const [open, setOpen] = useState(number === 1)
  return (
    <div className="pbi-step">
      <button className="pbi-step-header" onClick={() => setOpen((v) => !v)}>
        <span className="pbi-step-num">{number}</span>
        <span className="pbi-step-title">{title}</span>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {open && <div className="pbi-step-body">{children}</div>}
    </div>
  )
}

export default function AdminPowerBiPage() {
  const [activeTab, setActiveTab] = useState('web')

  return (
    <PageLayout>
      <div className="bbva-hello">
        <h1>Conectividad con Power BI</h1>
        <p>Integra los datos del Banco de la Nación directamente en tus reportes de Power BI Desktop.</p>
      </div>

      {/* Selector de método */}
      <div className="pbi-tabs">
        <button
          className={`pbi-tab ${activeTab === 'web' ? 'active' : ''}`}
          onClick={() => setActiveTab('web')}
        >
          <Globe size={16} /> Opción A — Endpoints Web JSON
        </button>
        <button
          className={`pbi-tab ${activeTab === 'db' ? 'active' : ''}`}
          onClick={() => setActiveTab('db')}
        >
          <Database size={16} /> Opción B — Base de Datos PostgreSQL
        </button>
      </div>

      {/* ── OPCIÓN A: Endpoints REST ─────────────────────────────────────────── */}
      {activeTab === 'web' && (
        <div className="pbi-content">
          <div className="pbi-intro-alert">
            <BarChart3 size={18} />
            <div>
              <strong>Antes de conectar:</strong> Inicia sesión como <code>admin / admin1234</code> en
              el portal y copia tu token JWT. Power BI necesitará enviarlo en el encabezado
              <code>Authorization: Bearer &lt;token&gt;</code>
            </div>
          </div>

          {/* Tarjetas de endpoints */}
          <Card title="Endpoints disponibles" icon={<Link2 size={18} />}>
            <div className="pbi-endpoints-grid">
              {ENDPOINTS.map((ep) => (
                <div key={ep.id} className="pbi-endpoint-card">
                  <div className="pbi-endpoint-header">
                    <span className="pbi-method-badge">GET</span>
                    <span className="pbi-endpoint-label">{ep.label}</span>
                  </div>
                  <p className="pbi-endpoint-desc">{ep.desc}</p>
                  <div className="pbi-endpoint-url">
                    <code>{ep.url}</code>
                    <CopyBtn text={ep.url} />
                  </div>
                  <div className="pbi-endpoint-fields">
                    {ep.campos.map((f) => (
                      <span key={f} className="pbi-field-chip">{f}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Guía paso a paso */}
          <Card title="Guía de conexión en Power BI Desktop" icon={<ExternalLink size={18} />}>
            <div className="pbi-steps">
              <CollapsibleStep number={1} title="Abrir Power BI Desktop e ir a 'Obtener datos'">
                <p>En la cinta de opciones, haz clic en <strong>Inicio → Obtener datos → Web</strong>.</p>
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='80' viewBox='0 0 400 80'%3E%3Crect width='400' height='80' rx='8' fill='%23f0f4f8'/%3E%3Crect x='10' y='20' width='120' height='40' rx='6' fill='%230a2e5c'/%3E%3Ctext x='70' y='44' text-anchor='middle' fill='white' font-family='sans-serif' font-size='13' font-weight='bold'%3EObtener datos%3C/text%3E%3Crect x='145' y='20' width='80' height='40' rx='6' fill='%2373b71c'/%3E%3Ctext x='185' y='44' text-anchor='middle' fill='white' font-family='sans-serif' font-size='13'%3EWeb%3C/text%3E%3C/svg%3E"
                  alt="Obtener datos desde Web" className="pbi-step-img" />
              </CollapsibleStep>

              <CollapsibleStep number={2} title="Elegir 'Avanzado' e ingresar la URL y cabeceras">
                <p>Selecciona <strong>Avanzado</strong>. En el campo URL pega una de las URLs de arriba. Luego agrega un encabezado HTTP:</p>
                <div className="pbi-code-block">
                  <span className="pbi-code-key">Nombre del encabezado:</span> <code>Authorization</code><br />
                  <span className="pbi-code-key">Valor:</span> <code>Bearer {'<tu-token-jwt>'}</code>
                </div>
                <p className="pbi-hint">💡 Obtén tu token ingresando al portal y revisando <code>localStorage → hb_token</code> en las DevTools del navegador.</p>
              </CollapsibleStep>

              <CollapsibleStep number={3} title="Transformar los datos en el Editor de Power Query">
                <p>Power BI cargará el JSON automáticamente. En el editor de Power Query:</p>
                <ol className="pbi-ol">
                  <li>Haz clic en el ícono de tabla junto al campo <strong>List</strong> o <strong>Record</strong>.</li>
                  <li>Selecciona <strong>A la tabla</strong> y luego expande las columnas.</li>
                  <li>Renombra las columnas y ajusta los tipos de datos según sea necesario.</li>
                  <li>Haz clic en <strong>Cerrar y aplicar</strong>.</li>
                </ol>
              </CollapsibleStep>

              <CollapsibleStep number={4} title="Crear relaciones entre tablas">
                <p>En la vista de <strong>Modelo</strong>, relaciona las tablas usando:</p>
                <ul className="pbi-ul">
                  <li><code>clientes.codcliente</code> → <code>ahorros.codcliente</code></li>
                  <li><code>clientes.codcliente</code> → <code>creditos.codcliente</code></li>
                  <li><code>clientes.codcliente</code> → <code>operaciones.codcliente</code></li>
                </ul>
              </CollapsibleStep>

              <CollapsibleStep number={5} title="Construir visualizaciones">
                <p>Con los datos relacionados puedes crear:</p>
                <ul className="pbi-ul">
                  <li>📊 Gráfico de barras: Saldos de ahorros por tipo de producto</li>
                  <li>🍩 Gráfico circular: Distribución de mora SBS</li>
                  <li>📈 Gráfico de líneas: Evolución de operaciones por fecha</li>
                  <li>🗂️ Tabla: Ranking de clientes por saldo total</li>
                </ul>
              </CollapsibleStep>
            </div>
          </Card>
        </div>
      )}

      {/* ── OPCIÓN B: Conexión directa a PostgreSQL ──────────────────────────── */}
      {activeTab === 'db' && (
        <div className="pbi-content">
          <div className="pbi-intro-alert pbi-intro-alert--blue">
            <Server size={18} />
            <div>
              <strong>Conexión directa a PostgreSQL:</strong> Más rápida para grandes volúmenes de datos.
              Requiere acceso de red a la base de datos y el driver de PostgreSQL instalado en Power BI.
            </div>
          </div>

          <Card title="Parámetros de conexión" icon={<Key size={18} />}>
            <div className="pbi-db-params">
              {[
                { label: 'Servidor', value: 'Ver archivo .env → DB_HOST', sensitive: false },
                { label: 'Puerto', value: '5432', sensitive: false },
                { label: 'Base de datos', value: 'bd_core_financiero_andino (o el nombre configurado)', sensitive: false },
                { label: 'Usuario', value: 'Ver archivo .env → DB_USER', sensitive: true },
                { label: 'Contraseña', value: 'Ver archivo .env → DB_PASSWORD', sensitive: true },
                { label: 'Modo SSL', value: 'Requerir (Require)', sensitive: false },
              ].map((p) => (
                <div key={p.label} className="pbi-db-param-row">
                  <span className="pbi-db-param-key">{p.label}</span>
                  <code className={`pbi-db-param-val ${p.sensitive ? 'pbi-db-param-val--sensitive' : ''}`}>
                    {p.value}
                  </code>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Guía de conexión PostgreSQL en Power BI Desktop" icon={<ExternalLink size={18} />}>
            <div className="pbi-steps">
              <CollapsibleStep number={1} title="Instalar el driver PostgreSQL ODBC">
                <p>Descarga e instala el driver ODBC de PostgreSQL desde:</p>
                <a href="https://www.postgresql.org/ftp/odbc/versions/" target="_blank" rel="noopener noreferrer" className="pbi-link">
                  postgresql.org/ftp/odbc/versions <ExternalLink size={12} />
                </a>
                <p className="pbi-hint">💡 Descarga el instalador MSI para Windows de 64 bits que coincida con tu versión de PostgreSQL.</p>
              </CollapsibleStep>

              <CollapsibleStep number={2} title="Conectar desde Power BI Desktop">
                <p>En Power BI: <strong>Inicio → Obtener datos → Base de datos PostgreSQL</strong>.</p>
                <p>Ingresa el servidor y el nombre de la base de datos usando los parámetros de arriba.</p>
              </CollapsibleStep>

              <CollapsibleStep number={3} title="Seleccionar las tablas del banco">
                <p>En el navegador de Power BI, selecciona las tablas que necesites:</p>
                <div className="pbi-table-chips">
                  {['dcliente', 'dcuentaahorro', 'dcuentacredito', 'doperacion', 'dcuota', 'dpago'].map((t) => (
                    <span key={t} className="pbi-table-chip"><Database size={11} /> {t}</span>
                  ))}
                </div>
              </CollapsibleStep>

              <CollapsibleStep number={4} title="Programar actualizaciones automáticas">
                <p>Para mantener los datos actualizados, publica el reporte en <strong>Power BI Service</strong> y configura una <strong>Puerta de enlace de datos local (On-premises gateway)</strong> para refrescar automáticamente.</p>
              </CollapsibleStep>
            </div>
          </Card>
        </div>
      )}
    </PageLayout>
  )
}
