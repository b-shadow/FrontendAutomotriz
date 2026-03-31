import { useState, useEffect } from 'react'
import { useTenant } from '../../hooks/useTenant'
import { Card, Button } from '../../components/ui'
import empresaService from '../../services/empresaService'
import suscripcionService from '../../services/suscripcionService'

export const GestionEmpresaView = ({ onNavigate }) => {
  const { tenantSlug } = useTenant()
  const [empresa, setEmpresa] = useState(null)
  const [suscripcion, setSuscripcion] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    nombre: ''
  })

  // Cargar datos de empresa y suscripción desde API
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true)
      setError(null)
      try {
        // Cargar empresa
        const dataEmpresa = await empresaService.obtenerMiEmpresa()
        setEmpresa(dataEmpresa)
        
        // Cargar suscripción (puede fallar con 404)
        try {
          const dataSuscripcion = await suscripcionService.obtenerSuscripcionActual(tenantSlug)
          setSuscripcion(dataSuscripcion)
        } catch (errSuscripcion) {
          if (errSuscripcion.response?.status !== 404) {
            console.error('Error cargando suscripción:', errSuscripcion)
          }
          setSuscripcion(null)
        }
      } catch (err) {
        console.error('Error cargando empresa:', err)
        setError(`Error al cargar datos: ${err.response?.status || 'desconocido'}`)
      } finally {
        setLoading(false)
      }
    }
    
    if (tenantSlug) {
      cargarDatos()
    }
  }, [tenantSlug])

  // Cargar datos en formulario cuando entra en edición
  useEffect(() => {
    if (isEditing && empresa) {
      setFormData({
        nombre: empresa.nombre || ''
      })
    }
  }, [isEditing, empresa])

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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleGuardarCambios = async () => {
    setSaving(true)
    setError(null)
    try {
      const datosParciales = {
        nombre: formData.nombre
      }
      
      const empresaActualizada = await empresaService.actualizarEmpresa(datosParciales)
      setEmpresa(empresaActualizada)
      setIsEditing(false)
      setSuccess('Empresa actualizada correctamente')
    } catch (err) {
      console.error('Error guardando empresa:', err)
      setError(`Error al guardar: ${err.response?.data?.detail || 'error desconocido'}`)
    } finally {
      setSaving(false)
    }
  }

  if (!empresa) {
    return (
      <div className="text-center text-gray-500 py-8">
        {loading ? 'Cargando empresa...' : 'No hay información de empresa'}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🏢 Gestionar Empresa</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Información y configuración de tu empresa</p>
      </div>

      {/* MENSAJES */}
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

      {/* INFORMACIÓN DE LA EMPRESA */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Información General</h2>
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
            >
              ✏️ Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleGuardarCambios}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white text-sm"
              >
                {saving ? '⏳ Guardando...' : '💾 Guardar'}
              </Button>
              <Button
                onClick={() => setIsEditing(false)}
                disabled={saving}
                variant="secondary"
                className="text-sm"
              >
                ✕ Cancelar
              </Button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">Nombre de Empresa</label>
            {isEditing ? (
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                placeholder="Nombre de la empresa"
              />
            ) : (
              <p className="text-lg text-gray-900 dark:text-white mt-1">{empresa.nombre}</p>
            )}
          </div>
          
          <div>
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">Slug (URL)</label>
            <p className="text-lg text-gray-900 dark:text-white mt-1 font-mono">{empresa.slug}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">⚠️ No se puede cambiar</p>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">Estado</label>
            <p className="text-lg mt-1">
              {empresa.estado === 'ACTIVA' ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">✓ Activa</span>
              ) : (
                <span className="text-red-700 dark:text-red-400 font-semibold">✕ Inactiva</span>
              )}
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">Fecha de Creación</label>
            <p className="text-lg text-gray-900 dark:text-white mt-1">
              {empresa.created_at ? new Date(empresa.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </Card>

      {/* SUSCRIPCIÓN ACTUAL */}
      {suscripcion ? (
        <Card className="border-l-4 border-l-primary-600 dark:border-l-primary-500">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📋 Suscripción Actual</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">Plan Activo</label>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                {suscripcion.plan_nombre || 'N/A'}
              </p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">Estado</label>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {suscripcion.estado}
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">Fecha de Inicio</label>
              <p className="text-lg text-gray-900 dark:text-white mt-1">
                {new Date(suscripcion.inicio).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">Fecha de Vencimiento</label>
              <p className="text-lg text-gray-900 dark:text-white mt-1">
                {new Date(suscripcion.fin).toLocaleDateString()}
              </p>
            </div>
            {suscripcion.plan_precio_centavos && (
              <div>
                <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">Precio</label>
                <p className="text-lg text-gray-900 dark:text-white mt-1">
                  ${(suscripcion.plan_precio_centavos / 100).toFixed(2)} USD
                </p>
              </div>
            )}
          </div>
          <div className="mt-6 flex gap-2">
            <Button 
              onClick={() => onNavigate && onNavigate('gestionSuscripciones')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              🔄 Cambiar Plan
            </Button>
            <Button 
              onClick={() => onNavigate && onNavigate('gestionSuscripciones')}
              variant="secondary"
            >
              ♻️ Renovar Suscripción
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <h2 className="text-xl font-bold text-yellow-900 dark:text-yellow-400">⚠️ Sin Suscripción</h2>
          <p className="text-yellow-800 dark:text-yellow-300 mt-2">
            Tu empresa actualmente no tiene una suscripción activa.
          </p>
          <Button 
            onClick={() => onNavigate && onNavigate('gestionSuscripciones')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            💳 Comprar Suscripción
          </Button>
        </Card>
      )}

      {/* INFORMACIÓN ADICIONAL */}
      <Card className="bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">ℹ️ Información</h3>
        <ul className="text-slate-700 dark:text-slate-300 text-sm list-disc list-inside space-y-1">
          <li>Aquí puedes ver los datos principales de tu empresa</li>
          <li>Tu suscripción define las funciones disponibles</li>
          <li>Puedes cambiar a un plan diferente en cualquier momento</li>
          <li>Si renuevas antes de que venza, el nuevo periodo comienza cuando acabe el actual</li>
        </ul>
      </Card>
    </div>
  )
}
