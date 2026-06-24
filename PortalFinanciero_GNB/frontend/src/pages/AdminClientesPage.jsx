import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Search, UserCheck, UserX, PiggyBank, CreditCard, ChevronRight } from 'lucide-react'
import { getAdminClientes } from '../services/adminService.js'
import PageLayout from '../components/layout/PageLayout.jsx'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import Loader from '../components/ui/Loader.jsx'

export default function AdminClientesPage() {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  useEffect(() => {
    getAdminClientes()
      .then(setClientes)
      .catch((e) => setError(e?.response?.data?.detail || 'Error al cargar clientes.'))
      .finally(() => setLoading(false))
  }, [])

  const clientesFiltrados = useMemo(() => {
    return clientes.filter((c) => {
      const matchBusqueda =
        !busqueda ||
        c.codcliente.toLowerCase().includes(busqueda.toLowerCase()) ||
        (c.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(busqueda.toLowerCase())
      const matchEstado =
        filtroEstado === 'todos' ||
        (filtroEstado === 'activos' && c.estado === 'A') ||
        (filtroEstado === 'inactivos' && c.estado !== 'A')
      return matchBusqueda && matchEstado
    })
  }, [clientes, busqueda, filtroEstado])

  const resumen = useMemo(() => ({
    total: clientes.length,
    activos: clientes.filter((c) => c.estado === 'A').length,
    inactivos: clientes.filter((c) => c.estado !== 'A').length,
  }), [clientes])

  return (
    <PageLayout>
      <div className="bbva-hello">
        <h1>Gestión de Clientes</h1>
        <p>Directorio completo de clientes del Banco de la Nación con sus productos asociados.</p>
      </div>

      {/* KPIs de resumen */}
      <div className="admin-kpi-grid admin-kpi-grid--sm">
        <div className="admin-kpi-card" style={{ '--kpi-color': '#0a2e5c', '--kpi-bg': '#0a2e5c18' }}>
          <span className="admin-kpi-ico"><Users size={20} /></span>
          <div className="admin-kpi-body">
            <span className="admin-kpi-label">Total clientes</span>
            <span className="admin-kpi-val">{resumen.total}</span>
          </div>
        </div>
        <div className="admin-kpi-card" style={{ '--kpi-color': '#73b71c', '--kpi-bg': '#73b71c18' }}>
          <span className="admin-kpi-ico"><UserCheck size={20} /></span>
          <div className="admin-kpi-body">
            <span className="admin-kpi-label">Activos</span>
            <span className="admin-kpi-val">{resumen.activos}</span>
          </div>
        </div>
        <div className="admin-kpi-card" style={{ '--kpi-color': '#e53935', '--kpi-bg': '#e5393518' }}>
          <span className="admin-kpi-ico"><UserX size={20} /></span>
          <div className="admin-kpi-body">
            <span className="admin-kpi-label">Inactivos</span>
            <span className="admin-kpi-val">{resumen.inactivos}</span>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="admin-search-bar">
        <div className="admin-search-input-wrap">
          <Search size={16} className="admin-search-icon" />
          <input
            id="busqueda-cliente"
            type="text"
            className="admin-search-input"
            placeholder="Buscar por código, nombre o email…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="admin-filter-btns">
          {['todos', 'activos', 'inactivos'].map((f) => (
            <button
              key={f}
              className={`admin-filter-btn ${filtroEstado === f ? 'active' : ''}`}
              onClick={() => setFiltroEstado(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <span className="admin-result-count">{clientesFiltrados.length} resultado(s)</span>
      </div>

      {/* Tabla de clientes */}
      <Card title="Directorio de Clientes" icon={<Users size={18} />}>
        {loading ? (
          <Loader text="Cargando clientes…" />
        ) : error ? (
          <p className="bbva-empty" style={{ color: 'var(--hb-red)' }}>{error}</p>
        ) : clientesFiltrados.length === 0 ? (
          <p className="bbva-empty">No se encontraron clientes con ese criterio.</p>
        ) : (
          <div className="admin-clientes-table-wrap">
            <table className="admin-clientes-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre completo</th>
                  <th>Email</th>
                  <th><PiggyBank size={13} /> Ahorros</th>
                  <th><CreditCard size={13} /> Créditos</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map((c) => (
                  <tr key={c.codcliente} className="admin-clientes-row">
                    <td><code className="admin-code">{c.codcliente}</code></td>
                    <td className="admin-nombre">{c.nombre || '—'}</td>
                    <td className="admin-email">{c.email || '—'}</td>
                    <td className="admin-cnt">
                      <span className={`admin-cnt-badge ${c.cnt_ahorros > 0 ? 'admin-cnt-badge--green' : ''}`}>
                        {c.cnt_ahorros}
                      </span>
                    </td>
                    <td className="admin-cnt">
                      <span className={`admin-cnt-badge ${c.cnt_creditos > 0 ? 'admin-cnt-badge--blue' : ''}`}>
                        {c.cnt_creditos}
                      </span>
                    </td>
                    <td>
                      <Badge estado={c.estado === 'A' ? 'Activo' : 'Inactivo'} tone={c.estado !== 'A' ? 'red' : undefined} />
                    </td>
                    <td>
                      <button 
                        className="bbva-btn-ghost" 
                        style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                        onClick={() => navigate(`/admin/creditos?action=solicitar&pkcliente=${c.pkcliente}&nombre=${encodeURIComponent(c.nombre)}`)}
                      >
                        Solicitar Crédito
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageLayout>
  )
}
