import React from 'react'
import { AlertTriangle, TrendingDown, ShieldAlert, FileX2 } from 'lucide-react'

// Métricas audibles GNB Perú
export default function GlobalKPIDashboard() {
  const kpis = [
    { label: 'Ratio de Mora Global', value: '4.31%', icon: AlertTriangle, color: '#0574AF', bg: '#0574AF18', desc: 'Media sistémica: 7.67%' },
    { label: 'Ratio de Cartera Pesada', value: '4.40%', icon: TrendingDown, color: '#FAB27F', bg: '#FAB27F18', desc: 'Calificación CPP a Pérdida' },
    { label: 'Cobertura de Provisiones', value: '127.40%', icon: ShieldAlert, color: '#73b71c', bg: '#73b71c18', desc: 'Provisión Específica + Genérica' },
    { label: 'Castigos Recientes (12M)', value: 'S/ 57.6 MM', icon: FileX2, color: '#e53935', bg: '#e5393518', desc: 'Baja del balance contable' }
  ]

  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 18, color: 'var(--gnb-dark)', marginBottom: 16 }}>
        Dashboard Global de Riesgos — Banco GNB Perú
      </h2>
      <div className="admin-kpi-grid">
        {kpis.map((k, i) => (
          <div key={i} className="admin-kpi-card" style={{ '--kpi-color': k.color, '--kpi-bg': k.bg, background: '#fff' }}>
            <span className="admin-kpi-ico"><k.icon size={24} /></span>
            <div className="admin-kpi-body">
              <span className="admin-kpi-label">{k.label}</span>
              <span className="admin-kpi-val">{k.value}</span>
              <small style={{ color: 'var(--hb-muted)', fontSize: 11, display: 'block', marginTop: 4 }}>
                {k.desc}
              </small>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
