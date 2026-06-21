import { XCircle, CheckCircle, Pencil, Mail, Save, X, Lock, Key, RefreshCw, Info, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react'
import { Card, Button, Input } from '../../components/ui'
import NotificationPreferencesSection from '../../components/NotificationPreferencesSection'
import { useTenant } from '../../hooks/useTenant'
import usuariosService from '../../services/usuariosService'
import { useGhostAutomation } from '../../hooks/useGhostAutomation'
import GhostIndicator from '../../components/GhostIndicator'

export const PerfilUsuarioView = ({ user, tenant, aiPrefill, onSuccess }) => {
  const { tenantSlug } = useTenant()
  // ESTADO: Edición de Perfil
  const [isEditing, setIsEditing] = useState(false)
  const { isSimulating, setIsSimulating, simulateTyping, simulateClick, simulateDelay } = useGhostAutomation()
  const [isAiClickingEdit, setIsAiClickingEdit] = useState(false) // Nueva bandera para click visual
  const [formData, setFormData] = useState({
    nombres: user.nombres || '', apellidos: user.apellidos || '',
    telefono: user.telefono || '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  // ESTADO: Datos completos del usuario (para mostrar en tarjeta adicional)
  const [usuarioCompleto, setUsuarioCompleto] = useState({
    rol: user.rol,
  })
  // EFECTO: Sincronizar con prop user cuando cambia (actualizaciones rápidas)
  useEffect(() => {
    // Restauramos el bloque que permite ver los cambios fluir
    if (!aiPrefill && !isSimulating) {
      setFormData({
        nombres: user.nombres || '',
        apellidos: user.apellidos || '',
        telefono: user.telefono || '',
      })
    }

    setUsuarioCompleto({
      rol: user.rol,
    })
  }, [user.nombres, user.apellidos, user.telefono, user.rol, aiPrefill, isSimulating])

  // EFECTO: Cerrar formularios automáticamente cuando la acción de la IA se completa o cancela
  useEffect(() => {
    // Si antes había una acción y ahora es null, cerramos los modos de edición
    if (!aiPrefill && !isSimulating) {
      setIsEditing(false);
      setShowPasswordForm(false);
    }
  }, [aiPrefill, isSimulating]);

  // EFECTO: Simulación de "Escritura" por la IA (Pre-llenado Visual)
  useEffect(() => {
    if (!aiPrefill) {
      console.log("Simulación: No hay acción pendiente.");
      return;
    }

    console.log("Simulación: Iniciando para acción con TS", aiPrefill._ts);

    const processPrefill = async () => {
      setIsSimulating(true);

      // 1. Manejar cambios de perfil (Nombre, Apellido, Teléfono)
      if (aiPrefill.nuevo_nombre || aiPrefill.nuevo_telefono || aiPrefill.nuevo_apellido) {
        if (!isEditing) {
          console.log("Simulación: Abriendo formulario de perfil...");
          setIsAiClickingEdit(true);
          await simulateDelay(800);
          setIsEditing(true);
          setIsAiClickingEdit(false);
          await simulateDelay(600); // Esperar animación de entrada
        } else {
          // Si ya está abierto, esperar un poco para que el usuario note que la IA va a escribir
          await simulateDelay(400);
        }

        if (aiPrefill.nuevo_nombre) await simulateTyping(setFormData, 'nombres', aiPrefill.nuevo_nombre, 50);
        if (aiPrefill.nuevo_apellido) await simulateTyping(setFormData, 'apellidos', aiPrefill.nuevo_apellido, 50);
        if (aiPrefill.nuevo_telefono) await simulateTyping(setFormData, 'telefono', aiPrefill.nuevo_telefono, 50);
      }

      // 2. Manejar cambios de contraseña
      if (aiPrefill.nueva_contrasena || aiPrefill.contrasena_actual) {
        console.log("Simulación: Abriendo formulario de contraseña...");
        setShowPasswordForm(true);
        await simulateDelay(800);

        if (aiPrefill.contrasena_actual) {
          await simulateTyping(setPasswordFormData, 'contraseña_actual', aiPrefill.contrasena_actual, 150);
        }
        if (aiPrefill.nueva_contrasena) {
          await simulateTyping(setPasswordFormData, 'contraseña_nueva', aiPrefill.nueva_contrasena, 150);
          await simulateTyping(setPasswordFormData, 'contraseña_confirmacion', aiPrefill.nueva_contrasena, 150);
        }
      }

      console.log("Simulación: Finalizada.");
      setIsSimulating(false);

      if (aiPrefill.status === 'EJECUTADA' || aiPrefill.estado === 'EJECUTADA') {
        await simulateDelay(800);
        
        if (aiPrefill.accion === 'CAMBIAR_CONTRASENA' || aiPrefill.type === 'CAMBIAR_CONTRASENA') {
           simulateClick('password-submit-btn');
        } else if (aiPrefill.accion === 'CAMBIAR_NOMBRES_PERSONALES' || aiPrefill.type === 'CAMBIAR_NOMBRES_PERSONALES' || aiPrefill.accion === 'CAMBIAR_TELEFONO' || aiPrefill.type === 'CAMBIAR_TELEFONO') {
           simulateClick('perfil-submit-btn');
        }
      }
    };

    processPrefill();
  }, [aiPrefill?._ts]);

  // Eliminado el efecto de refetch redundante que causaba el regreso al nombre anterior
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordFormData, setPasswordFormData] = useState({
    contraseña_actual: '', contraseña_nueva: '',
    contraseña_confirmacion: '',
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState('')
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('')
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev, [name]: value,
    }))
  }
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target
    setPasswordFormData((prev) => ({
      ...prev, [name]: value,
    }))
  }
  // Guardar cambios de perfil
  const handleSave = async (e) => {
    e.preventDefault()

    // Validaciones
    if (!tenantSlug) {
      setErrorMessage(<><XCircle className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Error: No se encontró el tenant. Por favor recarga la página.</>)
      return
    }
    if (!user.id) {
      setErrorMessage(<><XCircle className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Error: No se encontró tu ID de usuario. Por favor recarga la página.</>)
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
        nombres: usuarioActualizado.nombres || formData.nombres, apellidos: usuarioActualizado.apellidos || formData.apellidos,
        telefono: usuarioActualizado.telefono || formData.telefono,
      }
      setFormData(datosActualizados)

      // 4. IMPORTANTE: Guardar en localStorage para persistencia local
      localStorage.setItem(`perfil_${user.id}`, JSON.stringify(datosActualizados))

      // Éxito: Mostrar mensaje y salir de modo edición
      setSuccessMessage(<><CheckCircle className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Perfil actualizado correctamente</>)
      setIsEditing(false)

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)

      if (onSuccess) onSuccess()
    } catch (error) {
      // Error: Mostrar mensaje de error real
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'No se pudo actualizar el perfil'
      setErrorMessage(` Error: ${errorMsg}`)
      console.error('Error al actualizar perfil:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Cancelar edición
  const handleCancel = () => {
    setFormData({
      nombres: user.nombres || '', apellidos: user.apellidos || '',
      telefono: user.telefono || '',
    })
    setIsEditing(false)
    setErrorMessage('')
  }

  // Cambiar contraseña
  const handleCambiarContrasena = async (e) => {
    e.preventDefault()

    // Validaciones
    if (!tenantSlug) {
      setPasswordErrorMessage(<><XCircle className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Error: No se encontró el tenant. Por favor recarga la página.</>)
      return
    }

    if (
      !passwordFormData.contraseña_actual ||
      !passwordFormData.contraseña_nueva ||
      !passwordFormData.contraseña_confirmacion
    ) {
      setPasswordErrorMessage(<><XCircle className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Todos los campos son obligatorios</>)
      return
    }

    if (passwordFormData.contraseña_nueva !== passwordFormData.contraseña_confirmacion) {
      setPasswordErrorMessage(<><XCircle className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Las contraseñas nuevas no coinciden</>)
      return
    }

    if (passwordFormData.contraseña_nueva.length < 8) {
      setPasswordErrorMessage(<><XCircle className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> La contraseña debe tener al menos 8 caracteres</>)
      return
    }

    setIsChangingPassword(true)
    setPasswordErrorMessage('')
    setPasswordSuccessMessage('')

    try {
      await usuariosService.cambiarContrasena(tenantSlug, passwordFormData)

      // Éxito: Mostrar mensaje, limpiar formulario y cerrarlo
      setPasswordSuccessMessage(<><CheckCircle className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Contraseña cambiada correctamente</>)
      setPasswordFormData({
        contraseña_actual: '', contraseña_nueva: '',
        contraseña_confirmacion: '',
      })

      // Cerrar formulario después de 2 segundos
      setTimeout(() => {
        setShowPasswordForm(false)
        setPasswordSuccessMessage('')
      }, 2000)

      if (onSuccess) onSuccess()
    } catch (error) {
      // Error: Mostrar mensaje de error real
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'No se pudo cambiar la contraseña'
      setPasswordErrorMessage(` Error: ${errorMsg}`)
      console.error('Error al cambiar contraseña:', error)
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Limpiar formulario de contraseña
  const handleCancelPasswordForm = (e) => {
    e.preventDefault()
    setPasswordFormData({
      contraseña_actual: '', contraseña_nueva: '',
      contraseña_confirmacion: '',
    })
    setShowPasswordForm(false)
    setPasswordErrorMessage('')
  }

  return (
    <div className="space-y-6">
      {/* INDICADOR DE SIMULACIÓN IA */}
      <GhostIndicator isSimulating={isSimulating} />

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-carbon-900 dark:text-white"><Pencil className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Editar Mi Perfil</h1>
        <p className="text-carbon-600 dark:text-neutral-400 mt-1">Actualiza tu información personal</p>
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
          <h2 className="text-2xl font-bold text-carbon-900 dark:text-white">Información Personal</h2>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              type="button"
              variant="primary"
              className={`bg-primary-600 dark:bg-primary-700 hover:bg-primary-700 dark:hover:bg-primary-600 text-white transition-all duration-300 ${isAiClickingEdit ? 'ring-4 ring-primary-400 scale-110 shadow-xl shadow-primary-500/50' : ''}`}
            >
              <Pencil className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Editar
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {/* DATOS DE LECTURA O FORMULARIO */}
          {!isEditing ? (
            // VISTA DE LECTURA
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-carbon-600 dark:text-neutral-400 mb-1">Nombres</p>
                <p className="text-lg font-semibold text-carbon-900 dark:text-white">
                  {formData.nombres}
                </p>
              </div>
              <div>
                <p className="text-sm text-carbon-600 dark:text-neutral-400 mb-1">Apellidos</p>
                <p className="text-lg font-semibold text-carbon-900 dark:text-white">
                  {formData.apellidos || 'No especificado'}
                </p>
              </div>
              <div>
                <p className="text-sm text-carbon-600 dark:text-neutral-400 mb-1">Email (No editable)</p>
                <p className="text-lg font-semibold text-carbon-900 dark:text-white">
                  {user.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-carbon-600 dark:text-neutral-400 mb-1">Teléfono</p>
                <p className="text-lg font-semibold text-carbon-900 dark:text-white">
                  {formData.telefono || 'No especificado'}
                </p>
              </div>
            </div>
          ) : (
            // FORMULARIO DE EDICIÓN
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-carbon-900 dark:text-white mb-2">
                    Nombres *
                  </label>
                  <Input
                    type="text"
                    name="nombres"
                    value={formData.nombres}
                    onChange={handleInputChange}
                    placeholder="Tu nombre"
                    className={`w-full transition-all duration-300 ${aiPrefill?.nuevo_nombre ? 'ring-2 ring-primary-500 shadow-lg shadow-primary-500/20' : ''}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-carbon-900 dark:text-white mb-2">
                    Apellidos
                  </label>
                  <Input
                    type="text"
                    name="apellidos"
                    value={formData.apellidos}
                    onChange={handleInputChange}
                    placeholder="Tus apellidos"
                    className={`w-full transition-all duration-300 ${aiPrefill?.nuevo_apellido ? 'ring-2 ring-primary-500 shadow-lg shadow-primary-500/20' : ''}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-carbon-900 dark:text-white mb-2">
                  Teléfono
                </label>
                <Input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  placeholder="+57 3XX XXXX XXX"
                  className={`w-full transition-all duration-300 ${aiPrefill?.nuevo_telefono ? 'ring-2 ring-primary-500 shadow-lg shadow-primary-500/20' : ''}`}
                />
              </div>

              <div className="bg-neutral-50 dark:bg-carbon-700 p-4 rounded-lg text-sm text-carbon-600 dark:text-neutral-400">
                <p><Mail className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Email no se puede modificar. Es el identificador único de tu cuenta.</p>
                <p className="font-semibold text-carbon-900 dark:text-white mt-1">{user.email}</p>
              </div>

              {/* BOTONES */}
              <div className="flex gap-3 pt-4">
                <Button
                  id="perfil-submit-btn"
                  type="submit"
                  disabled={isSaving}
                  variant="primary"
                  className="bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 text-white flex-1"
                >
                  {isSaving ? <><Save className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Guardando...</> : <><Save className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Guardar Cambios</>}
                </Button>
                <Button
                  onClick={handleCancel}
                  type="button"
                  variant="secondary"
                  className="flex-1"
                >
                  <X className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Cancelar
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>

      {/* SEGURIDAD - CAMBIAR CONTRASEÑA */}
      <Card className="border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/30">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-carbon-900 dark:text-white"><Lock className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Seguridad</h3>
          {!showPasswordForm && (
            <Button
              onClick={() => setShowPasswordForm(true)}
              type="button"
              variant="secondary"
              className="text-sm"
            >
              <Key className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Cambiar Contraseña
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
              <label className="block text-sm font-semibold text-carbon-900 dark:text-white mb-2">
                Contraseña Actual *
              </label>
              <Input
                type="password"
                name="contraseña_actual"
                value={passwordFormData.contraseña_actual}
                onChange={handlePasswordInputChange}
                placeholder="Ingresa tu contraseña actual"
                className={`w-full transition-all duration-300 ${aiPrefill?.contrasena_actual ? 'ring-2 ring-primary-500 shadow-lg shadow-primary-500/20' : ''}`}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-carbon-900 dark:text-white mb-2">
                Contraseña Nueva *
              </label>
              <Input
                type="password"
                name="contraseña_nueva"
                value={passwordFormData.contraseña_nueva}
                onChange={handlePasswordInputChange}
                placeholder="Ingresa tu nueva contraseña (mínimo 8 caracteres)"
                className={`w-full transition-all duration-300 ${aiPrefill?.nueva_contrasena ? 'ring-2 ring-primary-500 shadow-lg shadow-primary-500/20' : ''}`}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-carbon-900 dark:text-white mb-2">
                Confirmar Contraseña Nueva *
              </label>
              <Input
                type="password"
                name="contraseña_confirmacion"
                value={passwordFormData.contraseña_confirmacion}
                onChange={handlePasswordInputChange}
                placeholder="Confirma tu nueva contraseña"
                className={`w-full transition-all duration-300 ${aiPrefill?.nueva_contrasena ? 'ring-2 ring-primary-500 shadow-lg shadow-primary-500/20' : ''}`}
              />
            </div>

            {/* BOTONES */}
            <div className="flex gap-3 pt-4">
              <Button
                id="password-submit-btn"
                type="submit"
                disabled={isChangingPassword}
                variant="primary"
                className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white flex-1"
              >
                {isChangingPassword ? <><RefreshCw className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Actualizando...</> : <><CheckCircle className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Cambiar Contraseña</>}
              </Button>
              <Button
                onClick={handleCancelPasswordForm}
                type="button"
                variant="secondary"
                className="flex-1"
              >
                <X className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Cancelar
              </Button>
            </div>
          </form>
        )}

        {!showPasswordForm && (
          <div className="text-sm text-carbon-700 dark:text-neutral-300">
            Actualiza tu contraseña para mantener tu cuenta segura.
          </div>
        )}
      </Card>

      {/* PREFERENCIAS DE NOTIFICACIÓN */}
      <NotificationPreferencesSection tenantSlug={tenantSlug} userId={user.id} aiPrefill={aiPrefill} onSuccess={onSuccess} />

      {/* INFORMACIÓN ADICIONAL */}
      <Card className="bg-neutral-50 dark:bg-carbon-700 border-neutral-200 dark:border-white/[0.08]">
        <h3 className="text-lg font-bold text-carbon-900 dark:text-white mb-4"><Info className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Información Adicional</h3>
        <div className="text-sm">
          <div>
            <p className="text-carbon-600 dark:text-neutral-400">Rol en {tenant.nombre}</p>
            <p className="text-carbon-900 dark:text-white font-semibold text-lg">
              {usuarioCompleto?.rol?.nombre || 'Usuario'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
