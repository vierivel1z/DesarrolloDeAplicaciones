import React, { useState, useEffect } from 'react'
import {
  FileSignature, Calculator, AlertTriangle, Briefcase,
  ChevronRight, TrendingUp, BarChart2, CheckCircle2,
  Scale, User, ArrowRight, Layers
} from 'lucide-react'
import api from '../../services/hb_api.js'
import Money from '../ui/Money.jsx'
import { formatDate } from '../../utils/format.js'
import Loader from '../ui/Loader.jsx'

const S = {
  tab: (active, danger = false) => ({
    padding: '10px 20px', background: 'none', border: 'none',
    borderBottom: active ? `3px solid ${danger ? '#dc2626' : '#15803d'}` : '3px solid transparent',
    fontWeight: 700, fontSize: 14,
    color: active ? (danger ? '#dc2626' : '#15803d') : '#64748b',
    cursor: 'pointer', transition: 'all 0.2s',
  }),
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 },
  kpiCard: (color) => ({
    background: '#fff', borderRadius: 16, padding: '20px 22px',
    display: 'flex', alignItems: 'center', gap: 14,
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)', borderLeft: `4px solid ${color}`,
  }),
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
  btn: (color = '#15803d') => ({ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: color, color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }),
  btnGhost: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: '#f1f5f9', color: '#64748b', border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(10,30,60,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { background: '#fff', borderRadius: 20, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.25)', overflow: 'hidden' },
}

export default function Checker1Dashboard() {
  const [activeTab, setActiveTab] = useState('kpis')
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSol, setSelectedSol] = useState(null)
  const [tea, setTea] = useState(20.0)
  const [cronograma, setCronograma] = useState([])
  const [approving, setApproving] = useState(false)
  const [hoveredRow, setHoveredRow] = useState(null)

  useEffect(() => { cargarSolicitudes() }, [])

  const cargarSolicitudes = async () => {
    try { setLoading(true); const r = await api.get('/admin/solicitudes'); setSolicitudes(r.data || []) }
    catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const pendFirma = solicitudes.filter(s => s.codestado === 'EV')
  const totalMontoEnCola = pendFirma.reduce((a, s) => a + parseFloat(s.monto || 0), 0)

  const kpis = [
    { label: 'Pendientes de firma', value: pendFirma.length, icon: FileSignature, color: '#15803d', bg: '#dcfce7' },
    { label: 'Monto en cola', value: totalMontoEnCola >= 1000 ? `S/${(totalMontoEnCola/1000).toFixed(0)}K` : `S/${totalMontoEnCola.toFixed(0)}`, icon: Briefcase, color: '#b45309', bg: '#fef3c7' },
    { label: 'Nivel 1 (≤ S/15K)', value: pendFirma.filter(s => parseFloat(s.monto) <= 15000).length, icon: Layers, color: '#0574AF', bg: '#e8f4fb' },
    { label: 'Nivel 2 (≤ S/50K)', value: pendFirma.filter(s => parseFloat(s.monto) > 15000 && parseFloat(s.monto) <= 50000).length, icon: TrendingUp, color: '#7c3aed', bg: '#f3e8ff' },
  ]

  const abrirModal = (sol) => { setSelectedSol(sol); setTea(20.0) }

  useEffect(() => {
    if (selectedSol && tea >= 13 && tea <= 36) generarCronograma()
    else setCronograma([])
  }, [selectedSol, tea])

  const generarCronograma = () => {
    const capital = parseFloat(selectedSol.monto)
    const n = selectedSol.plazo
    const tem = Math.pow(1 + tea / 100, 30 / 360) - 1
    const cuotaPura = capital * (tem * Math.pow(1+tem, n)) / (Math.pow(1+tem, n) - 1)
    let saldo = capital
    const crono = []
    for (let i = 1; i <= n; i++) {
      const interes = saldo * tem
      const amort = cuotaPura - interes
      const seguro = saldo * 0.000738
      const itf = (cuotaPura + seguro) * 0.00005
      const cuota = cuotaPura + seguro + itf
      saldo = Math.max(0, saldo - amort)
      crono.push({ mes: i, amort: amort.toFixed(2), interes: interes.toFixed(2), seguro: seguro.toFixed(2), itf: itf.toFixed(2), cuota: cuota.toFixed(2), saldo: saldo.toFixed(2) })
    }
    setCronograma(crono)
  }

  const aprobar = async () => {
    if (tea < 13 || tea > 36) return alert('TEA fuera de rango permitido (13%–36%)')
    setApproving(true)
    try {
      await api.post(`/admin/creditos/${selectedSol.id}/aprobar`, { tea_aprobada: parseFloat(tea) })
      const m = parseFloat(selectedSol.monto)
      alert(`✅ ${m > 50000 ? 'Firma 1 registrada. Solicitud enviada a Comité.' : 'Crédito aprobado. Contrato enviado al cliente.'}`)
      setSelectedSol(null); cargarSolicitudes()
    } catch (e) { alert('Error: ' + (e.response?.data?.detail || e.message)) }
    finally { setApproving(false) }
  }

  const nivelLabel = (monto) => {
    const m = parseFloat(monto)
    if (m <= 15000) return ['Nivel 1 · Básico', '#15803d', '#dcfce7']
    if (m <= 50000) return ['Nivel 2 · Regional', '#7c3aed', '#f3e8ff']
    return ['Nivel 3 · Comité', '#dc2626', '#fee2e2']
  }

  const cuota1 = cronograma[0]?.cuota ?? '—'

  return (
    <div>
      {/* ROL HEADER */}
      <div style={{ background: 'linear-gradient(135deg, #064e3b 0%, #15803d 100%)', borderRadius: 16, padding: '20px 24px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Scale size={26} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Panel de Trabajo</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>Jefe Regional / Riesgos (CHECKER 1)</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Asignación de TEA · Aprobación Nivel 1 y 2 · Firma para Comité</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 18px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{pendFirma.length}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Para firmar</div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #f1f5f9' }}>
        {[['kpis', '📊 Dashboard'], ['firmas', '✍️ Firmas y TEA']].map(([k, label]) => (
          <button key={k} onClick={() => setActiveTab(k)} style={S.tab(activeTab === k)}>{label}</button>
        ))}
      </div>

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

          {/* Resumen de niveles */}
          <div style={S.card}>
            <div style={S.cardHead}>
              <BarChart2 size={16} color="#15803d" />
              <span style={S.cardTitle}>Distribución de autonomía crediticia</span>
            </div>
            <div style={{ padding: '20px 22px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { label: 'Nivel 1', sub: '≤ S/ 15,000', val: pendFirma.filter(s => parseFloat(s.monto) <= 15000).length, color: '#15803d', bg: '#dcfce7', desc: 'Checker 1 aprueba directamente' },
                { label: 'Nivel 2', sub: '≤ S/ 50,000', val: pendFirma.filter(s => parseFloat(s.monto) > 15000 && parseFloat(s.monto) <= 50000).length, color: '#7c3aed', bg: '#f3e8ff', desc: 'Requiere Gerente Regional' },
                { label: 'Nivel 3', sub: '> S/ 50,000', val: pendFirma.filter(s => parseFloat(s.monto) > 50000).length, color: '#dc2626', bg: '#fee2e2', desc: 'Va a Comité (doble firma)' },
              ].map((n, i) => (
                <div key={i} style={{ borderRadius: 14, padding: '16px 18px', background: n.bg, border: `1px solid ${n.color}30` }}>
                  <div style={{ fontWeight: 800, fontSize: 28, color: n.color }}>{n.val}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: n.color }}>{n.label}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{n.sub}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{n.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'firmas' && (
        <div style={S.card}>
          <div style={S.cardHead}>
            <FileSignature size={16} color="#15803d" />
            <span style={S.cardTitle}>Solicitudes Evaluadas — Pendientes de Firma y TEA</span>
            <span style={{ marginLeft: 'auto', ...S.badge('#15803d', '#dcfce7') }}>{pendFirma.length}</span>
          </div>
          {loading ? <div style={{ padding: 30 }}><Loader /></div> : (
            <table style={S.table}>
              <thead>
                <tr>
                  {['Solicitud / Cliente', 'Nivel Autonomía', 'Monto', 'Plazo', 'Estado', 'Acción'].map(h => <th key={h} style={S.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {pendFirma.length === 0
                  ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No hay solicitudes pendientes de firma.</td></tr>
                  : pendFirma.map(s => {
                    const [nlabel, ncolor, nbg] = nivelLabel(s.monto)
                    return (
                      <tr key={s.id}
                        onMouseEnter={() => setHoveredRow(s.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{ background: hoveredRow === s.id ? '#f8fafc' : 'transparent', transition: 'background 0.15s' }}>
                        <td style={S.td}>
                          <div style={{ fontWeight: 700, color: '#0574AF', fontFamily: 'monospace', fontSize: 12 }}>{s.codsolicitud}</div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{s.nomcliente}</div>
                        </td>
                        <td style={S.td}><span style={S.badge(ncolor, nbg)}>{nlabel}</span></td>
                        <td style={S.td}><strong>S/ {parseFloat(s.monto).toLocaleString()}</strong></td>
                        <td style={S.td}>{s.plazo} meses</td>
                        <td style={S.td}><span style={S.badge('#b45309', '#fef3c7')}>Esperando TEA</span></td>
                        <td style={S.td}>
                          <button style={S.btn()} onClick={() => abrirModal(s)}>
                            <FileSignature size={14} /> Asignar TEA
                          </button>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* MODAL TEA + CRONOGRAMA */}
      {selectedSol && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && setSelectedSol(null)}>
          <div style={{ ...S.modal, maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #064e3b 0%, #15803d 100%)', padding: '22px 26px', color: '#fff' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase' }}>Firma y TEA — CHECKER 1</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{selectedSol.codsolicitud}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
                {selectedSol.nomcliente} · S/ {parseFloat(selectedSol.monto).toLocaleString()} · {selectedSol.plazo} meses
              </div>
            </div>

            <div style={{ padding: '22px 26px' }}>
              {/* Nivel */}
              {(() => {
                const [nl, nc, nb] = nivelLabel(selectedSol.monto)
                return (
                  <div style={{ padding: '12px 16px', borderRadius: 12, background: nb, border: `1px solid ${nc}30`, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>Ruta de aprobación</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{parseFloat(selectedSol.monto) > 50000 ? 'Se registrará primera firma. Luego irá a Comité.' : 'Aprobación directa con esta firma.'}</div>
                    </div>
                    <span style={S.badge(nc, nb)}>{nl}</span>
                  </div>
                )
              })()}

              {/* TEA Slider */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 700, fontSize: 13, color: '#374151', display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Asignar TEA Anual</span>
                  <strong style={{ color: '#15803d', fontSize: 18 }}>{tea}%</strong>
                </label>
                <input type="range" min={13} max={36} step={0.5} value={tea}
                  onChange={e => setTea(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#15803d', height: 6 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                  <span>Mín: 13%</span>
                  <span>Cuota estimada: <strong style={{ color: '#15803d' }}>S/ {cuota1}</strong></span>
                  <span>Máx: 36%</span>
                </div>
              </div>

              {/* Cronograma */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calculator size={14} /> Simulador de Cronograma Francés en vivo
                </div>
                {tea < 13 || tea > 36 ? (
                  <div style={{ padding: 14, borderRadius: 12, background: '#fee2e2', color: '#dc2626', fontSize: 13, fontWeight: 600 }}>
                    ⚠️ TEA fuera de parámetros del banco (13%–36%)
                  </div>
                ) : (
                  <div style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden', maxHeight: 200, overflowY: 'auto' }}>
                    <table style={{ ...S.table, fontSize: 12 }}>
                      <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                        <tr>
                          {['#', 'Amort.', 'Interés', 'Seguro', 'ITF', 'Cuota Total', 'Saldo Cap.'].map(h => <th key={h} style={{ ...S.th, padding: '8px 10px' }}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {cronograma.map((c, i) => (
                          <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                            <td style={{ ...S.td, padding: '8px 10px', color: '#94a3b8', fontWeight: 600 }}>{c.mes}</td>
                            <td style={{ ...S.td, padding: '8px 10px' }}>{c.amort}</td>
                            <td style={{ ...S.td, padding: '8px 10px' }}>{c.interes}</td>
                            <td style={{ ...S.td, padding: '8px 10px' }}>{c.seguro}</td>
                            <td style={{ ...S.td, padding: '8px 10px' }}>{c.itf}</td>
                            <td style={{ ...S.td, padding: '8px 10px', fontWeight: 700, color: '#15803d' }}>S/ {c.cuota}</td>
                            <td style={{ ...S.td, padding: '8px 10px' }}>{c.saldo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button style={S.btnGhost} onClick={() => setSelectedSol(null)}>Cancelar</button>
                <button
                  style={{ ...S.btn('#15803d'), opacity: (tea < 13 || tea > 36 || approving) ? 0.5 : 1 }}
                  disabled={approving || tea < 13 || tea > 36}
                  onClick={aprobar}>
                  {approving ? 'Procesando...' : parseFloat(selectedSol.monto) > 50000
                    ? <><FileSignature size={15} /> Firma 1 → Comité</>
                    : <><CheckCircle2 size={15} /> Aprobar y enviar contrato</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
