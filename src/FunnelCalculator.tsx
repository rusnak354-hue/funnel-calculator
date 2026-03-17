/* eslint-disable */
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
  name: 'Назва дашборду',
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

  const QUALITY_SENSITIVITY = 0.15;

  const calculateWithDynamicDecay = (baseCtr: number, targetCtr: number, baseLeadCr: number) => {
    const growthFactor = baseCtr > 0 ? (targetCtr - baseCtr) / baseCtr : 0;
    let dynamicDecay = 0;
    if (growthFactor < 0) dynamicDecay = 0;
    else if (growthFactor < 0.2) dynamicDecay = 0;
    else if (growthFactor < 0.5) dynamicDecay = 0.1;
    else dynamicDecay = QUALITY_SENSITIVITY;
    
    const correction = 1 - (growthFactor * dynamicDecay);
    const newLeadCr = baseLeadCr * correction;
    return { newLeadCr: Math.max(newLeadCr, 0.01), growthFactor, dynamicDecay, correction };
  };

  const getDashboardStatus = (growthFactor: number, correction: number, leadsGain: number) => {
    const growthPct = Math.round(growthFactor * 100);
    const crDropPct = Math.round((1 - correction) * 100);
    if (growthFactor <= 0) return { type: 'neutral', title: '', text: '' };
    if (leadsGain > 0) {
      if (growthFactor < 0.2) return { type: 'success', title: "✅ Чиста оптимізація", text: `Ви покращили CTR на ${growthPct}%. Зміни незначні, якість стабільна.` };
      return { type: 'info', title: "📈 Ефективне масштабування", text: `CTR виріс на ${growthPct}%. Конверсія знизиться на ${crDropPct}%, але лідів стане більше.` };
    } else {
      return { type: 'warning', title: "⚠️ Небезпечна зона", text: `Ріст CTR на ${growthPct}% призведе до падіння якості. Лідів стане менше!` };
    }
  };

  const calculateForecast = () => {
    const forecast = stages.map(stage => ({ ...stage }));
    const baseCtr = forecast[0].conversion / 100;
    const baseLeadCr = (forecast[1]?.conversion || 0) / 100;
    const targetCtr = (forecast[0].conversion + forecast[0].growth) / 100;

    let decayResult = forecast[0].growth === 0 
      ? { newLeadCr: baseLeadCr, growthFactor: 0, dynamicDecay: 0, correction: 1 }
      : calculateWithDynamicDecay(baseCtr, targetCtr, baseLeadCr);

    forecast[0].newConversion = targetCtr;
    forecast[0].forecast = impressions * targetCtr;

    for (let i = 1; i < forecast.length; i++) {
      const explicitGrowth = forecast[i].growth / 100;
      const baseCr = i === 1 ? decayResult.newLeadCr : (forecast[i].conversion / 100);
      forecast[i].newConversion = baseCr + explicitGrowth;
      forecast[i].forecast = (forecast[i - 1].forecast || 0) * forecast[i].newConversion;
    }

    const baseLeads = (impressions * baseCtr) * baseLeadCr;
    const newLeads = forecast[1]?.forecast || 0;
    const leadsGain = newLeads - baseLeads;
    
    (forecast as any)._decayInfo = {
      ...decayResult,
      status: getDashboardStatus(decayResult.growthFactor, decayResult.correction, leadsGain),
      leadsGain,
      baseLeads
    };
    return forecast;
  };

  const forecastStages = calculateForecast();
  const decayInfo = (forecastStages as any)._decayInfo;

  const calculateMetrics = (): { current: CalculatedMetricSet; forecast: CalculatedMetricSet } => {
    const current = {
      budget: metrics.budget,
      leadCost: stages[1]?.value > 0 ? metrics.budget / stages[1].value : 0,
      applicationCost: stages[3]?.value > 0 ? metrics.budget / stages[3].value : 0,
      clientCost: stages[4]?.value > 0 ? metrics.budget / stages[4].value : 0,
      avgCheck: metrics.avgCheck,
      revenue: (stages[4]?.value || 0) * metrics.avgCheck,
      roas: metrics.budget > 0 ? ((stages[4]?.value || 0) * metrics.avgCheck) / metrics.budget : 0,
      cpm: impressions > 0 ? (metrics.budget / impressions) * 1000 : 0
    };
    
    const forecast = {
      budget: metrics.budget,
      leadCost: forecastStages[1]?.forecast > 0 ? metrics.budget / forecastStages[1].forecast : 0,
      applicationCost: forecastStages[3]?.forecast > 0 ? metrics.budget / forecastStages[3].forecast : 0,
      clientCost: forecastStages[4]?.forecast > 0 ? metrics.budget / forecastStages[4].forecast : 0,
      avgCheck: metrics.avgCheck,
      revenue: (forecastStages[4]?.forecast || 0) * metrics.avgCheck,
      roas: metrics.budget > 0 ? ((forecastStages[4]?.forecast || 0) * metrics.avgCheck) / metrics.budget : 0,
      cpm: current.cpm
    };

    return { current, forecast };
  };

  const { current: curM, forecast: forM } = calculateMetrics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Хедер та управління (як у вашому коді) */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 md:p-8 mb-6 border border-white/60">
          <div className="mb-6">
             <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 tracking-tight">
               MARKETING PREDICTIONAL FRAMEWORK
             </h1>
          </div>
          {/* Решта кнопок управління... */}
          <div className="flex flex-wrap gap-3">
             <button onClick={saveDashboard} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2"><Save className="w-4 h-4"/> Зберегти</button>
             <button onClick={() => setShowDashboardList(!showDashboardList)} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2"><FolderOpen className="w-4 h-4"/> Дашборди</button>
             <button onClick={createShareLink} className="px-5 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2"><Share2 className="w-4 h-4"/> Поділитися</button>
             <button onClick={resetToDefault} className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold">Приклад</button>
          </div>
        </div>

        {/* Списки та модалки (пропущено для стислості, логіка збережена) */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Основна таблиця етапів */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h2 className="font-bold text-slate-800">Етапи воронки</h2>
                <div className="flex gap-4 text-sm font-bold">
                  <span className="text-slate-400 uppercase tracking-wider">Поточні</span>
                  <span className="text-emerald-500 uppercase tracking-wider">Прогноз</span>
                </div>
              </div>
              <div className="divide-y divide-slate-50">
                {stages.map((stage, idx) => (
                  <div key={stage.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-300">#0{idx+1}</span>
                          <input 
                            value={stage.name} 
                            onChange={(e) => setStages(stages.map(s => s.id === stage.id ? {...s, name: e.target.value} : s))}
                            className="font-bold text-slate-700 bg-transparent border-none focus:ring-0 p-0"
                          />
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-baseline gap-1">
                            <input 
                              type="number"
                              value={stage.value}
                              onChange={(e) => setStages(stages.map(s => s.id === stage.id ? {...s, value: Number(e.target.value)} : s))}
                              className="text-2xl font-black text-slate-900 w-24 bg-transparent border-b border-slate-200"
                            />
                            <span className="text-xs font-bold text-slate-400">ФАКТ</span>
                          </div>
                          <div className="h-8 w-px bg-slate-100"></div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-emerald-600">{Math.round(forecastStages[idx].forecast || 0).toLocaleString()}</span>
                            <span className="text-xs font-bold text-emerald-400">ЦІЛЬ</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="bg-indigo-50 p-3 rounded-2xl min-w-[100px]">
                          <div className="text-[10px] font-black text-indigo-400 uppercase mb-1">Гіпотеза ріст</div>
                          <div className="flex items-center gap-1">
                             <input 
                              type="number"
                              value={stage.growth}
                              onChange={(e) => setStages(stages.map(s => s.id === stage.id ? {...s, growth: Number(e.target.value)} : s))}
                              className="w-full bg-transparent font-bold text-indigo-700 focus:outline-none"
                            />
                            <span className="font-bold text-indigo-700">%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Бокова панель метрик */}
          <div className="space-y-6">
             <div className="bg-indigo-900 rounded-3xl p-6 text-white shadow-2xl">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-300"/> Економіка проєкту
                </h3>
                <div className="space-y-4">
                   <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                      <div className="text-xs font-bold text-indigo-200 uppercase mb-2">Бюджет</div>
                      <input 
                        type="number" 
                        value={metrics.budget} 
                        onChange={(e) => setMetrics({...metrics, budget: Number(e.target.value)})}
                        className="text-2xl font-black bg-transparent w-full focus:outline-none"
                      />
                   </div>
                   <div className="space-y-3 pt-4">
                      <MetricRow label="Дохід (прогноз)" value={forM.revenue} unit="грн" highlight forecast />
                      <MetricRow label="ROAS (прогноз)" value={forM.roas} unit="x" highlight forecast />
                      <MetricRow label="Вартість ліда" value={forM.leadCost} unit="грн" forecast />
                   </div>
                </div>
             </div>

             {/* Поради AI / Decay Info */}
             {decayInfo?.status?.title && (
               <div className={`p-6 rounded-3xl border-2 ${
                 decayInfo.status.type === 'success' ? 'bg-emerald-50 border-emerald-100' :
                 decayInfo.status.type === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'
               }`}>
                 <h4 className="font-black text-slate-800 mb-2">{decayInfo.status.title}</h4>
                 <p className="text-sm text-slate-600 leading-relaxed">{decayInfo.status.text}</p>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Модалка Share (як у вашому коді) */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-3xl max-w-md w-full mx-4">
            <div className="flex justify-between mb-4">
              <h3 className="font-black text-xl">Поділитися</h3>
              <button onClick={() => setShowShareModal(false)}><X/></button>
            </div>
            <input readOnly value={shareLink} className="w-full p-3 bg-slate-100 rounded-xl mb-4 font-mono text-sm"/>
            <button onClick={copyShareLink} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold">Копіювати посилання</button>
          </div>
        </div>
      )}
    </div>
  );
}    { id: '4', name: 'Заявки', value: 33, conversion: 4.31, growth: 0 },
    { id: '5', name: 'Оплати', value: 20, conversion: 60.61, growth: 0 }
  ]);

  const [currentId, setCurrentId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');

  // --- Ефекти (Завантаження) ---
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedId = urlParams.get('id');
    const saved = localStorage.getItem('funnel_dashboards');
    
    if (sharedId && saved) {
      const all = JSON.parse(saved);
      const target = all.find((d: SavedDashboard) => d.id === sharedId);
      if (target) {
        setDashboardName(target.name);
        setImpressions(target.impressions);
        setStages(target.stages);
        setMetrics(target.metrics);
        setCurrentId(target.id);
      }
    }
  }, []);

  // --- Логіка розрахунків (Виправлення п.1) ---
  const calculateForecast = () => {
    const forecast = stages.map(s => ({ ...s, fValue: 0, fConv: 0 }));
    
    // 1 етап: Кліки
    const clickGrowthFactor = 1 + (forecast[0].growth / 100);
    forecast[0].fConv = forecast[0].conversion * clickGrowthFactor;
    forecast[0].fValue = impressions * (forecast[0].fConv / 100);

    // Наступні етапи
    for (let i = 1; i < forecast.length; i++) {
      const growthFactor = 1 + (forecast[i].growth / 100);
      forecast[i].fConv = forecast[i].conversion * growthFactor;
      forecast[i].fValue = forecast[i - 1].fValue * (forecast[i].fConv / 100);
    }
    return forecast;
  };

  const forecastData = calculateForecast();

  // --- Функції кнопок (Виправлення п.2) ---
  const handleSaveAndShare = () => {
    const id = currentId || `dash_${Date.now()}`;
    const newDash: SavedDashboard = {
      id,
      name: dashboardName,
      impressions,
      stages,
      metrics,
      updatedAt: new Date().toISOString()
    };

    const saved = localStorage.getItem('funnel_dashboards');
    const all = saved ? JSON.parse(saved) : [];
    const index = all.findIndex((d: SavedDashboard) => d.id === id);
    
    if (index > -1) all[index] = newDash;
    else all.push(newDash);

    localStorage.setItem('funnel_dashboards', JSON.stringify(all));
    setCurrentId(id);

    const link = `${window.location.origin}${window.location.pathname}?id=${id}`;
    setShareLink(link);
    setShowShareModal(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Хедер */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Мій маркетинговий дашборд</h1>
            <input 
              value={dashboardName}
              onChange={(e) => setDashboardName(e.target.value)}
              className="bg-transparent text-slate-500 border-none p-0 focus:ring-0 text-sm"
            />
          </div>
          <button 
            onClick={handleSaveAndShare}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            <Share2 size={18} />
            Поділитися дашбордом
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Ліва частина: Поточна воронка */}
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-4">
              <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Calculator size={20}/></span>
              Воронка поточна
            </h2>
            
            {stages.map((stage, idx) => (
              <div key={stage.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-slate-800">{stage.name}</span>
                  <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                    <input 
                      type="number"
                      value={stage.value}
                      onChange={(e) => {
                        const newStages = [...stages];
                        newStages[idx].value = Number(e.target.value);
                        setStages(newStages);
                      }}
                      className="w-20 text-right font-bold text-indigo-600 bg-transparent border-none p-0 focus:ring-0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Конверсія (%)</label>
                    <input 
                      type="number"
                      value={stage.conversion}
                      onChange={(e) => {
                        const newStages = [...stages];
                        newStages[idx].conversion = Number(e.target.value);
                        setStages(newStages);
                      }}
                      className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Зміна (%)</label>
                    <input 
                      type="number"
                      value={stage.growth}
                      onChange={(e) => {
                        const newStages = [...stages];
                        newStages[idx].growth = Number(e.target.value);
                        setStages(newStages);
                      }}
                      className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Права частина: Прогноз */}
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-4">
              <span className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><TrendingUp size={20}/></span>
              Етапи воронки (прогноз)
            </h2>

            {forecastData.map((s) => (
              <div key={s.id} className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 mb-1">{s.name}</h3>
                    <p className="text-xs text-slate-500">
                      Нова конверсія: <span className="font-bold">{s.fConv.toFixed(2)}%</span>
                      {s.growth !== 0 && (
                        <span className={`ml-2 font-bold ${s.growth > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {s.growth > 0 ? '+' : ''}{s.growth}%
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900">
                      {new Intl.NumberFormat('uk-UA').format(Math.round(s.fValue * 100) / 100)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Модалка Share */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Ваше унікальне посилання</h3>
              <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">Скопіюйте це посилання, щоб відкрити цей конкретний дашборд на іншому пристрої.</p>
            <div className="flex gap-2 mb-6">
              <input readOnly value={shareLink} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono" />
              <button 
                onClick={() => { navigator.clipboard.writeText(shareLink); alert('Скопійовано!'); }}
                className="bg-slate-900 text-white p-3 rounded-xl hover:bg-slate-800"
              >
                <Copy size={20} />
              </button>
            </div>
            <button 
              onClick={() => setShowShareModal(false)}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold"
            >
              Зрозуміло
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
