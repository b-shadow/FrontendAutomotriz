import { useState, useEffect } from 'react'
import { useTenant } from '../../hooks/useTenant'
import { Card, Button } from '../../components/ui'
import usuariosService from '../../services/usuariosService'

export const GestionUsuariosRolesView = ({ user }) => {
  const { tenantSlug } = useTenant()
  const [activeTab, setActiveTab] = useState('usuarios')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [editingUsuarioId, setEditingUsuarioId] = useState(null)
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true)
      setError(null)
      try {
        const [usuariosData, rolesData] = await Promise.all([
          usuariosService.listarUsuarios(tenantSlug),
          usuariosService.listarRoles(tenantSlug),
        ])
        
        setUsuarios(Array.isArray(usuariosData) ? usuariosData : usuariosData.results || [])
        
        if (Array.isArray(rolesData)) {
          setRoles(rolesData)
        } else if (rolesData.results) {
          setRoles(rolesData.results)
        } else if (rolesData.roles) {
          setRoles(rolesData.roles)
        }
      } catch (err) {
        setError('Error al cargar datos. Por favor, intenta de nuevo.')
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    if (tenantSlug) {
      cargarDatos()
    }
  }, [tenantSlug])

  // Cambiar rol de usuario
  const handleCambiarRol = async (usuarioId, nuevoRolId) => {
    setLoading(true)
    setError(null)

    try {
      await usuariosService.cambiarRol(tenantSlug, usuarioId, { rol_id: nuevoRolId })
      setSuccess('Rol actualizado exitosamente')
      setEditingUsuarioId(null)
      
      // Recargar datos
      const usuariosData = await usuariosService.listarUsuarios(tenantSlug)
      setUsuarios(Array.isArray(usuariosData) ? usuariosData : usuariosData.results || [])
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Error al cambiar rol'
      )
    } finally {
      setLoading(false)
    }
  }

  // Desactivar usuario
  const handleDesactivarUsuario = async (usuarioId) => {
    if (!window.confirm('¿Estás seguro de que deseas desactivar este usuario?')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      await usuariosService.desactivarUsuario(tenantSlug, usuarioId)
      setSuccess('Usuario desactivado exitosamente')
      
      // Recargar datos
      const usuariosData = await usuariosService.listarUsuarios(tenantSlug)
      setUsuarios(Array.isArray(usuariosData) ? usuariosData : usuariosData.results || [])
    } catch {
      setError('Error al desactivar usuario')
    } finally {
      setLoading(false)
    }
  }

  // Activar usuario
  const handleActivarUsuario = async (usuarioId) => {
    if (!window.confirm('¿Estás seguro de que deseas activar este usuario?')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      await usuariosService.activarUsuario(tenantSlug, usuarioId)
      setSuccess('Usuario activado exitosamente')
      
      // Recargar datos
      const usuariosData = await usuariosService.listarUsuarios(tenantSlug)
      setUsuarios(Array.isArray(usuariosData) ? usuariosData : usuariosData.results || [])
    } catch {
      setError('Error al activar usuario')
    } finally {
      setLoading(false)
    }
  }

  // Limpiar mensajes
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Filtrar usuarios por nombre
  const usuariosFiltrados = usuarios.filter((usuario) => {
    const nombreCompleto = `${usuario.nombres} ${usuario.apellidos || ''}`.toLowerCase()
    const email = usuario.email.toLowerCase()
    const termino = searchTerm.toLowerCase()
    return nombreCompleto.includes(termino) || email.includes(termino)
  })

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">👨‍💼 Gestionar Usuarios y Roles</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Administra los usuarios y roles de tu empresa</p>
      </div>

      {/* MENSAJES DE ERROR Y ÉXITO */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          ✓ {success}
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
            activeTab === 'usuarios'
              ? 'border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          👤 Usuarios ({usuarios.length})
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
            activeTab === 'roles'
              ? 'border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          🔖 Roles ({roles.length})
        </button>
      </div>

      {/* TAB: USUARIOS */}
      {activeTab === 'usuarios' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Usuarios de la Empresa</h2>

          {/* BUSCADOR */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-sm"
              >
                ✕ Limpiar
              </button>
            )}
          </div>

          {/* LISTADO DE USUARIOS */}
          <Card>
            {loading && usuarios.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">Cargando usuarios...</div>
            ) : usuarios.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">No hay usuarios en la empresa</div>
            ) : usuariosFiltrados.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">No se encontraron usuarios que coincidan con "{searchTerm}"</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">Nombre</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">Rol</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">Estado</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosFiltrados.map((usuario) => (
                      <tr key={usuario.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-2 py-1 rounded">
                            {usuario.email}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-900 dark:text-white">
                          {usuario.nombres} {usuario.apellidos || ''}
                        </td>
                        <td className="py-3 px-4">
                          {editingUsuarioId === usuario.id ? (
                            <select
                              value={usuario.rol?.id || ''}
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleCambiarRol(usuario.id, e.target.value)
                                }
                              }}
                              disabled={loading}
                              className="px-2 py-1 border border-primary-300 dark:border-primary-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded text-xs"
                            >
                              <option value="">Seleccionar rol...</option>
                              {roles.map((rol) => (
                                <option key={rol.id} value={rol.id}>
                                  {rol.nombre}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
                              {usuario.rol?.nombre || 'Sin rol'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {usuario.is_active ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">✓ Activo</span>
                          ) : (
                            <span className="text-red-700 dark:text-red-400 font-semibold">✕ Inactivo</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col md:flex-row gap-2">
                            {usuario.is_active && usuario.email !== user?.email && (
                              <>
                                {editingUsuarioId === usuario.id ? (
                                  <Button
                                    onClick={() => setEditingUsuarioId(null)}
                                    disabled={loading}
                                    className="text-xs"
                                  >
                                    ✓ Listo
                                  </Button>
                                ) : (
                                  <Button
                                    onClick={() => setEditingUsuarioId(usuario.id)}
                                    disabled={loading}
                                    className="text-xs"
                                  >
                                    ✏️
                                  </Button>
                                )}
                                <Button
                                  onClick={() => handleDesactivarUsuario(usuario.id)}
                                  disabled={loading}
                                  className="text-xs text-orange-600"
                                >
                                  🔒 Desactivar
                                </Button>
                              </>
                            )}
                            {!usuario.is_active && usuario.email !== user?.email && (
                              <Button
                                onClick={() => handleActivarUsuario(usuario.id)}
                                disabled={loading}
                                className="text-xs text-green-600"
                              >
                                🔓 Activar
                              </Button>
                            )}
                            {usuario.email === user?.email && (
                              <span className="text-xs text-slate-500 dark:text-slate-400">Eres tú</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB: ROLES */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Roles Disponibles</h2>

          {/* GRID DE ROLES */}
          {loading && roles.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">Cargando roles...</div>
          ) : roles.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">No hay roles</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {roles.map((rol) => (
                <Card key={rol.id} className="hover:shadow-lg transition-shadow">
                  <h3 className="text-lg font-bold text-gray-900">{rol.nombre}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {rol.descripcion || 'Sin descripción'}
                  </p>
                  {rol.es_sistema && (
                    <span className="text-xs text-orange-600 font-semibold mt-2 inline-block">
                      🔒 Rol de sistema
                    </span>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* INFO */}
      <Card className="bg-blue-50 border-blue-200">
        <h3 className="text-lg font-bold text-gray-900 mb-2">ℹ️ Información</h3>
        <p className="text-gray-700 text-sm mb-2">
          Gestiona los usuarios de tu empresa con estas opciones:
        </p>
        <ul className="text-gray-700 text-sm list-disc list-inside space-y-1">
          <li>📋 Ver listado de todos los usuarios de la empresa</li>
          <li>🔄 Cambiar el rol de un usuario haciendo clic en el icono ✏️</li>
          <li>🔒 Desactivar usuarios que ya no pertenecen a la empresa</li>
          <li>🔖 Consultar los roles disponibles en tu empresa</li>
        </ul>
      </Card>
    </div>
  )
}
