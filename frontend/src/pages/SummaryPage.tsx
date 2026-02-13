// src/pages/SummaryPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Copy,
  Calendar,
  Users,
  DollarSign,
  MapPin,
  Sparkles,
  Check,
  Loader2,
  Download,
  Share2,
  Zap,
  Brain,
  Target,
  Palette,
  Gem,
  ChevronDown,
  ChevronUp,
  Code,
  Settings,
  TrendingUp
} from "lucide-react";
import Header from "../components/Header";
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle } from "lucide-react";
import { tripAPI } from '../services/tripService';
import { formatCurrency } from '../utils';
import type { TripSummaryResult } from '../types';
import {
  PromptEngineering,
  MODEL_CONFIGS,
  type AIModel,
  type PromptTemplate,
  type PromptConfig
} from '../utils/promptEngineering';

// ============== TYPES ==============

interface CopiedState {
  [key: string]: boolean;
}

// ============== CONSTANTS ==============

const PROMPT_TEMPLATES: Array<{
  id: PromptTemplate;
  name: string;
  description: string;
  icon: string;
  color: string;
  useCases: string[];
}> = [
  {
    id: 'comprehensive',
    name: 'Comprehensive Planning',
    description: 'ครบทุกมิติ - วางแผนทุกอย่างในคำถามเดียว',
    icon: '🎯',
    color: 'from-blue-500 to-indigo-600',
    useCases: ['First-time planning', 'Need full guidance', 'Multiple questions']
  },
  {
    id: 'itinerary',
    name: 'Itinerary Builder',
    description: 'วางเส้นทางทริปทั้งหมด ชั่วโมงต่อชั่วโมง',
    icon: '🗺️',
    color: 'from-green-500 to-emerald-600',
    useCases: ['Day-by-day planning', 'Route optimization', 'Time management']
  },
  {
    id: 'budget',
    name: 'Budget Analyzer',
    description: 'วิเคราะห์และเพิ่มประสิทธิภาพงบประมาณ',
    icon: '💰',
    color: 'from-yellow-500 to-orange-600',
    useCases: ['Budget validation', 'Cost optimization', 'Expense planning']
  },
  {
    id: 'activities',
    name: 'Activity Finder',
    description: 'แนะนำกิจกรรมและสถานที่เที่ยว',
    icon: '🎪',
    color: 'from-purple-500 to-pink-600',
    useCases: ['Things to do', 'Hidden gems', 'Group activities']
  },
  {
    id: 'accommodation',
    name: 'Accommodation Scout',
    description: 'ค้นหาที่พักที่เหมาะสมในงบ',
    icon: '🏨',
    color: 'from-red-500 to-rose-600',
    useCases: ['Hotel search', 'Booking tips', 'Group rooms']
  },
  {
    id: 'optimization',
    name: 'Trip Optimizer',
    description: 'ปรับปรุงแผนที่มีอยู่ให้ดีขึ้น',
    icon: '⚡',
    color: 'from-cyan-500 to-teal-600',
    useCases: ['Improve existing plan', 'Fix issues', 'Enhance experience']
  }
];

const MODEL_ICON_MAP: Record<AIModel, string> = {
  'gpt-4': '🧠',
  'gpt-3.5-turbo': '⚡',
  'claude-3-opus': '🎯',
  'claude-3-sonnet': '🎨',
  'gemini-pro': '💎'
};

// ============== MAIN COMPONENT ==============

const SummaryPage: React.FC = () => {
  const { tripCode } = useParams<{ tripCode: string }>();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // ============== STATE ==============
  const [tripData, setTripData] = useState<TripSummaryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<CopiedState>({});
  
  // AI Configuration State
  const [selectedModel, setSelectedModel] = useState<AIModel>('claude-3-sonnet');
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate>('comprehensive');
  const [promptConfig, setPromptConfig] = useState<PromptConfig>({
    model: 'claude-3-sonnet',
    template: 'comprehensive',
    temperature: 0.7,
    maxTokens: 4000,
    includeCOT: true,
    includeExamples: false,
    structured: false
  });
  
  // UI State
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'templates' | 'models'>('templates');
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [canView, setCanView] = useState(false);
  const [showDateTable, setShowDateTable] = useState(false);

  // ============== EFFECTS ==============

  useEffect(() => {
    const loadTripSummary = async () => {
      if (!tripCode) {
        alert("ไม่พบรหัสทริป");
        navigate("/homepage");
        return;
      }

      try {
        setLoading(true);
        const response = await tripAPI.getTripSummary(tripCode);

        if (!response.success || !response.data) {
          throw new Error('ไม่พบข้อมูลทริป');
        }

        setTripData(response.data);
        const ownerCheck = response.data.trip.owner_id === user?.user_id;
        setIsOwner(ownerCheck);
        // ตรวจสอบเงื่อนไขการดูสรุป (owner หรือ ครบ 7 วัน)
        const createdAt = new Date(response.data.trip.created_at);
        const diffDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        const unlocked = diffDays >= 7;

        setCanView(ownerCheck || unlocked);

        if (!ownerCheck && !unlocked) {
          const daysLeft = Math.ceil(7 - diffDays);
          setError(`สรุปผลจะเปิดให้ดูได้ในอีก ${daysLeft} วัน`);
        }

        console.log('✅ Loaded:', response.data);

      } catch (error) {
        console.error("Error loading trip:", error);
        setLoadError("ไม่สามารถโหลดข้อมูลทริปได้");
      } finally {
        setLoading(false);
      }
    };

    loadTripSummary();
  }, [tripCode, navigate]);

  // Update config when model or template changes
  useEffect(() => {
    setPromptConfig(prev => ({
      ...prev,
      model: selectedModel,
      template: selectedTemplate
    }));
  }, [selectedModel, selectedTemplate]);

  // ============== HANDLERS ==============

  const handleLogout = () => {
    logout();
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopied(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const handleExport = () => {
    if (!tripData) return;

    const { prompt, metadata } = PromptEngineering.generatePromptWithMetadata(
      tripData,
      promptConfig
    );

    const exportData = {
      trip: {
        code: tripCode,
        name: tripData.trip.trip_name,
        exported_at: new Date().toISOString()
      },
      prompt: {
        text: prompt,
        metadata: metadata,
        config: promptConfig
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trip-${tripCode}-ai-prompt.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!tripData) return;

    const prompt = PromptEngineering.generatePrompt(tripData, promptConfig);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `AI Prompt: ${tripData.trip.trip_name}`,
          text: prompt
        });
      } catch (err) {
        console.log('Share cancelled or failed');
      }
    } else {
      handleCopy('share', prompt);
      alert('Link copied! (Share API not supported)');
    }
  };

  // ============== RENDER HELPERS ==============

  const renderModelSelector = () => {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">🤖 Select AI Model</h3>
          <button
            onClick={() => setActiveTab(activeTab === 'models' ? 'templates' : 'models')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {activeTab === 'models' ? 'Show Templates' : 'Show Models'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(MODEL_CONFIGS) as AIModel[]).map((model) => {
            const config = MODEL_CONFIGS[model];
            const isSelected = selectedModel === model;

            return (
              <button
                key={model}
                onClick={() => setSelectedModel(model)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{MODEL_ICON_MAP[model]}</span>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">
                        {config.name}
                      </p>
                      <p className="text-xs text-gray-500">{config.provider}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-5 h-5 text-blue-600" />
                  )}
                </div>

                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Max tokens:</span>
                    <span className="font-mono">{config.maxTokens}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost/1k:</span>
                    <span className="font-mono text-green-600">
                      ${config.costPer1kTokens.input.toFixed(4)}
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                  {config.strengths.slice(0, 2).map((strength, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full"
                    >
                      {strength}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTemplateSelector = () => {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-800">📝 Choose Prompt Template</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PROMPT_TEMPLATES.map((template) => {
            const isSelected = selectedTemplate === template.id;

            return (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center text-2xl`}>
                      {template.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">
                        {template.name}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {template.description}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  )}
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                  {template.useCases.map((useCase, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full"
                    >
                      {useCase}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAdvancedOptions = () => {
    if (!showAdvancedOptions) return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
        <h4 className="font-bold text-gray-800 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Advanced Configuration
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Temperature: {promptConfig.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={promptConfig.temperature}
              onChange={(e) =>
                setPromptConfig((prev) => ({
                  ...prev,
                  temperature: parseFloat(e.target.value)
                }))
              }
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lower = more focused, Higher = more creative
            </p>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Tokens: {promptConfig.maxTokens}
            </label>
            <input
              type="range"
              min="1000"
              max="8000"
              step="500"
              value={promptConfig.maxTokens}
              onChange={(e) =>
                setPromptConfig((prev) => ({
                  ...prev,
                  maxTokens: parseInt(e.target.value)
                }))
              }
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Response length limit
            </p>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={promptConfig.includeCOT}
              onChange={(e) =>
                setPromptConfig((prev) => ({
                  ...prev,
                  includeCOT: e.target.checked
                }))
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">
              Chain-of-Thought (CoT) Prompting
            </span>
            <span className="text-xs text-gray-500">
              (Better reasoning, +20% tokens)
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={promptConfig.includeExamples}
              onChange={(e) =>
                setPromptConfig((prev) => ({
                  ...prev,
                  includeExamples: e.target.checked
                }))
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">
              Few-Shot Examples
            </span>
            <span className="text-xs text-gray-500">
              (Show examples, +30% tokens)
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={promptConfig.structured}
              onChange={(e) =>
                setPromptConfig((prev) => ({
                  ...prev,
                  structured: e.target.checked
                }))
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">
              Structured JSON Output
            </span>
            <span className="text-xs text-gray-500">
              (Machine-readable format)
            </span>
          </label>
        </div>
      </div>
    );
  };

  const renderPromptPreview = () => {
    if (!tripData || !showPromptPreview) return null;

    const { prompt, metadata } = PromptEngineering.generatePromptWithMetadata(
      tripData,
      promptConfig
    );

    return (
      <div className="mt-4 p-4 bg-gray-900 text-green-400 rounded-lg font-mono text-xs overflow-x-auto">
        <div className="flex items-center justify-between mb-3 text-gray-400">
          <span className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            Prompt Preview
          </span>
          <button
            onClick={() => handleCopy('preview', prompt)}
            className="text-green-400 hover:text-green-300 transition"
          >
            {copied.preview ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="mb-3 pb-3 border-b border-gray-700 text-gray-400 text-xs">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="text-gray-500">Tokens:</span>{' '}
              <span className="text-green-400">{metadata.estimatedTokens}</span>
            </div>
            <div>
              <span className="text-gray-500">Est. Cost:</span>{' '}
              <span className="text-yellow-400">${metadata.estimatedCost.toFixed(4)}</span>
            </div>
            <div>
              <span className="text-gray-500">Model:</span>{' '}
              <span className="text-blue-400">{metadata.model}</span>
            </div>
          </div>
        </div>

        <pre className="whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
          {prompt}
        </pre>
      </div>
    );
  };

  // ============== LOADING STATE ==============

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header onLogout={handleLogout} />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600 text-lg">Loading trip data...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header onLogout={handleLogout} />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <p className="text-xl text-gray-700 mb-4">{loadError}</p>
          <button onClick={() => navigate('/homepage')} className="px-6 py-3 bg-blue-600 text-white rounded-lg">
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  if (!canView && error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header onLogout={handleLogout} />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
          <p className="text-xl text-gray-700 mb-2">ยังดูไม่ได้</p>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => navigate('/homepage')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  if (!tripData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-700 mb-4">Trip not found</p>
          <button
            onClick={() => navigate('/homepage')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ============== MAIN RENDER ==============

  const { prompt, metadata } = PromptEngineering.generatePromptWithMetadata(
    tripData,
    promptConfig
  );

  const selectedTemplateData = PROMPT_TEMPLATES.find(t => t.id === selectedTemplate)!;
  const modelConfig = MODEL_CONFIGS[selectedModel];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header onLogout={handleLogout} />

            {/* ← เพิ่ม Top Bar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => navigate("/homepage")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition-colors"
          >
            ◄ กลับไปหน้าหลัก
          </button>

          <div className="flex items-center gap-3">
            {/* ปุ่มคัดลอกรหัส */}
            <button
              className={`px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1.5 sm:gap-2 transition-all font-mono text-sm sm:text-base min-w-[44px] min-h-[44px] ${
                copied.code
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
              }`}
              onClick={() => handleCopy('code', tripCode || '')}
              title="คลิกเพื่อคัดลอกรหัสห้อง"
            >
              <span className="truncate max-w-[80px] sm:max-w-none">{tripCode}</span>
              <Copy className="w-4 h-4" />
            </button>

            {/* ปุ่มแชร์ลิงก์ */}
            <button
              className={`px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1.5 sm:gap-2 transition-all text-sm sm:text-base min-w-[44px] min-h-[44px] ${
                copied.link
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
              }`}
              onClick={() => handleCopy('link', window.location.href)}
              title="แชร์ลิงก์ทริป"
            >
              <span className="hidden sm:inline">แชร์ลิงก์</span>
              <span className="sm:hidden">แชร์</span>
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="py-6 px-4 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">
                🤖 AI-Powered Trip Planning
              </h1>
              <p className="text-sm text-gray-600">
                Generate optimized prompts for AI assistants
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
            <span className="font-mono bg-blue-100 px-3 py-1.5 rounded-lg text-blue-700 font-semibold">
              {tripCode}
            </span>
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {tripData.members?.length || 0} members
            </span>
          </div>
        </div>

        {/* Trip Summary Row */}
         <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
            <Sparkles className="w-5 h-5 text-purple-600" />
            สรุปผลทริป
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* วันที่ */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> วันที่แนะนำ
              </p>

              {tripData.dateResult ? (
                <div className="space-y-1.5">
                  {(tripData.dateResult.fullMatches?.length > 0
                    ? tripData.dateResult.fullMatches.slice(0, 3).map(range => ({
                        label: `${new Date(range[0]).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} - ${new Date(range[range.length - 1]).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`,
                        count: null
                      }))
                    : Object.entries(tripData.dateResult.weighted || {})
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 3)
                        .map(([date, count]) => ({
                          label: new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
                          count
                        }))
                  ).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white border border-gray-100 rounded px-2.5 py-1.5">
                    <span className="text-xs font-medium text-gray-700">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'} {item.label}
                      </span>
                      {item.count !== null && (
                        <span className="text-xs text-gray-400">{item.count} คน</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-xs">ยังไม่มีข้อมูล</p>
              )}
            </div>

            {/* งบประมาณ */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" /> งบประมาณเฉลี่ย
              </p>

              {tripData.budgetResult ? (
                <div className="space-y-1.5">
                  {[
                    { key: 'accommodation', label: 'ที่พัก' },
                    { key: 'transport',     label: 'เดินทาง' },
                    { key: 'food',          label: 'อาหาร' },
                    { key: 'other',         label: 'สำรอง' }
                  ].map(({ key, label }) => {
                    const stat = tripData.budgetResult![key as keyof typeof tripData.budgetResult];
                    return (
                      <div key={key} className="flex items-center justify-between bg-white border border-gray-100 rounded px-2.5 py-1.5">
                        <span className="text-xs text-gray-600">{label}</span>
                        <span className="text-xs font-semibold text-gray-800">
                          ฿{formatCurrency(Math.round(stat?.mean || 0))}
                        </span>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded px-2.5 py-1.5 mt-2">
                    <span className="text-xs font-bold text-blue-700">รวม</span>
                    <span className="text-sm font-bold text-blue-700">
                      ฿{formatCurrency(Math.round(
                        ['accommodation', 'transport', 'food', 'other']
                          .reduce((s, k) => s + (tripData.budgetResult![k as keyof typeof tripData.budgetResult]?.mean || 0), 0)
                      ))}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-xs">ยังไม่มีข้อมูล</p>
              )}
            </div>

            {/* จังหวัด */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> จังหวัดยอดนิยม
              </p>

              {tripData.locationResult ? (
                <div className="space-y-1.5">
                  {(Array.isArray(tripData.locationResult)
                    ? tripData.locationResult
                    : [tripData.locationResult]
                  ).slice(0, 3).map((loc, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white border border-gray-100 rounded px-2.5 py-1.5">
                      <span className="text-xs font-medium text-gray-700">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'} {loc.province_name}
                      </span>
                      <span className="text-xs text-gray-400">{loc.vote_count} คะแนน</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-xs">ยังไม่มีข้อมูล</p>
              )}
            </div>

          </div>
        </div>

        {/* AI Configuration Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-600" />
              Prompt Engineering Studio
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('templates')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'templates'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Templates
              </button>
              <button
                onClick={() => setActiveTab('models')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'models'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Models
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mb-4">
            {activeTab === 'templates' ? renderTemplateSelector() : renderModelSelector()}
          </div>

          {/* Advanced Options Toggle */}
          <button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-sm font-medium text-gray-700"
          >
            <span className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Advanced Options
            </span>
            {showAdvancedOptions ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {renderAdvancedOptions()}
        </div>

        {/* Prompt Statistics */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Prompt Analytics
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-xs text-white/70 mb-1">Model</p>
              <p className="text-xl font-bold flex items-center gap-2">
                {MODEL_ICON_MAP[selectedModel]} {modelConfig.name}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-xs text-white/70 mb-1">Template</p>
              <p className="text-xl font-bold">
                {selectedTemplateData.icon} {selectedTemplateData.name.split(' ')[0]}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-xs text-white/70 mb-1">Estimated Tokens</p>
              <p className="text-2xl font-bold font-mono">
                {metadata.estimatedTokens.toLocaleString()}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-xs text-white/70 mb-1">Estimated Cost</p>
              <p className="text-2xl font-bold font-mono text-yellow-300">
                ${metadata.estimatedCost.toFixed(4)}
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-white/10 backdrop-blur rounded-lg text-xs">
            <p className="text-white/90">
              💡 <strong>Tip:</strong> Lower temperature for factual planning, higher for creative suggestions.
              CoT prompting improves reasoning but increases token usage.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            🚀 Ready to Use
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => handleCopy('main', prompt)}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition shadow-lg hover:shadow-xl"
            >
              {copied.main ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>Copy Prompt</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowPromptPreview(!showPromptPreview)}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-700 hover:bg-gray-800 text-white font-bold rounded-xl transition shadow-lg"
            >
              <Code className="w-5 h-5" />
              <span>{showPromptPreview ? 'Hide' : 'Show'} Preview</span>
            </button>

            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-lg"
            >
              <Download className="w-5 h-5" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition shadow-lg"
            >
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </button>
          </div>

          {renderPromptPreview()}

          <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>💡 Next Steps:</strong>
            </p>
            <ol className="mt-2 space-y-1 text-sm text-blue-800">
              <li>1. Copy the generated prompt</li>
              <li>2. Open your preferred AI (ChatGPT, Claude, Gemini)</li>
              <li>3. Paste and submit</li>
              <li>4. Get personalized travel recommendations!</li>
            </ol>
          </div>
        </div>

        {/* Quick Links to AI Platforms */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            🔗 Quick Access to AI Platforms
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <a
              href="https://chat.openai.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-2 border-green-200 rounded-xl transition"
            >
              <span className="text-3xl">🧠</span>
              <div>
                <p className="font-bold text-gray-800">ChatGPT</p>
                <p className="text-xs text-gray-600">OpenAI</p>
              </div>
            </a>

            <a
              href="https://claude.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border-2 border-orange-200 rounded-xl transition"
            >
              <span className="text-3xl">🎯</span>
              <div>
                <p className="font-bold text-gray-800">Claude</p>
                <p className="text-xs text-gray-600">Anthropic</p>
              </div>
            </a>

            <a
              href="https://gemini.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-2 border-blue-200 rounded-xl transition"
            >
              <span className="text-3xl">💎</span>
              <div>
                <p className="font-bold text-gray-800">Gemini</p>
                <p className="text-xs text-gray-600">Google</p>
              </div>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-xs space-y-2">
          <p className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            Powered by Advanced Prompt Engineering
          </p>
          <p>v{metadata.version} • {new Date(metadata.timestamp).toLocaleDateString('th-TH')}</p>
        </div>
      </div>
    </div>
  );
};

export default SummaryPage;