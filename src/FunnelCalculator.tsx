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

function MetricRow({ label, value, unit, highlight = false, forecast = false }: {label: string;value: number;unit: string;highlight?: boolean;forecast?: boolean;}) {
  const formatValue = (val: number) => {
    if (unit === 'x') return val.toFixed(2);
    return new Intl.NumberFormat('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val);
  };

  return (
    <div className={`flex justify-between items-center ${highlight ? 'font-bold text-base' : 'text-sm'}`}>
      <span className="text-muted-foreground font-medium">{label}</span>
      <span className={
      highlight ?
      forecast ? 'text-emerald-400 font-black' : 'text-primary font-black' :
      'text-foreground font-semibold'
      }>
        {formatValue(value)} {unit}
      </span>
    </div>);

}

const recalcConversions = (stages: Stage[], impressions: number): Stage[] => {
  return stages.map((s, i) => {
    const prevValue = i === 0 ? impressions : stages[i - 1].value;
    return { ...s, conversion: prevValue > 0 ? Math.round(s.value / prevValue * 10000) / 100 : 0 };
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
  { id: 'payments', name: 'Оплати', value: 20, conversion: 60.61, growth: 0, editable: true }] as
  Stage[],
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

  useEffect(() => {loadDashboards();loadFromURL();}, []);

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
    { id: 'payments', name: 'Оплати', value: 0, conversion: 0, growth: 0, editable: true }]
    );
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
    setStages(stages.filter((s) => s.id !== id));
  };

  // === НАЛАШТУВАННЯ ЧУТЛИВОСТІ (Soft Decay) ===
  const QUALITY_SENSITIVITY = 0.15;

  const calculateWithDynamicDecay = (baseCtr: number, targetCtr: number, baseLeadCr: number) => {
    const growthFactor = baseCtr > 0 ? (targetCtr - baseCtr) / baseCtr : 0;
    let dynamicDecay = 0;
    if (growthFactor < 0) {
      dynamicDecay = 0;
    } else if (growthFactor < 0.2) {
      dynamicDecay = 0;
    } else if (growthFactor < 0.5) {
      dynamicDecay = 0.1;
    } else {
      dynamicDecay = QUALITY_SENSITIVITY;
    }
    const correction = 1 - growthFactor * dynamicDecay;
    const newLeadCr = baseLeadCr * correction;
    return {
      newLeadCr: Math.max(newLeadCr, 0.01),
      growthFactor,
      dynamicDecay,
      correction
    };
  };

  const getDashboardStatus = (growthFactor: number, correction: number, leadsGain: number) => {
    const growthPct = Math.round(growthFactor * 100);
    const crDropPct = Math.round((1 - correction) * 100);
    if (growthFactor <= 0) {
      return { type: 'neutral', title: '', text: '' };
    }
    if (leadsGain > 0) {
      if (growthFactor < 0.2) {
        return {
          type: 'success',
          title: "✅ Чиста оптимізація",
          text: `Ви покращили CTR на ${growthPct}%. Оскільки зміни незначні, ми прогнозуємо стабільну якість лідів. Ви отримаєте максимум вигоди.`
        };
      }
      return {
        type: 'info',
        title: "📈 Ефективне масштабування",
        text: `CTR виріс на ${growthPct}%. Конверсія може знизитись на ${crDropPct}% (природна похибка), але кількість лідів все одно виросте. Це вигідна стратегія.`
      };
    } else {
      return {
        type: 'warning',
        title: "⚠️ Небезпечна зона",
        text: `Увага! Ріст CTR на ${growthPct}% призведе до сильного падіння якості. Ви отримаєте багато кліків, але менше реальних лідів. Перевірте креативи.`
      };
    }
  };

  const calculateForecast = () => {
    const forecast = [...stages];
    const baseCtr = stages[0].conversion / 100;
    const baseLeadCr = (stages[1]?.conversion || 0) / 100;
    const targetCtr = (stages[0].conversion + stages[0].growth) / 100;
    const decayResult = calculateWithDynamicDecay(baseCtr, targetCtr, baseLeadCr);

    forecast[0].newConversion = targetCtr;
    forecast[0].forecast = impressions * targetCtr;
    for (let i = 1; i < forecast.length; i++) {
      const rawConversion = (forecast[i].conversion + forecast[i].growth) / 100;
      forecast[i].newConversion = i === 1 ? decayResult.newLeadCr : rawConversion;
      forecast[i].forecast = (forecast[i - 1].forecast || 0) * forecast[i].newConversion;
    }

    const baseLeads = impressions * baseCtr * baseLeadCr;
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

  const calculateMetrics = (): {current: CalculatedMetricSet;forecast: CalculatedMetricSet;} => {
    const forecastLeads = forecastStages[1]?.forecast || 0;
    const forecastApplications = forecastStages[3]?.forecast || 0;
    const forecastPayments = forecastStages[4]?.forecast || 0;
    const currentCPM = impressions > 0 ? metrics.budget / impressions * 1000 : 0;
    const forecastBudget = metrics.budget;
    return {
      current: {
        budget: metrics.budget,
        leadCost: stages[1]?.value > 0 ? metrics.budget / stages[1].value : 0,
        applicationCost: stages[3]?.value > 0 ? metrics.budget / stages[3].value : 0,
        clientCost: stages[4]?.value > 0 ? metrics.budget / stages[4].value : 0,
        avgCheck: metrics.avgCheck,
        revenue: (stages[4]?.value || 0) * metrics.avgCheck,
        roas: metrics.budget > 0 ? (stages[4]?.value || 0) * metrics.avgCheck / metrics.budget : 0,
        cpm: currentCPM
      },
      forecast: {
        budget: forecastBudget,
        leadCost: forecastLeads > 0 ? forecastBudget / forecastLeads : 0,
        applicationCost: forecastApplications > 0 ? forecastBudget / forecastApplications : 0,
        clientCost: forecastPayments > 0 ? forecastBudget / forecastPayments : 0,
        avgCheck: metrics.avgCheck,
        revenue: forecastPayments * metrics.avgCheck,
        roas: forecastBudget > 0 ? forecastPayments * metrics.avgCheck / forecastBudget : 0,
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
    setStages(stages.map((s) =>
    s.id === stageId ? { ...s, name: tempName } : s
    ));
    setEditingStage(null);
  };

  const cancelEdit = () => {
    setEditingStage(null);
    setTempName('');
  };

  const updateStageValue = (stageId: string, field: keyof Stage, value: string) => {
    setStages(stages.map((s) =>
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
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Хедер */}
        <div className="bg-card/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 md:p-8 mb-6 border border-border">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary tracking-tight font-sans md:text-4xl">
              MARKETING PREDICTIONAL FRAMEWORK
            </h1>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-2xl shadow-lg">
                <Calculator className="w-6 h-6 md:w-7 md:h-7 text-primary-foreground" />
              </div>
              <input
                type="text"
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                className="text-2xl md:text-3xl font-bold text-foreground bg-transparent border-b-2 border-transparent hover:border-primary/30 focus:border-primary focus:outline-none px-2 py-1 w-full transition-colors"
                placeholder="Назва дашборду" />
              
            </div>
            {saveStatus &&
            <span className="text-sm font-medium px-3 py-1 bg-green-500/20 text-green-400 rounded-full">
                {saveStatus}
              </span>
            }
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={saveDashboard} className="px-5 py-2.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground rounded-xl transition-all text-sm font-semibold flex items-center gap-2 shadow-lg">
              <Save className="w-4 h-4" /> Зберегти
            </button>
            <button onClick={() => setShowDashboardList(!showDashboardList)} className="px-5 py-2.5 bg-gradient-to-r from-accent to-primary hover:opacity-90 text-accent-foreground rounded-xl transition-all text-sm font-semibold flex items-center gap-2 shadow-lg">
              <FolderOpen className="w-4 h-4" /> Дашборди ({dashboards.length})
            </button>
            <button onClick={createShareLink} className="px-5 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl transition-all text-sm font-semibold flex items-center gap-2">
              <Share2 className="w-4 h-4" /> Поділитися
            </button>
            <button onClick={exportToExcel} className="px-5 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl transition-all text-sm font-semibold flex items-center gap-2">
              <Download className="w-4 h-4" /> CSV
            </button>
            <button onClick={exportToExcel} className="px-5 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl transition-all text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4" /> PDF
            </button>
            <button onClick={resetToDefault} className="px-5 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl transition-all text-sm font-semibold">
              Приклад
            </button>
            <button onClick={clearAll} className="px-5 py-2.5 bg-muted hover:bg-muted/80 text-muted-foreground rounded-xl transition-all text-sm font-semibold">
              Очистити
            </button>
          </div>
        </div>

        {/* Список дашбордів */}
        {showDashboardList &&
        <div className="bg-card rounded-xl shadow-lg p-4 md:p-6 mb-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg md:text-xl font-bold text-foreground font-serif">Збережені дашборди</h3>
              <button onClick={() => setShowDashboardList(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-6 h-6" />
              </button>
            </div>
            {dashboards.length === 0 ?
          <p className="text-muted-foreground text-center py-8">Немає збережених дашбордів. Створіть перший!</p> :

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboards.map((dash) =>
            <div key={dash.id} className="bg-secondary border border-border rounded-lg p-4 hover:bg-secondary/80 transition-colors">
                    <h4 className="font-semibold text-foreground mb-2 truncate">{dash.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {dash.updatedAt ? new Date(dash.updatedAt).toLocaleDateString('uk-UA') : 'Новий'}
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => loadDashboard(dash.id)} className="flex-1 px-3 py-1 bg-primary/20 hover:bg-primary/30 text-primary rounded text-sm font-medium">
                        Відкрити
                      </button>
                      <button onClick={() => duplicateDashboard(dash.id)} className="px-3 py-1 bg-muted hover:bg-muted/80 text-muted-foreground rounded text-sm" title="Копіювати">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteDashboard(dash.id)} className="px-3 py-1 bg-destructive/20 hover:bg-destructive/30 text-destructive rounded text-sm" title="Видалити">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
            )}
              </div>
          }
          </div>
        }

        {/* Модальне вікно розшарення */}
        {showShareModal &&
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl shadow-2xl p-6 md:p-8 max-w-lg w-full border border-border">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-xl">
                    <Share2 className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-black text-foreground font-serif">Поділитися</h3>
                </div>
                <button onClick={() => setShowShareModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="mb-6">
                <p className="text-muted-foreground mb-4">
                  Скопіюйте посилання та поділіться своїм дашбордом з колегами. Вони побачать всі ваші дані та зможуть зберегти копію собі.
                </p>
                <div className="bg-secondary p-4 rounded-xl border border-border mb-4">
                  <label className="text-sm font-semibold text-foreground block mb-2">📋 Посилання для поширення:</label>
                  <div className="flex gap-2">
                    <input type="text" value={shareLink} readOnly onClick={(e) => e.currentTarget.select()} className="flex-1 px-4 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none focus:border-primary" />
                    <button onClick={copyShareLink} className="px-4 py-2.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground rounded-lg flex items-center gap-2 flex-shrink-0 font-semibold transition-all shadow-lg">
                      <Copy className="w-4 h-4" /> Копіювати
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent('Подивіться мій маркетинговий дашборд')}`, '_blank')} className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg font-semibold text-sm transition-colors">
                    Telegram
                  </button>
                  <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Подивіться мій дашборд: ' + shareLink)}`, '_blank')} className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg font-semibold text-sm transition-colors">
                    WhatsApp
                  </button>
                  <button onClick={() => window.open(`mailto:?subject=${encodeURIComponent('Маркетинговий дашборд')}&body=${encodeURIComponent('Подивіться мій дашборд: ' + shareLink)}`, '_blank')} className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg font-semibold text-sm transition-colors">
                    Email
                  </button>
                </div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <div className="flex gap-3">
                  <div className="text-yellow-500 flex-shrink-0">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <strong className="font-semibold text-foreground">Примітка:</strong> Дані зберігаються в посиланні. Отримувач побачить точну копію вашого дашборду і зможе зберегти її собі.
                  </div>
                </div>
              </div>
            </div>
          </div>
        }

        {/* Модальне вікно додавання етапу */}
        {showAddStage &&
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-xl shadow-2xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-foreground uppercase tracking-wider font-serif">Додати етап</h3>
                <button onClick={() => setShowAddStage(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-muted-foreground block mb-2">Назва етапу</label>
                  <input type="text" value={newStageName} onChange={(e) => setNewStageName(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary" placeholder="Назва нового етапу" />
                </div>
                <div>
                  <label className="text-muted-foreground block mb-2">Позиція</label>
                  <select value={newStagePosition} onChange={(e) => setNewStagePosition(parseInt(e.target.value))} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary">
                    {stages.map((_, index) =>
                  <option key={index} value={index}>Перед {stages[index].name}</option>
                  )}
                    <option value={stages.length}>В кінці</option>
                  </select>
                </div>
                <button onClick={addStage} className="w-full px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg font-medium">
                  Додати
                </button>
              </div>
            </div>
          </div>
        }

        {/* Основний калькулятор */}
        <div className="bg-card/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 md:p-10 mb-8 border border-border">
          {/* Воронка */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 mb-10">
            {/* Поточна воронка */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-3 font-sans">
                  <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-xl">
                    <TrendingUp className="w-5 h-5 text-primary-foreground" />
                  </div>
                  Воронка поточна
                </h2>
                <button onClick={() => setShowAddStage(true)} className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>Етап</span>
                </button>
              </div>

              <div className="space-y-4">
                {stages.map((stage) =>
                <div key={stage.id} className="group bg-secondary/50 hover:bg-secondary p-4 rounded-2xl border border-border hover:border-primary/30 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {editingStage === stage.id ?
                      <div className="flex items-center gap-2 flex-1">
                            <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} className="px-3 py-1.5 bg-background border border-primary rounded-lg text-foreground text-sm flex-1 focus:outline-none" autoFocus />
                            <button onClick={() => saveEdit(stage.id)} className="p-1.5 bg-green-600 hover:bg-green-700 text-primary-foreground rounded-lg transition-colors">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={cancelEdit} className="p-1.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div> :

                      <>
                            <span className="font-bold text-foreground text-base">{stage.name}</span>
                            {stage.editable &&
                        <button onClick={() => startEditing(stage.id, stage.name)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-all">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                        }
                            {stages.length > 2 &&
                        <button onClick={() => removeStage(stage.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all" title="Видалити етап">
                                <X className="w-3.5 h-3.5" />
                              </button>
                        }
                          </>
                      }
                      </div>
                      <input type="number" value={stage.value || ''} onChange={(e) => updateStageValue(stage.id, 'value', e.target.value)} placeholder="0" className="w-28 text-xl font-black text-primary text-right px-3 py-2 bg-background border border-border hover:border-primary/30 rounded-xl focus:outline-none focus:border-primary transition-colors" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-muted-foreground text-xs font-semibold block mb-1.5">Конверсія (%)</label>
                        <input type="number" step="0.01" value={stage.conversion || ''} onChange={(e) => updateStageValue(stage.id, 'conversion', e.target.value)} placeholder="0" className="w-full px-3 py-2 bg-background border border-border hover:border-primary/30 rounded-xl text-foreground text-sm text-center focus:outline-none focus:border-primary transition-colors" />
                      </div>
                      <div>
                        <label className="text-muted-foreground text-xs font-semibold block mb-1.5">Зміна (%)</label>
                        <input type="number" step="0.01" value={stage.growth || ''} onChange={(e) => updateStageValue(stage.id, 'growth', e.target.value)} placeholder="0" className="w-full px-3 py-2 bg-background border border-border hover:border-primary/30 rounded-xl text-foreground text-sm text-center focus:outline-none focus:border-primary transition-colors" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Прогнозна воронка */}
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6 flex items-center gap-3 font-sans">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-primary-foreground" />
                </div>
                Воронка прогнозу
              </h2>
              <div className="space-y-4">
                {forecastStages.map((stage, index) =>
                <div key={stage.id} className="bg-emerald-500/10 hover:bg-emerald-500/20 p-4 rounded-2xl border border-emerald-500/20 hover:border-emerald-500/40 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-foreground text-base">{stage.name}</span>
                      <span className="text-xl font-black text-emerald-400">
                        {formatNumber(stage.forecast || 0)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      Нова конверсія: {((stage.newConversion || 0) * 100).toFixed(2)}%
                      {index > 0 &&
                    <span className="ml-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-semibold">
                          {(stage.forecast || 0) > stage.value ? '+' : ''}{formatNumber((stage.forecast || 0) - stage.value)}
                        </span>
                    }
                    </div>
                  </div>
                )}
              </div>
              {/* Статус прогнозу */}
              {(() => {
                const decayInfo = (forecastStages as any)._decayInfo;
                if (!decayInfo || !decayInfo.status || decayInfo.status.type === 'neutral') return null;
                const { status, leadsGain, baseLeads } = decayInfo;
                const bgColors = {
                  success: 'bg-green-500/10 border-green-500/30',
                  info: 'bg-blue-500/10 border-blue-500/30',
                  warning: 'bg-yellow-500/10 border-yellow-500/30'
                };
                return (
                  <div className={`mt-6 p-5 rounded-2xl border ${bgColors[status.type as keyof typeof bgColors]}`}>
                    <div className="font-bold text-lg mb-2 text-foreground font-serif">
                      {status.title}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {status.text}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                      <span>Базові ліди: <strong>{Math.round(baseLeads)}</strong></span>
                      <span className={leadsGain > 0 ? 'text-green-400 font-semibold' : 'text-destructive font-semibold'}>
                        {leadsGain > 0 ? '+' : ''}{Math.round(leadsGain)} лідів
                      </span>
                    </div>
                  </div>);

              })()}
            </div>
          </div>

          {/* Фінансові метрики */}
          <div className="border-t border-border pt-10">
            <h2 className="text-2xl md:text-3xl font-black text-foreground mb-8 font-sans">Фінансові показники</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-secondary/50 p-6 rounded-2xl border border-border">
              <div>
                <label className="text-foreground font-bold block mb-2 text-sm">Покази</label>
                <input type="number" value={impressions || ''} onChange={(e) => setImpressions(parseFloat(e.target.value) || 0)} placeholder="0" className="w-full px-4 py-3 bg-background border border-border hover:border-primary/30 rounded-xl text-foreground text-sm font-semibold focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="text-foreground font-bold block mb-2 text-sm">Бюджет (₴)</label>
                <input type="number" value={metrics.budget || ''} onChange={(e) => updateMetric('budget', e.target.value)} placeholder="0" className="w-full px-4 py-3 bg-background border border-border hover:border-primary/30 rounded-xl text-foreground text-sm font-semibold focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="text-foreground font-bold block mb-2 text-sm">Середній чек (₴)</label>
                <input type="number" value={metrics.avgCheck || ''} onChange={(e) => updateMetric('avgCheck', e.target.value)} placeholder="0" className="w-full px-4 py-3 bg-background border border-border hover:border-primary/30 rounded-xl text-foreground text-sm font-semibold focus:outline-none focus:border-primary transition-colors" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-secondary/50 p-6 rounded-2xl border border-border">
                <h3 className="font-black text-lg mb-4 text-foreground font-sans">Поточні показники</h3>
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
              <div className="bg-emerald-500/10 p-6 rounded-2xl border border-emerald-500/20">
                <h3 className="font-black text-lg mb-4 text-emerald-400 font-sans">Прогнозні показники</h3>
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
        <div className="bg-card/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-border">
          <h3 className="font-bold text-foreground mb-4 text-lg font-sans">Як користуватись</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary mt-0.5">•</span>
              <span><strong className="text-primary">Зберегти:</strong> Створює новий дашборд або оновлює поточний у вашому браузері</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-accent mt-0.5">•</span>
              <span><strong className="text-accent">Дашборди:</strong> Відкриває список всіх збережених дашбордів</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary mt-0.5">•</span>
              <span><strong className="text-primary">Поділитися:</strong> Генерує посилання для поширення дашборду з усіма даними. Отримувач побачить точну копію!</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-accent mt-0.5">•</span>
              <span><strong className="text-accent">+ Етап:</strong> Додає власний етап воронки в будь-яку позицію</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary mt-0.5">•</span>
              <span><strong className="text-primary">Приклад:</strong> Завантажує демонстраційні дані для ознайомлення</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-muted-foreground mt-0.5">•</span>
              <span>Всі дані зберігаються локально в браузері. Створюйте окремі дашборди для різних продуктів!</span>
            </li>
          </ul>
        </div>
      </div>
    </div>);

}
