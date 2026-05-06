/**
 * RoleSelector.jsx - Componente para cambiar el rol de un usuario
 */
import { Pencil, AlertTriangle, Check } from 'lucide-react';
import { useState } from 'react'
import { Card, Button } from '../../components/ui'

export const RoleSelector = ({
  usuario,
  usuarioAutenticado,
  roles,
  onChangeRole,
  isLoading = false,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [selectedRoleId, setSelectedRoleId] = useState(usuario.rol.id || '')
  const [error, setError] = useState('')

  // No permitir editar si es el usuario autenticado
  const isCurrentUser = usuarioAutenticado.id === usuario.id
  const canEdit = !isCurrentUser && !isLoading

  const handleSave = async () => {
    if (!selectedRoleId) {
      setError('Debes seleccionar un rol')
      return
    }

    if (selectedRoleId === usuario.rol.id) {
      setIsEditing(false)
      return
    }

    try {
      setError('')
      await onChangeRole(usuario.id, selectedRoleId)
      setIsEditing(false)
    } catch (err) {
      setError(
        err.response.data.error ||
        err.response.data.detail ||
        'Error al cambiar el rol'
      )
    }
  }

  const handleCancel = () => {
    setSelectedRoleId(usuario.rol.id || '')
    setIsEditing(false)
    setError('')
  }

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
          {usuario.rol.nombre || 'Sin rol'}
        </span>
        {canEdit && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 rounded transition-colors"
            title="Editar rol"
          >
            <Pencil className="inline-block mx-1 text-current" size={20} strokeWidth={2} />
          </button>
        )}
        {isCurrentUser && (
          <span className="text-xs text-carbon-500">
            (No puedes cambiar tu propio rol)
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-carbon-900">
            Cambiar rol de {usuario.nombres}
          </h3>
          <button
            onClick={handleCancel}
            className="text-carbon-500 hover:text-carbon-700 text-2xl h-8 w-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Rol actual */}
          <div>
            <label className="text-sm text-carbon-600">Rol actual</label>
            <p className="font-semibold text-carbon-900">
              {usuario.rol.nombre}
            </p>
          </div>

          {/* Selector de rol */}
          <div>
            <label className="block text-sm font-semibold text-carbon-700 mb-2">
              Nuevo rol
            </label>
            <select
              value={selectedRoleId}
              onChange={(e) => {
                setSelectedRoleId(e.target.value)
                setError('')
              }}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-carbon-900"
            >
              <option value="">-- Seleccionar rol --</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.nombre}
                  {role.descripcion ? ` - ${role.descripcion}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              <AlertTriangle className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> {error}
            </div>
          )}

          {/* Advertencia */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            <p>
              <strong>Advertencia:</strong> Los cambios de rol entran en efecto
              inmediatamente.
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isLoading || !selectedRoleId}
              className="flex-1"
            >
              {isLoading ? 'Guardando...' : <><Check className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Guardar</>}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
export default RoleSelector
