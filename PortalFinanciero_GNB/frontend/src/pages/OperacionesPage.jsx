import { useNavigate } from 'react-router-dom'
import { Send, Receipt, FileText, FilePlus2, ChevronRight } from 'lucide-react'
import PageLayout from '../components/layout/PageLayout.jsx'

const OPERACIONES = [
  {
    icon: Send, color: '#C31A1F', bg: '#fdf2f2',
    titulo: 'Transferencias entre cuentas propias',
    desc: 'Mueve dinero de forma segura e inmediata entre tus cuentas de ahorro del Banco de la Nación.',
    to: '/operaciones/transferencia',
  },
  {
    icon: Receipt, color: '#d97706', bg: '#fffbeb',
    titulo: 'Pago de cuotas de crédito',
    desc: 'Amortiza tu deuda o paga la cuota de tu préstamo vigente debitando de tu cuenta de ahorros.',
    to: '/operaciones/pago-credito',
  },
  {
    icon: FileText, color: '#16a34a', bg: '#f0fdf4',
    titulo: 'Pago de servicios públicos',
    desc: 'Paga de forma rápida servicios de agua, luz, telefonía celular, internet y más.',
    to: '/operaciones/pago-servicios',
  },
  {
    icon: FilePlus2, color: '#7c3aed', bg: '#faf5ff',
    titulo: 'Solicitar préstamo digital',
    desc: 'Simula y solicita tu nuevo préstamo de consumo o microempresa en sencillos pasos 100% digital.',
    to: '/creditos/solicitar',
  },
]

export default function OperacionesPage() {
  const navigate = useNavigate()
  return (
    <PageLayout title="Operaciones en línea" subtitle="Operaciones › Selecciona una operación">
      <div className="bbva-op-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        {OPERACIONES.map((o) => {
          const Icon = o.icon
          return (
            <button 
              key={o.to} 
              className="bbva-op-card" 
              onClick={() => navigate(o.to)}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: '0 4px 6px -1px rgba(148, 163, 184, 0.03)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(148, 163, 184, 0.15)'
                e.currentTarget.style.borderColor = o.color
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(148, 163, 184, 0.03)'
                e.currentTarget.style.borderColor = '#e2e8f0'
              }}
            >
              <span className="bbva-op-ico" style={{ 
                background: o.bg, 
                color: o.color, 
                width: '56px', 
                height: '56px', 
                borderRadius: '14px',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0
              }}>
                <Icon size={24} />
              </span>
              <span className="bbva-op-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <strong style={{ fontSize: '15px', color: '#1e293b', fontWeight: '800' }}>{o.titulo}</strong>
                <small style={{ color: '#64748b', fontSize: '12.5px', lineHeight: '1.45', fontWeight: '500' }}>{o.desc}</small>
              </span>
              <ChevronRight size={18} className="bbva-op-chev" style={{ color: '#cbd5e1' }} />
            </button>
          )
        })}
      </div>
    </PageLayout>
  )
}
