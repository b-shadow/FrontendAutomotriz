import { Briefcase, AlertTriangle, Check, User, Bookmark, X, Pencil, Lock, Unlock, Info, ClipboardList, RefreshCw } from 'lucide-react';
import React, { useState, useEffect } from 'react'
import { useTenant } from '../../hooks/useTenant'
import { useGhostAutomation } from '../../hooks/useGhostAutomation'
import { Card, Button } from '../../components/ui'
import usuariosService from '../../services/usuariosService'

export const GestionUsuariosRolesView = ({ user, aiPrefill }) => {
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
  const [submitBtn, setSubmitBtn] = useState(null)
  const lastRoleTs = React.useRef(null)

  useGhostAutomation({
    aiPrefill,
    isModalOpen: showCrearUsuarioModal,
    setModalOpen: setShowCrearUsuarioModal,
    setForm: setFormCrearUsuario,
    submitBtnRef: { current: submitBtn },
    actionType: 'CREAR_USUARIO',
    fieldMapping: {
      nombres: 'nombres',
      apellidos: 'apellidos',
      email: 'email',
      contrasena: 'password',
      telefono: 'telefono'
    }
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
    // Intercept para CAMBIAR_ROL_USUARIO
  useEffect(() => {
    if (aiPrefill && aiPrefill.type === 'CAMBIAR_ROL_USUARIO' && aiPrefill.status === 'EJECUTADA') {
      if (lastRoleTs.current === aiPrefill._ts) return;
      lastRoleTs.current = aiPrefill._ts;

      const { usuario_id, nuevo_rol } = aiPrefill;
      if (usuario_id && nuevo_rol) {
        setEditingUsuarioId(usuario_id);
        setTimeout(() => {
          handleCambiarRol(usuario_id, nuevo_rol);
        }, 800);
      }
    }
  }, [aiPrefill]);

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
