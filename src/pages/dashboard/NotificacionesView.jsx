import { Bell, Rocket, Check, Mail, Mailbox, Settings, MessageSquare } from 'lucide-react';
import { Card } from '../../components/ui'

export const NotificacionesView = () => {
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-carbon-900"><Bell className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Gestionar Notificaciones</h1>
        <p className="text-carbon-600 mt-1">
          Configura y gestiona tus notificaciones
        </p>
      </div>

      {/* COMING SOON */}
      <Card className="border-yellow-200 bg-yellow-50 py-12">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="text-6xl"><Rocket className="inline-block mx-1 text-current" size={20} strokeWidth={2} /></div>
          <h2 className="text-2xl font-bold text-carbon-900">¡Próximamente!</h2>
          <p className="text-carbon-700 max-w-xl">
            El sistema de notificaciones está siendo desarrollado. Pronto podrás gestionar
            aquí tus preferencias de notificaciones y recibir alertas sobre eventos
            importantes en tu empresa.
          </p>
          <div className="text-sm text-carbon-600 mt-4">
            <p><Check className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Notificaciones por email</p>
            <p><Check className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Alertas en tiempo real</p>
            <p><Check className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Historial de notificaciones</p>
            <p><Check className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Preferencias personalizadas</p>
          </div>
        </div>
      </Card>

      {/* INFO CARDS */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-lg font-bold text-carbon-900 mb-2"><Mail className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Notificaciones por Email</h3>
          <p className="text-carbon-700 text-sm mb-3">
            Recibe notificaciones sobre eventos importantes en tu empresa directamente en
            tu bandeja de entrada.
          </p>
          <div className="text-sm text-carbon-600">Estado: <span className="font-semibold text-carbon-900">En desarrollo</span></div>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-carbon-900 mb-2"><Bell className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Alertas en Tiempo Real</h3>
          <p className="text-carbon-700 text-sm mb-3">
            Recibe alertas instantáneas sobre actividades críticas en tu empresa.
          </p>
          <div className="text-sm text-carbon-600">Estado: <span className="font-semibold text-carbon-900">Planeado</span></div>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-carbon-900 mb-2"><Mailbox className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Historial de Notificaciones</h3>
          <p className="text-carbon-700 text-sm mb-3">
            Consulta el historial completo de todas las notificaciones que hemos enviado.
          </p>
          <div className="text-sm text-carbon-600">Estado: <span className="font-semibold text-carbon-900">Planeado</span></div>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-carbon-900 mb-2"><Settings className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Preferencias Personalizadas</h3>
          <p className="text-carbon-700 text-sm mb-3">
            Configura qué tipos de notificaciones deseas recibir y con qué frecuencia.
          </p>
          <div className="text-sm text-carbon-600">Estado: <span className="font-semibold text-carbon-900">Planeado</span></div>
        </Card>
      </div>

      {/* CONTACT SECTION */}
      <Card className="bg-blue-50 border-blue-200">
        <h3 className="text-lg font-bold text-carbon-900 mb-2"><MessageSquare className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> ¿Tienes Sugerencias</h3>
        <p className="text-carbon-700 mb-4">
          Tu retroalimentación es importante. Si tienes sugerencias sobre cómo debería
          funcionar el sistema de notificaciones, nos gustaría escucharte.
        </p>
        <a
          href="mailto:soporte@example.com"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Mail className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Enviar Sugerencia
        </a>
      </Card>
    </div>
  )
}
