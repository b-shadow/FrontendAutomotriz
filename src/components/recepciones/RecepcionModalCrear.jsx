/**
 * Modal para crear recepción de vehículo
 * Formulario con campos: km, combustible, observaciones
 */

import { useState } from 'react';

export default function RecepcionModalCrear({ cita, onClose, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    cita_id: cita.id,
    kilometraje_ingreso: '',
    nivel_combustible: '1/2',
    observaciones: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpiar error si el campo se modifica
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validar = () => {
    const newErrors = {};

    if (!formData.kilometraje_ingreso || formData.kilometraje_ingreso <= 0) {
      newErrors.kilometraje_ingreso = 'Kilometraje debe ser un número positivo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validar()) {
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex justify-between items-center border-b border-purple-700">
          <h2 className="text-xl font-bold text-white">Registrar Recepción</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-purple-700 rounded p-1 transition"
          >
            ✕
          </button>
        </div>

        {/* CONTENIDO */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* INFO DE CITA (READ-ONLY) */}
          <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Información de la Cita
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Vehículo</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {cita.vehiculo_placa || '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Cliente</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {cita.cliente_nombres || '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Fecha Programada</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {cita.fecha_hora_inicio_programada
                    ? new Date(cita.fecha_hora_inicio_programada).toLocaleDateString('es-ES', {
                        year: 'numeric', month: 'long',
                        day: 'numeric', hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'
                  }
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Servicios</p>
                <div className="space-y-1">
                  {cita.servicios_nombres && cita.servicios_nombres.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {cita.servicios_nombres.map((servicio, idx) => (
                        <li key={idx} className="text-sm font-medium text-gray-900 dark:text-white">
                          {servicio}
                        </li>
                      ))}
                    </ul>) : (
                    <p className="text-sm font-medium text-gray-900 dark:text-white">—</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* FORMULARIO DE RECEPCIÓN */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Datos de Recepción
            </h3>

            {/* Kilometraje */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kilometraje de Ingreso *
              </label>
              <input
                type="number"
                name="kilometraje_ingreso"
                value={formData.kilometraje_ingreso}
                onChange={handleChange}
                placeholder="Ej: 145000"
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                  errors.kilometraje_ingreso ?
                     'border-red-500 dark:border-red-600'
                    : 'border-gray-300 dark:border-slate-600'
                }`}
              />
              {errors.kilometraje_ingreso && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                  {errors.kilometraje_ingreso}
                </p>
              )}
            </div>

            {/* Combustible */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nivel de Combustible *
              </label>
              <select
                name="nivel_combustible"
                value={formData.nivel_combustible}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value="1/4">1/4 de tanque</option>
                <option value="1/2">1/2 de tanque</option>
                <option value="3/4">3/4 de tanque</option>
                <option value="LLENO">Lleno</option>
              </select>
            </div>

            {/* Observaciones Adicionales */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Observaciones Adicionales
              </label>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                placeholder="Notas adicionales (opcional)"
                rows="2"
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
              />
            </div>
          </div>

          {/* BOTONES */}
          <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Guardando...
                </>) : (
                <>✓ Confirmar Recepción</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
