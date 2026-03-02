import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, Edit2, Check, X, Copy, Share2, FolderOpen, Save, Trash2, Download, FileText, Plus } from 'lucide-react';

interface Stage {
  id: string;
  name: string;
  value: number;
  conversion: number;
  growth: number;
  editable: boolean;
  newConversion?: number;
  forecast?: number;
}

interface Metrics {
  budget: number;
  avgCheck: number;
}

interface DashboardData {
  name: string;
  impressions: number;
  stages: Stage[];
  metrics: Metrics;
  updatedAt: string;
}

interface SavedDashboard extends DashboardData {
  id: string;
}

interface CalculatedMetricSet {
  budget: number;
  leadCost: number;
  applicationCost: number;
  clientCost: number;
  avgCheck: number;
  revenue: number;
  roas: number;
  cpm: number;
}

function MetricRow({ label, value, unit, highlight = false, forecast = false }: { label: string; value: number; unit: string; highlight?: boolean; forecast?: boolean }) {
  const formatValue = (val: number) => {
    if (unit === 'x') return val.toFixed(2);
    return new Intl.NumberFormat('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val);
  };

  return (
    <div className={`flex justify-between items-center ${highlight ? 'font-bold text-base' : 'text-sm'}`}>
      <span className="text-slate-600 font-medium">{label}</span>
      <span className={
        highlight
          ? (forecast ? 'text-emerald-600 font-black' : 'text-indigo-600 font-black')
          : 'text-slate-800 font-semibold'
      }>
        {formatValue(value)} {unit}
      </span>
    </div>
  );
}

const recalcConversions = (stages: Stage[], impressions: number): Stage[] => {
  return stages.map((s, i) => {
    const prevValue = i === 0 ? impressions : stages[i - 1].value;
    return { ...s, conversion: prevValue > 0 ? Math.round((s.value / prevValue) * 10000) / 100 : 0 };
  });
};

const defaultData = {
  name: 'Липень ТАРГЕТ',
  impressions: 913505,
  stages: [
    { id: 'clicks', name: 'Кліки', value: 7200, conversion: 0.79, growth: 0.5, editable: true },
    { id: 'leads', name: 'Ліди CRM', value: 1542, conversion: 21.42, growth: 0, editable: true },
    { id: 'webinar', name: 'Вебінар', value: 766, conversion: 49.68, growth: 0, editable: true },
    { id: 'applications', name: 'Заявки', value: 33, conversion: 4.31, growth: 0, editable: true },
    { id: 'payments', name: 'Оплати', value: 20, conversion: 60.61, growth: 0, editable: true }
  ] as Stage[],
  metrics: { budget: 106677, avgCheck: 15798 }
};

export default function FunnelCalculator() {
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [currentDashboard, setCurrentDashboard] = useState<string | null>(null);
  const [dashboards, setDashboards] = useState<SavedDashboard[]>([]);
  const [showDashboardList, setShowDashboardList] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [showAddStage, setShowAddStage] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStagePosition, setNewStagePosition] = useState(0);

  const [stages, setStages] = useState<Stage[]>(defaultData.stages);
  const [metrics, setMetrics] = useState<Metrics>(defaultData.metrics);
  const [impressions, setImpressions] = useState(defaultData.impressions);
  const [dashboardName, setDashboardName] = useState(defaultData.name);

  useEffect(() => { loadDashboards(); loadFromURL(); }, []);

  const loadDashboards = () => {
    try {
      const saved = localStorage.getItem('funnelDashboards');
      if (saved) setDashboards(JSON.parse(saved));
    } catch (e) {
      console.error('Error loading dashboards:', e);
    }
  };

  const loadFromURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedId = urlParams.get('id');
    if (sharedId) loadDashboard(sharedId);
  };

  const saveDashboard = () => {
    const id = currentDashboard || `dash_${Date.now()}`;
    const data: DashboardData = {
      name: dashboardName,
      impressions,
      stages,
      metrics,
      updatedAt: new Date().toISOString()
    };

    try {
      const saved = localStorage.getItem('funnelDashboards');
      const allDashboards = saved ? JSON.parse(saved) : [];
      const existing = allDashboards.findIndex((d: SavedDashboard) => d.id === id);
      
      if (existing >= 0) {
        allDashboards[existing] = { ...data, id };
      } else {
        allDashboards.push({ ...data, id });
      }
      
      localStorage.setItem('funnelDashboards', JSON.stringify(allDashboards));
      setCurrentDashboard(id);
      setSaveStatus('✅ Збережено');
      setTimeout(() => setSaveStatus(''), 2000);
      loadDashboards();
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('❌ Помилка');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  const loadDashboard = (id: string) => {
    try {
      const saved = localStorage.getItem('funnelDashboards');
      if (!saved) return;
      
      const allDashboards = JSON.parse(saved);
      const dashboard = allDashboards.find((d: SavedDashboard) => d.id === id);
      
      if (dashboard) {
        setDashboardName(dashboard.name);
        setImpressions(dashboard.impressions);
        setStages(dashboard.stages);
        setMetrics(dashboard.metrics);
        setCurrentDashboard(id);
        setShowDashboardList(false);
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const deleteDashboard = (id: string) => {
    if (!confirm('Видалити цей дашборд?')) return;
    
    try {
      const saved = localStorage.getItem('funnelDashboards');
      if (!saved) return;
      
      const allDashboards = JSON.parse(saved);
      const filtered = allDashboards.filter((d: SavedDashboard) => d.id !== id);
      localStorage.setItem('funnelDashboards', JSON.stringify(filtered));
      
      if (currentDashboard === id) {
        setCurrentDashboard(null);
        resetToDefault();
      }
      loadDashboards();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const duplicateDashboard = (id: string) => {
    try {
      const saved = localStorage.getItem('funnelDashboards');
      if (!saved) return;
      
      const allDashboards = JSON.parse(saved);
      const dashboard = allDashboards.find((d: SavedDashboard) => d.id === id);
      
      if (dashboard) {
        const newId = `dash_${Date.now()}`;
        const newDashboard = { ...dashboard, id: newId, name: `${dashboard.name} (копія)` };
        allDashboards.push(newDashboard);
        localStorage.setItem('funnelDashboards', JSON.stringify(allDashboards));
        loadDashboards();
      }
    } catch (error) {
      console.error('Duplicate error:', error);
    }
  };

  const createShareLink = () => {
    if (!currentDashboard) {
      alert('Спочатку збережіть дашборд');
      return;
    }
    const baseUrl = window.location.origin + window.location.pathname;
    const link = `${baseUrl}?id=${currentDashboard}`;
    setShareLink(link);
    setShowShareModal(true);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    alert('Посилання скопійовано!');
  };

  const resetToDefault = () => {
    setStages(defaultData.stages);
    setMetrics(defaultData.metrics);
    setImpressions(defaultData.impressions);
    setDashboardName(defaultData.name);
    setCurrentDashboard(null);
  };

  const clearAll = () => {
    setStages([
      { id: 'clicks', name: 'Кліки', value: 0, conversion: 0, growth: 0, editable: true },
      { id: 'leads', name: 'Ліди CRM', value: 0, conversion: 0, growth: 0, editable: true },
      { id: 'webinar', name: 'Вебінар', value: 0, conversion: 0, growth: 0, editable: true },
      { id: 'applications', name: 'Заявки', value: 0, conversion: 0, growth: 0, editable: true },
      { id: 'payments', name: 'Оплати', value: 0, conversion: 0, growth: 0, editable: true }
    ]);
    setMetrics({ budget: 0, avgCheck: 0 });
    setImpressions(0);
    setDashboardName('Новий дашборд');
    setCurrentDashboard(null);
  };

  const addStage = () => {
    const newStage: Stage = {
      id: `stage_${Date.now()}`,
      name: newStageName || 'Новий етап',
      value: 0,
      conversion: 0,
      growth: 0,
      editable: true
    };
    
    const newStages = [...stages];
    newStages.splice(newStagePosition, 0, newStage);
    setStages(newStages);
    setShowAddStage(false);
    setNewStageName('');
  };

  const removeStage = (id: string) => {
    if (stages.length <= 2) {
      alert('Має бути мінімум 2 етапи');
      return;
    }
    setStages(stages.filter(s => s.id !== id));
  };

  const calculateForecast = () => {
    const forecast = [...stages];

    forecast[0].newConversion = (forecast[0].conversion + forecast[0].growth) / 100;
    forecast[0].forecast = impressions * forecast[0].newConversion;

    for (let i = 1; i < forecast.length; i++) {
      forecast[i].newConversion = (forecast[i].conversion + forecast[i].growth) / 100;
      forecast[i].forecast = (forecast[i - 1].forecast || 0) * forecast[i].newConversion;
    }

    return forecast;
  };

  const forecastStages = calculateForecast();

  const calculateMetrics = (): { current: CalculatedMetricSet; forecast: CalculatedMetricSet } => {
    const forecastLeads        = forecastStages[1]?.forecast || 0;
    const forecastApplications = forecastStages[3]?.forecast || 0;
    const forecastPayments     = forecastStages[4]?.forecast || 0;

    const currentCPM   = impressions > 0 ? (metrics.budget / impressions) * 1000 : 0;
    const forecastBudget = metrics.budget;

    return {
      current: {
        budget: metrics.budget,
        leadCost: stages[1]?.value > 0 ? metrics.budget / stages[1].value : 0,
        applicationCost: stages[3]?.value > 0 ? metrics.budget / stages[3].value : 0,
        clientCost: stages[4]?.value > 0 ? metrics.budget / stages[4].value : 0,
        avgCheck: metrics.avgCheck,
        revenue: (stages[4]?.value || 0) * metrics.avgCheck,
        roas: metrics.budget > 0 ? ((stages[4]?.value || 0) * metrics.avgCheck) / metrics.budget : 0,
        cpm: currentCPM
      },
      forecast: {
        budget: forecastBudget,
        leadCost: forecastLeads > 0 ? forecastBudget / forecastLeads : 0,
        applicationCost: forecastApplications > 0 ? forecastBudget / forecastApplications : 0,
        clientCost: forecastPayments > 0 ? forecastBudget / forecastPayments : 0,
        avgCheck: metrics.avgCheck,
        revenue: forecastPayments * metrics.avgCheck,
        roas: forecastBudget > 0 ? (forecastPayments * metrics.avgCheck) / forecastBudget : 0,
        cpm: currentCPM
      }
    };
  };

  const calculatedMetrics = calculateMetrics();

  const startEditing = (stageId: string, currentName: string) => {
    setEditingStage(stageId);
    setTempName(currentName);
  };

  const saveEdit = (stageId: string) => {
    setStages(stages.map(s => 
      s.id === stageId ? { ...s, name: tempName } : s
    ));
    setEditingStage(null);
  };

  const cancelEdit = () => {
    setEditingStage(null);
    setTempName('');
  };

  const updateStageValue = (stageId: string, field: keyof Stage, value: string) => {
    setStages(stages.map(s => 
      s.id === stageId ? { ...s, [field]: parseFloat(value) || 0 } : s
    ));
  };

  const updateMetric = (field: keyof Metrics, value: string) => {
    setMetrics({ ...metrics, [field]: parseFloat(value) || 0 });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('uk-UA', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 2 
    }).format(num);
  };

  const exportToExcel = () => {
    alert('Експорт в Excel - в розробці');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Хедер */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-indigo-100/50 p-6 md:p-8 mb-6 border border-white/60">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 tracking-tight">
              MARKETING ARCHITECTURE FRAMEWORK
            </h1>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                <Calculator className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <input
                type="text"
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                className="text-2xl md:text-3xl font-bold text-slate-800 bg-transparent border-b-2 border-transparent hover:border-indigo-200 focus:border-indigo-500 focus:outline-none px-2 py-1 w-full transition-colors"
                placeholder="Назва дашборду"
              />
            </div>
            {saveStatus && (
              <span className="text-sm font-medium px-3 py-1 bg-green-100 text-green-700 rounded-full">
                {saveStatus}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={saveDashboard}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-200/50"
            >
              <Save className="w-4 h-4" />
              Зберегти
            </button>
            
            <button
              onClick={() => setShowDashboardList(!showDashboardList)}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all text-sm font-semibold flex items-center gap-2 shadow-lg shadow-purple-200/50"
            >
              <FolderOpen className="w-4 h-4" />
              Дашборди ({dashboards.length})
            </button>

            <button
              onClick={exportToExcel}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl transition-all text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-200/50"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>

            <button
              onClick={exportToExcel}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl transition-all text-sm font-semibold flex items-center gap-2 shadow-lg shadow-orange-200/50"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>

            <button
              onClick={resetToDefault}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl transition-all text-sm font-semibold shadow-lg shadow-blue-200/50"
            >
              Приклад
            </button>
            
            <button
              onClick={clearAll}
              className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-all text-sm font-semibold"
            >
              Очистити
            </button>
          </div>
        </div>

        {/* Список дашбордів */}
        {showDashboardList && (
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg md:text-xl font-bold text-gray-800">Збережені дашборди</h3>
              <button
                onClick={() => setShowDashboardList(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {dashboards.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Немає збережених дашбордів. Створіть перший!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboards.map((dash) => (
                  <div key={dash.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    <h4 className="font-semibold text-gray-800 mb-2 truncate">{dash.name}</h4>
                    <p className="text-sm text-gray-500 mb-3">
                      {dash.updatedAt ? new Date(dash.updatedAt).toLocaleDateString('uk-UA') : 'Новий'}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadDashboard(dash.id)}
                        className="flex-1 px-3 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded text-sm font-medium"
                      >
                        Відкрити
                      </button>
                      <button
                        onClick={() => duplicateDashboard(dash.id)}
                        className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm"
                        title="Копіювати"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteDashboard(dash.id)}
                        className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm"
                        title="Видалити"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Модальне вікно розшарення */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-white/20 rounded-xl shadow-2xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white uppercase tracking-wider">Поділитися</h3>
                <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-gray-300 mb-4">
                Скопіюйте це посилання та поділіться ним.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-black/40 border border-white/20 rounded-lg text-white text-sm"
                />
                <button
                  onClick={copyShareLink}
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg flex items-center gap-2 flex-shrink-0"
                >
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">Копіювати</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Модальне вікно додавання етапу */}
        {showAddStage && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-white/20 rounded-xl shadow-2xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white uppercase tracking-wider">Додати етап</h3>
                <button onClick={() => setShowAddStage(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-300 block mb-2">Назва етапу</label>
                  <input
                    type="text"
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded-lg text-white"
                    placeholder="Назва нового етапу"
                  />
                </div>
                <div>
                  <label className="text-gray-300 block mb-2">Позиція</label>
                  <select
                    value={newStagePosition}
                    onChange={(e) => setNewStagePosition(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded-lg text-white"
                  >
                    {stages.map((_, index) => (
                      <option key={index} value={index}>Перед {stages[index].name}</option>
                    ))}
                    <option value={stages.length}>В кінці</option>
                  </select>
                </div>
                <button
                  onClick={addStage}
                  className="w-full px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium"
                >
                  Додати
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Основний калькулятор */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-indigo-100/50 p-6 md:p-10 mb-8 border border-white/60">
          {/* Воронка */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 mb-10">
            {/* Поточна воронка */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  Воронка поточна
                </h2>
                <button
                  onClick={() => setShowAddStage(true)}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Етап</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {stages.map((stage) => (
                  <div key={stage.id} className="group bg-gradient-to-br from-slate-50 to-blue-50/50 hover:from-white hover:to-indigo-50 p-4 rounded-2xl border-2 border-slate-200/60 hover:border-indigo-300 transition-all shadow-sm hover:shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {editingStage === stage.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={tempName}
                              onChange={(e) => setTempName(e.target.value)}
                              className="px-3 py-1.5 bg-white border-2 border-indigo-400 rounded-lg text-slate-800 text-sm flex-1 focus:outline-none focus:border-indigo-600 shadow-sm"
                              autoFocus
                            />
                            <button onClick={() => saveEdit(stage.id)} className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={cancelEdit} className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="font-bold text-slate-800 text-base">{stage.name}</span>
                            {stage.editable && (
                              <button 
                                onClick={() => startEditing(stage.id, stage.name)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 transition-all"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {stages.length > 2 && (
                              <button
                                onClick={() => removeStage(stage.id)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-all"
                                title="Видалити етап"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                      
                      <input
                        type="number"
                        value={stage.value || ''}
                        onChange={(e) => updateStageValue(stage.id, 'value', e.target.value)}
                        placeholder="0"
                        className="w-28 text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 text-right px-3 py-2 bg-white border-2 border-slate-200 hover:border-indigo-300 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-600 text-xs font-semibold block mb-1.5">Конверсія (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={stage.conversion || ''}
                          onChange={(e) => updateStageValue(stage.id, 'conversion', e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 bg-white border-2 border-slate-200 hover:border-indigo-300 rounded-xl text-slate-800 text-sm text-center focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>
                      
                      <div>
                        <label className="text-slate-600 text-xs font-semibold block mb-1.5">Зміна (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={stage.growth || ''}
                          onChange={(e) => updateStageValue(stage.id, 'growth', e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 bg-white border-2 border-slate-200 hover:border-indigo-300 rounded-xl text-slate-800 text-sm text-center focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Прогнозна воронка */}
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                Етапи воронки (прогноз)
              </h2>
              <div className="space-y-4">
                {forecastStages.map((stage, index) => (
                  <div key={stage.id} className="bg-gradient-to-br from-emerald-50 to-teal-50/50 hover:from-emerald-100 hover:to-teal-100 p-4 rounded-2xl border-2 border-emerald-200/60 hover:border-emerald-400 transition-all shadow-sm hover:shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800 text-base">{stage.name}</span>
                      <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                        {formatNumber(stage.forecast || 0)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-medium">
                      Нова конверсія: {((stage.newConversion || 0) * 100).toFixed(2)}%
                      {index > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-semibold">
                          {(stage.forecast || 0) > stage.value ? '+' : ''}{formatNumber((stage.forecast || 0) - stage.value)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Фінансові метрики */}
          <div className="border-t-2 border-slate-200/60 pt-10">
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-8">Фінансові показники</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border-2 border-indigo-100/60">
              <div>
                <label className="text-slate-700 font-bold block mb-2 text-sm">Покази</label>
                <input
                  type="number"
                  value={impressions || ''}
                  onChange={(e) => setImpressions(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 hover:border-indigo-300 rounded-xl text-slate-800 text-sm font-semibold focus:outline-none focus:border-indigo-500 transition-colors shadow-sm"
                />
              </div>
              <div>
                <label className="text-slate-700 font-bold block mb-2 text-sm">Бюджет (₴)</label>
                <input
                  type="number"
                  value={metrics.budget || ''}
                  onChange={(e) => updateMetric('budget', e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 hover:border-indigo-300 rounded-xl text-slate-800 text-sm font-semibold focus:outline-none focus:border-indigo-500 transition-colors shadow-sm"
                />
              </div>
              <div>
                <label className="text-slate-700 font-bold block mb-2 text-sm">Середній чек (₴)</label>
                <input
                  type="number"
                  value={metrics.avgCheck || ''}
                  onChange={(e) => updateMetric('avgCheck', e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 hover:border-indigo-300 rounded-xl text-slate-800 text-sm font-semibold focus:outline-none focus:border-indigo-500 transition-colors shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 p-6 rounded-2xl border-2 border-slate-200/60 shadow-sm">
                <h3 className="font-black text-lg mb-4 text-slate-800">Поточні показники</h3>
                <div className="space-y-3">
                  <MetricRow label="Бюджет" value={calculatedMetrics.current.budget} unit="₴" />
                  <MetricRow label="Вартість ліда" value={calculatedMetrics.current.leadCost} unit="₴" />
                  <MetricRow label="Вартість заявки" value={calculatedMetrics.current.applicationCost} unit="₴" />
                  <MetricRow label="Вартість клієнта" value={calculatedMetrics.current.clientCost} unit="₴" />
                  <MetricRow label="Середній чек" value={calculatedMetrics.current.avgCheck} unit="₴" />
                  <MetricRow label="Дохід" value={calculatedMetrics.current.revenue} unit="₴" highlight />
                  <MetricRow label="ROAS" value={calculatedMetrics.current.roas} unit="x" highlight />
                  <MetricRow label="CPM" value={calculatedMetrics.current.cpm} unit="₴" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-6 rounded-2xl border-2 border-emerald-200/60 shadow-sm">
                <h3 className="font-black text-lg mb-4 text-emerald-700">Прогнозні показники</h3>
                <div className="space-y-3">
                  <MetricRow label="Бюджет" value={calculatedMetrics.forecast.budget} unit="₴" forecast />
                  <MetricRow label="Вартість ліда" value={calculatedMetrics.forecast.leadCost} unit="₴" forecast />
                  <MetricRow label="Вартість заявки" value={calculatedMetrics.forecast.applicationCost} unit="₴" forecast />
                  <MetricRow label="Вартість клієнта" value={calculatedMetrics.forecast.clientCost} unit="₴" forecast />
                  <MetricRow label="Середній чек" value={calculatedMetrics.forecast.avgCheck} unit="₴" forecast />
                  <MetricRow label="Дохід" value={calculatedMetrics.forecast.revenue} unit="₴" highlight forecast />
                  <MetricRow label="ROAS" value={calculatedMetrics.forecast.roas} unit="x" highlight forecast />
                  <MetricRow label="CPM" value={calculatedMetrics.forecast.cpm} unit="₴" forecast />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Інструкція */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-indigo-100/50 p-6 border border-white/60">
          <h3 className="font-bold text-slate-800 mb-4 text-lg">Як користуватись</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="font-bold text-indigo-600 mt-0.5">•</span>
              <span><strong className="text-indigo-600">Приклад:</strong> Завантажує демонстраційні дані</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-purple-600 mt-0.5">•</span>
              <span><strong className="text-purple-600">Зберегти:</strong> Створює новий дашборд або оновлює поточний</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-600 mt-0.5">•</span>
              <span><strong className="text-emerald-600">+ Етап:</strong> Додає власний етап воронки в будь-яку позицію</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-slate-600 mt-0.5">•</span>
              <span>Всі дані зберігаються локально в браузері</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-slate-600 mt-0.5">•</span>
              <span>Створюйте окремі дашборди для різних продуктів</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
