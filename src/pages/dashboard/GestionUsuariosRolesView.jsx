import { Briefcase, AlertTriangle, Check, User, Bookmark, X, Pencil, Lock, Unlock, Info, ClipboardList, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react'
import { useTenant } from '../../hooks/useTenant'
import { Card, Button } from '../../components/ui'
import usuariosService from '../../services/usuariosService'

export const GestionUsuariosRolesView = ({ user }) => {
  const { tenantSlug } = useTenant()
  const esAdmin = user?.rol === 'ADMIN'
  const [activeTab, setActiveTab] = useState('usuarios')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [editingUsuarioId, setEditingUsuarioId] = useState(null)
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showCrearUsuarioModal, setShowCrearUsuarioModal] = useState(false)
  const [formCrearUsuario, setFormCrearUsuario] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    password: '',
    telefono: '',
  })

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
        err.response.data.error ||
        err.response.data.detail ||
        'Error al cambiar rol'
      )
    } finally {
      setLoading(false)
    }
  }

  // Desactivar usuario
  const handleDesactivarUsuario = async (usuarioId) => {
    if (!window.confirm('¿Estás seguro de que deseas desactivar este usuario')) {
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
    if (!window.confirm('¿Estás seguro de que deseas activar este usuario')) {
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

  const handleCrearUsuario = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await usuariosService.crearUsuario(tenantSlug, {
        nombres: formCrearUsuario.nombres.trim(),
        apellidos: formCrearUsuario.apellidos.trim(),
        email: formCrearUsuario.email.trim().toLowerCase(),
        password: formCrearUsuario.password,
        telefono: formCrearUsuario.telefono.trim() || null,
      })
      setSuccess('Usuario creado exitosamente')
      setShowCrearUsuarioModal(false)
      setFormCrearUsuario({
        nombres: '',
        apellidos: '',
        email: '',
        password: '',
        telefono: '',
      })
      const usuariosData = await usuariosService.listarUsuarios(tenantSlug)
      setUsuarios(Array.isArray(usuariosData) ? usuariosData : usuariosData.results || [])
    } catch (err) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        (typeof err?.response?.data === 'object' ? Object.values(err.response.data)[0]?.[0] : null) ||
        'Error al crear usuario'
      )
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

  const getRolNombre = (usuario) => {
    if (!usuario?.rol) return 'Sin rol'
    if (typeof usuario.rol === 'string') return usuario.rol
    return usuario.rol.nombre || 'Sin rol'
  }

  const getRolId = (usuario) => {
    if (!usuario?.rol) return ''
    if (typeof usuario.rol === 'object') return usuario.rol.id || ''
    const encontrado = roles.find((r) => r.nombre === usuario.rol)
    return encontrado?.id || ''
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-carbon-900 dark:text-white"><Briefcase className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Gestionar Usuarios y Roles</h1>
        <p className="text-carbon-600 dark:text-neutral-400 mt-1">Administra los usuarios y roles de tu empresa</p>
      </div>

      {/* MENSAJES DE ERROR Y ÉXITO */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <AlertTriangle className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          <Check className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> {success}
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-4 border-b border-neutral-200 dark:border-white/[0.08]">
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
            activeTab === 'usuarios' ?
               'border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-400'
              : 'border-transparent text-carbon-600 dark:text-neutral-400 hover:text-carbon-900 dark:hover:text-neutral-200'
          }`}
        >
          <User className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Usuarios ({usuarios.length})
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
            activeTab === 'roles' ?
               'border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-400'
              : 'border-transparent text-carbon-600 dark:text-neutral-400 hover:text-carbon-900 dark:hover:text-neutral-200'
          }`}
        >
          <Bookmark className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Roles ({roles.length})
        </button>
      </div>

      {/* TAB: USUARIOS */}
      {activeTab === 'usuarios' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-carbon-900 dark:text-white">Usuarios de la Empresa</h2>
            {esAdmin && (
              <Button onClick={() => setShowCrearUsuarioModal(true)} disabled={loading}>
                <User className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Crear Usuario
              </Button>
            )}
          </div>

          {/* BUSCADOR */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-neutral-300 dark:border-white/[0.08] bg-white dark:bg-carbon-800 text-carbon-900 dark:text-white rounded-lg text-sm focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 text-carbon-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-carbon-700 rounded-lg transition-colors text-sm"
              >
                <X className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Limpiar
              </button>
            )}
          </div>

          {/* LISTADO DE USUARIOS */}
          <Card>
            {loading && usuarios.length === 0 ? (
              <div className="text-center py-8 text-carbon-500 dark:text-neutral-400">Cargando usuarios...</div>
            ) : usuarios.length === 0 ? (
              <div className="text-center py-8 text-carbon-500 dark:text-neutral-400">No hay usuarios en la empresa</div>
            ) : usuariosFiltrados.length === 0 ? (
              <div className="text-center py-8 text-carbon-500 dark:text-neutral-400">No se encontraron usuarios que coincidan con "{searchTerm}"</div>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-white/[0.08]">
                      <th className="text-left py-3 px-4 font-semibold text-carbon-900 dark:text-white">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-carbon-900 dark:text-white">Nombre</th>
                      <th className="text-left py-3 px-4 font-semibold text-carbon-900 dark:text-white">Rol</th>
                      <th className="text-left py-3 px-4 font-semibold text-carbon-900 dark:text-white">Estado</th>
                      <th className="text-left py-3 px-4 font-semibold text-carbon-900 dark:text-white">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosFiltrados.map((usuario) => (
                      <tr key={usuario.id} className="border-b border-neutral-100 dark:border-white/[0.08] hover:bg-neutral-50 dark:hover:bg-carbon-800/50">
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs bg-neutral-100 dark:bg-carbon-800 text-carbon-900 dark:text-white px-2 py-1 rounded">
                            {usuario.email}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-carbon-900 dark:text-white">
                          {usuario.nombres} {usuario.apellidos || ''}
                        </td>
                        <td className="py-3 px-4">
                          {editingUsuarioId === usuario.id ? (
                            <select
                              value={getRolId(usuario)}
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleCambiarRol(usuario.id, e.target.value)
                                }
                              }}
                              disabled={loading}
                              className="px-2 py-1 border border-primary-300 dark:border-primary-700 bg-white dark:bg-carbon-800 text-carbon-900 dark:text-white rounded text-xs"
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
                              {getRolNombre(usuario)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {usuario.is_active ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold"><Check className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Activo</span>
                          ) : (
                            <span className="text-red-700 dark:text-red-400 font-semibold"><X className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Inactivo</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col md:flex-row gap-2">
                            {usuario.is_active && usuario.email !== user.email && (
                              <>
                                {editingUsuarioId === usuario.id ? (
                                  <Button
                                    onClick={() => setEditingUsuarioId(null)}
                                    disabled={loading}
                                    className="text-xs"
                                  >
                                    <Check className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Listo
                                  </Button> ) : (
                                  <Button
                                    onClick={() => setEditingUsuarioId(usuario.id)}
                                    disabled={loading}
                                    className="text-xs"
                                  >
                                    <Pencil className="inline-block mx-1 text-current" size={20} strokeWidth={2} />
                                  </Button>
                                )}
                                <Button
                                  onClick={() => handleDesactivarUsuario(usuario.id)}
                                  disabled={loading}
                                  className="text-xs text-orange-600"
                                >
                                  <Lock className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Desactivar
                                </Button>
                              </>
                            )}
                            {!usuario.is_active && usuario.email !== user.email && (
                              <Button
                                onClick={() => handleActivarUsuario(usuario.id)}
                                disabled={loading}
                                className="text-xs text-green-600"
                              >
                                <Unlock className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Activar
                              </Button>
                            )}
                            {usuario.email === user.email && (
                              <span className="text-xs text-carbon-500 dark:text-neutral-400">Eres tú</span>
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

      {showCrearUsuarioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-neutral-200 bg-white p-6 dark:border-white/[0.08] dark:bg-carbon-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-carbon-900 dark:text-white">Crear Usuario</h3>
              <button
                onClick={() => setShowCrearUsuarioModal(false)}
                className="rounded px-2 py-1 text-carbon-700 dark:text-neutral-300"
              >
                <X className="inline-block mx-1 text-current" size={20} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleCrearUsuario} className="space-y-3">
              <input
                required
                placeholder="Nombres"
                value={formCrearUsuario.nombres}
                onChange={(e) => setFormCrearUsuario((p) => ({ ...p, nombres: e.target.value }))}
                className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-carbon-900 dark:border-white/[0.08] dark:bg-carbon-800 dark:text-white"
              />
              <input
                placeholder="Apellidos"
                value={formCrearUsuario.apellidos}
                onChange={(e) => setFormCrearUsuario((p) => ({ ...p, apellidos: e.target.value }))}
                className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-carbon-900 dark:border-white/[0.08] dark:bg-carbon-800 dark:text-white"
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={formCrearUsuario.email}
                onChange={(e) => setFormCrearUsuario((p) => ({ ...p, email: e.target.value }))}
                className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-carbon-900 dark:border-white/[0.08] dark:bg-carbon-800 dark:text-white"
              />
              <input
                required
                type="password"
                minLength={8}
                placeholder="Contrasena"
                value={formCrearUsuario.password}
                onChange={(e) => setFormCrearUsuario((p) => ({ ...p, password: e.target.value }))}
                className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-carbon-900 dark:border-white/[0.08] dark:bg-carbon-800 dark:text-white"
              />
              <p className="text-xs text-carbon-500 dark:text-neutral-400">
                Debe incluir mayuscula, minuscula, numero y simbolo.
              </p>
              <input
                placeholder="Telefono (opcional)"
                value={formCrearUsuario.telefono}
                onChange={(e) => setFormCrearUsuario((p) => ({ ...p, telefono: e.target.value }))}
                className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-carbon-900 dark:border-white/[0.08] dark:bg-carbon-800 dark:text-white"
              />
              <div className="rounded bg-neutral-100 px-3 py-2 text-xs text-carbon-700 dark:bg-carbon-800 dark:text-neutral-300">
                Rol inicial: <strong>USUARIO</strong> (puedes cambiarlo luego con el boton de editar).
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" onClick={() => setShowCrearUsuarioModal(false)} disabled={loading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creando...' : 'Crear'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB: ROLES */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-carbon-900 dark:text-white">Roles Disponibles</h2>

          {/* GRID DE ROLES */}
          {loading && roles.length === 0 ? (
            <div className="text-center py-8 text-carbon-500 dark:text-neutral-400">Cargando roles...</div>
          ) : roles.length === 0 ? (
            <div className="text-center py-8 text-carbon-500 dark:text-neutral-400">No hay roles</div>
              ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {roles.map((rol) => (
                <Card key={rol.id} className="hover:shadow-lg transition-shadow">
                  <h3 className="text-lg font-bold text-carbon-900">{rol.nombre}</h3>
                  <p className="text-sm text-carbon-600 mt-1">
                    {rol.descripcion || 'Sin descripción'}
                  </p>
                  {rol.es_sistema && (
                    <span className="text-xs text-orange-600 font-semibold mt-2 inline-block">
                      <Lock className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Rol de sistema
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
        <h3 className="text-lg font-bold text-carbon-900 mb-2"><Info className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Información</h3>
        <p className="text-carbon-700 text-sm mb-2">
          Gestiona los usuarios de tu empresa con estas opciones:
        </p>
        <ul className="text-carbon-700 text-sm list-disc list-inside space-y-1">
          <li><ClipboardList className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Ver listado de todos los usuarios de la empresa</li>
          <li><RefreshCw className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Cambiar el rol de un usuario haciendo clic en el icono <Pencil className="inline-block mx-1 text-current" size={20} strokeWidth={2} /></li>
          <li><Lock className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Desactivar usuarios que ya no pertenecen a la empresa</li>
          <li><Bookmark className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Consultar los roles disponibles en tu empresa</li>
        </ul>
      </Card>
    </div>
  )
}
