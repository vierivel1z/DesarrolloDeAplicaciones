import { useState, useEffect } from 'react'
import { getCarteraMora, ejecutarEodMora, aplicarTransicionMora } from '../services/moraService'
import PageLayout from '../components/layout/PageLayout'
import Card from '../components/ui/Card'
import Tabla from '../components/ui/Tabla'
import Money from '../components/ui/Money'
import Badge from '../components/ui/Badge'
import { Play, Gavel, FileWarning } from 'lucide-react'
import { adminEjecutarEodAhorros } from '../services/adminService'

export default function AdminMoraPage() {
  const [cartera, setCartera] = useState([])
  const [loading, setLoading] = useState(true)
  const [eodLoading, setEodLoading] = useState(false)

  const cargar = () => {
    setLoading(true)
    getCarteraMora()
      .then(setCartera)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargar()
  }, [])

  const handleEod = async () => {
    if(!window.confirm("¿Ejecutar proceso End of Day (EOD) para mora? Esto actualizará días de atraso, intereses y categorías SBS.")) return
    try {
      setEodLoading(true)
      const res = await ejecutarEodMora()
      alert(res.mensaje)
      cargar()
    } catch(e) {
      alert("Error en EOD: " + e.message)
    } finally {
      setEodLoading(false)
    }
  }

  const handleEodAhorros = async () => {
    if(!window.confirm("¿Ejecutar proceso End of Day (EOD) para ahorros? Esto calculará el interés diario (capitalizable para Cuenta Rolando).")) return
    try {
      setEodLoading(true)
      const res = await adminEjecutarEodAhorros()
      alert(`EOD Ahorros exitoso.\nCuentas afectadas: ${res.cuentas_afectadas}\nInterés pagado/acumulado: S/ ${res.interes_total_banco_pagado}`)
    } catch(e) {
      alert("Error en EOD Ahorros: " + e.message)
    } finally {
      setEodLoading(false)
    }
  }

  const handleJudicial = async (pk) => {
    if(!window.confirm("¿Pasar cuenta a Judicial? Solo permitido si > 120 días y Rol >= Riesgos/Admin")) return
    try {
      await aplicarTransicionMora(pk, 'judicial')
      alert("Enviado a judicial")
      cargar()
    } catch(e) {
      alert("Error: " + (e.response?.data?.detail || e.message))
    }
  }

  const handleCastigo = async (pk) => {
    if(!window.confirm("¿Castigar deuda? Solo permitido si > 180 días y Rol >= Comité/Admin")) return
    try {
      await aplicarTransicionMora(pk, 'castigo')
      alert("Deuda castigada")
      cargar()
    } catch(e) {
      alert("Error: " + (e.response?.data?.detail || e.message))
    }
  }

  const cols = [
    { key: 'codcuentacredito', header: 'Cuenta' },
    { key: 'nomcliente', header: 'Cliente' },
    { key: 'diasatrasocredito', header: 'Días Atraso', align: 'center' },
    { key: 'banda', header: 'Banda/Estado', render: c => {
      let tone = 'gray'
      if (c.banda === 'Judicial' || c.banda === 'Castigo') tone = 'red'
      else if (c.banda === 'Tardía') tone = 'amber'
      return <Badge estado={c.banda} tone={tone} />
    }},
    { key: 'montosaldocapital', header: 'Saldo Cap.', align: 'right', render: c => <Money value={c.montosaldocapital}/> },
    { key: 'acciones', header: 'Acciones', render: c => (
        <div style={{display: 'flex', gap: 5}}>
            <button className="bbva-btn-ghost sm" onClick={() => handleJudicial(c.pkcuentacredito)} title="Pasar a Judicial"><Gavel size={14}/></button>
            <button className="bbva-btn-ghost sm" style={{color: 'var(--hb-danger)'}} onClick={() => handleCastigo(c.pkcuentacredito)} title="Castigo Contable"><FileWarning size={14}/></button>
        </div>
    )}
  ]

  return (
    <PageLayout>
      <div className="bbva-page-head">
        <div>
          <h1 className="bbva-page-title">Procesos Batch EOD</h1>
          <p className="bbva-page-sub">Gestión de cartera atrasada y ejecución de cierres contables (Ahorro/Crédito)</p>
        </div>
        <div className="bbva-page-actions" style={{display: 'flex', gap: '10px'}}>
          <button className="bbva-btn" onClick={handleEodAhorros} disabled={eodLoading}>
            <Play size={14}/> {eodLoading ? 'Ejecutando...' : 'EOD Ahorros (Pasivos)'}
          </button>
          <button className="bbva-btn" onClick={handleEod} disabled={eodLoading} style={{background: 'var(--hb-danger)'}}>
            <Play size={14}/> {eodLoading ? 'Ejecutando...' : 'EOD Créditos (Activos/Mora)'}
          </button>
        </div>
      </div>
      <Card>
        <Tabla columns={cols} rows={cartera} rowKey={r => r.pkcuentacredito} emptyText="No hay cartera morosa" />
      </Card>
    </PageLayout>
  )
}
