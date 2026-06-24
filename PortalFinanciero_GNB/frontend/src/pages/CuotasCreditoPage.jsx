import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Receipt, RefreshCw } from 'lucide-react'
import { useCuotas } from '../hooks/useCreditos.js'
import { formatDate } from '../utils/format.js'
import PageLayout from '../components/layout/PageLayout.jsx'
import Card from '../components/ui/Card.jsx'
import Tabla from '../components/ui/Tabla.jsx'
import Loader from '../components/ui/Loader.jsx'
import Money from '../components/ui/Money.jsx'
import Badge from '../components/ui/Badge.jsx'
import Alert from '../components/ui/Alert.jsx'

export default function CuotasCreditoPage() {
  const { cod } = useParams()
  const navigate = useNavigate()
  const { cuotas, loading, error, recargar } = useCuotas(cod)

  const proxima = cuotas.find((c) => !c.pagada)

  const columns = [
    { key: 'nrocuota', header: 'N° Cuota', render: (c) => <strong style={{ color: '#1e293b' }}>{c.nrocuota}</strong> },
    { key: 'fecha_vencimiento', header: 'Vencimiento', render: (c) => formatDate(c.fecha_vencimiento) },
    { key: 'monto_cuota', header: 'Cuota', align: 'right', render: (c) => <Money value={c.monto_cuota} /> },
    { key: 'capital', header: 'Capital', align: 'right', render: (c) => <Money value={c.capital} /> },
    { key: 'interes', header: 'Interés', align: 'right', render: (c) => <Money value={c.interes} /> },
    { key: 'saldo_capital', header: 'Saldo Capital', align: 'right', render: (c) => <Money value={c.saldo_capital} /> },
    { key: 'dias_atraso', header: 'Días atraso', align: 'center', render: (c) => (c.dias_atraso > 0 ? <Badge estado={`${c.dias_atraso}`} tone="red" /> : <span style={{ color: '#94a3b8', fontWeight: '500' }}>0</span>) },
    { key: 'estado', header: 'Estado', render: (c) => <Badge estado={c.pagada ? 'Pagada' : (c.estado === '02' ? 'Vencida' : 'Vigente')} tone={c.pagada ? 'green' : (c.estado === '02' ? 'red' : 'yellow')} /> },
  ]

  return (
    <PageLayout
      title="Cronograma de Cuotas"
      subtitle={`Préstamos › Crédito ${cod}`}
      actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="bbva-btn-ghost sm" onClick={() => navigate('/cuentas/credito')}>
            <ArrowLeft size={14} /> Volver
          </button>
          <button className="bbva-btn-ghost sm" onClick={recargar} disabled={loading}>
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>
      }
    >
      {error && <Alert tipo="error">{error}</Alert>}

      {/* Alerta de Próxima Cuota Premium */}
      {!loading && proxima && (
        <div style={{
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
          border: '1.5px solid #f59e0b',
          borderRadius: '12px',
          padding: '18px 24px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.08)'
        }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block' }}>
              ⚠️ Próximo Vencimiento Pendiente
            </span>
            <strong style={{ fontSize: '15px', color: '#78350f', marginTop: '4px', display: 'block' }}>
              Cuota N° {proxima.nrocuota} — Vence el {formatDate(proxima.fecha_vencimiento)}
            </strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '10px', color: '#b45309', display: 'block', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total a Pagar</span>
              <span style={{ fontSize: '19px', fontWeight: '900', color: '#b45309', fontFamily: 'Outfit, sans-serif' }}>
                <Money value={proxima.monto_cuota} />
              </span>
            </div>
            <button 
              className="bbva-btn" 
              onClick={() => navigate(`/operaciones/pago-credito/${cod}`)}
              style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(195, 26, 31, 0.15)' }}
            >
              <Receipt size={14} /> Pagar cuota
            </button>
          </div>
        </div>
      )}

      <Card title="Cronograma de pagos" icon={<CalendarDays size={18} style={{ color: '#C31A1F' }} />}>
        {loading ? (
          <Loader text="Cargando cronograma…" />
        ) : (
          <Tabla columns={columns} rows={cuotas} rowKey={(c) => c.nrocuota}
            emptyText="Este crédito no tiene cuotas registradas o ya fue cancelado." />
        )}
      </Card>
    </PageLayout>
  )
}
