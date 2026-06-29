import React, { useState, useEffect } from 'react'
import {
  Activity, Settings2, ShieldCheck, FileWarning,
  ArrowUpRight, Save, TrendingDown, TrendingUp,
  BarChart2, AlertTriangle, Users, Crown, Banknote
} from 'lucide-react'
import api from '../../services/hb_api.js'
import Money from '../ui/Money.jsx'
import { formatDate } from '../../utils/format.js'
import Loader from '../ui/Loader.jsx'

const S = {
  tab: (active, danger = false) => ({
    padding: '10px 20px', background: 'none', border: 'none',
    borderBottom: active ? `3px solid ${danger ? '#dc2626' : '#1e293b'}` : '3px solid transparent',
    fontWeight: 700, fontSize: 14,
    color: active ? (danger ? '#dc2626' : '#1e293b') : '#64748b',
    cursor: 'pointer', transition: 'all 0.2s',
  }),
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 },
  kpiCard: (color) => ({ background: '#fff', borderRadius: 16, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', borderLeft: `4px solid ${color}` }),
  kpiIcon: (color, bg) => ({ width: 46, height: 46, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color }),
  kpiLabel: { fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 },
  kpiVal: { fontSize: 24, fontWeight: 800, color: '#1e293b', lineHeight: 1 },
  card: { background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 20 },
  cardHead: { padding: '16px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: 700, color: '#1e293b' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '2px solid #f1f5f9', background: '#f8fafc' },
  td: { padding: '13px 14px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' },
  badge: (color, bg) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, color, background: bg }),
  btn: (color = '#1e293b') => ({ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, background: color, color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }),
  btnGhost: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, background: '#f1f5f9', color: '#64748b', border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(10,30,60,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520, boxShadow: '0 25px 60px rgba(0,0,0,0.25)', overflow: 'hidden' },
  input: { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box' },
}

export default function SuperadminDashboard() {
  const [activeTab, setActiveTab] = useState('kpis')
  const [solicitudes, setSolicitudes] = useState([])
  const [creditos, setCreditos] = useState([])
  const [parametros, setParametros] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [selectedCastigo, setSelectedCastigo] = useState(null)
  const [hoveredRow, setHoveredRow] = useState(null)

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [r1, r2, r3] = await Promise.all([
        api.get('/admin/solicitudes'),
        api.get('/admin/creditos/cartera-completa'),
        api.get('/admin/creditos/parametros'),
      ])
      setSolicitudes(r1.data || [])
      setCreditos(r2.data || [])
      setParametros(r3.data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const paraCastigo = creditos.filter(c => c.dias_atraso > 180 && c.calificacion !== 'Pérdida (Castigado)')
  const totalSolicitudes = solicitudes.length
  const desembolsados = solicitudes.filter(s => s.codestado === 'DE' || s.codestado === '03').length

  const kpis = [
    { label: 'Total solicitudes', value: totalSolicitudes, icon: BarChart2, color: '#1e293b', bg: '#f1f5f9' },
    { label: 'Desembolsadas', value: desembolsados, icon: TrendingUp, color: '#15803d', bg: '#dcfce7' },
    { label: 'ROA (Estimado)', value: '0.08%', icon: Activity, color: '#0574AF', bg: '#e8f4fb' },
    { label: 'Para castigo (>180d)', value: paraCastigo.length, icon: AlertTriangle, color: '#dc2626', bg: '#fee2e2' },
  ]

  const actualizarParametros = async () => {
    setProcessing(true)
    try {
      await api.put('/admin/creditos/parametros', parametros)
      alert('✅ Parámetros globales actualizados en dparametros_credito.')
    } catch (e) { alert('Error: ' + (e.response?.data?.detail || e.message)) }
    finally { setProcessing(false) }
  }

  const ejecutarCastigo = async (creditoId) => {
    setProcessing(true)
    try {
      await api.post(`/admin/creditos/${creditoId}/castigar`)
      alert('✅ Castigo de Cartera ejecutado. Saldo reducido a S/ 0.00.')
      setSelectedCastigo(null); cargarDatos()
    } catch (e) { alert('Error: ' + (e.response?.data?.detail || e.message)) }
    finally { setProcessing(false) }
  }

  return (
    <div>
      {/* ROL HEADER — Directorio */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)', borderRadius: 16, padding: '20px 24px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Crown size={26} color="#e5b224" />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Panel de Directorio</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>Superadministrador — Directorio GNB</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Castigos contables · Parámetros globales · Auditoría completa</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          {[{ val: paraCastigo.length, label: 'Para castigo' }, { val: totalSolicitudes, label: 'Solicitudes' }].map((d, i) => (
            <div key={i} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 18px' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: i === 0 ? '#fca5a5' : '#fff' }}>{d.val}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #f1f5f9' }}>
        {[
          ['kpis', '📊 Analítica', false],
          ['params', '⚙️ Configuración Global', false],
          ['auditoria', '📋 Auditoría', false],
          ['castigos', '🗂️ Castigos Contables', true],
        ].map(([k, label, d]) => (
          <button key={k} onClick={() => setActiveTab(k)} style={S.tab(activeTab === k, d)}>{label}</button>
        ))}
      </div>

      {/* KPIs */}
      {activeTab === 'kpis' && (
        <>
          <div style={S.kpiGrid}>
            {kpis.map((k, i) => (
              <div key={i} style={S.kpiCard(k.color)}>
                <div style={S.kpiIcon(k.color, k.bg)}><k.icon size={22} /></div>
                <div>
                  <div style={S.kpiLabel}>{k.label}</div>
                  <div style={S.kpiVal}>{k.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Métricas de negocio */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {[
              { label: 'Margen Financiero Bruto', value: '97.18%', color: '#15803d', bg: '#dcfce7', icon: TrendingUp, desc: 'Ingresos financieros netos / activos' },
              { label: 'ROE (Retorno Capital)', value: '0.70%', color: '#0574AF', bg: '#e8f4fb', icon: ArrowUpRight, desc: 'Utilidad neta / Patrimonio' },
              { label: 'ROA (Retorno Activos)', value: '0.08%', color: '#7c3aed', bg: '#f3e8ff', icon: Activity, desc: 'Utilidad neta / Total Activos' },
            ].map((m, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: `1px solid ${m.color}20` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color }}>
                    <m.icon size={18} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#374151' }}>{m.label}</span>
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, color: m.color, letterSpacing: '-1px' }}>{m.value}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* PARÁMETROS */}
      {activeTab === 'params' && (
        <div style={S.card}>
          <div style={S.cardHead}>
            <Settings2 size={16} color="#1e293b" />
            <span style={S.cardTitle}>Tabla de Control Global — dparametros_credito</span>
          </div>
          <div style={{ padding: '24px 26px' }}>
            {loading || !parametros ? <Loader text="Cargando parámetros..." /> : (
              <>
                <div style={{ background: '#fef3c7', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={16} /> Estos parámetros afectan a todas las solicitudes de crédito en tiempo real.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 24 }}>
                  {[
                    { label: 'TEA Mínima (%)', key: 'tea_min', type: 'number', step: '0.1', color: '#15803d' },
                    { label: 'TEA Máxima (%)', key: 'tea_max', type: 'number', step: '0.1', color: '#dc2626' },
                    { label: 'Monto Mínimo (PEN)', key: 'monto_min_pen', type: 'number', color: '#0574AF' },
                    { label: 'Monto Máximo (PEN)', key: 'monto_max_pen', type: 'number', color: '#7c3aed' },
                    { label: 'Monto Mínimo (USD)', key: 'monto_min_usd', type: 'number', color: '#0574AF' },
                    { label: 'Monto Máximo (USD)', key: 'monto_max_usd', type: 'number', color: '#7c3aed' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontWeight: 700, fontSize: 12, color: f.color, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</label>
                      <input
                        type={f.type} step={f.step}
                        value={parametros[f.key] || ''}
                        onChange={e => setParametros({ ...parametros, [f.key]: e.target.value })}
                        style={{ ...S.input, borderColor: f.color + '60' }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button style={S.btn('#1e293b')} onClick={actualizarParametros} disabled={processing}>
                    <Save size={16} /> {processing ? 'Guardando...' : 'Guardar Parámetros Globales'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* AUDITORÍA */}
      {activeTab === 'auditoria' && (
        <div style={S.card}>
          <div style={S.cardHead}>
            <ShieldCheck size={16} color="#1e293b" />
            <span style={S.cardTitle}>Registro de Auditoría — Todas las Solicitudes</span>
            <span style={{ marginLeft: 'auto', ...S.badge('#1e293b', '#f1f5f9') }}>{solicitudes.length} registros</span>
          </div>
          {loading ? <div style={{ padding: 30 }}><Loader /></div> : (
            <table style={S.table}>
              <thead>
                <tr>{['Solicitud', 'Cliente', 'Estado', 'Monto', 'Plazo', 'Fecha'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {solicitudes.map((s, i) => {
                  const estadoColor = s.codestado === 'AL' || s.codestado === 'DE' ? '#15803d' :
                    s.codestado === 'RZ' ? '#dc2626' :
                    s.codestado === 'FC' ? '#b45309' : '#0574AF'
                  return (
                    <tr key={s.id}
                      onMouseEnter={() => setHoveredRow(s.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{ background: hoveredRow === s.id ? '#f8fafc' : 'transparent', transition: 'background 0.15s' }}>
                      <td style={S.td}><strong style={{ fontFamily: 'monospace', color: '#64748b', fontSize: 12 }}>{s.codsolicitud}</strong></td>
                      <td style={S.td}><div style={{ fontWeight: 600 }}>{s.nomcliente}</div></td>
                      <td style={S.td}><span style={S.badge(estadoColor, estadoColor + '15')}>{s.estado}</span></td>
                      <td style={S.td}><strong>S/ {parseFloat(s.monto).toLocaleString()}</strong></td>
                      <td style={S.td}>{s.plazo} m.</td>
                      <td style={S.td}><span style={{ fontSize: 12, color: '#94a3b8' }}>{formatDate(s.fecha)}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* CASTIGOS */}
      {activeTab === 'castigos' && (
        <div style={S.card}>
          <div style={S.cardHead}>
            <FileWarning size={16} color="#dc2626" />
            <span style={S.cardTitle}>Castigo de Cartera Irrecuperable — Mora &gt; 180 días</span>
            <span style={{ marginLeft: 'auto', ...S.badge('#dc2626', '#fee2e2') }}>{paraCastigo.length} expedientes</span>
          </div>
          {loading ? <div style={{ padding: 30 }}><Loader /></div> : (
            <table style={S.table}>
              <thead>
                <tr>{['Crédito', 'Capital Deuda', 'Días Atraso', 'Provisiones', 'Acción Directorio'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {paraCastigo.length === 0
                  ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                      <ShieldCheck size={32} style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
                      No hay expedientes listos para castigo.
                    </td></tr>
                  : paraCastigo.map((c, i) => (
                    <tr key={i}
                      onMouseEnter={() => setHoveredRow('c' + i)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{ background: hoveredRow === 'c' + i ? '#fff5f5' : 'transparent', transition: 'background 0.15s' }}>
                      <td style={S.td}><strong style={{ fontFamily: 'monospace', color: '#dc2626' }}>{c.codigo_credito}</strong></td>
                      <td style={S.td}><strong style={{ color: '#dc2626' }}>S/ {parseFloat(c.saldo_capital || 0).toLocaleString()}</strong></td>
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 900, fontSize: 20, color: '#dc2626' }}>{c.dias_atraso}</span>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>días</span>
                        </div>
                      </td>
                      <td style={S.td}><span style={S.badge('#15803d', '#dcfce7')}>100% Cubierto</span></td>
                      <td style={S.td}>
                        <button style={{ ...S.btn('#dc2626'), padding: '8px 16px', fontSize: 13 }} onClick={() => setSelectedCastigo(c)}>
                          <FileWarning size={14} /> Autorizar Castigo
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* MODAL CASTIGO */}
      {selectedCastigo && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && setSelectedCastigo(null)}>
          <div style={S.modal}>
            <div style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)', padding: '24px 28px', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <FileWarning size={22} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.8)' }}>Aprobación de Directorio</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>Castigo Contable Irrecuperable</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 6 }}>
                <strong>{selectedCastigo.codigo_credito}</strong> · Deuda capital: <strong>S/ {parseFloat(selectedCastigo.saldo_capital || 0).toLocaleString()}</strong>
              </div>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <div style={{ padding: '14px 16px', borderRadius: 12, background: '#fee2e2', border: '1px solid #fca5a5', marginBottom: 20, fontSize: 13, color: '#7f1d1d' }}>
                <strong style={{ display: 'block', marginBottom: 8 }}>Impacto contable en PostgreSQL:</strong>
                <ul style={{ paddingLeft: 18, margin: 0, lineHeight: 1.9 }}>
                  <li>Saldo capital → <code style={{ background: '#fee2e2' }}>0.00</code> en <code>fagcuentacredito</code></li>
                  <li>Flag <code>flagcastigado</code> → <code>'S'</code> (irreversible)</li>
                  <li>Asiento en <code>foperaciones</code>: "CASTIGO DE CARTERA CREDITICIA AUTORIZADO POR DIRECTORIO"</li>
                  <li>Estado solicitud → <code>05 (Castigado)</code></li>
                </ul>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button style={S.btnGhost} onClick={() => setSelectedCastigo(null)}>Cancelar</button>
                <button style={S.btn('#dc2626')} disabled={processing} onClick={() => ejecutarCastigo(selectedCastigo.id)}>
                  <FileWarning size={16} /> {processing ? 'Ejecutando...' : 'Ejecutar Castigo Contable'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
