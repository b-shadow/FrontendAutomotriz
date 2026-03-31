/**
 * TenantResolver: Resuelve el tenant por slug desde la URL.Detecta slug dinámicamente
 */
import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import authService from '../services/authService'
import { TenantProvider } from '../context/TenantContext'

export const TenantResolver = ({ children }) => {
  const { tenantSlug } = useParams()
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 5

  useEffect(() => {
    const resolveTenant = async () => {
      if (!tenantSlug) {
        setError('Slug de empresa no proporcionado')
        setLoading(false)
        return
      }

      const result = await authService.resolveTenant(tenantSlug)

      if (result.success) {
        setTenant(result.tenant)
        setLoading(false)
      } else {
        // Si no encontramos la empresa y aún tenemos reintentos, esperar y reintentar
        if (retryCount < maxRetries) {
          console.log(`Empresa no encontrada, reintentando en 2s... (intento ${retryCount + 1}/${maxRetries})`)
          setTimeout(() => {
            setRetryCount(retryCount + 1)
          }, 2000)
        } else {
          // Después de máximos reintentos, mostrar error
          setError(result.error || 'Empresa no encontrada')
          setLoading(false)
        }
      }
    }

    resolveTenant()
  }, [tenantSlug, retryCount])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            <p className="text-gray-600 mt-4">Cargando empresa...</p>
            {retryCount > 0 && (
              <p className="text-gray-400 text-sm mt-2">(intento {retryCount} de {maxRetries})</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-md">
          <h2 className="text-3xl font-bold text-red-600 mb-2">❌ Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            ← Volver al inicio
          </a>
        </div>
      </div>
    )
  }

  return (
    <TenantProvider tenant={tenant} tenantSlug={tenantSlug}>
      {children}
    </TenantProvider>
  )
}

export default TenantResolver
