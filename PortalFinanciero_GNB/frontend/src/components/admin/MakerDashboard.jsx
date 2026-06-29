import React, { useState, useEffect, useMemo } from 'react'
import {
  FilePlus2, CheckCircle2, AlertTriangle, Clock, Eye,
  TrendingUp, User, FileCheck, XCircle, ChevronRight,
  Shield, BarChart2, Zap
} from 'lucide-react'
import api from '../../services/hb_api.js'
import Money from '../ui/Money.jsx'
import { formatDate } from '../../utils/format.js'
import Loader from '../ui/Loader.jsx'

// ── Estilos inline premium ──────────────────────────────────────────────────
const S = {
  tab: (active) => ({
    padding: '10px 20px',
    background: 'none',
    border: 'none',
    borderBottom: active ? '3px solid #0574AF' : '3px solid transparent',
    fontWeight: 700,
    fontSize: 14,
    color: active ? '#0574AF' : '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s',
    letterSpacing: '0.01em',
  }),
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
    marginBottom: 24,
  },
  kpiCard: (color, bg) => ({
    background: '#fff',
    borderRadius: 16,
    padding: '20px 22px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
    borderLeft: `4px solid ${color}`,
    transition: 'transform 0.2s, box-shadow 0.2s',
  }),
  kpiIcon: (color, bg) => ({
    width: 48, height: 48,
    borderRadius: 12,
    background: bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color,
    flexShrink: 0,
  }),
  kpiLabel: { fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 },
  kpiVal: { fontSize: 26, fontWeight: 800, color: '#1e293b', lineHeight: 1 },
  card: {
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
    overflow: 'hidden',
    marginBottom: 20,
  },
  cardHead: {
    padding: '16px 22px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'linear-gradient(135deg, #f8fafc 0%, #fff 100%)',
  },
  cardTitle: { fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 },
  cardBody: { padding: '20px 22px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '2px solid #f1f5f9', background: '#f8fafc' },
  td: { padding: '13px 12px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' },
  badge: (color, bg) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 10px', borderRadius: 20,
    fontSize: 11, fontWeight: 700,
    color, background: bg,
  }),
  btn: (color = '#0574AF', light = '#e8f4fb') => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 16px', borderRadius: 10,
    background: color, color: '#fff',
    border: 'none', fontWeight: 700, fontSize: 13,
    cursor: 'pointer', transition: 'opacity 0.2s',
  }),
  btnGhost: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 16px', borderRadius: 10,
    background: '#f1f5f9', color: '#64748b',
    border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer',
  },
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(10,30,60,0.55)',
    backdropFilter: 'blur(6px)',
    zIndex: 1000, display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  modal: {
    background: '#fff', borderRadius: 20,
    width: '100%', maxWidth: 520,
    boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
    overflow: 'hidden',
  },
  modalHead: (color) => ({
    background: color,
    padding: '22px 26px',
    color: '#fff',
  }),
  infoBox: (color, bg, border) => ({
    padding: '14px 16px', borderRadius: 12,
    background: bg, border: `1px solid ${border}`,
    marginBottom: 14,
  }),
}

export default function MakerDashboard() {
  const [activeTab, setActiveTab] = useState('kpis')
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSol, setSelectedSol] = useState(null)
  const [detalle, setDetalle] = useState(null)
  const [comentarios, setComentarios] = useState('')
  const [evaluating, setEvaluating] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [hoveredRow, setHoveredRow] = useState(null)

  useEffect(() => { cargarSolicitudes() }, [])

  const cargarSolicitudes = async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/solicitudes')
      setSolicitudes(res.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const ingresadas = solicitudes.filter(s => s.codestado === '01')
  const evaluadas = solicitudes.filter(s => s.codestado === 'EV')
  const rechazadas = solicitudes.filter(s => ['RZ', '06'].includes(s.codestado))
  const totalMonto = ingresadas.reduce((a, s) => a + parseFloat(s.monto || 0), 0)

  const kpis = [
    { label: 'En bandeja', value: ingresadas.length, icon: FilePlus2, color: '#0574AF', bg: '#e8f4fb', suffix: '' },
    { label: 'Evaluadas hoy', value: evaluadas.length, icon: FileCheck, color: '#15803d', bg: '#dcfce7', suffix: '' },
    { label: 'Rechazadas', value: rechazadas.length, icon: XCircle, color: '#dc2626', bg: '#fee2e2', suffix: '' },
    { label: 'Monto en cola', value: totalMonto >= 1000 ? `S/${(totalMonto/1000).toFixed(0)}K` : `S/${totalMonto.toFixed(0)}`, icon: TrendingUp, color: '#b45309', bg: '#fef3c7', suffix: '' },
  ]

  const abrirModal = async (sol) => {
    setSelectedSol(sol)
    setDetalle(null)
    setComentarios('')
    try {
      const res = await api.get(`/admin/solicitudes/${sol.id}/detalle`)
      setDetalle(res.data)
    } catch (e) { console.error(e) }
  }

  const sbsScore = detalle ? parseInt(detalle?.finanzas?.calificacion_code || '0') : 0
  const sbsLabel = detalle?.finanzas?.calificacion_sbs || 'Normal'
  const dtiVal = detalle?.scoring?.dti_ratio ?? (() => {
    if (!selectedSol) return 0
    const tem = Math.pow(1.25, 30/360) - 1
    const m = parseFloat(selectedSol.monto)
    const p = selectedSol.plazo
    if (p === 0) return 0
    const c = m * (tem * Math.pow(1+tem, p)) / (Math.pow(1+tem, p) - 1)
    return Math.round((c / 2500) * 10000) / 100
  })()

  const aprobar = async () => {
    if (dtiVal > 40 || sbsScore >= 2) return alert('No cumple condiciones mínimas.')
    setEvaluating(true)
    try {
      await api.post(`/admin/creditos/${selectedSol.id}/evaluar`, {
        score_pd: 85, ingreso_neto_mensual: 3000, comentarios_analista: comentarios
      })
      alert('✅ Solicitud evaluada. Enviada a Checker 1.')
      setSelectedSol(null)
      cargarSolicitudes()
    } catch (e) { alert('Error: ' + e.message) }
    finally { setEvaluating(false) }
  }

  const rechazar = async () => {
    setRejecting(true)
    try {
      await api.post(`/admin/solicitudes/${selectedSol.id}/rechazar`)
      alert('❌ Solicitud rechazada.')
      setSelectedSol(null)
      cargarSolicitudes()
    } catch (e) { alert('Error: ' + e.message) }
    finally { setRejecting(false) }
  }

  const canApprove = dtiVal <= 40 && sbsScore < 2
  const semaforoColor = sbsScore >= 3 ? '#dc2626' : sbsScore >= 2 ? '#d97706' : '#15803d'
  const semaforoBg = sbsScore >= 3 ? '#fee2e2' : sbsScore >= 2 ? '#fef3c7' : '#dcfce7'
  const dtiColor = dtiVal > 40 ? '#dc2626' : dtiVal > 30 ? '#d97706' : '#15803d'
  const dtiBg = dtiVal > 40 ? '#fee2e2' : dtiVal > 30 ? '#fef3c7' : '#dcfce7'

  return (
    <div>
      {/* HEADER ROL */}
      <div style={{ background: 'linear-gradient(135deg, #0a2e5c 0%, #0574AF 100%)', borderRadius: 16, padding: '20px 24px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={26} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Panel de Trabajo</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>Analista de Admisión (MAKER)</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Evaluación de elegibilidad, semáforo SBS y DTI</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 18px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{ingresadas.length}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Pendientes</div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #f1f5f9' }}>
        {[['kpis', '📊 Dashboard'], ['bandeja', '📋 Bandeja de Evaluación']].map(([k, label]) => (
          <button key={k} onClick={() => setActiveTab(k)} style={S.tab(activeTab === k)}>{label}</button>
        ))}
      </div>

      {/* KPIs */}
      {activeTab === 'kpis' && (
        <>
          <div style={S.kpiGrid}>
            {kpis.map((k, i) => (
              <div key={i} style={S.kpiCard(k.color, k.bg)}>
                <div style={S.kpiIcon(k.color, k.bg)}><k.icon size={22} /></div>
                <div>
                  <div style={S.kpiLabel}>{k.label}</div>
                  <div style={S.kpiVal}>{k.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div style={S.card}>
            <div style={S.cardHead}>
              <Zap size={16} color="#0574AF" />
              <span style={S.cardTitle}>Solicitudes recientes en bandeja</span>
              <button onClick={() => setActiveTab('bandeja')} style={{ ...S.btn(), marginLeft: 'auto', padding: '6px 14px', fontSize: 12 }}>
                Ver todas <ChevronRight size={14} />
              </button>
            </div>
            <div style={S.cardBody}>
              {loading ? <Loader text="Cargando..." /> : (
                ingresadas.length === 0
                  ? <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                      <FilePlus2 size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                      <p style={{ margin: 0 }}>No hay solicitudes pendientes</p>
                    </div>
                  : ingresadas.slice(0, 3).map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid #f8fafc' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#e8f4fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={18} color="#0574AF" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{s.nomcliente}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{s.codsolicitud} · {s.plazo} meses</div>
                      </div>
                      <div style={{ fontWeight: 700, color: '#0574AF', fontSize: 15 }}>S/ {parseFloat(s.monto).toLocaleString()}</div>
                      <button style={S.btn()} onClick={() => { setActiveTab('bandeja'); abrirModal(s) }}>Evaluar</button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </>
      )}

      {/* BANDEJA */}
      {activeTab === 'bandeja' && (
        <div style={S.card}>
          <div style={S.cardHead}>
            <FilePlus2 size={16} color="#0574AF" />
            <span style={S.cardTitle}>Solicitudes INGRESADAS — Pendientes de Evaluación</span>
            <span style={{ marginLeft: 'auto', ...S.badge('#0574AF', '#e8f4fb') }}>{ingresadas.length} solicitudes</span>
          </div>
          <div>
            {loading ? <div style={{ padding: 30 }}><Loader text="Cargando solicitudes..." /></div> : (
              <table style={S.table}>
                <thead>
                  <tr>
                    {['Solicitud', 'Cliente', 'Producto', 'Monto', 'Plazo', 'Fecha', 'Acción'].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ingresadas.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                      <CheckCircle2 size={32} style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
                      Bandeja vacía — no hay solicitudes pendientes
                    </td></tr>
                  ) : ingresadas.map(s => (
                    <tr key={s.id}
                      onMouseEnter={() => setHoveredRow(s.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{ background: hoveredRow === s.id ? '#f8fafc' : 'transparent', transition: 'background 0.15s' }}>
                      <td style={S.td}><strong style={{ color: '#0574AF', fontFamily: 'monospace' }}>{s.codsolicitud}</strong></td>
                      <td style={S.td}>
                        <div style={{ fontWeight: 600 }}>{s.nomcliente}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.nomproducto || 'CONSUMO'}</div>
                      </td>
                      <td style={S.td}><span style={S.badge('#7c3aed', '#f3e8ff')}>{s.nomtipocredito || 'CONSUMO'}</span></td>
                      <td style={S.td}><strong style={{ color: '#1e293b' }}>S/ {parseFloat(s.monto).toLocaleString()}</strong></td>
                      <td style={S.td}>{s.plazo} meses</td>
                      <td style={S.td}><span style={{ color: '#64748b', fontSize: 12 }}>{formatDate(s.fecha)}</span></td>
                      <td style={S.td}>
                        <button style={S.btn()} onClick={() => abrirModal(s)}>
                          <Eye size={14} /> Evaluar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* MODAL EVALUACIÓN */}
      {selectedSol && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && setSelectedSol(null)}>
          <div style={S.modal}>
            <div style={S.modalHead('linear-gradient(135deg, #0a2e5c 0%, #0574AF 100%)')}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Evaluación MAKER</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginTop: 2 }}>{selectedSol.codsolicitud}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>{selectedSol.nomcliente} · S/ {parseFloat(selectedSol.monto).toLocaleString()} / {selectedSol.plazo} meses</div>
            </div>

            <div style={{ padding: '22px 26px' }}>
              {/* Ver sustento */}
              {selectedSol.archivo_sustento_path && (
                <a href={selectedSol.archivo_sustento_path} target="_blank" rel="noreferrer"
                  style={{ ...S.btn('#475569'), textDecoration: 'none', marginBottom: 16, display: 'inline-flex', width: '100%', justifyContent: 'center' }}>
                  <Eye size={15} /> Ver Sustento de Ingresos
                </a>
              )}

              {/* Semáforo SBS */}
              {!detalle ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#94a3b8', fontSize: 13 }}>Cargando análisis SBS...</div>
              ) : (
                <>
                  <div style={S.infoBox(semaforoColor, semaforoBg, semaforoColor + '44')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#1e293b', fontSize: 13 }}>🚦 Semáforo SBS</span>
                      <span style={{ ...S.badge(semaforoColor, semaforoBg + '80'), fontWeight: 800 }}>
                        Nivel {sbsScore} — {sbsLabel}
                      </span>
                    </div>
                    {sbsScore >= 2 && <p style={{ margin: '8px 0 0', fontSize: 12, color: '#dc2626' }}>⛔ Rechazado automáticamente por Central de Riesgo SBS</p>}
                  </div>

                  <div style={S.infoBox(dtiColor, dtiBg, dtiColor + '44')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#1e293b', fontSize: 13 }}>📊 Ratio DTI (Endeudamiento)</span>
                      <span style={{ fontWeight: 800, fontSize: 20, color: dtiColor }}>{dtiVal}%</span>
                    </div>
                    <div style={{ marginTop: 8, height: 6, borderRadius: 4, background: '#e2e8f0', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(dtiVal, 100)}%`, background: dtiColor, borderRadius: 4, transition: 'width 0.5s' }} />
                    </div>
                    {dtiVal > 40 && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#dc2626' }}>⛔ Excede el límite máximo del 40%</p>}
                  </div>
                </>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 700, fontSize: 13, color: '#374151', display: 'block', marginBottom: 6 }}>Comentarios del analista</label>
                <textarea
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                  rows={3}
                  value={comentarios}
                  onChange={e => setComentarios(e.target.value)}
                  placeholder="Observaciones técnicas del analista..."
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button style={S.btnGhost} onClick={() => setSelectedSol(null)}>Cancelar</button>
                <button
                  style={{ ...S.btn('#dc2626'), opacity: (!detalle || canApprove) ? 0.4 : 1 }}
                  disabled={rejecting || evaluating || !detalle || canApprove}
                  onClick={rechazar}>
                  <XCircle size={15} /> Rechazar
                </button>
                <button
                  style={{ ...S.btn('#15803d'), opacity: (!detalle || !canApprove) ? 0.4 : 1 }}
                  disabled={evaluating || rejecting || !detalle || !canApprove}
                  onClick={aprobar}>
                  <CheckCircle2 size={15} /> {evaluating ? 'Evaluando...' : 'Aprobar → Checker'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
