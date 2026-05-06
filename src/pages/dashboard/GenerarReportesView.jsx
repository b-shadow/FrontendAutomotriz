import React from 'react';
import { BarChart, Info } from 'lucide-react';
import { Card } from '../../components/ui';

export const GenerarReportesView = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-carbon-900 dark:text-white mb-2 tracking-tight">
          <BarChart className="inline-block mx-1 text-current" size={28} strokeWidth={2} /> Reportes y Estadísticas
        </h1>
        <p className="text-xl text-carbon-600 dark:text-neutral-300">
          Analítica avanzada de tu empresa
        </p>
      </div>

      <Card className="bg-gradient-to-br from-carbon-50 to-neutral-100 dark:from-carbon-800/30 dark:to-carbon-900/30 border-neutral-300 dark:border-white/[0.06] p-12 text-center">
        <Info className="mx-auto text-primary-500 mb-4" size={48} strokeWidth={1.5} />
        <h2 className="text-2xl font-bold text-carbon-900 dark:text-white mb-2">Módulo en Desarrollo</h2>
        <p className="text-carbon-600 dark:text-neutral-400 max-w-md mx-auto">
          Estamos construyendo un sistema de reportería avanzada que te permitirá visualizar ingresos, rendimiento de personal, servicios más solicitados y mucho más.
        </p>
        <span className="inline-block mt-6 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium border border-primary-200 dark:border-primary-700/40">
          Próximamente disponible
        </span>
      </Card>
    </div>
  );
};
