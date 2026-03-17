/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, Share2, FolderOpen, Save, Trash2, Copy, X, Plus } from 'lucide-react';

// --- Типи даних ---
interface Stage {
  id: string;
  name: string;
  value: number;
  conversion: number;
  growth: number;
}

interface Metrics {
  budget: number;
  avgCheck: number;
}

interface SavedDashboard {
  id: string;
  name: string;
  impressions: number;
  stages: Stage[];
  metrics: Metrics;
  updatedAt: string;
}

export default function FunnelCalculator() {
  // --- Стейт ---
  const [dashboardName, setDashboardName] = useState('Мій дашборд');
  const [impressions, setImpressions] = useState(913505);
  const [metrics, setMetrics] = useState<Metrics>({ budget: 106677, avgCheck: 15798 });
  const [stages, setStages] = useState<Stage[]>([
    { id: '1', name: 'Кліки', value: 7200, conversion: 0.79, growth: 0 },
    { id: '2', name: 'Ліди CRM', value: 1542, conversion: 21.42, growth: 0 },
    { id: '3', name: 'Вебінар', value: 766, conversion: 49.68, growth: 0 },
    { id: '4', name: 'Заявки', value: 33, conversion: 4.31, growth: 0 },
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
