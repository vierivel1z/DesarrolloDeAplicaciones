import React, { useState, useEffect } from 'react'
import {
  Landmark, ArrowRightLeft, AlertOctagon, Scale,
  TrendingUp, Banknote, CheckCircle2, Gavel,
  Clock, ChevronRight, ShieldAlert
} from 'lucide-react'
import api from '../../services/hb_api.js'
import Money from '../ui/Money.jsx'
import { formatDate } from '../../utils/format.js'
import Loader from '../ui/Loader.jsx'

const S = {
  tab: (active, danger = false) => ({
    padding: '10px 20px', background: 'none', border: 'none',
    borderBottom: active ? `3px solid ${danger ? '#dc2626' : '#7c3aed'}` : '3px solid transparent',
    fontWeight: 700, fontSize: 14,
    color: active ? (danger ? '#dc2626' : '#7c3aed') : '#64748b',
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
  btn: (color = '#7c3aed') => ({ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: color, color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }),
  btnGhost: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: '#f1f5f9', color: '#64748b', border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(10,30,60,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520, boxShadow: '0 25px 60px rgba(0,0,0,0.25)', overflow: 'hidden' },
}

export default function Checker2Dashboard() {
  const [activeTab, setActiveTab] = useState('kpis')
  const [solicitudes, setSolicitudes] = useState([])
  const [creditos, setCreditos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSol, setSelectedSol] = useState(null)
  const [selectedMoroso, setSelectedMoroso] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [hoveredRow, setHoveredRow] = useState(null)

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [r1, r2] = await Promise.all([
        api.get('/admin/solicitudes'),
        api.get('/admin/creditos/cartera-completa')
      ])
      setSolicitudes(r1.data || [])
      setCreditos(r2.data || [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const desembolsos = solicitudes.filter(s => s.codestado === 'AL' || s.codestado === 'FC')
  const morosos = creditos.filter(c => c.dias_atraso >= 121 && c.calificacion !== 'Pérdida')
  const totalLiquidar = desembolsos.reduce((a, s) => a + parseFloat(s.monto || 0), 0)

  const kpis = [
    { label: 'Listos para desembolsar', value: desembolsos.filter(s => s.codestado === 'AL').length, icon: Landmark, color: '#7c3aed', bg: '#f3e8ff' },
    { label: 'Pendiente Comité', value: desembolsos.filter(s => s.codestado === 'FC').length, icon: Clock, color: '#b45309', bg: '#fef3c7' },
    { label: 'Capital a liquidar', value: totalLiquidar >= 1000 ? `S/${(totalLiquidar/1000).toFixed(0)}K` : `S/${totalLiquidar.toFixed(0)}`, icon: Banknote, color: '#15803d', bg: '#dcfce7' },
    { label: 'Cartera tardía (≥121d)', value: morosos.length, icon: AlertOctagon, color: '#dc2626', bg: '#fee2e2' },
  ]

  const desembolsar = async (solId) => {
    setProcessing(true)
    try {
      await api.post(`/admin/creditos/${solId}/desembolsar`)
      alert('✅ Desembolso ejecutado. El importe fue acreditado en la cuenta de ahorros del cliente.')
      setSelectedSol(null); cargarDatos()
    } catch (e) { alert('Error: ' + (e.response?.data?.detail || e.message)) }
    finally { setProcessing(false) }
  }

  const resolverComite = async (solId) => {
    setProcessing(true)
    try {
      await api.post(`/admin/creditos/${solId}/comite/resolver`)
      alert('✅ Firma de Comité registrada. Solicitud lista para desembolso.')
      setSelectedSol(null); cargarDatos()
    } catch (e) { alert('Error: ' + (e.response?.data?.detail || e.message)) }
    finally { setProcessing(false) }
  }

  const derivarJudicial = async (creditoId) => {
    setProcessing(true)
    try {
      await api.post(`/admin/creditos/${creditoId}/derivar-judicial`)
      alert('⚖️ Crédito trasladado a Cartera Judicial (Estado 04).')
      setSelectedMoroso(null); cargarDatos()
    } catch (e) { alert('Error: ' + (e.response?.data?.detail || e.message)) }
    finally { setProcessing(false) }
  }

  return (
    <div>
      {/* ROL HEADER */}
      <div style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)', borderRadius: 16, padding: '20px 24px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Landmark size={26} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Panel de Trabajo</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>Mesa de Control (CHECKER 2)</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Desembolsos · Comité · Derivación judicial (≥ 121 días)</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 18px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{desembolsos.length}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Para liquidar</div>
          </div>
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 18px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{morosos.length}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Tardíos</div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #f1f5f9' }}>
        {[
          ['kpis', '📊 Dashboard', false],
          ['desembolsos', '🏦 Mesa de Control', false],
          ['cobranza', '⚖️ Cartera Tardía', true],
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

          {/* Quick view */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { title: 'Próximos desembolsos', icon: ArrowRightLeft, color: '#7c3aed', items: desembolsos.slice(0, 3), key: 'codsolicitud', val: s => `S/ ${parseFloat(s.monto).toLocaleString()}`, sub: s => s.nomcliente, tab: 'desembolsos' },
              { title: 'Cartera tardía urgente', icon: AlertOctagon, color: '#dc2626', items: morosos.slice(0, 3), key: 'codigo_credito', val: c => `${c.dias_atraso} días`, sub: c => c.cliente, tab: 'cobranza' },
            ].map((sect, si) => (
              <div key={si} style={S.card}>
                <div style={S.cardHead}>
                  <sect.icon size={16} color={sect.color} />
                  <span style={S.cardTitle}>{sect.title}</span>
                  <button onClick={() => setActiveTab(sect.tab)} style={{ marginLeft: 'auto', ...S.badge(sect.color, sect.color + '15'), cursor: 'pointer', border: 'none' }}>
                    Ver todo <ChevronRight size={12} />
                  </button>
                </div>
                <div style={{ padding: '12px 22px' }}>
                  {sect.items.length === 0
                    ? <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontSize: 13 }}>Sin pendientes ✅</div>
                    : sect.items.map((item, ii) => (
                      <div key={ii} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: ii < sect.items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{item[sect.key]}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{sect.sub(item)}</div>
                        </div>
                        <span style={{ fontWeight: 800, color: sect.color }}>{sect.val(item)}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* DESEMBOLSOS */}
      {activeTab === 'desembolsos' && (
        <div style={S.card}>
          <div style={S.cardHead}>
            <ArrowRightLeft size={16} color="#7c3aed" />
            <span style={S.cardTitle}>Bandeja de Desembolsos y Comité</span>
            <span style={{ marginLeft: 'auto', ...S.badge('#7c3aed', '#f3e8ff') }}>{desembolsos.length}</span>
          </div>
          {loading ? <div style={{ padding: 30 }}><Loader /></div> : (
            <table style={S.table}>
              <thead>
                <tr>{['Solicitud', 'Cliente', 'Monto', 'Plazo', 'Estado', 'Acción'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {desembolsos.length === 0
                  ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No hay créditos en cola de liquidación.</td></tr>
                  : desembolsos.map(s => (
                    <tr key={s.id}
                      onMouseEnter={() => setHoveredRow(s.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{ background: hoveredRow === s.id ? '#f8fafc' : 'transparent', transition: 'background 0.15s' }}>
                      <td style={S.td}><strong style={{ color: '#7c3aed', fontFamily: 'monospace', fontSize: 12 }}>{s.codsolicitud}</strong></td>
                      <td style={S.td}><div style={{ fontWeight: 600 }}>{s.nomcliente}</div></td>
                      <td style={S.td}><strong>S/ {parseFloat(s.monto).toLocaleString()}</strong></td>
                      <td style={S.td}>{s.plazo} meses</td>
                      <td style={S.td}>
                        <span style={s.codestado === 'FC' ? S.badge('#b45309', '#fef3c7') : S.badge('#15803d', '#dcfce7')}>
                          {s.codestado === 'FC' ? '🔐 Pendiente Comité' : '✅ Listo para desembolso'}
                        </span>
                      </td>
                      <td style={S.td}>
                        <button style={S.btn(s.codestado === 'FC' ? '#b45309' : '#7c3aed')} onClick={() => setSelectedSol(s)}>
                          {s.codestado === 'FC' ? <><Scale size={14} /> Comité</> : <><Banknote size={14} /> Desembolsar</>}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* COBRANZA TARDÍA */}
      {activeTab === 'cobranza' && (
        <div style={S.card}>
          <div style={S.cardHead}>
            <AlertOctagon size={16} color="#dc2626" />
            <span style={S.cardTitle}>Cartera Tardía — Derivación Judicial (≥ 121 días)</span>
            <span style={{ marginLeft: 'auto', ...S.badge('#dc2626', '#fee2e2') }}>{morosos.length} créditos</span>
          </div>
          {loading ? <div style={{ padding: 30 }}><Loader /></div> : (
            <table style={S.table}>
              <thead>
                <tr>{['Crédito', 'Días Atraso', 'Saldo Capital', 'Calificación SBS', 'Acción Legal'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {morosos.length === 0
                  ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Sin cartera tardía para derivar ✅</td></tr>
                  : morosos.map((c, i) => (
                    <tr key={i}
                      onMouseEnter={() => setHoveredRow('m' + i)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{ background: hoveredRow === 'm' + i ? '#fff5f5' : 'transparent', transition: 'background 0.15s' }}>
                      <td style={S.td}><strong style={{ fontFamily: 'monospace', color: '#dc2626' }}>{c.codigo_credito}</strong><br/><small style={{ color: '#94a3b8' }}>{c.cliente}</small></td>
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 800, fontSize: 18, color: '#dc2626' }}>{c.dias_atraso}</span>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>días</span>
                        </div>
                      </td>
                      <td style={S.td}><strong style={{ color: '#dc2626' }}>S/ {parseFloat(c.saldo_capital || 0).toLocaleString()}</strong></td>
                      <td style={S.td}><span style={S.badge('#7c1d1d', '#fee2e2')}>{c.calificacion}</span></td>
                      <td style={S.td}>
                        <button style={S.btn('#dc2626')} onClick={() => setSelectedMoroso(c)}>
                          <Gavel size={14} /> Derivar Judicial
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* MODAL DESEMBOLSO */}
      {selectedSol && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && setSelectedSol(null)}>
          <div style={S.modal}>
            <div style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)', padding: '22px 26px', color: '#fff' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase' }}>
                {selectedSol.codestado === 'FC' ? 'Resolución de Comité' : 'Liquidación Contable'}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{selectedSol.codsolicitud}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
                {selectedSol.nomcliente} · S/ {parseFloat(selectedSol.monto).toLocaleString()}
              </div>
            </div>
            <div style={{ padding: '22px 26px' }}>
              <div style={{ padding: '14px 16px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 18, fontSize: 13 }}>
                <strong style={{ display: 'block', marginBottom: 8, color: '#374151' }}>Transacciones PostgreSQL a ejecutar:</strong>
                <ul style={{ paddingLeft: 18, margin: 0, color: '#64748b', lineHeight: 1.8 }}>
                  {selectedSol.codestado === 'FC'
                    ? <><li>Registrar firma de Comité (Checker 2)</li><li>Cambiar estado a <code>AL (Listo para desembolso)</code></li></>
                    : <><li>Crear cuenta transaccional en <code>dcuentaahorro</code></li>
                      <li>Inyectar capital en <code>fagcuentaahorro</code></li>
                      <li>Asiento en <code>foperaciones</code>: "DESEMBOLSO PRÉSTAMO GNB"</li>
                      <li>Generar cronograma en <code>fplanpagomes</code></li>
                      <li>Cambiar estado a <code>03 (Desembolsado)</code></li></>
                  }
                </ul>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button style={S.btnGhost} onClick={() => setSelectedSol(null)}>Cancelar</button>
                {selectedSol.codestado === 'FC'
                  ? <button style={S.btn('#b45309')} disabled={processing} onClick={() => resolverComite(selectedSol.id)}>
                      <Scale size={15} /> {processing ? 'Procesando...' : 'Firmar por Comité'}
                    </button>
                  : <button style={S.btn('#7c3aed')} disabled={processing} onClick={() => desembolsar(selectedSol.id)}>
                      <Banknote size={15} /> {processing ? 'Procesando...' : 'Ejecutar Desembolso'}
                    </button>
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL JUDICIAL */}
      {selectedMoroso && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && setSelectedMoroso(null)}>
          <div style={S.modal}>
            <div style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)', padding: '22px 26px', color: '#fff' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase' }}>Acción Legal Irreversible</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>Derivación a Cartera Judicial</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>{selectedMoroso.codigo_credito} · {selectedMoroso.dias_atraso} días de atraso</div>
            </div>
            <div style={{ padding: '22px 26px' }}>
              <div style={{ padding: '14px 16px', borderRadius: 12, background: '#fee2e2', border: '1px solid #fca5a5', marginBottom: 16, fontSize: 13, color: '#7f1d1d' }}>
                <strong style={{ display: 'block', marginBottom: 6 }}>⚠️ Esta acción es irreversible desde esta interfaz</strong>
                <p style={{ margin: 0 }}>El crédito pasará a <strong>Estado 04 (Judicial)</strong> y será retirado de la cobranza regular. La deuda pendiente es de <strong>S/ {parseFloat(selectedMoroso.saldo_capital || 0).toLocaleString()}</strong>.</p>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button style={S.btnGhost} onClick={() => setSelectedMoroso(null)}>Cancelar</button>
                <button style={S.btn('#dc2626')} disabled={processing} onClick={() => derivarJudicial(selectedMoroso.id)}>
                  <Gavel size={15} /> {processing ? 'Procesando...' : 'Derivar a Judicial'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
