export const REPORT_GROUPS = [
  {
    id: 'global',
    label: 'Reporte global de estadisticas',
    shortLabel: 'Global',
    description: 'Consultas operativas y consolidadas del taller.',
  },
  {
    id: 'vehiculo',
    label: 'Reporte de vehiculo',
    shortLabel: 'Vehiculo',
    description: 'Historiales, citas, servicios y trazabilidad por vehiculo.',
  },
  {
    id: 'presupuesto',
    label: 'Reporte de presupuesto',
    shortLabel: 'Presupuesto',
    description: 'Presupuestos, caja y pagos asociados.',
  },
  {
    id: 'inventario',
    label: 'Reporte de inventario',
    shortLabel: 'Inventario',
    description: 'Inventario, compras y solicitudes de repuesto.',
  },
]

const VEHICULOS_COLUMNS = [
  'id',
  'placa',
  'marca',
  'modelo',
  'anio',
  'color',
  'kilometraje_actual',
  'propietario__email',
  'created_at',
]

const CITAS_COLUMNS = [
  'id',
  'estado',
  'canal_origen',
  'fecha_hora_inicio_programada',
  'fecha_hora_fin_programada',
  'motivo_visita',
  'vehiculo__placa',
  'vehiculo__marca',
  'vehiculo__modelo',
  'cliente__email',
  'asesor_responsable__email',
  'reprogramaciones_count',
  'created_at',
  'finalizada_at',
  'vehiculo_devuelto_at',
]

const CITA_DETALLES_COLUMNS = [
  'id',
  'cita__id',
  'cita__vehiculo__placa',
  'servicio_catalogo__codigo',
  'servicio_catalogo__nombre',
  'estado',
  'tiempo_estandar_min',
  'precio_referencial',
  'observaciones',
  'created_at',
]

const PLANES_DETALLE_COLUMNS = [
  'id',
  'plan_servicio__vehiculo__placa',
  'servicio_catalogo__codigo',
  'servicio_catalogo__nombre',
  'estado',
  'origen',
  'prioridad',
  'tiempo_estandar_min',
  'precio_referencial',
  'recomendado_por__email',
  'created_at',
  'updated_at',
]

const PRESUPUESTOS_COLUMNS = [
  'id',
  'estado',
  'subtotal',
  'descuento',
  'total',
  'cita__id',
  'cita__vehiculo__placa',
  'cita__vehiculo__marca',
  'cita__vehiculo__modelo',
  'cita__cliente__email',
  'cita__asesor_responsable__email',
  'comunicado_por__email',
  'comunicado_at',
  'observaciones',
  'created_at',
  'updated_at',
]

const ORDENES_GLOBALES_COLUMNS = [
  'id',
  'numero',
  'estado',
  'cita__vehiculo__placa',
  'cita__vehiculo__marca',
  'cita__cliente__email',
  'asesor_responsable__email',
  'observaciones',
  'fecha_apertura',
  'fecha_cierre',
  'created_at',
]

const ORDENES_DETALLE_COLUMNS = [
  'id',
  'orden_global__numero',
  'orden_global__cita__vehiculo__placa',
  'servicio_catalogo__nombre',
  'estado',
  'prioridad',
  'mecanico_asignado__email',
  'tiempo_estandar_min',
  'tiempo_real_min',
  'visible_cliente',
  'inicio_real',
  'fin_real',
  'created_at',
]

const RECEPCIONES_COLUMNS = [
  'id',
  'cita__id',
  'cita__vehiculo__placa',
  'cita__vehiculo__marca',
  'cita__vehiculo__modelo',
  'asesor_registra__email',
  'fecha_recepcion',
  'kilometraje_ingreso',
  'nivel_combustible',
  'fecha_recogida',
  'recogido_por__email',
  'created_at',
]

const AVANCES_COLUMNS = [
  'id',
  'cita__id',
  'cita__vehiculo__placa',
  'orden_detalle__id',
  'registrado_por__email',
  'tipo',
  'estado_nuevo',
  'mensaje',
  'porcentaje_avance',
  'visible_cliente',
  'created_at',
]

const PAGOS_COLUMNS = [
  'id',
  'tipo_origen',
  'tipo_destino',
  'id_destino',
  'estado',
  'proveedor',
  'metodo_pago',
  'monto_total',
  'monto_real',
  'monto_cobrado',
  'referencia',
  'descripcion',
  'cita__vehiculo__placa',
  'venta__id',
  'registrado_por__email',
  'fecha_pago',
  'recibido_at',
  'created_at',
]

const ITEMS_COLUMNS = [
  'id',
  'codigo',
  'nombre',
  'categoria__nombre',
  'tipo_item',
  'unidad_medida',
  'stock_actual',
  'stock_minimo',
  'costo_promedio',
  'precio_venta',
  'activo',
  'created_at',
]

const MOVIMIENTOS_COLUMNS = [
  'id',
  'item_inventario__codigo',
  'item_inventario__nombre',
  'tipo_movimiento',
  'cantidad',
  'stock_anterior',
  'stock_posterior',
  'referencia_tipo',
  'referencia_id',
  'registrado_por__email',
  'observacion',
  'created_at',
]

const SOLICITUDES_COLUMNS = [
  'id',
  'cita__id',
  'cita__vehiculo__placa',
  'orden_global__numero',
  'solicitado_por__email',
  'aprobado_por_asesor__email',
  'estado',
  'motivo',
  'observaciones_asesor',
  'observaciones_almacen',
  'created_at',
  'updated_at',
]

const SOLICITUDES_DETALLE_COLUMNS = [
  'id',
  'solicitud__id',
  'solicitud__cita__vehiculo__placa',
  'item_inventario__codigo',
  'item_inventario__nombre',
  'cantidad_solicitada',
  'cantidad_aprobada',
  'cantidad_entregada',
  'cantidad_recibida_taller',
  'estado',
  'recibido_taller_at',
  'recibido_taller_por__email',
  'observacion',
  'created_at',
]

const COMPRAS_COLUMNS = [
  'id',
  'numero_documento',
  'estado',
  'proveedor__nombre',
  'subtotal',
  'total',
  'fecha_compra',
  'registrado_por__email',
  'observaciones',
  'created_at',
]

const PROVEEDORES_COLUMNS = [
  'id',
  'nombre',
  'telefono',
  'email',
  'direccion',
  'contacto',
  'activo',
  'created_at',
]

const VENTAS_COLUMNS = [
  'id',
  'cliente_nombre_libre',
  'cliente_documento',
  'cliente_usuario__email',
  'vendido_por__email',
  'estado',
  'subtotal',
  'total',
  'created_at',
]

export const EXPLORER_VIEWS = {
  vehiculos_citas: {
    label: 'Vehiculos con sus citas',
    columns: CITAS_COLUMNS,
  },
  citas_servicios: {
    label: 'Citas con servicios',
    columns: CITA_DETALLES_COLUMNS,
  },
  vehiculos: {
    label: 'Vehiculos',
    columns: VEHICULOS_COLUMNS,
  },
  citas: {
    label: 'Citas',
    columns: CITAS_COLUMNS,
  },
  cita_detalles: {
    label: 'Detalles de cita',
    columns: CITA_DETALLES_COLUMNS,
  },
  planes_detalle: {
    label: 'Servicios del plan',
    columns: PLANES_DETALLE_COLUMNS,
  },
  presupuestos: {
    label: 'Presupuestos',
    columns: PRESUPUESTOS_COLUMNS,
  },
  pagos_taller: {
    label: 'Pagos de taller',
    columns: PAGOS_COLUMNS,
  },
  ordenes_globales: {
    label: 'Ordenes de trabajo',
    columns: ORDENES_GLOBALES_COLUMNS,
  },
  ordenes_detalle: {
    label: 'Servicios en ordenes de trabajo',
    columns: ORDENES_DETALLE_COLUMNS,
  },
  recepciones: {
    label: 'Recepciones de vehiculo',
    columns: RECEPCIONES_COLUMNS,
  },
  avances: {
    label: 'Avances de vehiculo',
    columns: AVANCES_COLUMNS,
  },
  usuarios: {
    label: 'Usuarios',
    columns: ['id', 'email', 'nombres', 'apellidos', 'is_active', 'rol__nombre', 'created_at'],
  },
  ventas: {
    label: 'Ventas de mostrador',
    columns: VENTAS_COLUMNS,
  },
  compras: {
    label: 'Compras',
    columns: COMPRAS_COLUMNS,
  },
  proveedores: {
    label: 'Proveedores',
    columns: PROVEEDORES_COLUMNS,
  },
  items_inventario: {
    label: 'Items de inventario',
    columns: ITEMS_COLUMNS,
  },
  movimientos_inventario: {
    label: 'Movimientos de inventario',
    columns: MOVIMIENTOS_COLUMNS,
  },
  solicitudes_repuesto: {
    label: 'Solicitudes de repuesto',
    columns: SOLICITUDES_COLUMNS,
  },
  solicitudes_repuesto_detalle: {
    label: 'Items de solicitudes de repuesto',
    columns: SOLICITUDES_DETALLE_COLUMNS,
  },
  vehiculos_en_taller: {
    label: 'Vehiculos en taller',
    columns: CITAS_COLUMNS,
  },
  items_stock_bajo: {
    label: 'Items con stock bajo',
    columns: ITEMS_COLUMNS,
  },
  solicitudes_repuesto_activas: {
    label: 'Solicitudes de repuesto activas',
    columns: SOLICITUDES_COLUMNS,
  },
  solicitudes_detalle_pendientes: {
    label: 'Items pendientes de entrega',
    columns: SOLICITUDES_DETALLE_COLUMNS,
  },
}

const template = (group, id, title, view, selectedColumns, defaultFilters = {}, description = '') => ({
  group,
  id,
  title,
  view,
  selectedColumns,
  defaultFilters,
  description,
})

const globalTemplates = [
  template('global', 'global_historial_citas', 'Historial general de citas', 'citas', ['id', 'estado', 'fecha_hora_inicio_programada', 'vehiculo__placa', 'cliente__email', 'canal_origen']),
  template('global', 'global_vehiculos_con_citas', 'Vehiculos con sus citas', 'vehiculos_citas', ['vehiculo__placa', 'vehiculo__marca', 'vehiculo__modelo', 'estado', 'fecha_hora_inicio_programada', 'motivo_visita']),
  template('global', 'global_historial_presupuestos', 'Historial general de presupuestos', 'presupuestos', ['id', 'estado', 'total', 'cita__vehiculo__placa', 'cita__cliente__email', 'created_at']),
  template('global', 'global_historial_pagos', 'Historial general de pagos', 'pagos_taller', ['id', 'estado', 'metodo_pago', 'monto_total', 'cita__vehiculo__placa', 'created_at']),
  template('global', 'global_historial_ordenes', 'Historial general de ordenes de trabajo', 'ordenes_globales', ['numero', 'estado', 'cita__vehiculo__placa', 'asesor_responsable__email', 'fecha_apertura']),
  template('global', 'global_historial_servicios_orden', 'Historial general de servicios en ordenes', 'ordenes_detalle', ['orden_global__numero', 'servicio_catalogo__nombre', 'estado', 'prioridad', 'mecanico_asignado__email']),
  template('global', 'global_historial_recepciones', 'Historial general de recepciones', 'recepciones', ['cita__vehiculo__placa', 'asesor_registra__email', 'fecha_recepcion', 'kilometraje_ingreso', 'fecha_recogida']),
  template('global', 'global_historial_avances', 'Historial general de avances de vehiculo', 'avances', ['cita__vehiculo__placa', 'tipo', 'estado_nuevo', 'porcentaje_avance', 'visible_cliente', 'created_at']),
  template('global', 'global_historial_solicitudes', 'Historial general de solicitudes de repuesto', 'solicitudes_repuesto', ['cita__vehiculo__placa', 'estado', 'solicitado_por__email', 'aprobado_por_asesor__email', 'created_at']),
  template('global', 'global_historial_items_solicitados', 'Historial general de items solicitados', 'solicitudes_repuesto_detalle', ['solicitud__cita__vehiculo__placa', 'item_inventario__nombre', 'cantidad_solicitada', 'estado', 'created_at']),
  template('global', 'global_historial_compras', 'Historial general de compras', 'compras', ['numero_documento', 'estado', 'proveedor__nombre', 'total', 'fecha_compra', 'registrado_por__email']),
  template('global', 'global_historial_ventas', 'Historial general de ventas de mostrador', 'ventas', ['id', 'estado', 'cliente_nombre_libre', 'vendido_por__email', 'total', 'created_at']),
  template('global', 'global_historial_movimientos', 'Historial general de movimientos de inventario', 'movimientos_inventario', ['item_inventario__nombre', 'tipo_movimiento', 'cantidad', 'stock_posterior', 'registrado_por__email', 'created_at']),
  template('global', 'global_citas_canceladas', 'Listado general de citas canceladas', 'citas', ['id', 'vehiculo__placa', 'cliente__email', 'motivo_visita', 'fecha_hora_inicio_programada', 'created_at'], { estado: 'CANCELADA' }),
  template('global', 'global_citas_no_show', 'Listado general de citas no show', 'citas', ['id', 'vehiculo__placa', 'cliente__email', 'fecha_hora_inicio_programada', 'no_show_marcado_at'], { estado: 'NO_SHOW' }),
  template('global', 'global_vehiculos_en_taller', 'Vehiculos actualmente en taller', 'vehiculos_en_taller', ['vehiculo__placa', 'vehiculo__marca', 'cliente__email', 'estado', 'fecha_hora_inicio_programada']),
  template('global', 'global_presupuestos_aprobados', 'Presupuestos aprobados del sistema', 'presupuestos', ['id', 'total', 'cita__vehiculo__placa', 'cita__cliente__email', 'comunicado_at', 'updated_at'], { estado: 'APROBADO' }),
  template('global', 'global_ordenes_abiertas', 'Ordenes abiertas del sistema', 'ordenes_globales', ['numero', 'estado', 'cita__vehiculo__placa', 'asesor_responsable__email', 'fecha_apertura'], { estado: ['ABIERTA', 'ASIGNADA', 'EN_PROCESO', 'PAUSADA'] }),
  template('global', 'global_pagos_pendientes', 'Pagos pendientes o procesando', 'pagos_taller', ['id', 'estado', 'metodo_pago', 'monto_total', 'cita__vehiculo__placa', 'created_at'], { estado: ['PENDIENTE', 'PROCESANDO', 'REGISTRADO'] }),
  template('global', 'global_solicitudes_activas', 'Solicitudes de repuesto activas', 'solicitudes_repuesto_activas', ['cita__vehiculo__placa', 'estado', 'solicitado_por__email', 'aprobado_por_asesor__email', 'updated_at']),
]

const vehiculoTemplates = [
  template('vehiculo', 'vehiculo_solo_vehiculos', 'Solo vehiculos', 'vehiculos', ['placa', 'marca', 'modelo', 'anio', 'color', 'kilometraje_actual']),
  template('vehiculo', 'vehiculo_historial_citas', 'Historial de citas por vehiculo', 'citas', ['vehiculo__placa', 'estado', 'fecha_hora_inicio_programada', 'canal_origen', 'motivo_visita', 'cliente__email']),
  template('vehiculo', 'vehiculo_historial_detalles_cita', 'Historial de detalles de cita por vehiculo', 'cita_detalles', ['cita__vehiculo__placa', 'servicio_catalogo__nombre', 'estado', 'tiempo_estandar_min', 'precio_referencial', 'created_at']),
  template('vehiculo', 'vehiculo_historial_plan', 'Historial de servicios del plan por vehiculo', 'planes_detalle', ['plan_servicio__vehiculo__placa', 'servicio_catalogo__nombre', 'estado', 'prioridad', 'tiempo_estandar_min', 'updated_at']),
  template('vehiculo', 'vehiculo_historial_presupuestos', 'Historial de presupuestos por vehiculo', 'presupuestos', ['cita__vehiculo__placa', 'estado', 'subtotal', 'descuento', 'total', 'created_at']),
  template('vehiculo', 'vehiculo_historial_pagos', 'Historial de pagos por vehiculo', 'pagos_taller', ['cita__vehiculo__placa', 'estado', 'metodo_pago', 'monto_total', 'fecha_pago', 'created_at']),
  template('vehiculo', 'vehiculo_historial_ordenes', 'Historial de ordenes por vehiculo', 'ordenes_globales', ['cita__vehiculo__placa', 'numero', 'estado', 'asesor_responsable__email', 'fecha_apertura']),
  template('vehiculo', 'vehiculo_historial_servicios_ot', 'Historial de servicios en ordenes por vehiculo', 'ordenes_detalle', ['orden_global__cita__vehiculo__placa', 'servicio_catalogo__nombre', 'estado', 'prioridad', 'mecanico_asignado__email']),
  template('vehiculo', 'vehiculo_historial_recepciones', 'Historial de recepciones por vehiculo', 'recepciones', ['cita__vehiculo__placa', 'fecha_recepcion', 'kilometraje_ingreso', 'nivel_combustible', 'fecha_recogida']),
  template('vehiculo', 'vehiculo_historial_avances', 'Historial de avances por vehiculo', 'avances', ['cita__vehiculo__placa', 'tipo', 'estado_nuevo', 'mensaje', 'porcentaje_avance', 'created_at']),
  template('vehiculo', 'vehiculo_historial_solicitudes', 'Historial de solicitudes de repuesto por vehiculo', 'solicitudes_repuesto', ['cita__vehiculo__placa', 'estado', 'motivo', 'solicitado_por__email', 'created_at']),
  template('vehiculo', 'vehiculo_historial_items_solicitados', 'Historial de items solicitados por vehiculo', 'solicitudes_repuesto_detalle', ['solicitud__cita__vehiculo__placa', 'item_inventario__nombre', 'cantidad_solicitada', 'cantidad_entregada', 'estado']),
  template('vehiculo', 'vehiculo_citas_programadas', 'Citas programadas por vehiculo', 'citas', ['vehiculo__placa', 'cliente__email', 'fecha_hora_inicio_programada', 'motivo_visita', 'created_at'], { estado: 'PROGRAMADA' }),
  template('vehiculo', 'vehiculo_citas_en_proceso', 'Citas en proceso por vehiculo', 'citas', ['vehiculo__placa', 'cliente__email', 'fecha_hora_inicio_programada', 'motivo_visita', 'created_at'], { estado: 'EN_PROCESO' }),
  template('vehiculo', 'vehiculo_citas_finalizadas', 'Citas finalizadas por vehiculo', 'citas', ['vehiculo__placa', 'cliente__email', 'fecha_hora_inicio_programada', 'finalizada_at', 'vehiculo_devuelto_at'], { estado: 'FINALIZADA' }),
  template('vehiculo', 'vehiculo_citas_canceladas', 'Citas canceladas por vehiculo', 'citas', ['vehiculo__placa', 'cliente__email', 'fecha_hora_inicio_programada', 'created_at'], { estado: 'CANCELADA' }),
  template('vehiculo', 'vehiculo_citas_no_show', 'Citas no show por vehiculo', 'citas', ['vehiculo__placa', 'cliente__email', 'fecha_hora_inicio_programada', 'no_show_marcado_at'], { estado: 'NO_SHOW' }),
  template('vehiculo', 'vehiculo_presupuestos_aprobados', 'Presupuestos aprobados por vehiculo', 'presupuestos', ['cita__vehiculo__placa', 'total', 'cita__cliente__email', 'comunicado_at', 'updated_at'], { estado: 'APROBADO' }),
  template('vehiculo', 'vehiculo_pagos_pendientes', 'Pagos pendientes por vehiculo', 'pagos_taller', ['cita__vehiculo__placa', 'estado', 'metodo_pago', 'monto_total', 'created_at'], { estado: ['PENDIENTE', 'PROCESANDO', 'REGISTRADO'] }),
  template('vehiculo', 'vehiculo_avances_visibles', 'Avances visibles para cliente por vehiculo', 'avances', ['cita__vehiculo__placa', 'estado_nuevo', 'mensaje', 'porcentaje_avance', 'created_at'], { visible_cliente: true }),
]

const presupuestoTemplates = [
  template('presupuesto', 'presupuesto_general', 'Listado general de presupuestos', 'presupuestos', ['id', 'estado', 'subtotal', 'descuento', 'total', 'cita__vehiculo__placa', 'cita__cliente__email', 'created_at']),
  template('presupuesto', 'presupuesto_borrador', 'Presupuestos en borrador', 'presupuestos', ['id', 'subtotal', 'total', 'cita__vehiculo__placa', 'cita__cliente__email', 'created_at'], { estado: 'BORRADOR' }),
  template('presupuesto', 'presupuesto_comunicado', 'Presupuestos comunicados', 'presupuestos', ['id', 'total', 'cita__vehiculo__placa', 'cita__cliente__email', 'comunicado_por__email', 'comunicado_at'], { estado: 'COMUNICADO' }),
  template('presupuesto', 'presupuesto_ajustado', 'Presupuestos ajustados', 'presupuestos', ['id', 'subtotal', 'descuento', 'total', 'cita__vehiculo__placa', 'updated_at'], { estado: 'AJUSTADO' }),
  template('presupuesto', 'presupuesto_aprobado', 'Presupuestos aprobados', 'presupuestos', ['id', 'total', 'cita__vehiculo__placa', 'cita__cliente__email', 'updated_at'], { estado: 'APROBADO' }),
  template('presupuesto', 'presupuesto_rechazado', 'Presupuestos rechazados', 'presupuestos', ['id', 'total', 'cita__vehiculo__placa', 'cita__cliente__email', 'updated_at'], { estado: 'RECHAZADO' }),
  template('presupuesto', 'presupuesto_cerrado', 'Presupuestos cerrados', 'presupuestos', ['id', 'total', 'cita__vehiculo__placa', 'cita__cliente__email', 'updated_at'], { estado: 'CERRADO' }),
  template('presupuesto', 'presupuesto_con_descuento', 'Presupuestos con descuento aplicado', 'presupuestos', ['id', 'subtotal', 'descuento', 'total', 'cita__vehiculo__placa', 'updated_at'], { descuento__gt: 0 }),
  template('presupuesto', 'presupuesto_por_cliente', 'Presupuestos por cliente', 'presupuestos', ['cita__cliente__email', 'cita__vehiculo__placa', 'estado', 'total', 'created_at']),
  template('presupuesto', 'presupuesto_por_vehiculo', 'Presupuestos por vehiculo', 'presupuestos', ['cita__vehiculo__placa', 'cita__cliente__email', 'estado', 'total', 'created_at']),
  template('presupuesto', 'presupuesto_por_asesor', 'Presupuestos por asesor', 'presupuestos', ['cita__asesor_responsable__email', 'cita__vehiculo__placa', 'estado', 'total', 'created_at']),
  template('presupuesto', 'presupuesto_pagos_general', 'Pagos asociados a presupuestos', 'pagos_taller', ['id', 'tipo_destino', 'id_destino', 'estado', 'metodo_pago', 'monto_total', 'cita__vehiculo__placa', 'created_at']),
  template('presupuesto', 'presupuesto_pagos_qr', 'Pagos QR de presupuesto', 'pagos_taller', ['id', 'proveedor', 'estado', 'monto_total', 'cita__vehiculo__placa', 'created_at'], { proveedor: 'LIBELULA_QR' }),
  template('presupuesto', 'presupuesto_pagos_tarjeta', 'Pagos con tarjeta de presupuesto', 'pagos_taller', ['id', 'proveedor', 'estado', 'monto_total', 'cita__vehiculo__placa', 'created_at'], { proveedor: 'STRIPE' }),
  template('presupuesto', 'presupuesto_pagos_efectivo', 'Pagos en efectivo o manuales', 'pagos_taller', ['id', 'metodo_pago', 'estado', 'monto_total', 'cita__vehiculo__placa', 'created_at'], { metodo_pago: 'EFECTIVO' }),
  template('presupuesto', 'presupuesto_pagos_pendientes', 'Pagos pendientes de presupuesto', 'pagos_taller', ['id', 'estado', 'metodo_pago', 'monto_total', 'cita__vehiculo__placa', 'created_at'], { estado: ['PENDIENTE', 'PROCESANDO', 'REGISTRADO'] }),
  template('presupuesto', 'presupuesto_pagos_confirmados', 'Pagos confirmados o recibidos', 'pagos_taller', ['id', 'estado', 'metodo_pago', 'monto_total', 'cita__vehiculo__placa', 'recibido_at'], { estado: ['CONFIRMADO', 'RECIBIDO'] }),
  template('presupuesto', 'presupuesto_pagos_facturados', 'Pagos facturados', 'pagos_taller', ['id', 'estado', 'metodo_pago', 'monto_total', 'cita__vehiculo__placa', 'created_at'], { estado: 'FACTURADO' }),
  template('presupuesto', 'presupuesto_pagos_con_referencia', 'Pagos con referencia registrada', 'pagos_taller', ['id', 'referencia', 'metodo_pago', 'monto_total', 'cita__vehiculo__placa', 'created_at']),
  template('presupuesto', 'presupuesto_caja_por_metodo', 'Caja y pagos por metodo', 'pagos_taller', ['metodo_pago', 'estado', 'monto_total', 'monto_cobrado', 'registrado_por__email', 'created_at']),
]

const inventarioTemplates = [
  template('inventario', 'inventario_items_general', 'Listado general de items de inventario', 'items_inventario', ['codigo', 'nombre', 'categoria__nombre', 'tipo_item', 'stock_actual', 'precio_venta']),
  template('inventario', 'inventario_items_activos', 'Items activos de inventario', 'items_inventario', ['codigo', 'nombre', 'categoria__nombre', 'tipo_item', 'stock_actual', 'precio_venta'], { activo: true }),
  template('inventario', 'inventario_items_inactivos', 'Items inactivos de inventario', 'items_inventario', ['codigo', 'nombre', 'categoria__nombre', 'tipo_item', 'stock_actual', 'precio_venta'], { activo: false }),
  template('inventario', 'inventario_items_sin_stock', 'Items sin stock', 'items_inventario', ['codigo', 'nombre', 'categoria__nombre', 'tipo_item', 'stock_actual', 'stock_minimo'], { stock_actual: 0 }),
  template('inventario', 'inventario_items_stock_bajo', 'Items con stock bajo', 'items_stock_bajo', ['codigo', 'nombre', 'categoria__nombre', 'tipo_item', 'stock_actual', 'stock_minimo']),
  template('inventario', 'inventario_items_por_categoria', 'Items de inventario por categoria', 'items_inventario', ['categoria__nombre', 'codigo', 'nombre', 'tipo_item', 'stock_actual', 'precio_venta']),
  template('inventario', 'inventario_items_por_tipo', 'Items de inventario por tipo', 'items_inventario', ['tipo_item', 'codigo', 'nombre', 'categoria__nombre', 'stock_actual', 'precio_venta']),
  template('inventario', 'inventario_movimientos_general', 'Historial general de movimientos de inventario', 'movimientos_inventario', ['item_inventario__nombre', 'tipo_movimiento', 'cantidad', 'stock_anterior', 'stock_posterior', 'created_at']),
  template('inventario', 'inventario_entradas_compra', 'Entradas por compra', 'movimientos_inventario', ['item_inventario__nombre', 'cantidad', 'stock_posterior', 'registrado_por__email', 'created_at'], { tipo_movimiento: 'ENTRADA_COMPRA' }),
  template('inventario', 'inventario_salidas_taller', 'Salidas al taller', 'movimientos_inventario', ['item_inventario__nombre', 'cantidad', 'stock_posterior', 'registrado_por__email', 'created_at'], { tipo_movimiento: 'SALIDA_TALLER' }),
  template('inventario', 'inventario_salidas_venta', 'Salidas por venta', 'movimientos_inventario', ['item_inventario__nombre', 'cantidad', 'stock_posterior', 'registrado_por__email', 'created_at'], { tipo_movimiento: 'SALIDA_VENTA' }),
  template('inventario', 'inventario_ajustes_stock', 'Ajustes manuales de stock', 'movimientos_inventario', ['item_inventario__nombre', 'cantidad', 'stock_anterior', 'stock_posterior', 'observacion', 'created_at'], { tipo_movimiento: 'AJUSTE' }),
  template('inventario', 'inventario_compras_general', 'Listado general de compras', 'compras', ['numero_documento', 'estado', 'proveedor__nombre', 'total', 'fecha_compra', 'created_at']),
  template('inventario', 'inventario_compras_confirmadas', 'Compras confirmadas', 'compras', ['numero_documento', 'proveedor__nombre', 'total', 'fecha_compra', 'created_at'], { estado: 'CONFIRMADA' }),
  template('inventario', 'inventario_compras_anuladas', 'Compras anuladas', 'compras', ['numero_documento', 'proveedor__nombre', 'total', 'fecha_compra', 'created_at'], { estado: 'ANULADA' }),
  template('inventario', 'inventario_proveedores_registrados', 'Proveedores registrados', 'proveedores', ['nombre', 'telefono', 'email', 'contacto', 'activo', 'created_at']),
  template('inventario', 'inventario_solicitudes_general', 'Listado general de solicitudes de repuesto', 'solicitudes_repuesto', ['cita__vehiculo__placa', 'estado', 'solicitado_por__email', 'aprobado_por_asesor__email', 'created_at']),
  template('inventario', 'inventario_solicitudes_activas', 'Solicitudes de repuesto activas', 'solicitudes_repuesto_activas', ['cita__vehiculo__placa', 'estado', 'solicitado_por__email', 'updated_at']),
  template('inventario', 'inventario_solicitudes_revision_almacen', 'Solicitudes en revision de almacen', 'solicitudes_repuesto', ['cita__vehiculo__placa', 'solicitado_por__email', 'aprobado_por_asesor__email', 'updated_at'], { estado: 'EN_REVISION_ALMACEN' }),
  template('inventario', 'inventario_items_solicitud_pendientes', 'Items pendientes de entrega al taller', 'solicitudes_detalle_pendientes', ['solicitud__cita__vehiculo__placa', 'item_inventario__nombre', 'cantidad_aprobada', 'cantidad_entregada', 'estado', 'updated_at']),
]

export const REPORT_TEMPLATES = [
  ...globalTemplates,
  ...vehiculoTemplates,
  ...presupuestoTemplates,
  ...inventarioTemplates,
]

export const QUICK_AI_REPORTS = [
  {
    id: 'ingresos_mes',
    group: 'presupuesto',
    title: 'Ingresos del Mes',
    description: 'Total facturado por dia',
    iconKey: 'wallet',
    prompt: 'Cual es el total de ingresos agrupado por dia durante este mes en formato grafico de barras?',
  },
  {
    id: 'servicios_rentables',
    group: 'global',
    title: 'Servicios Rentables',
    description: 'Top 5 que mas generan',
    iconKey: 'trending',
    prompt: 'Cuales son los 5 servicios mas rentables del taller en el periodo actual?',
  },
  {
    id: 'citas_estado',
    group: 'global',
    title: 'Estado de Citas',
    description: 'Completadas, canceladas y pendientes',
    iconKey: 'calendar',
    prompt: 'Muestrame la cantidad de citas agrupadas por estado en un grafico circular.',
  },
  {
    id: 'top_clientes',
    group: 'global',
    title: 'Mejores Clientes',
    description: 'Clientes con mas visitas',
    iconKey: 'users',
    prompt: 'Lista los 5 clientes con mas citas finalizadas en el sistema.',
  },
]

const buildPrompt = (report) => {
  const base = `Quiero ver ${report.title.toLowerCase()}`
  if (report.group === 'global') return `${base} en formato tabla con detalle operativo.`
  if (report.group === 'vehiculo') return `${base} filtrado por placa del vehiculo en formato tabla.`
  if (report.group === 'presupuesto') return `${base} incluyendo estados, montos y pagos en formato tabla.`
  return `${base} incluyendo inventario, compras o solicitudes en formato tabla.`
}

export const IA_PROMPT_GROUPS = REPORT_GROUPS.map((group) => ({
  ...group,
  prompts: REPORT_TEMPLATES.filter((report) => report.group === group.id).map((report) => ({
    id: report.id,
    title: report.title,
    prompt: buildPrompt(report),
  })),
}))

export const REPORT_TEMPLATES_BY_GROUP = REPORT_GROUPS.reduce((acc, group) => {
  acc[group.id] = REPORT_TEMPLATES.filter((report) => report.group === group.id)
  return acc
}, {})

