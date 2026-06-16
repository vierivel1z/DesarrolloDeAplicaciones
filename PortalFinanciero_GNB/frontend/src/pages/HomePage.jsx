import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Wallet, CreditCard, Send, Receipt, FileText, FilePlus2,
  PiggyBank, ChevronRight, TrendingDown, TrendingUp,
  Users, BarChart3, AlertTriangle, CheckCircle2, DollarSign,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import { useHBAuth } from '../hooks/useHBAuth.js'
import { useCuentas } from '../hooks/useCuentas.js'
import { useCreditos } from '../hooks/useCreditos.js'
import { simboloMoneda, toNumber } from '../utils/format.js'
import PageLayout from '../components/layout/PageLayout.jsx'
import ActionPanel from '../components/ui/ActionPanel.jsx'
import Card from '../components/ui/Card.jsx'
import Money from '../components/ui/Money.jsx'
import Badge from '../components/ui/Badge.jsx'
import Loader from '../components/ui/Loader.jsx'
import { getAdminStats } from '../services/adminService.js'

// ──────────────────────────────────────────────────────────────────────────────
// Paleta de colores corporativa GNB
// ──────────────────────────────────────────────────────────────────────────────
const GNB_COLORS = ['#73b71c', '#0a2e5c', '#e5b224', '#2196f3', '#e53935', '#9c27b0', '#00bcd4']
const SBS_COLORS = {
  Normal: '#73b71c',
  CPP: '#e5b224',
  Deficiente: '#ff9800',
  Dudoso: '#e53935',
  Pérdida: '#7b1fa2',
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers de formato
// ──────────────────────────────────────────────────────────────────────────────
function fmt(n) {
  if (n == null) return 'S/ 0'
  if (n >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `S/ ${(n / 1_000).toFixed(1)}K`
  return `S/ ${Number(n).toFixed(2)}`
}

function fmtTooltip(value) {
  return [`S/ ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, 'Monto']
}

// ──────────────────────────────────────────────────────────────────────────────
// Dashboard del Administrador
// ──────────────────────────────────────────────────────────────────────────────
function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader text="Cargando estadísticas del banco…" />
  if (!stats) return <p className="bbva-empty">No se pudieron cargar las estadísticas.</p>

  const kpis = [
    { label: 'Clientes activos', value: stats.clientes_activos, icon: Users, color: '#0a2e5c', bg: '#0a2e5c18' },
    { label: 'Cuentas ahorro', value: stats.cuentas_ahorro_activas, icon: PiggyBank, color: '#73b71c', bg: '#73b71c18' },
    { label: 'Créditos activos', value: stats.creditos_activos, icon: CreditCard, color: '#e5b224', bg: '#e5b22418' },
    { label: 'Total ahorros PEN', value: fmt(stats.total_ahorro_pen), icon: TrendingUp, color: '#73b71c', bg: '#73b71c18', isMoney: false },
    { label: 'Total ahorros USD', value: `$ ${Number(stats.total_ahorro_usd).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: '#2196f3', bg: '#2196f318', isMoney: false },
    { label: 'Deuda total cartera', value: fmt(stats.deuda_total), icon: TrendingDown, color: '#e53935', bg: '#e5393518', isMoney: false },
  ]

  // Prepara datos para gráfica de distribución de productos de ahorro
  const distProd = (stats.dist_productos_ahorro || []).map((p, i) => ({
    name: p.tipo,
    value: p.total,
    color: GNB_COLORS[i % GNB_COLORS.length],
  }))

  // Cartera SBS para gráfica de barras
  const carteraSbs = (stats.cartera_sbs || []).map((c) => ({
    name: c.clasificacion,
    monto: c.monto,
    cantidad: c.cantidad,
    fill: SBS_COLORS[c.clasificacion] || '#9e9e9e',
  }))

  // Mora
  const moraData = (stats.mora || []).map((m, i) => ({
    name: m.grupo,
    monto: m.monto,
    cantidad: m.cantidad,
    fill: GNB_COLORS[i % GNB_COLORS.length],
  }))

  return (
    <div className="admin-dashboard">
      {/* KPIs */}
      <div className="admin-kpi-grid">
        {kpis.map((k) => (
          <div key={k.label} className="admin-kpi-card" style={{ '--kpi-color': k.color, '--kpi-bg': k.bg }}>
            <span className="admin-kpi-ico"><k.icon size={22} /></span>
            <div className="admin-kpi-body">
              <span className="admin-kpi-label">{k.label}</span>
              <span className="admin-kpi-val">{k.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficas */}
      <div className="admin-charts-grid">
        {/* Distribución de ahorros por tipo */}
        <div className="admin-chart-card">
          <h3 className="admin-chart-title"><PiggyBank size={16} /> Distribución Ahorros por Producto</h3>
          {distProd.length === 0 ? <p className="bbva-empty">Sin datos</p> : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={distProd} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {distProd.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={fmtTooltip} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Cartera SBS */}
        <div className="admin-chart-card">
          <h3 className="admin-chart-title"><AlertTriangle size={16} /> Cartera SBS — Monto por Clasificación</h3>
          {carteraSbs.length === 0 ? <p className="bbva-empty">Sin datos</p> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={carteraSbs} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 10 }} width={70} />
                <Tooltip formatter={fmtTooltip} />
                <Bar dataKey="monto" name="Monto">
                  {carteraSbs.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Grupos de mora */}
        <div className="admin-chart-card">
          <h3 className="admin-chart-title"><CheckCircle2 size={16} /> Distribución de Mora en Créditos</h3>
          {moraData.length === 0 ? <p className="bbva-empty">Sin datos</p> : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={moraData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                  dataKey="monto"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {moraData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip formatter={fmtTooltip} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Ahorros PEN vs USD */}
        <div className="admin-chart-card">
          <h3 className="admin-chart-title"><DollarSign size={16} /> Ahorros PEN vs USD</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={[
                { name: 'Soles (PEN)', monto: stats.total_ahorro_pen, fill: '#73b71c' },
                { name: 'Dólares (USD)', monto: stats.total_ahorro_usd, fill: '#2196f3' },
              ]}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 10 }} width={80} />
              <Tooltip formatter={fmtTooltip} />
              <Bar dataKey="monto" name="Total">
                {[{ fill: '#73b71c' }, { fill: '#2196f3' }].map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="admin-quick-links">
        <button className="admin-ql-btn" onClick={() => navigate('/admin/clientes')}>
          <Users size={20} /> Ver todos los clientes
        </button>
        <button className="admin-ql-btn admin-ql-btn--secondary" onClick={() => navigate('/admin/powerbi')}>
          <BarChart3 size={20} /> Guía de conexión Power BI
        </button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Dashboard del Cliente (con sus propias gráficas)
// ──────────────────────────────────────────────────────────────────────────────
function ClienteDashboard() {
  const { user } = useHBAuth()
  const navigate = useNavigate()
  const { cuentas, loading: lc } = useCuentas('ahorro')
  const { creditos, loading: lk } = useCreditos()

  const totalAhorro = cuentas.reduce((s, c) => s + toNumber(c.saldo), 0)
  const totalDeuda = creditos.reduce((s, c) => s + toNumber(c.pago_pendiente), 0)

  const acciones = [
    { icon: Send, label: 'Transferencias propias', to: '/operaciones/transferencia' },
    { icon: Receipt, label: 'Pago de crédito', to: '/operaciones/pago-credito' },
    { icon: FileText, label: 'Pago de servicios', to: '/operaciones/pago-servicios' },
    { icon: FilePlus2, label: 'Solicitar préstamo', to: '/creditos/solicitar' },
  ]

  // Datos para gráfica de distribución de ahorros
  const dataPie = cuentas.map((c, i) => ({
    name: c.codcuentaahorro,
    value: toNumber(c.saldo),
    color: GNB_COLORS[i % GNB_COLORS.length],
  }))

  // Datos para amortización de créditos
  const dataBar = creditos.map((c) => ({
    name: c.codcuentacredito,
    pendiente: toNumber(c.pago_pendiente),
    otorgado: toNumber(c.monto_otorgado),
  }))

  return (
    <PageLayout aside={<ActionPanel title="Operaciones frecuentes" items={acciones} />}>
      {/* Saludo */}
      <div className="bbva-hello">
        <h1>Hola {primerNombre(user?.nombre)}, hoy te ofrecemos:</h1>
        <p>Esta es la posición global de tus productos en Banco GNB.</p>
      </div>

      {/* KPIs */}
      <div className="bbva-kpis">
        <div className="bbva-kpi">
          <span className="bbva-kpi-ico" style={{ background: '#73b71c1a', color: 'var(--hb-green)' }}>
            <PiggyBank size={22} />
          </span>
          <div>
            <span className="bbva-kpi-label"><TrendingUp size={13} /> Total en ahorros</span>
            <Money className="bbva-kpi-val" value={totalAhorro} />
            <small>{cuentas.length} cuenta(s)</small>
          </div>
        </div>
        <div className="bbva-kpi">
          <span className="bbva-kpi-ico" style={{ background: '#e533351a', color: 'var(--hb-red)' }}>
            <CreditCard size={22} />
          </span>
          <div>
            <span className="bbva-kpi-label"><TrendingDown size={13} /> Deuda total de créditos</span>
            <Money className="bbva-kpi-val" value={totalDeuda} />
            <small>{creditos.length} crédito(s)</small>
          </div>
        </div>
      </div>

      {/* Gráfica de distribución de ahorros */}
      {!lc && cuentas.length > 0 && (
        <Card title="Distribución de Ahorros" icon={<PiggyBank size={18} />}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={dataPie} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                label={({ name, percent }) => `${name.slice(-4)} · ${(percent * 100).toFixed(0)}%`}
                labelLine={true}>
                {dataPie.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [`S/ ${toNumber(v).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, 'Saldo']} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Gráfica de amortización de créditos */}
      {!lk && creditos.length > 0 && (
        <Card title="Estado de Créditos" icon={<CreditCard size={18} />}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dataBar} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 9 }} width={65} />
              <Tooltip formatter={(v, name) => [`S/ ${toNumber(v).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, name === 'otorgado' ? 'Monto otorgado' : 'Saldo pendiente']} />
              <Legend formatter={(v) => v === 'otorgado' ? 'Monto otorgado' : 'Saldo pendiente'} />
              <Bar dataKey="otorgado" fill="#0a2e5c" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pendiente" fill="#e5b224" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Cuentas resumidas */}
      <Card title="Cuentas de Ahorro" icon={<Wallet size={18} />}
        actions={<button className="bbva-link" onClick={() => navigate('/cuentas/ahorro')}>Ver todas <ChevronRight size={14} /></button>}>
        {lc ? <Loader text="Cargando cuentas…" /> : cuentas.length === 0 ? (
          <p className="bbva-empty">No registra cuentas de ahorro.</p>
        ) : (
          <ul className="bbva-prodlist">
            {cuentas.map((c) => (
              <li key={c.codcuentaahorro} onClick={() => navigate(`/cuentas/ahorro/${c.codcuentaahorro}/movimientos`)}>
                <div className="bbva-prod-info">
                  <strong>{c.codcuentaahorro}</strong>
                  <small>{c.tipo} · <Badge estado={c.estado} /></small>
                </div>
                <div className="bbva-prod-amt">
                  <Money value={c.saldo} simbolo={simboloMoneda(c.moneda)} />
                  <ChevronRight size={16} />
                </div>
              </li>
            ))}
            <li className="bbva-prodlist-total">
              <span>Saldo disponible total</span>
              <Money value={totalAhorro} className="bbva-money-strong" />
            </li>
          </ul>
        )}
      </Card>

      {/* Créditos resumidos */}
      <Card title="Préstamos" icon={<CreditCard size={18} />}
        actions={<button className="bbva-link" onClick={() => navigate('/cuentas/credito')}>Ver todos <ChevronRight size={14} /></button>}>
        {lk ? <Loader text="Cargando créditos…" /> : creditos.length === 0 ? (
          <p className="bbva-empty">No registra créditos vigentes.</p>
        ) : (
          <ul className="bbva-prodlist">
            {creditos.map((c) => (
              <li key={c.codcuentacredito} onClick={() => navigate(`/cuentas/credito/${c.codcuentacredito}/cuotas`)}>
                <div className="bbva-prod-info">
                  <strong>{c.codcuentacredito}</strong>
                  <small>Consumo · <Badge estado={c.calificacion || 'Normal'} tone={c.dias_atraso > 0 ? 'red' : undefined} /></small>
                </div>
                <div className="bbva-prod-amt">
                  <Money value={c.pago_pendiente} />
                  <ChevronRight size={16} />
                </div>
              </li>
            ))}
            <li className="bbva-prodlist-total">
              <span>Saldo pendiente total</span>
              <Money value={totalDeuda} className="bbva-money-strong" />
            </li>
          </ul>
        )}
      </Card>
    </PageLayout>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Componente principal: despacha según rol
// ──────────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { user } = useHBAuth()
  const isAdmin = user?.codcliente === 'admin'

  if (isAdmin) {
    return (
      <PageLayout>
        <div className="bbva-hello">
          <h1>Panel de Administración — Banco GNB</h1>
          <p>Indicadores financieros globales y herramientas de análisis en tiempo real.</p>
        </div>
        <AdminDashboard />
      </PageLayout>
    )
  }

  return <ClienteDashboard />
}

function primerNombre(nombre) {
  if (!nombre) return 'Cliente'
  const parts = nombre.split(',')
  const np = (parts[1] || parts[0]).trim().split(/\s+/)[0]
  return np || 'Cliente'
}
