import { CheckCircle2, Printer } from 'lucide-react'

/**
 * Tarjeta de comprobante tras una operación en línea.
 * filas: [{ label, value }]   (value puede ser texto o <Money/>)
 * acciones: [{ label, onClick, primary? }]
 */
export default function Comprobante({ titulo = 'Operación exitosa', mensaje, filas = [], nota, simulado = false, acciones = [] }) {
  // Busca el monto de la operación para mostrarlo de forma destacada si existe
  const montoFila = filas.find(f => f.label.toLowerCase() === 'monto')
  const otrasFilas = filas.filter(f => f.label.toLowerCase() !== 'monto')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      <div className="bn-receipt">
        <div className="bn-receipt-header">
          <div className="bn-receipt-success-icon">
            <CheckCircle2 size={32} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: '8px 0 2px' }}>{titulo}</h3>
          {mensaje && <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: '500' }}>{mensaje}</p>}
          
          <button 
            className="bbva-print" 
            onClick={() => window.print()} 
            title="Imprimir constancia"
            style={{
              position: 'absolute',
              top: '-10px',
              right: '-10px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '6px',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#C31A1F'; e.currentTarget.style.borderColor = '#C31A1F'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
          >
            <Printer size={16} />
          </button>
        </div>

        {simulado && (
          <div className="bbva-info-note" style={{ margin: '0 0 16px 0', textAlign: 'center', background: '#fffbeb', border: '1px solid #fef3c7', color: '#b45309' }}>
            Operación simulada (el endpoint aún no existe en el backend).
          </div>
        )}

        {/* Si hay un monto, lo mostramos de forma prominente en la constancia */}
        {montoFila && (
          <div style={{ textAlign: 'center', margin: '8px 0 20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Monto Transferido
            </span>
            <div className="bn-receipt-amount">
              {montoFila.value}
            </div>
          </div>
        )}

        <dl className="bn-receipt-rows">
          {otrasFilas.map((f, i) => (
            <div key={i} className="bn-receipt-row">
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>

        {nota && <p className="bbva-comprobante-nota" style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '12px', marginTop: '16px', fontSize: '11.5px', color: '#94a3b8', textAlign: 'center' }}>{nota}</p>}
      </div>

      {acciones.length > 0 && (
        <div className="bbva-form-actions" style={{ justifyContent: 'center' }}>
          {acciones.map((a, i) => (
            <button key={i} className={a.primary ? 'bbva-btn' : 'bbva-btn-gray'} onClick={a.onClick} style={{ minWidth: '150px' }}>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
