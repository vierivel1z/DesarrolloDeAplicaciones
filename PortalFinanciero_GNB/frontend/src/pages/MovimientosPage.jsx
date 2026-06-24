import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Send, Receipt, FileText, Wallet, CreditCard, PiggyBank, Search, ListChecks } from 'lucide-react'
import { useMovimientos } from '../hooks/useMovimientos.js'
import { useCuentas } from '../hooks/useCuentas.js'
import { simboloMoneda, formatTEA, formatDate } from '../utils/format.js'
import PageLayout from '../components/layout/PageLayout.jsx'
import Card from '../components/ui/Card.jsx'
import Loader from '../components/ui/Loader.jsx'
import Money from '../components/ui/Money.jsx'
import Badge from '../components/ui/Badge.jsx'
import Alert from '../components/ui/Alert.jsx'

export default function MovimientosPage() {
  const { cod } = useParams()
  const navigate = useNavigate()
  const { movimientos, loading, error, recargar } = useMovimientos(cod, 50)
  const { cuentas } = useCuentas('ahorro')
  const [search, setSearch] = useState('')

  const cuenta = cuentas.find((c) => c.codcuentaahorro === cod)
  const simbolo = cuenta ? simboloMoneda(cuenta.moneda) : 'S/'

  const filteredMovimientos = movimientos.filter((m) =>
    (m.concepto || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.canal || m.medio || '').toLowerCase().includes(search.toLowerCase()) ||
    String(m.monto).includes(search)
  )

  // Agrupar movimientos por fecha formateada
  const grouped = []
  filteredMovimientos.forEach((m) => {
    const dateStr = formatDate(m.fecha)
    let group = grouped.find((g) => g.date === dateStr)
    if (!group) {
      group = { date: dateStr, items: [] }
      grouped.push(group)
    }
    group.items.push(m)
  })

  return (
    <PageLayout
      title="Detalle de Cuenta"
      subtitle="Cuentas › Movimientos"
      actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="bbva-btn-ghost sm" onClick={() => navigate('/cuentas/ahorro')}>
            <ArrowLeft size={14} /> Volver
          </button>
          <button className="bbva-btn-ghost sm" onClick={recargar} disabled={loading}>
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>
      }
    >
      {/* Resumen Físico de Tarjeta arriba */}
      {cuenta && (
        <div className="bn-card-phys" style={{ minHeight: 'auto', marginBottom: '20px', background: 'linear-gradient(135deg, #1e2937 0%, #111827 100%)', color: '#ffffff', borderColor: '#374151' }}>
          <div className="bn-card-phys-header">
            <div className="bn-card-phys-title">
              <strong style={{ color: '#ffffff' }}>{cuenta.codcuentaahorro}</strong>
              <small style={{ color: '#94a3b8' }}>{cuenta.tipo} · {cuenta.moneda}</small>
            </div>
            <Badge estado={cuenta.estado} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', alignItems: 'end', marginTop: '16px' }}>
            <div>
              <span className="bn-card-phys-saldo-label" style={{ color: '#94a3b8' }}>Saldo Contable Disponible</span>
              <div className="bn-card-phys-saldo" style={{ color: '#ffffff', fontSize: '28px' }}>
                <Money value={cuenta.saldo} simbolo={simbolo} />
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '13px', color: '#94a3b8', fontWeight: 'bold' }}>
              Tasa de interés TEA: <span style={{ color: '#ffcb05' }}>{formatTEA(cuenta.tea)}</span>
            </div>
          </div>
        </div>
      )}

      {error && <Alert tipo="error">{error}</Alert>}

      {/* Buscador Dinámico */}
      {!loading && movimientos.length > 0 && (
        <div className="bn-search-wrapper">
          <Search className="bn-search-icon" size={18} />
          <input
            type="text"
            placeholder="Buscar por descripción, canal o monto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bn-search-input"
          />
        </div>
      )}

      {/* Historial de Movimientos */}
      <Card title="Últimos movimientos" icon={<ListChecks size={18} style={{ color: '#C31A1F' }} />}>
        {loading ? (
          <Loader text="Cargando movimientos…" />
        ) : filteredMovimientos.length === 0 ? (
          <p className="bbva-empty">
            {movimientos.length === 0
              ? 'Esta cuenta no registra movimientos en el periodo consultado.'
              : 'No se encontraron movimientos que coincidan con la búsqueda.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {grouped.map((g) => (
              <div key={g.date} className="bn-mov-group">
                <div className="bn-mov-date-header">{g.date}</div>
                {g.items.map((m, idx) => {
                  const isPositive = m.signo === '+'
                  const meta = getCategoryIconAndColor(m.concepto)
                  const CategoryIcon = meta.Icon

                  return (
                    <div key={`${m.fecha}-${idx}`} className="bn-mov-item">
                      <div 
                        className="bn-mov-icon" 
                        style={{ background: meta.bg, color: meta.color }}
                      >
                        <CategoryIcon size={18} />
                      </div>
                      <div className="bn-mov-info">
                        <strong>{m.concepto || 'Operación'}</strong>
                        <small>{m.canal || m.medio || 'Banca por Internet'}</small>
                      </div>
                      <div className={`bn-mov-amount ${isPositive ? 'positive' : 'negative'}`}>
                        {isPositive ? '+' : '-'} <Money value={m.monto} simbolo={simbolo} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageLayout>
  )
}

function getCategoryIconAndColor(concepto) {
  const c = (concepto || '').toLowerCase()
  if (c.includes('transfer') || c.includes('transf')) {
    return { Icon: Send, bg: '#eff6ff', color: '#1d4ed8' }
  }
  if (c.includes('servicio') || c.includes('pago serv')) {
    return { Icon: FileText, bg: '#fffbeb', color: '#d97706' }
  }
  if (c.includes('crédito') || c.includes('prestamo') || c.includes('pago cuota')) {
    return { Icon: Receipt, bg: '#fdf2f2', color: '#C31A1F' }
  }
  if (c.includes('interés') || c.includes('abono') || c.includes('depósito') || c.includes('sueldo') || c.includes('nómina')) {
    return { Icon: PiggyBank, bg: '#f0fdf4', color: '#16a34a' }
  }
  return { Icon: CreditCard, bg: '#f1f5f9', color: '#475569' }
}
