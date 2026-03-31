/**
 * UserModal.jsx - Modal para crear nuevo usuario
 */
import { useState } from 'react'
import { Card, Button, Input } from '../../components/ui'

export const UserModal = ({ isOpen, onClose, onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    password: '',
    confirmarPassword: '',
    telefono: '',
  })
  const [errors, setErrors] = useState({})

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Validar nombres
    if (!formData.nombres.trim()) {
      newErrors.nombres = 'Los nombres son requeridos'
    }

    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido'
    }

    // Validar password
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres'
    }

    // Validar confirmación de password
    if (formData.password !== formData.confirmarPassword) {
      newErrors.confirmarPassword = 'Las contraseñas no coinciden'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Preparar datos para enviar (sin confirmarPassword)
    const userData = {
      nombres: formData.nombres.trim(),
      apellidos: formData.apellidos.trim(),
      email: formData.email.trim(),
      password: formData.password,
      telefono: formData.telefono.trim() || undefined,
    }

    try {
      await onSubmit(userData)
      // Limpiar formulario
      setFormData({
        nombres: '',
        apellidos: '',
        email: '',
        password: '',
        confirmarPassword: '',
        telefono: '',
      })
      setErrors({})
    } catch (error) {
      // El manejo de errores se hace en el componente padre
      if (error.response?.data?.usuario?.email) {
        setErrors((prev) => ({
          ...prev,
          email: error.response.data.usuario.email[0],
        }))
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">➕ Crear Usuario</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl h-8 w-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombres */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nombres *
            </label>
            <Input
              type="text"
              name="nombres"
              value={formData.nombres}
              onChange={handleInputChange}
              placeholder="Juan"
              className={errors.nombres ? 'border-red-500' : ''}
            />
            {errors.nombres && (
              <p className="text-red-500 text-sm mt-1">{errors.nombres}</p>
            )}
          </div>

          {/* Apellidos */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Apellidos
            </label>
            <Input
              type="text"
              name="apellidos"
              value={formData.apellidos}
              onChange={handleInputChange}
              placeholder="Pérez García"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email *
            </label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="juan@empresa.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Teléfono
            </label>
            <Input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
              placeholder="+573001234567"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Contraseña *
            </label>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
            {!errors.password && formData.password && (
              <p className="text-xs text-gray-500 mt-1">
                ✓ Contraseña segura
              </p>
            )}
          </div>

          {/* Confirmar Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Confirmar Contraseña *
            </label>
            <Input
              type="password"
              name="confirmarPassword"
              value={formData.confirmarPassword}
              onChange={handleInputChange}
              placeholder="••••••••"
              className={errors.confirmarPassword ? 'border-red-500' : ''}
            />
            {errors.confirmarPassword && (
              <p className="text-red-500 text-sm mt-1">
                {errors.confirmarPassword}
              </p>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <p>
              <strong>Nota:</strong> El nuevo usuario será creado con rol{' '}
              <strong>"USUARIO"</strong>. Puedes cambiar su rol después si es
              necesario.
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Creando...' : '✓ Crear Usuario'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default UserModal
