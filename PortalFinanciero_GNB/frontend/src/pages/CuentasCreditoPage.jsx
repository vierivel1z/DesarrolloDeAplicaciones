import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, ListChecks, RefreshCw, Receipt, FilePlus2, Search, Calendar } from 'lucide-react'
import { useCreditos } from '../hooks/useCreditos.js'
import { formatDate, toNumber } from '../utils/format.js'
import PageLayout from '../components/layout/PageLayout.jsx'
import Card from '../components/ui/Card.jsx'
import Loader from '../components/ui/Loader.jsx'
import Money from '../components/ui/Money.jsx'
import Badge from '../components/ui/Badge.jsx'
import Alert from '../components/ui/Alert.jsx'

export default function CuentasCreditoPage() {
  const { creditos, loading, error, recargar } = useCreditos()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const totalDeuda = creditos.reduce((s, c) => s + toNumber(c.pago_pendiente), 0)

  const filteredCreditos = creditos.filter((c) =>
    c.codcuentacredito.toLowerCase().includes(search.toLowerCase()) ||
    (c.calificacion || 'Normal').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PageLayout
      title="Mis Préstamos"
      subtitle="Préstamos › Mis productos"
      actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="bbva-btn-ghost sm" onClick={() => navigate('/creditos/solicitar')}>
            <FilePlus2 size={14} /> Solicitar préstamo
          </button>
          <button className="bbva-btn-ghost sm" onClick={recargar} disabled={loading}>
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>
      }
    >
      {error && <Alert tipo="error">{error}</Alert>}

      {/* Buscador Dinámico */}
      {!loading && creditos.length > 0 && (
        <div className="bn-search-wrapper">
          <Search className="bn-search-icon" size={18} />
          <input
            type="text"
            placeholder="Buscar préstamos por número o clasificación SBS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bn-search-input"
          />
        </div>
      )}

      {loading ? (
        <Loader text="Cargando créditos…" />
      ) : filteredCreditos.length === 0 ? (
        <Card>
          <p className="bbva-empty">
            {creditos.length === 0 
              ? 'No registra créditos vigentes asociados a su cliente.' 
              : 'No se encontraron préstamos que coincidan con la búsqueda.'}
          </p>
        </Card>
      ) : (
        <>
          {/* Grid de Préstamos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {filteredCreditos.map((c) => {
              const pendiente = toNumber(c.pago_pendiente)
              const otorgado = toNumber(c.monto_otorgado)
              const pagado = otorgado - pendiente
              const porcentaje = otorgado > 0 ? Math.min(100, Math.max(0, (pagado / otorgado) * 100)) : 0

              return (
                <div key={c.codcuentacredito} className="bn-card-phys" style={{ minHeight: 'auto', gap: '12px' }}>
                  <div className="bn-card-phys-header">
                    <div className="bn-card-phys-title">
                      <strong>{c.codcuentacredito}</strong>
                      <small>Préstamo Consumo</small>
                    </div>
                    <Badge estado={c.calificacion || 'Normal'} tone={c.dias_atraso > 0 ? 'red' : undefined} />
                  </div>

                  {/* Info general en dos columnas */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12.5px', margin: '6px 0' }}>
                    <div>
                      <span style={{ color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontSize: '10px', fontWeight: '800' }}>Fecha Desembolso</span>
                      <strong style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Calendar size={13} /> {formatDate(c.fecha_desembolso)}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontSize: '10px', fontWeight: '800' }}>Días de Atraso</span>
                      <strong style={{ color: c.dias_atraso > 0 ? '#dc2626' : '#16a34a', marginTop: '2px', display: 'block' }}>
                        {c.dias_atraso || '0'} días
                      </strong>
                    </div>
                  </div>

                  {/* Amortization Progress Tracker */}
                  <div className="bn-progress-container" style={{ margin: '4px 0' }}>
                    <div className="bn-progress-labels">
                      <span style={{ color: '#16a34a' }}>Amortizado: <Money value={pagado} /></span>
                      <span style={{ color: '#475569' }}>Deuda: <Money value={pendiente} /></span>
                    </div>
                    <div className="bn-progress-track">
                      <div className="bn-progress-fill" style={{ width: `${porcentaje}%` }} />
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '10.5px', color: '#94a3b8', fontWeight: 'bold', marginTop: '4px' }}>
                      Progreso de pago: {porcentaje.toFixed(0)}%
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="bn-card-phys-footer" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '4px' }}>
                    <span className="bn-card-phys-tea" style={{ color: '#64748b' }}>
                      Capital: <Money value={c.saldo_capital} />
                    </span>
                    <div className="bn-card-phys-actions">
                      <button className="bbva-btn-ghost sm" onClick={() => navigate(`/cuentas/credito/${c.codcuentacredito}/cuotas`)}>
                        <ListChecks size={14} /> Cronograma
                      </button>
                      <button 
                        className="bbva-btn sm" 
                        onClick={() => navigate(`/operaciones/pago-credito/${c.codcuentacredito}`)}
                        style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px' }}
                      >
                        <Receipt size={13} /> Pagar
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Resumen Total */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 6px -1px rgba(148,163,184,0.03)',
            marginTop: '20px'
          }}>
            <span style={{ fontWeight: '700', color: '#475569', fontSize: '14px' }}>Deuda consolidada total pendiente</span>
            <Money value={totalDeuda} className="bbva-money-strong" style={{ fontSize: '20px' }} />
          </div>
        </>
      )}
    </PageLayout>
  )
}
