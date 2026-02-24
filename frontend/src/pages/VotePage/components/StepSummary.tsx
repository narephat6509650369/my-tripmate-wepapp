// src/pages/VotePage/components/StepSummary.tsx
import React, { useEffect, useState } from 'react';
import { Calendar, DollarSign, MapPin, Sparkles, Brain, Settings,
         Check, ChevronDown, ChevronUp, Loader2, Copy, Code } from 'lucide-react';
import type { TripDetail, DateMatchingResponse, BudgetVotingResponse } from '../../../types';
import { voteAPI, tripAPI } from '../../../services/tripService';

// ── Local Types ──
type AIModel = 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3-opus' | 'claude-3-sonnet' | 'gemini-pro';
type PromptTemplate = 'comprehensive' | 'itinerary' | 'budget' | 'activities' | 'accommodation' | 'optimization';

interface PromptConfig {
  model: AIModel;
  template: PromptTemplate;
  temperature: number;
  maxTokens: number;
  includeCOT: boolean;
  includeExamples: boolean;
  structured: boolean;
}

interface SummaryData {
  bestDates: string[];
  avgBudget: { accommodation: number; transport: number; food: number; other: number };
  topLocations: { place: string; total_score: number }[];
  progress: { dates: number; budget: number; location: number };
}

// ── Local Utilities ──
const formatCurrency = (n: number) => n.toLocaleString('th-TH');

const MODEL_CONFIGS: Record<AIModel, { name: string; provider: string; costPer1kTokens: { input: number } }> = {
  'gpt-4':          { name: 'GPT-4',          provider: 'OpenAI',    costPer1kTokens: { input: 0.03 } },
  'gpt-3.5-turbo':  { name: 'GPT-3.5 Turbo',  provider: 'OpenAI',    costPer1kTokens: { input: 0.001 } },
  'claude-3-opus':  { name: 'Claude 3 Opus',   provider: 'Anthropic', costPer1kTokens: { input: 0.015 } },
  'claude-3-sonnet':{ name: 'Claude 3 Sonnet', provider: 'Anthropic', costPer1kTokens: { input: 0.003 } },
  'gemini-pro':     { name: 'Gemini Pro',       provider: 'Google',    costPer1kTokens: { input: 0.0005 } },
};

// ============== TYPES ==============

interface StepSummaryProps {
  trip: TripDetail;
  initialSummaryData?: {
    matchingData: Pick<DateMatchingResponse, 'availability' | 'recommendation' | 'summary'> | null;
    budgetInfo: Pick<BudgetVotingResponse, 'rows' | 'stats' | 'budgetTotal' | 'minTotal' | 'maxTotal' | 'filledMembers'> | null;
    userLocations: { place: string; score: number }[];
  };
  onNavigateToStep?: (step: number) => void;
  isOwner?: boolean;
  canViewSummary?: boolean;
  onClosed?: () => void;
}

// ============== AI CONSTANTS ==============

const PROMPT_TEMPLATES: Array<{
  id: PromptTemplate;
  name: string;
  description: string;
  icon: string;
  color: string;
}> = [
  { id: 'comprehensive', name: 'Comprehensive', description: 'ครบทุกมิติ', icon: '🎯', color: 'from-blue-500 to-indigo-600' },
  { id: 'itinerary',     name: 'Itinerary',     description: 'วางเส้นทางทริป', icon: '🗺️', color: 'from-green-500 to-emerald-600' },
  { id: 'budget',        name: 'Budget',         description: 'วิเคราะห์งบ', icon: '💰', color: 'from-yellow-500 to-orange-600' },
  { id: 'activities',    name: 'Activities',     description: 'แนะนำกิจกรรม', icon: '🎪', color: 'from-purple-500 to-pink-600' },
  { id: 'accommodation', name: 'Accommodation',  description: 'ค้นหาที่พัก', icon: '🏨', color: 'from-red-500 to-rose-600' },
  { id: 'optimization',  name: 'Optimizer',      description: 'ปรับปรุงแผน', icon: '⚡', color: 'from-cyan-500 to-teal-600' },
];

const MODEL_ICON_MAP: Record<AIModel, string> = {
  'gpt-4': '🧠',
  'gpt-3.5-turbo': '⚡',
  'claude-3-opus': '🎯',
  'claude-3-sonnet': '🎨',
  'gemini-pro': '💎',
};

// ============== COMPONENT ==============

export const StepSummary: React.FC<StepSummaryProps> = ({
  trip,
  initialSummaryData,
  onNavigateToStep,
  isOwner,
  canViewSummary,
  onClosed,
}) => {

  // ── Summary data ──
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── AI config ──
  const [selectedModel, setSelectedModel] = useState<AIModel>('claude-3-sonnet');
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate>('comprehensive');
  const [promptConfig, setPromptConfig] = useState<PromptConfig>({
    model: 'claude-3-sonnet',
    template: 'comprehensive',
    temperature: 0.7,
    maxTokens: 4000,
    includeCOT: true,
    includeExamples: false,
    structured: false,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'templates' | 'models'>('templates');
  const [copied, setCopied] = useState<Record<string, boolean>>({});
  const [isClosing, setIsClosing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [aiMeta, setAiMeta] = useState<any>(null);

  // ── Sync config ──
  useEffect(() => {
    setPromptConfig(prev => ({ ...prev, model: selectedModel, template: selectedTemplate }));
  }, [selectedModel, selectedTemplate]);

  // ── Fetch summary data ──
  // useEffect 1: fetch vote data ครั้งเดียวตอน mount
  useEffect(() => {
    if (!trip?.tripid) return;

    const fetchVoteData = async () => {
      try {
        setIsLoading(true);
        const [dateRes, budgetRes, locRes] = await Promise.all([
          voteAPI.getDateMatchingResult(trip.tripid),
          voteAPI.getBudgetVoting(trip.tripid),
          voteAPI.getLocationVote(trip.tripid),
        ]);
        // ... map data เหมือนเดิม
      } catch (err) {
        console.error('Failed to load vote data', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVoteData();
  }, [trip?.tripid]);


  // useEffect 2: fetch AI summary เฉพาะตอน canViewSummary = true
  useEffect(() => {
    if (!trip?.tripid) return;
    if (!canViewSummary) return; // ← guard 

    const fetchAiSummary = async () => {
      try {
        const summaryRes = await tripAPI.getTripSummary(trip.tripid, selectedTemplate);
        if (summaryRes?.data?.aiSummary) {
          setAiSummary(summaryRes.data.aiSummary);
          setAiMeta(summaryRes.data.aiMeta);
        }
      } catch (err) {
        console.error('Failed to load AI summary', err);
      }
    };

    fetchAiSummary();
  }, [trip?.tripid, selectedTemplate, canViewSummary]);

  // ── Helpers ──
  const memberCount = trip.membercount || trip.members?.length || 0;
  const totalAvgBudget = summaryData
    ? Object.values(summaryData.avgBudget).reduce((a, b) => a + b, 0)
    : 0;

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 2000);
  };

  const handleCloseVoting = async () => {
    if (!confirm('ยืนยันปิดการโหวต? สมาชิกจะไม่สามารถแก้ไขข้อมูลได้อีก')) return;
    try {
      setIsClosing(true);
      await voteAPI.manualClose(trip.tripid);
      onClosed?.();
    } catch (err) {
      console.error(err);
      alert('ปิดการโหวตไม่สำเร็จ');
    } finally {
      setIsClosing(false);
    }
  };

  const prompt = aiSummary;
  const metadata = aiMeta ?? {
    estimatedTokens: 0,
    estimatedCost: 0,
    model: selectedModel,
    version: '1.0.0',
    timestamp: ''
  };

  // ============== LOADING ==============
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500">กำลังโหลดข้อมูลสรุป...</p>
      </div>
    );
  }

  // ============== RENDER ==============
  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="bg-white p-6 rounded-xl shadow-lg text-center">
        <div className="text-6xl mb-3">🎉</div>
        <h2 className="text-2xl font-bold mb-2">กรอกข้อมูลครบแล้ว!</h2>
        <p className="text-gray-500">รอเพื่อนๆ กรอกข้อมูลให้ครบเพื่อดูผลสรุป</p>
      </div>

      {/* ── Progress ── */}
      <div className="bg-white p-5 rounded-xl shadow-lg">
        <p className="text-sm font-bold text-gray-700 mb-3">📊 ความคืบหน้าของทริป</p>
        <div className="space-y-3">
          {[
            { label: '📅 กรอกวันที่แล้ว',    count: summaryData?.progress.dates    || 0 },
            { label: '💰 กรอกงบแล้ว',         count: summaryData?.progress.budget   || 0 },
            { label: '📍 โหวตจังหวัดแล้ว',   count: summaryData?.progress.location || 0 },
          ].map(({ label, count }) => (
            <div key={label}>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{label}</span>
                <span className="font-semibold">{count}/{memberCount} คน</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                  style={{ width: `${memberCount > 0 ? Math.min(100, (count / memberCount) * 100) : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Summary Data (blurred until open) ── */}
      <div className="relative">
        {/* Blur overlay */}
        {!canViewSummary && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl">
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm rounded-xl" />
            <div className="relative z-10 text-center px-6">
              <div className="text-5xl mb-3">🔒</div>
              <p className="font-bold text-gray-800 text-lg mb-1">
                {isOwner ? 'ปิดการโหวตเพื่อดูผลสรุป' : 'รอเจ้าของทริปปิดการโหวต'}
              </p>
              <p className="text-sm text-gray-500">
                {isOwner ? 'กดปุ่มด้านล่างเมื่อทุกคนกรอกครบ' : 'หรือรอครบ 7 วันหลังสร้างทริป'}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white p-5 rounded-xl shadow-lg space-y-5">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            ผลสรุปของทริป
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* วันที่ */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> วันที่แนะนำ
              </p>
              {summaryData?.bestDates.length ? (
                <div className="flex flex-wrap gap-2">
                  {summaryData.bestDates.map((date, idx) => (
                    <div key={date} className="flex items-center gap-1 bg-white border border-gray-100 rounded px-2.5 py-1.5">
                      <span className="text-xs">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                      <span className="text-xs font-medium text-gray-700">
                        {new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-xs">ยังไม่มีข้อมูลเพียงพอ</p>
              )}
            </div>

            {/* งบประมาณ */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" /> งบประมาณเฉลี่ยกลุ่ม
              </p>
              {summaryData ? (
                <div className="space-y-1.5">
                  {[
                    { key: 'accommodation', label: '🏠 ที่พัก' },
                    { key: 'transport',     label: '🚗 เดินทาง' },
                    { key: 'food',          label: '🍜 อาหาร' },
                    { key: 'other',         label: '🎒 สำรอง' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex justify-between bg-white border border-gray-100 rounded px-2.5 py-1.5">
                      <span className="text-xs text-gray-600">{label}</span>
                      <span className="text-xs font-semibold text-gray-800">
                        ฿{formatCurrency(summaryData.avgBudget[key as keyof typeof summaryData.avgBudget])}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between bg-blue-50 border border-blue-100 rounded px-2.5 py-1.5 mt-1">
                    <span className="text-xs font-bold text-blue-700">รวม</span>
                    <span className="text-sm font-bold text-blue-700">฿{formatCurrency(totalAvgBudget)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-xs">ยังไม่มีข้อมูลเพียงพอ</p>
              )}
            </div>

            {/* จังหวัด */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> จังหวัดยอดนิยม
              </p>
              {summaryData?.topLocations.length ? (
                <div className="space-y-1.5">
                  {summaryData.topLocations.map((loc, idx) => (
                    <div key={loc.place} className="flex justify-between bg-white border border-gray-100 rounded px-2.5 py-1.5">
                      <span className="text-xs font-medium text-gray-700">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'} {loc.place}
                      </span>
                      <span className="text-xs text-gray-400">{loc.total_score} คะแนน</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-xs">ยังไม่มีข้อมูลเพียงพอ</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Prompt Studio (blurred until open) ── */}
      <div className="relative">
        {!canViewSummary && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl">
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm rounded-xl" />
            <div className="relative z-10 text-center px-6">
              <div className="text-4xl mb-2">🤖🔒</div>
              <p className="font-bold text-gray-700">AI Prompt พร้อมใช้เมื่อเปิดการโหวต</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-5 space-y-5">
          {/* Header + Tabs */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              AI Prompt Studio
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('templates')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === 'templates' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Templates
              </button>
              <button
                onClick={() => setActiveTab('models')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === 'models' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Models
              </button>
            </div>
          </div>

          {/* Template Selector */}
          {activeTab === 'templates' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PROMPT_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`p-3 rounded-xl border-2 text-left transition ${selectedTemplate === t.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white hover:border-purple-300'}`}
                >
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${t.color} flex items-center justify-center text-xl mb-2`}>
                    {t.icon}
                  </div>
                  <p className="text-xs font-bold text-gray-800">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.description}</p>
                </button>
              ))}
            </div>
          )}

          {/* Model Selector */}
          {activeTab === 'models' && (
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(MODEL_CONFIGS) as AIModel[]).map(model => {
                const cfg = MODEL_CONFIGS[model];
                const isSelected = selectedModel === model;
                return (
                  <button
                    key={model}
                    onClick={() => setSelectedModel(model)}
                    className={`p-3 rounded-xl border-2 text-left transition ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xl">{MODEL_ICON_MAP[model]}</span>
                      {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                    <p className="text-xs font-bold text-gray-800">{cfg.name}</p>
                    <p className="text-xs text-gray-500">{cfg.provider}</p>
                    <p className="text-xs font-mono text-green-600 mt-1">${cfg.costPer1kTokens.input}/1k</p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Advanced Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition"
          >
            <span className="flex items-center gap-2"><Settings className="w-4 h-4" /> Advanced Options</span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvanced && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Temperature: {promptConfig.temperature}</label>
                  <input type="range" min="0" max="1" step="0.1" value={promptConfig.temperature}
                    onChange={e => setPromptConfig(p => ({ ...p, temperature: parseFloat(e.target.value) }))}
                    className="w-full" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Max Tokens: {promptConfig.maxTokens}</label>
                  <input type="range" min="1000" max="8000" step="500" value={promptConfig.maxTokens}
                    onChange={e => setPromptConfig(p => ({ ...p, maxTokens: parseInt(e.target.value) }))}
                    className="w-full" />
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { key: 'includeCOT', label: 'Chain-of-Thought (CoT)', note: '+20% tokens' },
                  { key: 'includeExamples', label: 'Few-Shot Examples', note: '+30% tokens' },
                  { key: 'structured', label: 'Structured JSON Output', note: 'machine-readable' },
                ].map(({ key, label, note }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox"
                      checked={promptConfig[key as keyof PromptConfig] as boolean}
                      onChange={e => setPromptConfig(p => ({ ...p, [key]: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-xs text-gray-700">{label}</span>
                    <span className="text-xs text-gray-400">({note})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Bar */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-white/10 rounded-lg p-2">
                <p className="text-xs text-white/70">Model</p>
                <p className="text-sm font-bold">{MODEL_ICON_MAP[selectedModel]} {MODEL_CONFIGS[selectedModel].name.split(' ')[0]}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-2">
                <p className="text-xs text-white/70">Template</p>
                <p className="text-sm font-bold">{PROMPT_TEMPLATES.find(t => t.id === selectedTemplate)?.icon} {selectedTemplate}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-2">
                <p className="text-xs text-white/70">Tokens</p>
                <p className="text-sm font-bold font-mono">{canViewSummary ? metadata.estimatedTokens.toLocaleString() : '—'}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-2">
                <p className="text-xs text-white/70">Est. Cost</p>
                <p className="text-sm font-bold font-mono text-yellow-300">
                  {canViewSummary ? `$${metadata.estimatedCost.toFixed(4)}` : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {canViewSummary && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleCopy('prompt', prompt)}
                className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition shadow-lg text-sm"
              >
                {copied.prompt ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Prompt</>}
              </button>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center justify-center gap-2 py-3 bg-gray-700 hover:bg-gray-800 text-white font-bold rounded-xl transition text-sm"
              >
                <Code className="w-4 h-4" />
                {showPreview ? 'Hide' : 'Preview'}
              </button>
            </div>
          )}

          {/* Prompt Preview */}
          {showPreview && canViewSummary && (
            <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-xs overflow-x-auto">
              <div className="flex justify-between items-center mb-2 text-gray-400">
                <span className="flex items-center gap-2"><Code className="w-4 h-4" /> Prompt Preview</span>
                <button onClick={() => handleCopy('preview', prompt)}>
                  {copied.preview ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <pre className="whitespace-pre-wrap break-words max-h-64 overflow-y-auto">{prompt}</pre>
            </div>
          )}

          {/* Quick Links */}
          {canViewSummary && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">🔗 เปิด AI แล้ววางโพรมต์เลย</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { href: 'https://chat.openai.com', icon: '🧠', label: 'ChatGPT' },
                  { href: 'https://claude.ai', icon: '🎯', label: 'Claude' },
                  { href: 'https://gemini.google.com', icon: '💎', label: 'Gemini' },
                ].map(({ href, icon, label }) => (
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition text-xs font-medium text-gray-700">
                    <span>{icon}</span>{label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Edit ── */}
      {onNavigateToStep && !canViewSummary && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800 font-semibold mb-3">🔧 ต้องการแก้ไขข้อมูล?</p>
          <div className="flex flex-wrap gap-2">
            {[
              { step: 2, label: 'แก้ไขวันที่' },
              { step: 3, label: 'แก้ไขงบประมาณ' },
              { step: 4, label: 'แก้ไขจังหวัด' },
            ].map(({ step, label }) => (
              <button key={step} onClick={() => onNavigateToStep(step)}
                className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 transition">
                ✏️ {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Action Button ── */}
      {isOwner && !canViewSummary && (
        <button
          onClick={handleCloseVoting}
          disabled={isClosing}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition"
        >
          {isClosing ? '⏳ กำลังปิดการโหวต...' : '🔐 ปิดการโหวตและดูผลสรุป →'}
        </button>
      )}

      {isOwner && canViewSummary && (
        <div className="w-full py-4 bg-green-50 border border-green-200 rounded-xl text-center text-green-700 font-semibold">
          ✅ การโหวตปิดแล้ว
        </div>
      )}

      {!isOwner && !canViewSummary && (
        <div className="w-full py-4 bg-gray-100 rounded-xl text-center text-gray-400 text-sm">
          🔒 รอเจ้าของทริปปิดการโหวต หรือรอครบ 7 วัน
        </div>
      )}
    </div>
  );
};

export default StepSummary;