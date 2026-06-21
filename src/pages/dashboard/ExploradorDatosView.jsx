import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CheckSquare,
  Database,
  Download,
  Filter,
  Loader2,
  Plus,
  Square,
  Table as TableIcon,
  X,
} from 'lucide-react';
import Plot from 'react-plotly.js';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Card } from '../../components/ui';
import apiClient from '../../services/apiClient';
import {
  EXPLORER_VIEWS,
  REPORT_GROUPS,
  REPORT_TEMPLATES_BY_GROUP,
} from './reportCatalog';

const FILTER_OPERATORS = [
  { value: 'eq', label: 'Es igual a' },
  { value: 'contains', label: 'Contiene' },
  { value: 'gt', label: 'Mayor que' },
  { value: 'gte', label: 'Mayor o igual' },
  { value: 'lt', label: 'Menor que' },
  { value: 'lte', label: 'Menor o igual' },
  { value: 'in', label: 'Esta en lista' },
  { value: 'isnull', label: 'Es nulo' },
];

const parseFilterValue = (value, operator) => {
  if (operator === 'isnull') {
    return String(value).toLowerCase() === 'true';
  }

  if (operator === 'in') {
    return String(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        if (item.toLowerCase() === 'true') return true;
        if (item.toLowerCase() === 'false') return false;
        if (item.toLowerCase() === 'null') return null;
        if (!Number.isNaN(Number(item)) && item !== '') return Number(item);
        return item;
      });
  }

  if (String(value).toLowerCase() === 'true') return true;
  if (String(value).toLowerCase() === 'false') return false;
  if (String(value).toLowerCase() === 'null') return null;
  if (!Number.isNaN(Number(value)) && String(value).trim() !== '') return Number(value);
  return String(value).trim();
};

const buildUserFilters = (filters) =>
  filters.reduce((acc, filter) => {
    if (!filter.field) return acc;
    if (filter.operator !== 'isnull' && String(filter.value || '').trim() === '') return acc;

    const suffixMap = {
      eq: '',
      contains: '__icontains',
      gt: '__gt',
      gte: '__gte',
      lt: '__lt',
      lte: '__lte',
      in: '__in',
      isnull: '__isnull',
    };

    const key = `${filter.field}${suffixMap[filter.operator] || ''}`;
    acc[key] = parseFilterValue(filter.value, filter.operator);
    return acc;
  }, {});

const isNumericValue = (value) => {
  if (value === null || value === undefined || value === '') return false;
  return !Number.isNaN(Number(value));
};

const buildChartConfig = (rows) => {
  if (!rows?.length) return null;

  const keys = Object.keys(rows[0] || {});
  if (keys.length < 2) return null;

  const labelKey = keys.find((key) => rows.some((row) => !isNumericValue(row[key])));
  const valueKey = keys.find(
    (key) => key !== labelKey && rows.some((row) => isNumericValue(row[key])),
  );

  if (!labelKey || !valueKey) return null;

  const labels = rows.map((row) => String(row[labelKey] ?? '-'));
  const values = rows.map((row) => Number(row[valueKey] ?? 0));

  return {
    bar: {
      data: [
        {
          type: 'bar',
          x: labels,
          y: values,
          marker: {
            color: '#ef4444',
            line: { color: '#7f1d1d', width: 1 },
          },
          hovertemplate: `%{x}<br>%{y}<extra></extra>`,
        },
      ],
      layout: {
        title: `${labelKey.replace(/_/g, ' ')} vs ${valueKey.replace(/_/g, ' ')}`,
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        margin: { t: 48, r: 20, l: 48, b: 80 },
      },
    },
    pie: {
      data: [
        {
          type: 'pie',
          labels,
          values,
          hole: 0.45,
          marker: {
            colors: ['#ef4444', '#f97316', '#eab308', '#10b981', '#3b82f6', '#8b5cf6'],
          },
        },
      ],
      layout: {
        title: `Distribucion por ${labelKey.replace(/_/g, ' ')}`,
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        margin: { t: 48, r: 20, l: 20, b: 20 },
      },
    },
  };
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const buildTableHtml = (rows) => {
  if (!rows?.length) return '<table><tr><td>Sin datos</td></tr></table>';
  const headers = Object.keys(rows[0]);
  let html = '<table border="1" cellspacing="0" cellpadding="6"><thead><tr>';
  headers.forEach((header) => {
    html += `<th>${header.replace(/_/g, ' ')}</th>`;
  });
  html += '</tr></thead><tbody>';
  rows.forEach((row) => {
    html += '<tr>';
    headers.forEach((header) => {
      html += `<td>${row[header] ?? '-'}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  return html;
};

const createEmptyFilter = (defaultField = '') => ({
  field: defaultField,
  operator: 'eq',
  value: '',
});

const exportRows = (rows, format, title) => {
  if (!rows?.length) return;

  const baseName = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;

  if (format === 'excel') {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSX.writeFile(wb, `${baseName}.xlsx`);
    return;
  }

  if (format === 'csv') {
    const ws = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${baseName}.csv`);
    return;
  }

  const tableHtml = buildTableHtml(rows);

  if (format === 'html') {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${baseName}</title></head><body>${tableHtml}</body></html>`;
    downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8;' }), `${baseName}.html`);
    return;
  }

  if (format === 'word') {
    const doc = `<!doctype html><html><head><meta charset="utf-8"></head><body>${tableHtml}</body></html>`;
    downloadBlob(new Blob([doc], { type: 'application/msword' }), `${baseName}.doc`);
    return;
  }

  if (format === 'pdf') {
    const pdf = new jsPDF({ orientation: 'landscape' });
    const headers = Object.keys(rows[0] || {});
    let y = 12;
    pdf.setFontSize(12);
    pdf.text(baseName, 14, y);
    y += 8;
    pdf.setFontSize(8);
    pdf.text(headers.join(' | '), 14, y);
    y += 6;
    rows.forEach((row) => {
      const line = headers.map((key) => String(row[key] ?? '-')).join(' | ');
      const wrapped = pdf.splitTextToSize(line, 270);
      pdf.text(wrapped, 14, y);
      y += wrapped.length * 4 + 1;
      if (y > 190) {
        pdf.addPage();
        y = 12;
      }
    });
    pdf.save(`${baseName}.pdf`);
  }
};

const ExploradorDatosView = ({ tenantSlug }) => {
  const [selectedGroup, setSelectedGroup] = useState(REPORT_GROUPS[0]?.id || 'global');
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    REPORT_TEMPLATES_BY_GROUP[REPORT_GROUPS[0]?.id || 'global']?.[0]?.id || '',
  );
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [filters, setFilters] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultMeta, setResultMeta] = useState(null);
  const [viewMode, setViewMode] = useState('table');

  const templates = useMemo(
    () => REPORT_TEMPLATES_BY_GROUP[selectedGroup] || [],
    [selectedGroup],
  );

  const currentTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) || templates[0] || null,
    [selectedTemplateId, templates],
  );

  const currentView = currentTemplate ? EXPLORER_VIEWS[currentTemplate.view] : null;
  const availableColumns = currentView?.columns || [];
  const chartConfig = useMemo(() => buildChartConfig(rows), [rows]);

  useEffect(() => {
    const groupTemplates = REPORT_TEMPLATES_BY_GROUP[selectedGroup] || [];
    if (!groupTemplates.length) return;
    setSelectedTemplateId(groupTemplates[0].id);
  }, [selectedGroup]);

  useEffect(() => {
    if (!currentTemplate) return;
    setSelectedColumns(currentTemplate.selectedColumns);
    setFilters([createEmptyFilter(currentTemplate.selectedColumns[0] || availableColumns[0] || '')]);
    setRows([]);
    setResultMeta(null);
    setError('');
    setViewMode('table');
  }, [currentTemplate, availableColumns]);

  const handleToggleColumn = (column) => {
    setSelectedColumns((prev) => {
      if (prev.includes(column)) {
        return prev.filter((item) => item !== column);
      }
      return [...prev, column];
    });
  };

  const handleFilterChange = (index, patch) => {
    setFilters((prev) =>
      prev.map((filter, currentIndex) =>
        currentIndex === index ? { ...filter, ...patch } : filter,
      ),
    );
  };

  const handleAddFilter = () => {
    setFilters((prev) => [...prev, createEmptyFilter(availableColumns[0] || '')]);
  };

  const handleRemoveFilter = (index) => {
    setFilters((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleGenerate = async () => {
    if (!currentTemplate || !selectedColumns.length) {
      setError('Selecciona al menos una columna para generar el reporte.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const mergedFilters = {
        ...(currentTemplate.defaultFilters || {}),
        ...buildUserFilters(filters),
      };

      const params = new URLSearchParams({
        vista: currentTemplate.view,
        columnas: selectedColumns.join(','),
        filtros: JSON.stringify(mergedFilters),
      });

      const response = await apiClient.get(
        `/api/${tenantSlug}/comunicacion-control/reportes/explorador_datos/?${params.toString()}`,
      );

      const resultados = response.data?.resultados || [];
      setRows(resultados);
      setResultMeta({
        title: currentTemplate.title,
        description: currentTemplate.description,
        total: resultados.length,
      });

      if (buildChartConfig(resultados)) {
        setViewMode('chart');
      } else {
        setViewMode('table');
      }
    } catch (requestError) {
      setRows([]);
      setResultMeta(null);
      setError(requestError.response?.data?.error || 'No se pudo generar el reporte.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 sm:p-8 rounded-[2rem] border-neutral-200 dark:border-white/[0.06] shadow-xl bg-white dark:bg-carbon-900">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
            <Database className="text-red-500" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-carbon-900 dark:text-white">
              Reportes Personalizados
            </h2>
            <p className="text-carbon-500 dark:text-neutral-400">
              Disena reportes dinamicos usando vistas predefinidas, columnas y filtros combinables.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4 mb-6">
          {REPORT_GROUPS.map((group) => {
            const isActive = selectedGroup === group.id;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setSelectedGroup(group.id)}
                className={`text-left rounded-2xl border px-4 py-4 transition-all ${
                  isActive
                    ? 'border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30 shadow-sm'
                    : 'border-neutral-200 bg-white hover:border-red-200 dark:bg-carbon-950/40 dark:border-white/[0.06]'
                }`}
              >
                <div className="text-sm font-bold text-carbon-900 dark:text-white">
                  {group.shortLabel}
                </div>
                <div className="text-xs text-carbon-500 dark:text-neutral-400 mt-1">
                  {group.description}
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-carbon-700 dark:text-neutral-200 mb-2">
                Tipo de reporte
              </label>
              <select
                value={currentTemplate?.id || ''}
                onChange={(event) => setSelectedTemplateId(event.target.value)}
                className="w-full rounded-2xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-carbon-950 px-4 py-3 text-sm text-carbon-900 dark:text-white outline-none focus:border-red-400"
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.title}
                  </option>
                ))}
              </select>
              {currentTemplate?.description && (
                <p className="text-xs text-carbon-500 dark:text-neutral-400 mt-2">
                  {currentTemplate.description}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-carbon-700 dark:text-neutral-200">
                  Columnas visibles
                </label>
                <span className="text-xs text-carbon-500 dark:text-neutral-400">
                  {selectedColumns.length} seleccionadas
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableColumns.map((column) => {
                  const active = selectedColumns.includes(column);
                  return (
                    <button
                      key={column}
                      type="button"
                      onClick={() => handleToggleColumn(column)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-all ${
                        active
                          ? 'border-red-300 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
                          : 'border-neutral-200 text-carbon-600 hover:border-red-200 dark:border-white/[0.08] dark:text-neutral-300'
                      }`}
                    >
                      {active ? <CheckSquare size={16} /> : <Square size={16} />}
                      {column}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-neutral-200 dark:border-white/[0.06] bg-neutral-50/70 dark:bg-carbon-950/40 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-red-500" />
                <h3 className="font-semibold text-carbon-900 dark:text-white">Filtros</h3>
              </div>
              <button
                type="button"
                onClick={handleAddFilter}
                className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20"
              >
                <Plus size={16} />
                Anadir filtro
              </button>
            </div>

            <div className="space-y-3">
              {filters.map((filter, index) => (
                <div key={`${filter.field}-${index}`} className="grid gap-3 md:grid-cols-[1.3fr_1fr_1.2fr_auto]">
                  <select
                    value={filter.field}
                    onChange={(event) => handleFilterChange(index, { field: event.target.value })}
                    className="rounded-2xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-carbon-900 px-3 py-3 text-sm"
                  >
                    {availableColumns.map((column) => (
                      <option key={column} value={column}>
                        {column}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filter.operator}
                    onChange={(event) => handleFilterChange(index, { operator: event.target.value })}
                    className="rounded-2xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-carbon-900 px-3 py-3 text-sm"
                  >
                    {FILTER_OPERATORS.map((operator) => (
                      <option key={operator.value} value={operator.value}>
                        {operator.label}
                      </option>
                    ))}
                  </select>

                  <input
                    value={filter.value}
                    onChange={(event) => handleFilterChange(index, { value: event.target.value })}
                    placeholder={filter.operator === 'in' ? 'valor1, valor2, valor3' : 'Valor'}
                    className="rounded-2xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-carbon-900 px-3 py-3 text-sm"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveFilter(index)}
                    disabled={filters.length === 1}
                    className="rounded-2xl border border-neutral-200 dark:border-white/[0.08] px-3 py-3 text-carbon-500 hover:text-red-500 disabled:opacity-40"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !selectedColumns.length}
            className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
            Generar consulta
          </button>
        </div>
      </Card>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      {resultMeta && (
        <Card className="p-6 rounded-[2rem] border-neutral-200 dark:border-white/[0.06] shadow-xl bg-white dark:bg-carbon-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-5">
            <div>
              <h3 className="text-xl font-bold text-carbon-900 dark:text-white">
                {resultMeta.title}
              </h3>
              <p className="text-sm text-carbon-500 dark:text-neutral-400">
                {resultMeta.total} registros encontrados
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-2xl border border-neutral-200 dark:border-white/[0.08] bg-neutral-50 dark:bg-carbon-950/40 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
                    viewMode === 'table'
                      ? 'bg-white text-red-600 shadow-sm dark:bg-carbon-900'
                      : 'text-carbon-500 dark:text-neutral-400'
                  }`}
                >
                  <TableIcon size={16} />
                  Tabla
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('chart')}
                  disabled={!chartConfig}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
                    viewMode === 'chart'
                      ? 'bg-white text-red-600 shadow-sm dark:bg-carbon-900'
                      : 'text-carbon-500 dark:text-neutral-400'
                  } ${!chartConfig ? 'opacity-40' : ''}`}
                >
                  <BarChart3 size={16} />
                  Grafico
                </button>
              </div>

              {['pdf', 'word', 'html', 'csv', 'excel'].map((format) => (
                <button
                  key={format}
                  type="button"
                  onClick={() => exportRows(rows, format, resultMeta.title)}
                  className="inline-flex items-center gap-2 rounded-xl bg-carbon-900 px-4 py-2 text-sm font-semibold text-white hover:bg-carbon-800 dark:bg-white dark:text-carbon-900"
                >
                  <Download size={15} />
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {viewMode === 'chart' && chartConfig ? (
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-3xl border border-neutral-200 dark:border-white/[0.06] p-4">
                <Plot
                  data={chartConfig.bar.data}
                  layout={chartConfig.bar.layout}
                  config={{ responsive: true, displayModeBar: false }}
                  className="w-full h-[420px]"
                />
              </div>
              <div className="rounded-3xl border border-neutral-200 dark:border-white/[0.06] p-4">
                <Plot
                  data={chartConfig.pie.data}
                  layout={chartConfig.pie.layout}
                  config={{ responsive: true, displayModeBar: false }}
                  className="w-full h-[420px]"
                />
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-neutral-200 dark:border-white/[0.06]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-neutral-50 dark:bg-carbon-950/50">
                  <tr>
                    {selectedColumns.map((column) => (
                      <th
                        key={column}
                        className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-carbon-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-white/[0.06]"
                      >
                        {column.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length ? (
                    rows.map((row, index) => (
                      <tr
                        key={`${index}-${Object.values(row).join('-')}`}
                        className="border-b border-neutral-100 dark:border-white/[0.03] hover:bg-neutral-50/70 dark:hover:bg-white/[0.02]"
                      >
                        {selectedColumns.map((column) => (
                          <td key={`${index}-${column}`} className="px-4 py-3 text-sm text-carbon-700 dark:text-neutral-300">
                            {row[column] !== null && row[column] !== undefined ? String(row[column]) : '-'}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={selectedColumns.length || 1}
                        className="px-4 py-10 text-center text-carbon-500 dark:text-neutral-400"
                      >
                        Sin datos para mostrar con la configuracion actual.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default ExploradorDatosView;
