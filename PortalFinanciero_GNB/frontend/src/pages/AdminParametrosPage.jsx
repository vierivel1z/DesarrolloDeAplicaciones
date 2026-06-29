import { useState, useEffect } from 'react'
import { getAdminParametros, adminConfigurarParametros } from '../services/adminService'
import PageLayout from '../components/layout/PageLayout'
import Card from '../components/ui/Card'
import Alert from '../components/ui/Alert'
import Loader from '../components/ui/Loader'
import { Settings, Save } from 'lucide-react'
import { useHBAuth } from '../hooks/useHBAuth'
import { useNavigate } from 'react-router-dom'

export default function AdminParametrosPage() {
  const { user } = useHBAuth()
  const navigate = useNavigate()
  
  const [parametros, setParametros] = useState({
    monto_min_pen: '',
    monto_max_pen: '',
    monto_min_usd: '',
    monto_max_usd: '',
    tea_min: '',
    tea_max: ''
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Solo SUPERADMIN puede editar, pero otros roles podrian ver. Validemos:
    if (user && user.role !== 'SUPERADMIN') {
      setError("Acceso denegado. Solo el rol SUPERADMIN puede configurar parámetros globales.")
      setLoading(false)
      return
    }

    getAdminParametros()
      .then((data) => {
        setParametros({
          monto_min_pen: data.monto_min_pen || '',
          monto_max_pen: data.monto_max_pen || '',
          monto_min_usd: data.monto_min_usd || '',
          monto_max_usd: data.monto_max_usd || '',
          tea_min: data.tea_min || '',
          tea_max: data.tea_max || ''
        })
      })
      .catch((err) => setError("Error al cargar parámetros: " + (err.response?.data?.detail || err.message)))
      .finally(() => setLoading(false))
  }, [user])

  const setF = (k) => (e) => setParametros((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)
    setError(null)
    setSaving(true)

    try {
      // Parsear a números
      const payload = {
        monto_min_pen: parseFloat(parametros.monto_min_pen),
        monto_max_pen: parseFloat(parametros.monto_max_pen),
        monto_min_usd: parseFloat(parametros.monto_min_usd),
        monto_max_usd: parseFloat(parametros.monto_max_usd),
        tea_min: parseFloat(parametros.tea_min),
        tea_max: parseFloat(parametros.tea_max)
      }

      await adminConfigurarParametros(payload)
      setMessage("Parámetros globales actualizados correctamente.")
    } catch (err) {
      setError("Error al guardar: " + (err.response?.data?.detail || err.message))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loader text="Cargando configuración..." />

  return (
    <PageLayout>
      <div className="bbva-page-head">
        <div>
          <h1 className="bbva-page-title">Configuración Global (Tesorería)</h1>
          <p className="bbva-page-sub">Gestión de límites de montos y tasas de interés permitidas</p>
        </div>
      </div>

      <Card title="Parámetros del Core Bancario" icon={<Settings size={18} />}>
        {error && <Alert tipo="error">{error}</Alert>}
        {message && <Alert tipo="success">{message}</Alert>}

        {user?.role === 'SUPERADMIN' ? (
          <form onSubmit={handleSubmit}>
            <div className="hb-grid-2">
              <div className="hb-field">
                <label>Monto Mínimo Soles (S/)</label>
                <input className="hb-input" type="number" step="0.01" min="0" value={parametros.monto_min_pen} onChange={setF('monto_min_pen')} required />
              </div>
              <div className="hb-field">
                <label>Monto Máximo Soles (S/)</label>
                <input className="hb-input" type="number" step="0.01" min="0" value={parametros.monto_max_pen} onChange={setF('monto_max_pen')} required />
              </div>
            </div>

            <div className="hb-grid-2">
              <div className="hb-field">
                <label>Monto Mínimo Dólares ($)</label>
                <input className="hb-input" type="number" step="0.01" min="0" value={parametros.monto_min_usd} onChange={setF('monto_min_usd')} required />
              </div>
              <div className="hb-field">
                <label>Monto Máximo Dólares ($)</label>
                <input className="hb-input" type="number" step="0.01" min="0" value={parametros.monto_max_usd} onChange={setF('monto_max_usd')} required />
              </div>
            </div>

            <div className="hb-grid-2">
              <div className="hb-field">
                <label>TEA Mínima Permitida (%)</label>
                <input className="hb-input" type="number" step="0.01" min="0" max="100" value={parametros.tea_min} onChange={setF('tea_min')} required />
              </div>
              <div className="hb-field">
                <label>TEA Máxima Permitida (%)</label>
                <input className="hb-input" type="number" step="0.01" min="0" max="200" value={parametros.tea_max} onChange={setF('tea_max')} required />
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button type="submit" className="bbva-btn" disabled={saving}>
                <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Parámetros'}
              </button>
              <button type="button" className="bbva-btn-gray" onClick={() => navigate('/inicio')}>
                Volver
              </button>
            </div>
          </form>
        ) : null}
      </Card>
    </PageLayout>
  )
}
