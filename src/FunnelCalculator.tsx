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
