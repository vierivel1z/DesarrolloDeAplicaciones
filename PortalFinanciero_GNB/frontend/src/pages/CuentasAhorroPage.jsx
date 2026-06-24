import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Wallet, ListChecks, ChevronDown, RefreshCw,
  Send, Receipt, FileText, PiggyBank, Search, HelpCircle
} from 'lucide-react'
import { useCuentas } from '../hooks/useCuentas.js'
import { useDetalleAhorro } from '../hooks/useMovimientos.js'
import { simboloMoneda, formatTEA, toNumber } from '../utils/format.js'
import PageLayout from '../components/layout/PageLayout.jsx'
import Card from '../components/ui/Card.jsx'
import Loader from '../components/ui/Loader.jsx'
import Badge from '../components/ui/Badge.jsx'
import Money from '../components/ui/Money.jsx'
import Alert from '../components/ui/Alert.jsx'
import DetalleAhorro from '../components/cuentas/DetalleAhorro.jsx'

export default function CuentasAhorroPage() {
  const { cuentas, loading, error, recargar } = useCuentas('ahorro')
  const navigate = useNavigate()
  const [abierta, setAbierta] = useState(null) // codcuentaahorro con detalle abierto
  const [search, setSearch] = useState('')

  const total = cuentas.reduce((s, c) => s + toNumber(c.saldo), 0)

  const filteredCuentas = cuentas.filter((c) =>
    c.codcuentaahorro.toLowerCase().includes(search.toLowerCase()) ||
    (c.tipo || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PageLayout
      title="Cuentas de Ahorro"
      subtitle="Cuentas › Mis productos"
      actions={
        <button className="bbva-btn-ghost sm" onClick={recargar} disabled={loading}>
          <RefreshCw size={14} /> Actualizar
        </button>
      }
    >
      {error && <Alert tipo="error">{error}</Alert>}

      {/* Buscador Dinámico */}
      {!loading && cuentas.length > 0 && (
        <div className="bn-search-wrapper">
          <Search className="bn-search-icon" size={18} />
          <input
            type="text"
            placeholder="Buscar por número de cuenta o tipo de producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bn-search-input"
          />
        </div>
      )}

      {loading ? (
        <Loader text="Cargando cuentas de ahorro…" />
      ) : filteredCuentas.length === 0 ? (
        <Card>
          <p className="bbva-empty">
            {cuentas.length === 0 
              ? 'No registra cuentas de ahorro asociadas a su cliente.' 
              : 'No se encontraron cuentas que coincidan con la búsqueda.'}
          </p>
        </Card>
      ) : (
        <>
          <div className="bn-account-grid">
            {filteredCuentas.map((c) => (
              <CuentaItem
                key={c.codcuentaahorro}
                cuenta={c}
                abierta={abierta === c.codcuentaahorro}
                onToggle={() => setAbierta(abierta === c.codcuentaahorro ? null : c.codcuentaahorro)}
                onMovimientos={() => navigate(`/cuentas/ahorro/${c.codcuentaahorro}/movimientos`)}
              />
            ))}
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
            <span style={{ fontWeight: '700', color: '#475569', fontSize: '14px' }}>Saldo disponible total consolidado</span>
            <Money value={total} className="bbva-money-strong" style={{ fontSize: '20px' }} />
          </div>
        </>
      )}
    </PageLayout>
  )
}

function CuentaItem({ cuenta, abierta, onToggle, onMovimientos }) {
  const simbolo = simboloMoneda(cuenta.moneda)
  // Carga perezosa del detalle solo cuando se expande.
  const { detalle, loading, error } = useDetalleAhorro(abierta ? cuenta.codcuentaahorro : null)
  const navigate = useNavigate()

  return (
    <div className={`bn-card-phys ${abierta ? 'open' : ''}`} style={{ minHeight: 'auto', gap: '16px' }}>
      <div className="bn-card-phys-header">
        <div className="bn-card-phys-title">
          <strong>{cuenta.codcuentaahorro}</strong>
          <small>{cuenta.tipo} · {cuenta.moneda}</small>
        </div>
        <Badge estado={cuenta.estado} />
      </div>

      <div className="bn-card-phys-middle" style={{ margin: '8px 0' }}>
        <span className="bn-card-phys-saldo-label">Saldo Disponible</span>
        <div className="bn-card-phys-saldo">
          <Money value={cuenta.saldo} simbolo={simbolo} />
        </div>
      </div>

      <div className="bn-card-phys-footer" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '4px' }}>
        <span className="bn-card-phys-tea" style={{ color: '#16a34a', fontWeight: 'bold' }}>
          TEA: {formatTEA(cuenta.tea)}
        </span>
        <div className="bn-card-phys-actions">
          <button className="bbva-btn-ghost sm" onClick={onMovimientos} title="Ver movimientos">
            <ListChecks size={14} /> Movs
          </button>
          <button className="bbva-btn-ghost sm" onClick={onToggle} title="Ver detalles bancarios">
            Detalle <ChevronDown size={14} className={`bbva-chev ${abierta ? 'up' : ''}`} style={{ marginLeft: '2px' }} />
          </button>
          <button 
            className="bbva-btn sm" 
            onClick={() => navigate('/operaciones/transferencia', { state: { cuentaOrigen: cuenta.codcuentaahorro } })}
            style={{ padding: '6px 10px', fontSize: '11px', borderRadius: '8px' }}
            title="Nueva transferencia"
          >
            <Send size={12} />
          </button>
        </div>
      </div>

      {abierta && (
        <div style={{ width: '100%', marginTop: '8px', borderTop: '1px dashed #e2e8f0', paddingTop: '12px' }}>
          <DetalleAhorro detalle={detalle} loading={loading} error={error} />
        </div>
      )}
    </div>
  )
}
