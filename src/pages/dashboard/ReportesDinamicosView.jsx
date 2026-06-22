import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart2,
  CalendarCheck,
  CircleHelp,
  Database,
  Download,
  Loader2,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Table as TableIcon,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import Plot from 'react-plotly.js';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Card, Modal } from '../../components/ui';
import apiClient from '../../services/apiClient';
import assistantService from '../../services/assistantService';
import ExploradorDatosView from './ExploradorDatosView';
import {
  IA_PROMPT_GROUPS,
  QUICK_AI_REPORTS,
  REPORT_GROUPS,
} from './reportCatalog';

const QUICK_ICON_MAP = {
  wallet: Wallet,
  trending: TrendingUp,
  calendar: CalendarCheck,
  users: Users,
};

const GROUP_STYLES = {
  global: {
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300',
    card: 'from-slate-50 to-white dark:from-slate-500/10 dark:to-transparent',
    border: 'border-slate-200 dark:border-slate-500/20',
  },
  vehiculo: {
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
    card: 'from-blue-50 to-white dark:from-blue-500/10 dark:to-transparent',
    border: 'border-blue-200 dark:border-blue-500/20',
  },
  presupuesto: {
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    card: 'from-emerald-50 to-white dark:from-emerald-500/10 dark:to-transparent',
    border: 'border-emerald-200 dark:border-emerald-500/20',
  },
  inventario: {
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    card: 'from-amber-50 to-white dark:from-amber-500/10 dark:to-transparent',
    border: 'border-amber-200 dark:border-amber-500/20',
  },
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const buildTableHtml = (rows) => {
  if (!rows?.length) return '<table><tr><td>Sin datos</td></tr></table>';
  const keys = Object.keys(rows[0]);
  let html = '<table border="1" cellspacing="0" cellpadding="6"><thead><tr>';
  keys.forEach((key) => {
    html += `<th>${String(key).replace(/_/g, ' ')}</th>`;
  });
  html += '</tr></thead><tbody>';
  rows.forEach((row) => {
    html += '<tr>';
    keys.forEach((key) => {
      html += `<td>${row[key] ?? '-'}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  return html;
};

const isNumericValue = (value) => {
  if (value === null || value === undefined || value === '') return false;
  return !Number.isNaN(Number(value));
};

const buildChartVariants = (result) => {
  const rows = result?.data || [];
  if (!rows.length) {
    return {
      bar: result?.plotly_fig || null,
      pie: result?.plotly_fig?.data?.[0]?.type === 'pie' ? result.plotly_fig : null,
    };
  }

  const keys = Object.keys(rows[0] || {});
  if (keys.length < 2) {
    return {
      bar: result?.plotly_fig || null,
      pie: result?.plotly_fig?.data?.[0]?.type === 'pie' ? result.plotly_fig : null,
    };
  }

  const labelKey = keys.find((key) => rows.some((row) => !isNumericValue(row[key])));
  const valueKey = keys.find(
    (key) => key !== labelKey && rows.some((row) => isNumericValue(row[key])),
  );

  if (!labelKey || !valueKey) {
    return {
      bar: result?.plotly_fig || null,
      pie: result?.plotly_fig?.data?.[0]?.type === 'pie' ? result.plotly_fig : null,
    };
  }

  const labels = rows.map((row) => String(row[labelKey] ?? '-'));
  const values = rows.map((row) => Number(row[valueKey] ?? 0));
  const commonTitle = `${labelKey.replace(/_/g, ' ')} vs ${valueKey.replace(/_/g, ' ')}`;

  return {
    bar: {
      data: [
        {
          type: 'bar',
          x: labels,
          y: values,
          marker: {
            color: '#ef4444',
            line: { color: '#991b1b', width: 1 },
          },
          hovertemplate: `%{x}<br>%{y}<extra></extra>`,
        },
      ],
      layout: {
        title: commonTitle,
        autosize: true,
        margin: { t: 48, r: 20, l: 50, b: 70 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: { family: 'Inter, sans-serif', color: '#888' },
      },
    },
    pie: {
      data: [
        {
          type: 'pie',
          labels,
          values,
          hole: 0.38,
          marker: {
            colors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'],
          },
        },
      ],
      layout: {
        title: `Distribucion de ${labelKey.replace(/_/g, ' ')}`,
        autosize: true,
        margin: { t: 48, r: 20, l: 20, b: 20 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: { family: 'Inter, sans-serif', color: '#888' },
      },
    },
  };
};

export const ReportesDinamicosView = ({ tenantSlug }) => {
  const [mainMode, setMainMode] = useState('clasico');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('bar');
  const [isListening, setIsListening] = useState(false);
  const [showPromptHelp, setShowPromptHelp] = useState(false);
  const recognitionRef = useRef(null);
  const transcriptBufferRef = useRef('');
  const interimTranscriptRef = useRef('');
  const stopRequestedRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const quickReports = useMemo(() => QUICK_AI_REPORTS, []);
  const chartVariants = useMemo(() => buildChartVariants(result), [result]);

  const triggerAsk = async (textToAsk) => {
    if (!textToAsk.trim()) return;

    setPrompt(textToAsk);
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await apiClient.post(`/api/${tenantSlug}/comunicacion-control/reportes-ia/ask/`, {
        prompt: textToAsk,
      });

      setResult(res.data);
      if (!res.data.plotly_fig && res.data.data && res.data.data.length > 0) {
        setViewMode('data');
      } else {
        setViewMode('bar');
      }
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError.response?.data?.error || 'Ocurrio un error al procesar tu solicitud con la IA.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = (event) => {
    event.preventDefault();
    if (isListening) {
      stopListening();
    }
    triggerAsk(prompt);
  };

  const ensureRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return null;
    }

    if (recognitionRef.current) return recognitionRef.current;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      transcriptBufferRef.current = '';
      interimTranscriptRef.current = '';
      stopRequestedRef.current = false;
      setIsListening(true);
      setError('');
    };
    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const part = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) finalText += part;
        else interimText += part;
      }
      if (finalText) {
        transcriptBufferRef.current = `${transcriptBufferRef.current} ${finalText}`.trim();
      }
      interimTranscriptRef.current = interimText.trim();
    };
    recognition.onerror = async (event) => {
      setIsListening(false);
      if (stopRequestedRef.current || event?.error === 'aborted' || event?.error === 'no-speech') {
        return;
      }
      const canUseRecorder = !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
      if (canUseRecorder) {
        startAudioRecordingFallback();
        return;
      }
      if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
        setError('Permiso de microfono denegado. Habilitalo en el navegador.');
        return;
      }
      setError(`No se pudo capturar el audio (${event?.error || 'desconocido'}).`);
    };
    recognition.onend = () => {
      setIsListening(false);
      const text = `${transcriptBufferRef.current} ${interimTranscriptRef.current}`.trim();
      if (text) setPrompt(text);
      transcriptBufferRef.current = '';
      interimTranscriptRef.current = '';
      stopRequestedRef.current = false;
    };

    recognitionRef.current = recognition;
    return recognition;
  };

  const startListening = () => {
    const canUseRecorder = !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
    if (canUseRecorder) {
      startAudioRecordingFallback();
      return;
    }
    const recognition = ensureRecognition();
    if (!recognition) {
      setError('Tu navegador no soporta grabacion de voz.');
      return;
    }
    setError('');
    try {
      recognition.start();
    } catch (err) {
      if (!String(err?.message || '').toLowerCase().includes('already started')) {
        setError('No se pudo iniciar la grabacion.');
      }
    }
  };

  const stopListening = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      stopAudioRecordingFallback();
      return;
    }
    if (recognitionRef.current) {
      stopRequestedRef.current = true;
      recognitionRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      return;
    }
    startListening();
  };

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startAudioRecordingFallback = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: mediaRecorder.mimeType || 'audio/webm',
          });
          if (audioBlob.size === 0) return;
          const res = await assistantService.transcribeAudio(tenantSlug, audioBlob);
          const text = (res?.text || res?.texto || '').trim();
          if (text) {
            setPrompt(text);
            setError('');
          } else {
            setError('No se detecto texto en el audio. Habla mas cerca del microfono e intenta de nuevo.');
          }
        } catch (requestError) {
          setError(requestError?.response?.data?.error || 'No se pudo transcribir el audio.');
        } finally {
          setIsListening(false);
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      setError('');
      setIsListening(true);
      mediaRecorder.start();
    } catch (requestError) {
      setError('No se pudo acceder al microfono.');
    }
  };

  const stopAudioRecordingFallback = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recorder.state !== 'inactive') {
      recorder.stop();
    } else {
      setIsListening(false);
    }
  };

  const handleExport = (format) => {
    const rows = result?.data || [];
    if (!rows.length) return;
    const baseName = `Reporte_IA_${new Date().toISOString().split('T')[0]}`;

    if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'ReporteIA');
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
      const doc = `<!doctype html><html><head><meta charset="utf-8"><title>${baseName}</title></head><body>${tableHtml}</body></html>`;
      downloadBlob(new Blob([doc], { type: 'text/html;charset=utf-8;' }), `${baseName}.html`);
      return;
    }
    if (format === 'word') {
      const doc = `<!doctype html><html><head><meta charset="utf-8"></head><body>${tableHtml}</body></html>`;
      downloadBlob(new Blob([doc], { type: 'application/msword' }), `${baseName}.doc`);
      return;
    }
    if (format === 'pdf') {
      const doc = new jsPDF({ orientation: 'landscape' });
      const keys = Object.keys(rows[0] || {});
      let y = 12;
      doc.setFontSize(12);
      doc.text(baseName, 14, y);
      y += 8;
      doc.setFontSize(8);
      doc.text(keys.join(' | '), 14, y);
      y += 6;
      rows.forEach((row) => {
        const line = keys.map((key) => String(row[key] ?? '-')).join(' | ');
        const wrapped = doc.splitTextToSize(line, 270);
        doc.text(wrapped, 14, y);
        y += wrapped.length * 4 + 1;
        if (y > 190) {
          doc.addPage();
          y = 12;
        }
      });
      doc.save(`${baseName}.pdf`);
    }
  };

  const exportOptions = ['pdf', 'word', 'html', 'csv', 'excel'];
  const hasData = result && result.data && result.data.length > 0;
  const hasBarChart = !!chartVariants?.bar;
  const hasPieChart = !!chartVariants?.pie;

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex bg-neutral-100 dark:bg-carbon-800 p-1.5 rounded-2xl w-fit mx-auto mb-8">
        <button
          onClick={() => setMainMode('clasico')}
          className={`px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all duration-300 ${
            mainMode === 'clasico'
              ? 'bg-white shadow-md dark:bg-carbon-900 text-emerald-500 scale-105'
              : 'text-carbon-500 dark:text-neutral-400 hover:text-carbon-700 dark:hover:text-neutral-200'
          }`}
        >
          <BarChart2 size={20} />
          Reportes Personalizados
        </button>
        <button
          onClick={() => setMainMode('ia')}
          className={`px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all duration-300 ${
            mainMode === 'ia'
              ? 'bg-gradient-to-r from-primary-500 to-indigo-500 text-white shadow-lg shadow-primary-500/30 scale-105'
              : 'text-carbon-500 dark:text-neutral-400 hover:text-carbon-700 dark:hover:text-neutral-200'
          }`}
        >
          <Sparkles size={20} />
          Reportes con IA
        </button>
      </div>

      {mainMode === 'clasico' ? (
        <div className="animate-in fade-in zoom-in-95 duration-300">
          <ExploradorDatosView tenantSlug={tenantSlug} />
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-carbon-900 dark:text-white mb-2 tracking-tight flex items-center gap-3">
                <Sparkles className="text-primary-500" size={32} />
                Reportes con IA
                <button
                  type="button"
                  onClick={() => setShowPromptHelp(true)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white dark:bg-carbon-900 border border-neutral-200 dark:border-white/[0.08] text-carbon-500 hover:text-primary-500 hover:border-primary-300 transition-colors"
                  title="Ver ejemplos de reportes"
                >
                  <CircleHelp size={18} />
                </button>
              </h1>
              <p className="text-carbon-500 dark:text-neutral-400 text-lg">
                Consulta tu base de datos con lenguaje natural y manteniendo los reportes clasificados por tipo.
              </p>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-indigo-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-500" />
            <form
              onSubmit={handleAsk}
              className="relative flex items-center bg-white dark:bg-carbon-900 rounded-3xl p-2 shadow-xl border border-neutral-100 dark:border-white/[0.05]"
            >
              <div className="pl-4">
                <Database className="text-primary-500" size={28} />
              </div>
              <input
                type="text"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                disabled={loading}
                placeholder="Escribe tu pregunta. Ej: Quiero ver pagos pendientes de presupuestos aprobados"
                className="w-full py-4 px-4 bg-transparent text-carbon-900 dark:text-white placeholder:text-carbon-400 dark:placeholder:text-neutral-600 outline-none text-lg"
              />
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="mr-2 shrink-0 p-3.5 bg-primary-500 hover:bg-primary-600 disabled:bg-carbon-200 dark:disabled:bg-carbon-800 text-white rounded-2xl transition-all shadow-md flex items-center justify-center min-w-[56px]"
              >
                {loading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
              </button>
              <button
                type="button"
                onClick={toggleListening}
                disabled={loading}
                title={isListening ? 'Detener grabacion' : 'Grabar por voz'}
                className={`mr-2 shrink-0 p-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center min-w-[56px] ${
                  isListening
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-carbon-800 dark:hover:bg-carbon-700 text-carbon-700 dark:text-neutral-200'
                }`}
              >
                {isListening ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
            </form>
          </div>

          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-bold text-carbon-900 dark:text-white mb-1">
                Reportes rapidos
              </h2>
              <p className="text-sm text-carbon-500 dark:text-neutral-400">
                Accesos directos a consultas frecuentes. La clasificacion completa queda en el modal de ejemplos.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
              {quickReports.map((report) => {
                const style = GROUP_STYLES[report.group] || GROUP_STYLES.global;
                const Icon = QUICK_ICON_MAP[report.iconKey] || BarChart2;
                return (
                  <button
                    key={report.id}
                    type="button"
                    onClick={() => triggerAsk(report.prompt)}
                    className={`text-left rounded-[1.75rem] border bg-gradient-to-br ${style.card} ${style.border} p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-carbon-900 flex items-center justify-center shadow-sm mb-4">
                      <Icon size={24} className="text-primary-500" />
                    </div>
                    <h3 className="font-bold text-carbon-900 dark:text-white mb-1">
                      {report.title}
                    </h3>
                    <p className="text-sm text-carbon-500 dark:text-neutral-400">
                      {report.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="p-5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl animate-in fade-in flex items-center gap-3 shadow-sm">
              <div className="bg-red-100 dark:bg-red-500/20 p-2 rounded-full">
                <Database size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <p className="font-medium">{error}</p>
            </div>
          )}

          {result ? (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-700">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex bg-white dark:bg-carbon-900 p-1 rounded-2xl border border-neutral-200 dark:border-white/[0.06] shadow-sm">
                  <button
                    onClick={() => setViewMode('bar')}
                    disabled={!hasBarChart}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      viewMode === 'bar'
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300 shadow-sm'
                        : 'text-carbon-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-white/[0.02]'
                    } ${!hasBarChart ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <BarChart2 size={18} />
                    Grafico Barras
                  </button>
                  <button
                    onClick={() => setViewMode('pie')}
                    disabled={!hasPieChart}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      viewMode === 'pie'
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300 shadow-sm'
                        : 'text-carbon-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-white/[0.02]'
                    } ${!hasPieChart ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <BarChart2 size={18} />
                    Grafico Circular
                  </button>
                  <button
                    onClick={() => setViewMode('data')}
                    disabled={!hasData}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      viewMode === 'data'
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300 shadow-sm'
                        : 'text-carbon-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-white/[0.02]'
                    } ${!hasData ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <TableIcon size={18} />
                    Datos
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {exportOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleExport(opt)}
                      disabled={!hasData}
                      className="flex items-center gap-2 px-4 py-2.5 bg-carbon-900 hover:bg-carbon-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-carbon-900 rounded-xl transition-all text-sm font-semibold shadow-md disabled:opacity-50 disabled:shadow-none"
                    >
                      <Download size={16} />
                      {opt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <Card className="p-2 sm:p-6 bg-white dark:bg-carbon-900 shadow-xl border-neutral-200 dark:border-white/[0.05] rounded-[2rem] overflow-hidden">
                {viewMode === 'bar' && hasBarChart && (
                  <div className="w-full overflow-x-auto flex justify-center py-4">
                    <Plot
                      data={chartVariants.bar.data}
                      layout={chartVariants.bar.layout}
                      config={{ responsive: true, displayModeBar: false }}
                      className="w-full h-[450px]"
                    />
                  </div>
                )}

                {viewMode === 'pie' && hasPieChart && (
                  <div className="w-full overflow-x-auto flex justify-center py-4">
                    <Plot
                      data={chartVariants.pie.data}
                      layout={chartVariants.pie.layout}
                      config={{ responsive: true, displayModeBar: false }}
                      className="w-full h-[450px]"
                    />
                  </div>
                )}

                {viewMode === 'data' && hasData && (
                  <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-white/[0.06]">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-neutral-50 dark:bg-carbon-950/50 sticky top-0">
                        <tr>
                          {Object.keys(result.data[0]).map((key) => (
                            <th
                              key={key}
                              className="p-4 text-xs font-bold text-carbon-500 dark:text-neutral-400 uppercase tracking-wider border-b border-neutral-200 dark:border-white/[0.06]"
                            >
                              {key.replace(/_/g, ' ')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.data.map((row, rowIndex) => (
                          <tr
                            key={rowIndex}
                            className="border-b border-neutral-100 dark:border-white/[0.02] hover:bg-neutral-50/50 dark:hover:bg-white/[0.01] transition-colors"
                          >
                            {Object.values(row).map((val, valueIndex) => (
                              <td
                                key={valueIndex}
                                className="p-4 text-sm font-medium text-carbon-700 dark:text-neutral-300"
                              >
                                {val !== null && val !== undefined ? val.toString() : '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {!hasBarChart && !hasPieChart && !hasData && (
                  <div className="flex flex-col items-center justify-center py-16 text-carbon-400 dark:text-neutral-500">
                    <Database size={56} className="mb-4 opacity-30 text-carbon-300 dark:text-carbon-700" />
                    <p className="text-lg font-medium">No se encontraron datos para esta consulta.</p>
                  </div>
                )}
              </Card>

              <div className="bg-neutral-50 dark:bg-carbon-950/50 rounded-2xl border border-neutral-200 dark:border-white/[0.05] p-4">
                <details className="group">
                  <summary className="text-sm font-semibold text-carbon-500 dark:text-neutral-400 cursor-pointer list-none flex items-center gap-2">
                    <span className="bg-neutral-200 dark:bg-carbon-800 p-1 rounded-md group-open:rotate-90 transition-transform">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </span>
                    Ver consulta SQL generada
                  </summary>
                  <pre className="mt-4 p-4 bg-white dark:bg-carbon-900 border border-neutral-200 dark:border-white/[0.05] rounded-xl text-xs text-primary-600 dark:text-primary-400 overflow-x-auto font-mono shadow-inner">
                    {result.sql}
                  </pre>
                </details>
              </div>
            </div>
          ) : (
            !loading &&
            !error && (
              <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-1000">
                <div className="relative mb-6 group">
                  <div className="absolute inset-0 bg-primary-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 rounded-full" />
                  <div className="relative bg-white dark:bg-carbon-900 p-6 rounded-[2rem] shadow-xl border border-neutral-100 dark:border-white/[0.05]">
                    <BarChart2 size={64} className="text-primary-500" strokeWidth={1.5} />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-carbon-900 dark:text-white mb-2">
                  Que quieres analizar hoy?
                </h2>
                <p className="text-carbon-500 dark:text-neutral-400 text-center max-w-2xl">
                  Puedes usar las tarjetas rapidas por grupo o escribir una consulta libre. El boton de ayuda
                  muestra todos los tipos de reportes soportados en lenguaje natural.
                </p>
              </div>
            )
          )}
        </div>
      )}

      <Modal
        isOpen={showPromptHelp}
        onClose={() => setShowPromptHelp(false)}
        title="Ejemplos de reportes con IA"
        className="max-w-5xl w-full"
      >
        <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
          <p className="text-sm text-carbon-500 dark:text-neutral-400">
            Estos ejemplos no reemplazan la consulta libre. Sirven para que veas el tipo de reportes que la IA puede interpretar por grupo.
          </p>

          {IA_PROMPT_GROUPS.map((group) => {
            const style = GROUP_STYLES[group.id] || GROUP_STYLES.global;
            return (
              <section key={group.id} className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${style.badge}`}>
                    {group.label}
                  </span>
                  <span className="text-xs text-carbon-500 dark:text-neutral-400">
                    {group.prompts.length} ejemplos
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {group.prompts.map((promptItem) => (
                    <div
                      key={promptItem.id}
                      className={`rounded-2xl border bg-gradient-to-br ${style.card} ${style.border} p-4`}
                    >
                      <div className="font-semibold text-carbon-900 dark:text-white mb-2">
                        {promptItem.title}
                      </div>
                      <p className="text-sm text-carbon-600 dark:text-neutral-300 mb-4">
                        {promptItem.prompt}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setPrompt(promptItem.prompt);
                          setShowPromptHelp(false);
                        }}
                        className="inline-flex items-center rounded-xl bg-carbon-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-carbon-900"
                      >
                        Usar ejemplo
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};
