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
import Card from '../components/ui/Card.jsx'
import Money from '../components/ui/Money.jsx'
import Badge from '../components/ui/Badge.jsx'
import Loader from '../components/ui/Loader.jsx'
import { getAdminStats } from '../services/adminService.js'

// ──────────────────────────────────────────────────────────────────────────────
// Paleta de colores corporativa Banco de la Nación
// ──────────────────────────────────────────────────────────────────────────────
const BN_COLORS = ['#C31A1F', '#4b5563', '#9e1014', '#f59e0b', '#dc2626', '#111827']
const SBS_COLORS = {
  Normal: '#16a34a',
  CPP: '#f59e0b',
  Deficiente: '#f97316',
  Dudoso: '#dc2626',
  Pérdida: '#7c3aed',
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
    { label: 'Clientes activos', value: stats.clientes_activos, icon: Users, color: '#C31A1F', bg: '#C31A1F18' },
    { label: 'Cuentas ahorro', value: stats.cuentas_ahorro_activas, icon: PiggyBank, color: '#16a34a', bg: '#16a34a18' },
    { label: 'Créditos activos', value: stats.creditos_activos, icon: CreditCard, color: '#f59e0b', bg: '#f59e0b18' },
    { label: 'Total ahorros PEN', value: fmt(stats.total_ahorro_pen), icon: TrendingUp, color: '#16a34a', bg: '#16a34a18', isMoney: false },
    { label: 'Total ahorros USD', value: `$ ${Number(stats.total_ahorro_usd).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: '#f59e0b', bg: '#f59e0b22', isMoney: false },
    { label: 'Deuda total cartera', value: fmt(stats.deuda_total), icon: TrendingDown, color: '#dc2626', bg: '#dc262618', isMoney: false },
  ]

  // Prepara datos para gráfica de distribución de productos de ahorro
  const distProd = (stats.dist_productos_ahorro || []).map((p, i) => ({
    name: p.tipo,
    value: p.total,
    color: BN_COLORS[i % BN_COLORS.length],
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
    fill: BN_COLORS[i % BN_COLORS.length],
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
                { name: 'Soles (PEN)', monto: stats.total_ahorro_pen, fill: '#16a34a' },
                { name: 'Dólares (USD)', monto: stats.total_ahorro_usd, fill: '#f59e0b' },
              ]}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 10 }} width={80} />
              <Tooltip formatter={fmtTooltip} />
              <Bar dataKey="monto" name="Total">
                {[{ fill: '#16a34a' }, { fill: '#f59e0b' }].map((d, i) => <Cell key={i} fill={d.fill} />)}
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
        <button className="admin-ql-btn admin-ql-btn--secondary" onClick={() => navigate('/admin/creditos')}>
          <CreditCard size={20} /> Ver solicitudes de crédito
        </button>
        <button className="admin-ql-btn admin-ql-btn--secondary" onClick={() => navigate('/admin/powerbi')}>
          <BarChart3 size={20} /> Guía de conexión Power BI
        </button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Dashboard del Cliente (con estructura renovada de 2 columnas sin aside)
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
    color: BN_COLORS[i % BN_COLORS.length],
  }))

  // Datos para amortización de créditos
  const dataBar = creditos.map((c) => ({
    name: c.codcuentacredito,
    pendiente: toNumber(c.pago_pendiente),
    otorgado: toNumber(c.monto_otorgado),
  }))

  return (
    <PageLayout>
      {/* 1. Saludo / Banner de Bienvenida Premium */}
      <div style={{
        background: 'linear-gradient(135deg, #9e1014 0%, #C31A1F 60%, #e52c31 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        marginBottom: '20px',
        boxShadow: '0 10px 25px -5px rgba(195, 26, 31, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Adorno circular decorativo de fondo */}
        <div style={{
          position: 'absolute',
          right: '-20px',
          top: '-20px',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          pointerEvents: 'none'
        }} />
        
        <div style={{ zIndex: 2 }}>
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>
            ¡Hola, {primerNombre(user?.nombre)}!
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', margin: '6px 0 0 0', fontSize: '13.5px', fontWeight: '500' }}>
            Posición global consolidada de tus cuentas y préstamos en el Banco de la Nación.
          </p>
        </div>
        
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.15)', 
          backdropFilter: 'blur(4px)',
          padding: '6px 16px', 
          borderRadius: '20px', 
          fontSize: '12px', 
          fontWeight: '700', 
          color: '#ffffff',
          border: '1px solid rgba(255,255,255,0.15)',
          zIndex: 2
        }}>
          📅 {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* 2. Fila de Acciones Rápidas (Horizontal Quick Actions) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        {acciones.map((a, i) => {
          const colors = [
            { bg: '#fdf2f2', color: '#C31A1F', border: 'rgba(195, 26, 31, 0.12)' }, // red
            { bg: '#fffbeb', color: '#d97706', border: 'rgba(217, 119, 6, 0.12)' }, // amber/gold
            { bg: '#f0fdf4', color: '#16a34a', border: 'rgba(22, 163, 74, 0.12)' }, // green
            { bg: '#faf5ff', color: '#7c3aed', border: 'rgba(124, 58, 237, 0.12)' }  // purple
          ]
          const col = colors[i % colors.length]
          const Icon = a.icon
          return (
            <button
              key={a.label}
              onClick={() => navigate(a.to)}
              style={{
                background: '#ffffff',
                border: `1.5px solid ${col.border}`,
                borderRadius: '14px',
                padding: '16px 12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(148, 163, 184, 0.03)',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                textAlign: 'center',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.boxShadow = '0 10px 18px -4px rgba(148, 163, 184, 0.15)'
                e.currentTarget.style.borderColor = col.color
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(148, 163, 184, 0.03)'
                e.currentTarget.style.borderColor = col.border
              }}
            >
              <span style={{ 
                width: '42px', 
                height: '42px', 
                borderRadius: '50%', 
                background: col.bg, 
                color: col.color, 
                display: 'grid', 
                placeItems: 'center',
                flexShrink: 0 
              }}>
                <Icon size={19} />
              </span>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#334155' }}>{a.label}</span>
            </button>
          )
        })}
      </div>

      {/* 3. División en 2 Columnas (Listas a la izquierda, Gráficos a la derecha) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', alignItems: 'start' }}>
        
        {/* Columna Izquierda (Productos) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Cuentas de Ahorro */}
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Wallet size={16} style={{ color: '#C31A1F' }} />
                  <span style={{ fontWeight: '800', color: '#1e293b' }}>Cuentas de Ahorro</span>
                </div>
                <div style={{ fontSize: '13.5px', color: '#16a34a', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Disponible:</span>
                  <Money value={totalAhorro} />
                </div>
              </div>
            }
            actions={<button className="bbva-link" onClick={() => navigate('/cuentas/ahorro')}>Ver todas <ChevronRight size={14} /></button>}
          >
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
                      <ChevronRight size={16} style={{ color: '#cbd5e1' }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Préstamos y Créditos con Barras de Progreso Lineales */}
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={16} style={{ color: '#C31A1F' }} />
                  <span style={{ fontWeight: '800', color: '#1e293b' }}>Préstamos y Créditos</span>
                </div>
                <div style={{ fontSize: '13.5px', color: '#C31A1F', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Deuda total:</span>
                  <Money value={totalDeuda} />
                </div>
              </div>
            }
            actions={<button className="bbva-link" onClick={() => navigate('/cuentas/credito')}>Ver todos <ChevronRight size={14} /></button>}
          >
            {lk ? <Loader text="Cargando créditos…" /> : creditos.length === 0 ? (
              <p className="bbva-empty">No registra créditos vigentes.</p>
            ) : (
              <ul className="bbva-prodlist" style={{ gap: '10px' }}>
                {creditos.map((c) => {
                  const pendiente = toNumber(c.pago_pendiente)
                  const otorgado = toNumber(c.monto_otorgado)
                  const pagado = otorgado - pendiente
                  const porcentaje = otorgado > 0 ? Math.min(100, Math.max(0, (pagado / otorgado) * 100)) : 0

                  return (
                    <li 
                      key={c.codcuentacredito} 
                      onClick={() => navigate(`/cuentas/credito/${c.codcuentacredito}/cuotas`)}
                      style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div className="bbva-prod-info">
                          <strong>{c.codcuentacredito}</strong>
                          <small>Consumo · <Badge estado={c.calificacion || 'Normal'} tone={c.dias_atraso > 0 ? 'red' : undefined} /></small>
                        </div>
                        <div className="bbva-prod-amt">
                          <Money value={pendiente} />
                          <ChevronRight size={16} style={{ color: '#cbd5e1' }} />
                        </div>
                      </div>
                      
                      {/* Amortization Progress Tracker */}
                      <div className="bn-progress-container">
                        <div className="bn-progress-labels">
                          <span>Pagado: <Money value={pagado} /></span>
                          <span>Otorgado: <Money value={otorgado} /></span>
                        </div>
                        <div className="bn-progress-track">
                          <div className="bn-progress-fill" style={{ width: `${porcentaje}%` }} />
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

        </div>

        {/* Columna Derecha (Gráficas) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Gráfica de distribución de ahorros */}
          {!lc && cuentas.length > 0 && (
            <Card title="Distribución de Ahorros" icon={<PiggyBank size={16} style={{ color: '#C31A1F' }} />}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={dataPie} cx="50%" cy="50%" outerRadius={70} dataKey="value"
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
            <Card title="Estado de Créditos" icon={<CreditCard size={16} style={{ color: '#C31A1F' }} />}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dataBar} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 9 }} width={65} />
                  <Tooltip formatter={(v, name) => [`S/ ${toNumber(v).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, name === 'otorgado' ? 'Monto otorgado' : 'Saldo pendiente']} />
                  <Legend formatter={(v) => v === 'otorgado' ? 'Monto otorgado' : 'Saldo pendiente'} />
                  <Bar dataKey="otorgado" fill="#C31A1F" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pendiente" fill="#4b5563" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

        </div>

      </div>

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
          <h1>Panel de Administración — Banco de la Nación</h1>
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
