import { useState, useEffect } from 'react'
import { Card, Button, Input } from '../../components/ui'
import NotificationPreferencesSection from '../../components/NotificationPreferencesSection'
import { useTenant } from '../../hooks/useTenant'
import usuariosService from '../../services/usuariosService'

export const PerfilUsuarioView = ({ user, tenant }) => {
  const { tenantSlug } = useTenant()
  // ESTADO: Edición de Perfil
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    nombres: user?.nombres || '',
    apellidos: user?.apellidos || '',
    telefono: user?.telefono || '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  // ESTADO: Datos completos del usuario (para mostrar en tarjeta adicional)
  const [usuarioCompleto, setUsuarioCompleto] = useState({
    rol: user?.rol,
  })
  // EFECTO: Sincronizar con prop user cuando cambia (actualizaciones rápidas)
  useEffect(() => {
    setFormData({
      nombres: user?.nombres || '',
      apellidos: user?.apellidos || '',
      telefono: user?.telefono || '',
    })
    setUsuarioCompleto({
      rol: user?.rol,
    })
  }, [user?.nombres, user?.apellidos, user?.telefono, user?.rol])

  useEffect(() => {
    if (!user?.id || !tenantSlug) return
    const timer = setTimeout(async () => {
      try {
        const usuarioActualizado = await usuariosService.obtenerUsuario(
          tenantSlug,
          user.id
        )
        
        // Actualizar formData
        setFormData((prev) => ({
          nombres: usuarioActualizado.nombres || prev.nombres,
          apellidos: usuarioActualizado.apellidos || prev.apellidos,
          telefono: usuarioActualizado.telefono || prev.telefono,
        }))
        setUsuarioCompleto({
          rol: usuarioActualizado.rol,
        })
      } catch (error) {
        console.error('Error refetching usuario:', error)
      }
    }, 300) // Pequeño delay 

    return () => clearTimeout(timer)
  }, [user?.id, tenantSlug])
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordFormData, setPasswordFormData] = useState({
    contraseña_actual: '',
    contraseña_nueva: '',
    contraseña_confirmacion: '',
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState('')
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('')
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target
    setPasswordFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }
  // Guardar cambios de perfil
  const handleSave = async (e) => {
    e.preventDefault()
    
    // Validaciones
    if (!tenantSlug) {
      setErrorMessage('❌ Error: No se encontró el tenant. Por favor recarga la página.')
      return
    }
    if (!user?.id) {
      setErrorMessage('❌ Error: No se encontró tu ID de usuario. Por favor recarga la página.')
      return
    }
    setIsSaving(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      // 1. Guardar cambios en el backend
      await usuariosService.editarUsuario(
        tenantSlug,
        user.id,
        formData
      )
      // 2. Refetch completo del usuario para asegurar sincronización
      const usuarioActualizado = await usuariosService.obtenerUsuario(
        tenantSlug,
        user.id
      )
      // 3. Actualizar formData con los datos frescos del backend
      const datosActualizados = {
        nombres: usuarioActualizado.nombres || formData.nombres,
        apellidos: usuarioActualizado.apellidos || formData.apellidos,
        telefono: usuarioActualizado.telefono || formData.telefono,
      }
      setFormData(datosActualizados)

      // 4. IMPORTANTE: Guardar en localStorage para persistencia local
      localStorage.setItem(`perfil_${user.id}`, JSON.stringify(datosActualizados))

      // Éxito: Mostrar mensaje y salir de modo edición
      setSuccessMessage('✅ Perfil actualizado correctamente')
      setIsEditing(false)

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    } catch (error) {
      // Error: Mostrar mensaje de error real
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'No se pudo actualizar el perfil'
      setErrorMessage(`❌ Error: ${errorMsg}`)
      console.error('Error al actualizar perfil:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Cancelar edición
  const handleCancel = () => {
    setFormData({
      nombres: user?.nombres || '',
      apellidos: user?.apellidos || '',
      telefono: user?.telefono || '',
    })
    setIsEditing(false)
    setErrorMessage('')
  }

  // Cambiar contraseña
  const handleCambiarContrasena = async (e) => {
    e.preventDefault()

    // Validaciones
    if (!tenantSlug) {
      setPasswordErrorMessage('❌ Error: No se encontró el tenant. Por favor recarga la página.')
      return
    }

    if (
      !passwordFormData.contraseña_actual ||
      !passwordFormData.contraseña_nueva ||
      !passwordFormData.contraseña_confirmacion
    ) {
      setPasswordErrorMessage('❌ Todos los campos son obligatorios')
      return
    }

    if (passwordFormData.contraseña_nueva !== passwordFormData.contraseña_confirmacion) {
      setPasswordErrorMessage('❌ Las contraseñas nuevas no coinciden')
      return
    }

    if (passwordFormData.contraseña_nueva.length < 8) {
      setPasswordErrorMessage('❌ La contraseña debe tener al menos 8 caracteres')
      return
    }

    setIsChangingPassword(true)
    setPasswordErrorMessage('')
    setPasswordSuccessMessage('')

    try {
      await usuariosService.cambiarContrasena(tenantSlug, passwordFormData)

      // Éxito: Mostrar mensaje, limpiar formulario y cerrarlo
      setPasswordSuccessMessage('✅ Contraseña cambiada correctamente')
      setPasswordFormData({
        contraseña_actual: '',
        contraseña_nueva: '',
        contraseña_confirmacion: '',
      })
      
      // Cerrar formulario después de 2 segundos
      setTimeout(() => {
        setShowPasswordForm(false)
        setPasswordSuccessMessage('')
      }, 2000)
    } catch (error) {
      // Error: Mostrar mensaje de error real
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'No se pudo cambiar la contraseña'
      setPasswordErrorMessage(`❌ Error: ${errorMsg}`)
      console.error('Error al cambiar contraseña:', error)
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Limpiar formulario de contraseña
  const handleCancelPasswordForm = (e) => {
    e.preventDefault()
    setPasswordFormData({
      contraseña_actual: '',
      contraseña_nueva: '',
      contraseña_confirmacion: '',
    })
    setShowPasswordForm(false)
    setPasswordErrorMessage('')
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">✏️ Editar Mi Perfil</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Actualiza tu información personal</p>
      </div>

      {/* MENSAJES DE ÉXITO - PERFIL */}
      {successMessage && (
        <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg text-green-700 dark:text-green-400 text-sm">
          {successMessage}
        </div>
      )}

      {/* MENSAJES DE ERROR - PERFIL */}
      {errorMessage && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {errorMessage}
        </div>
      )}

      {/* PERFIL CARD */}
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Información Personal</h2>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              type="button"
              variant="primary"
              className="bg-primary-600 dark:bg-primary-700 hover:bg-primary-700 dark:hover:bg-primary-600 text-white"
            >
              ✏️ Editar
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {/* DATOS DE LECTURA O FORMULARIO */}
          {!isEditing ? (
            // VISTA DE LECTURA
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Nombres</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formData.nombres}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Apellidos</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formData.apellidos || 'No especificado'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email (No editable)</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {user?.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Teléfono</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formData.telefono || 'No especificado'}
                </p>
              </div>
            </div>
          ) : (
            // FORMULARIO DE EDICIÓN
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Nombres *
                  </label>
                  <Input
                    type="text"
                    name="nombres"
                    value={formData.nombres}
                    onChange={handleInputChange}
                    placeholder="Tu nombre"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Apellidos
                  </label>
                  <Input
                    type="text"
                    name="apellidos"
                    value={formData.apellidos}
                    onChange={handleInputChange}
                    placeholder="Tu apellido"
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Teléfono
                </label>
                <Input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  placeholder="+57 3XX XXXX XXX"
                  className="w-full"
                />
              </div>

              <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                <p>📧 Email no se puede modificar. Es el identificador único de tu cuenta.</p>
                <p className="font-semibold text-gray-900 dark:text-white mt-1">{user?.email}</p>
              </div>

              {/* BOTONES */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSaving}
                  variant="primary"
                  className="bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 text-white flex-1"
                >
                  {isSaving ? '💾 Guardando...' : '💾 Guardar Cambios'}
                </Button>
                <Button
                  onClick={handleCancel}
                  type="button"
                  variant="secondary"
                  className="flex-1"
                >
                  ✕ Cancelar
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>

      {/* SEGURIDAD - CAMBIAR CONTRASEÑA */}
      <Card className="border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/30">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">🔐 Seguridad</h3>
          {!showPasswordForm && (
            <Button
              onClick={() => setShowPasswordForm(true)}
              type="button"
              variant="secondary"
              className="text-sm"
            >
              🔑 Cambiar Contraseña
            </Button>
          )}
        </div>

        {/* MENSAJES DE ÉXITO - CONTRASEÑA */}
        {passwordSuccessMessage && (
          <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg text-green-700 dark:text-green-400 text-sm mb-4">
            {passwordSuccessMessage}
          </div>
        )}

        {/* MENSAJES DE ERROR - CONTRASEÑA */}
        {passwordErrorMessage && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm mb-4">
            {passwordErrorMessage}
          </div>
        )}

        {/* FORMULARIO DE CAMBIO DE CONTRASEÑA */}
        {showPasswordForm && (
          <form onSubmit={handleCambiarContrasena} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Contraseña Actual *
              </label>
              <Input
                type="password"
                name="contraseña_actual"
                value={passwordFormData.contraseña_actual}
                onChange={handlePasswordInputChange}
                placeholder="Ingresa tu contraseña actual"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Contraseña Nueva *
              </label>
              <Input
                type="password"
                name="contraseña_nueva"
                value={passwordFormData.contraseña_nueva}
                onChange={handlePasswordInputChange}
                placeholder="Ingresa tu nueva contraseña (mínimo 8 caracteres)"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Confirmar Contraseña Nueva *
              </label>
              <Input
                type="password"
                name="contraseña_confirmacion"
                value={passwordFormData.contraseña_confirmacion}
                onChange={handlePasswordInputChange}
                placeholder="Confirma tu nueva contraseña"
                className="w-full"
              />
            </div>

            {/* BOTONES */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isChangingPassword}
                variant="primary"
                className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white flex-1"
              >
                {isChangingPassword ? '🔄 Actualizando...' : '✅ Cambiar Contraseña'}
              </Button>
              <Button
                onClick={handleCancelPasswordForm}
                type="button"
                variant="secondary"
                className="flex-1"
              >
                ✕ Cancelar
              </Button>
            </div>
          </form>
        )}

        {!showPasswordForm && (
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Actualiza tu contraseña para mantener tu cuenta segura.
          </div>
        )}
      </Card>

      {/* PREFERENCIAS DE NOTIFICACIÓN */}
      <NotificationPreferencesSection tenantSlug={tenantSlug} userId={user?.id} />

      {/* INFORMACIÓN ADICIONAL */}
      <Card className="bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">ℹ️ Información Adicional</h3>
        <div className="text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Rol en {tenant?.nombre}</p>
            <p className="text-gray-900 dark:text-white font-semibold text-lg">
              {usuarioCompleto?.rol?.nombre || 'Usuario'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
