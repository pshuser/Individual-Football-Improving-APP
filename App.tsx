import React, { useState, useEffect, useRef } from 'react';
import { ViewState, Drill, ChatMessage, UserStats, TrainingPlan, VideoAnalysisResult, TacticalScenario, Language } from './types';
import { SAMPLE_DRILLS, INITIAL_STATS, TRANSLATIONS } from './constants';
import { 
  createCoachChat, 
  generateCustomDrills, 
  generateTrainingPlan, 
  analyzeVideoTechnique,
  generateTacticalScenario,
  evaluateTacticalDecision
} from './services/geminiService';
import DrillCard from './components/DrillCard';
import { 
  Activity, 
  Dumbbell, 
  Brain, 
  MessageSquare, 
  LayoutDashboard, 
  Send, 
  Loader2, 
  Plus,
  Sparkles,
  Trophy,
  Video,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Target,
  ClipboardList,
  Upload,
  Moon,
  Sun,
  Globe
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import { GenerateContentResponse } from '@google/genai';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [stats] = useState<UserStats>(INITIAL_STATS);
  // Initialize with correct language drills
  const [drills, setDrills] = useState<Drill[]>(SAMPLE_DRILLS['zh']);
  
  // Settings State
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [language, setLanguage] = useState<Language>('zh');

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Drill Gen State
  const [isGeneratingDrills, setIsGeneratingDrills] = useState(false);
  const [drillPrompt, setDrillPrompt] = useState('');
  const [drillLevel, setDrillLevel] = useState('Intermediate');
  const [showDrillModal, setShowDrillModal] = useState(false);
  
  // Training Plan State
  const [activePlan, setActivePlan] = useState<TrainingPlan | null>(null);
  const [planGoal, setPlanGoal] = useState('Technique & Ball Control');
  const [planDays, setPlanDays] = useState('3 days/week');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);

  // Video Analyst State
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResult | null>(null);

  // Tactics State
  const [currentScenario, setCurrentScenario] = useState<TacticalScenario | null>(null);
  const [scenarioResult, setScenarioResult] = useState<string | null>(null);
  const [isLoadingScenario, setIsLoadingScenario] = useState(false);

  // Helper for translations
  const t = TRANSLATIONS[language];

  // Initialize/Reset Chat and Drills when language changes
  useEffect(() => {
    // Reset Chat
    chatSessionRef.current = createCoachChat(language);
    setChatMessages([
      { 
        id: '0', 
        role: 'model', 
        text: t.coach.welcome, 
        timestamp: new Date() 
      }
    ]);

    // Reset Drills to localized sample set
    // Note: In a real app we might want to preserve user generated drills, 
    // but for this demo we reset to ensure content matches language.
    setDrills(SAMPLE_DRILLS[language]);
  }, [language]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, view]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en');
  };

  // --- Handlers ---

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !chatSessionRef.current) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const resultStream = await chatSessionRef.current.sendMessageStream({ message: userMsg.text });
      
      let fullResponseText = '';
      const modelMsgId = (Date.now() + 1).toString();
      
      setChatMessages(prev => [...prev, {
        id: modelMsgId,
        role: 'model',
        text: '',
        timestamp: new Date()
      }]);

      for await (const chunk of resultStream) {
        const c = chunk as GenerateContentResponse;
        const text = c.text || '';
        fullResponseText += text;
        
        setChatMessages(prev => prev.map(msg => 
          msg.id === modelMsgId ? { ...msg, text: fullResponseText } : msg
        ));
      }
    } catch (error) {
      console.error("Chat error", error);
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Connection error.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGenerateDrills = async () => {
    if (!drillPrompt.trim()) return;
    
    setIsGeneratingDrills(true);
    const newDrills = await generateCustomDrills(drillPrompt, drillLevel, language);
    
    if (newDrills.length > 0) {
      setDrills(prev => [...newDrills, ...prev]);
      setShowDrillModal(false);
      setDrillPrompt('');
    }
    setIsGeneratingDrills(false);
  };

  const handleGeneratePlan = async () => {
    setIsGeneratingPlan(true);
    const plan = await generateTrainingPlan(drillLevel, planGoal, planDays, language);
    if (plan) {
      setActivePlan(plan);
      setShowPlanForm(false);
    }
    setIsGeneratingPlan(false);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedVideo(file);
      setVideoUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
    }
  };

  const handleAnalyzeVideo = async () => {
    if (!selectedVideo) return;
    setIsAnalyzingVideo(true);
    
    // Convert to base64
    const reader = new FileReader();
    reader.readAsDataURL(selectedVideo);
    reader.onload = async () => {
      const base64String = (reader.result as string).split(',')[1];
      const result = await analyzeVideoTechnique(base64String, selectedVideo.type, language);
      setAnalysisResult(result);
      setIsAnalyzingVideo(false);
    };
  };

  const loadNewScenario = async () => {
    setIsLoadingScenario(true);
    setScenarioResult(null);
    const scenario = await generateTacticalScenario(language);
    setCurrentScenario(scenario);
    setIsLoadingScenario(false);
  };

  const handleScenarioDecision = async (optionText: string) => {
    if (!currentScenario) return;
    setScenarioResult(t.common.loading);
    const feedback = await evaluateTacticalDecision(currentScenario.situation, optionText, language);
    setScenarioResult(feedback);
  };

  // --- Render Functions ---

  const renderDashboard = () => {
    const radarData = [
      { subject: t.categories.Technical, A: stats.technical, fullMark: 100 },
      { subject: t.categories.Physical, A: stats.physical, fullMark: 100 },
      { subject: t.categories.Tactical, A: stats.tactical, fullMark: 100 },
      { subject: t.categories.Mental, A: stats.mental, fullMark: 100 },
    ];

    return (
      <div className="space-y-6 animate-fade-in pb-20">
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
                    <Activity size={16} />
                    <span>{t.dashboard.trainingHours}</span>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.trainingHours} <span className="text-sm font-normal text-slate-500">{t.common.hrs}</span></div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
                    <Trophy size={16} />
                    <span>{t.dashboard.drillsDone}</span>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.drillsCompleted}</div>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 w-full text-left">{t.dashboard.playerAttributes}</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke={isDarkMode ? "#475569" : "#e2e8f0"} />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                            name="Stats"
                            dataKey="A"
                            stroke="#10b981"
                            strokeWidth={3}
                            fill="#10b981"
                            fillOpacity={0.3}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-900/50 dark:to-slate-900 border border-emerald-200 dark:border-emerald-500/30 p-5 rounded-xl shadow-sm">
            <div className="flex items-start gap-4">
                <div className="bg-emerald-100 dark:bg-emerald-500/20 p-3 rounded-full text-emerald-600 dark:text-emerald-400">
                    <Sparkles size={24} />
                </div>
                <div>
                    <h3 className="text-slate-900 dark:text-white font-semibold mb-1">{t.dashboard.weeklyFocus}</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                        {activePlan ? `${t.dashboard.following}: ${activePlan.title}` : t.dashboard.noPlan}
                    </p>
                </div>
            </div>
        </div>
      </div>
    );
  };

  const renderDrills = () => (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t.drills.header}</h2>
        <div className="flex gap-2">
            <button 
            onClick={() => setShowPlanForm(true)}
            className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
            >
            <ClipboardList size={16} />
            {t.drills.btnPlan}
            </button>
            <button 
            onClick={() => setShowDrillModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
            >
            <Plus size={16} />
            {t.drills.btnNew}
            </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700 pb-2 overflow-x-auto">
        <button 
            onClick={() => setActivePlan(null)}
            className={`px-4 py-1 rounded-full text-sm whitespace-nowrap ${!activePlan ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/50' : 'text-slate-500 dark:text-slate-400'}`}
        >
            {t.drills.library}
        </button>
        {activePlan && (
            <button 
                className={`px-4 py-1 rounded-full text-sm whitespace-nowrap bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/50`}
            >
                {t.drills.myPlan}: {activePlan.title}
            </button>
        )}
      </div>

      <div className="pb-20 overflow-y-auto flex-1">
        {activePlan ? (
             <div className="space-y-6">
                {activePlan.weeklySchedule.map((day, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                        <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mb-1">{day.dayName}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-4 font-bold">{day.focus}</p>
                        <div className="space-y-3">
                            {day.drills.map((drill, dIdx) => (
                                <DrillCard key={dIdx} drill={drill} lang={language} />
                            ))}
                        </div>
                    </div>
                ))}
             </div>
        ) : (
            <div className="grid grid-cols-1 gap-4">
                {drills.map((drill) => (
                <DrillCard key={drill.id} drill={drill} lang={language} />
                ))}
            </div>
        )}
      </div>

      {/* Modals for Drill Generation and Plan Generation */}
      {showDrillModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t.drills.generateTitle}</h3>
            <input 
              type="text" 
              value={drillPrompt}
              onChange={(e) => setDrillPrompt(e.target.value)}
              placeholder={t.drills.promptPlaceholder}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white mb-4 placeholder-slate-400"
            />
             <div className="flex gap-3">
              <button onClick={() => setShowDrillModal(false)} className="flex-1 py-3 text-slate-500 dark:text-slate-400">{t.drills.cancel}</button>
              <button onClick={handleGenerateDrills} disabled={isGeneratingDrills} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex justify-center items-center font-semibold">
                {isGeneratingDrills ? <Loader2 className="animate-spin" /> : t.drills.generate}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPlanForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t.drills.planTitle}</h3>
            <div className="space-y-4">
                <div>
                    <label className="text-slate-500 dark:text-slate-400 text-sm">{t.drills.level}</label>
                    <select value={drillLevel} onChange={(e) => setDrillLevel(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white mt-1">
                        <option value="Beginner">{t.difficulties.Beginner}</option>
                        <option value="Intermediate">{t.difficulties.Intermediate}</option>
                        <option value="Advanced">{t.difficulties.Advanced}</option>
                    </select>
                </div>
                <div>
                    <label className="text-slate-500 dark:text-slate-400 text-sm">{t.drills.goal}</label>
                    <select value={planGoal} onChange={(e) => setPlanGoal(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white mt-1">
                        <option>Technique & Ball Control</option>
                        <option>Speed & Conditioning</option>
                        <option>Tactical Awareness</option>
                        <option>Shooting & Finishing</option>
                        <option>Defense & Positioning</option>
                    </select>
                </div>
                <div>
                    <label className="text-slate-500 dark:text-slate-400 text-sm">{t.drills.availability}</label>
                    <select value={planDays} onChange={(e) => setPlanDays(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white mt-1">
                        <option>2 {t.drills.day}</option>
                        <option>3 {t.drills.day}</option>
                        <option>4 {t.drills.day}</option>
                        <option>5 {t.drills.day}</option>
                        <option>Every day</option>
                    </select>
                </div>
            </div>
             <div className="flex gap-3 mt-6">
              <button onClick={() => setShowPlanForm(false)} className="flex-1 py-3 text-slate-500 dark:text-slate-400">{t.drills.cancel}</button>
              <button onClick={handleGeneratePlan} disabled={isGeneratingPlan} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex justify-center items-center font-semibold">
                {isGeneratingPlan ? <Loader2 className="animate-spin" /> : t.drills.createPlan}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAnalyst = () => (
    <div className="h-full flex flex-col space-y-4 pb-20 overflow-y-auto">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t.analyst.header}</h2>
        
        <div className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center min-h-[200px] border-dashed shadow-sm">
            {!selectedVideo ? (
                <>
                    <Upload className="text-slate-400 dark:text-slate-500 mb-3" size={48} />
                    <p className="text-slate-500 dark:text-slate-400 text-center mb-4">{t.analyst.uploadTitle}<br/>{t.analyst.uploadSubtitle}</p>
                    <label className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg cursor-pointer font-bold transition-colors shadow-md">
                        {t.analyst.selectBtn}
                        <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                    </label>
                </>
            ) : (
                <div className="w-full">
                    {videoUrl && (
                        <video src={videoUrl} controls className="w-full rounded-lg max-h-64 bg-black mb-4" />
                    )}
                    <div className="flex gap-3">
                         <button 
                            onClick={() => {setSelectedVideo(null); setAnalysisResult(null);}}
                            className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg transition-colors font-medium"
                         >
                            {t.analyst.clear}
                         </button>
                         <button 
                            onClick={handleAnalyzeVideo}
                            disabled={isAnalyzingVideo}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 shadow-md transition-colors"
                         >
                            {isAnalyzingVideo ? <Loader2 className="animate-spin" /> : <><Brain size={18}/> {t.analyst.analyze}</>}
                         </button>
                    </div>
                </div>
            )}
        </div>

        {analysisResult && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4 animate-fade-in shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <span className="text-emerald-600 dark:text-emerald-400 text-sm font-bold uppercase tracking-wider">{analysisResult.actionType}</span>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.analyst.reportTitle}</h3>
                    </div>
                    <div className="text-center">
                        <div className={`text-2xl font-black ${analysisResult.techniqueScore > 75 ? 'text-green-500 dark:text-green-400' : 'text-yellow-500 dark:text-yellow-400'}`}>
                            {analysisResult.techniqueScore}
                        </div>
                        <span className="text-slate-400 dark:text-slate-500 text-xs uppercase">{t.analyst.score}</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                        <h4 className="text-slate-700 dark:text-slate-300 font-semibold mb-1 flex items-center gap-2">
                            <Activity size={16} /> {t.analyst.mechanics}
                        </h4>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">{analysisResult.breakdown}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border-l-2 border-red-500">
                        <h4 className="text-slate-700 dark:text-slate-300 font-semibold mb-1 flex items-center gap-2">
                            <AlertCircle size={16} className="text-red-500"/> {t.analyst.corrections}
                        </h4>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">{analysisResult.corrections}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border-l-2 border-emerald-500">
                        <h4 className="text-slate-700 dark:text-slate-300 font-semibold mb-1 flex items-center gap-2">
                            <Target size={16} className="text-emerald-500"/> {t.analyst.recommendation}
                        </h4>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">{analysisResult.drillRecommendation}</p>
                    </div>
                </div>
            </div>
        )}
    </div>
  );

  const renderTactics = () => (
    <div className="h-full flex flex-col pb-20 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t.tactics.header}</h2>
            <button 
                onClick={loadNewScenario}
                disabled={isLoadingScenario}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-md"
            >
               {isLoadingScenario ? <Loader2 className="animate-spin" size={16} /> : <PlayCircle size={16} />}
               {t.tactics.newScenario}
            </button>
        </div>

        {!currentScenario ? (
             <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-60">
                <Brain size={64} className="text-slate-400 dark:text-slate-600 mb-4" />
                <p className="text-slate-500 dark:text-slate-400 text-lg">{t.tactics.emptyState}</p>
                <button 
                    onClick={loadNewScenario}
                    className="mt-6 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white px-8 py-3 rounded-xl font-bold transition-colors"
                >
                    {t.tactics.startSim}
                </button>
             </div>
        ) : (
            <div className="space-y-6 animate-fade-in">
                {/* Visual Representation (Abstract) */}
                <div className="aspect-video bg-emerald-900/90 dark:bg-emerald-900/30 border border-emerald-500/30 rounded-xl relative overflow-hidden flex items-center justify-center p-6 shadow-lg">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                    {/* Pitch markings */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-emerald-500/20"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-emerald-500/20 rounded-full"></div>
                    
                    <div className="relative z-10 text-center">
                        <span className="inline-block bg-emerald-500/20 text-emerald-100 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold mb-3 border border-emerald-500/30">
                            {currentScenario.formation}
                        </span>
                        <h3 className="text-xl font-bold text-white mb-2">{currentScenario.title}</h3>
                        <p className="text-emerald-100 dark:text-slate-300 text-sm max-w-md mx-auto">{currentScenario.situation}</p>
                    </div>
                </div>

                <div className="grid gap-3">
                    {currentScenario.options.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => handleScenarioDecision(option.text)}
                            disabled={!!scenarioResult}
                            className={`p-4 rounded-xl text-left transition-all border shadow-sm ${
                                scenarioResult 
                                ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-50' 
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            <span className="text-slate-800 dark:text-slate-200 font-medium">{option.text}</span>
                        </button>
                    ))}
                </div>

                {scenarioResult && (
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 p-5 rounded-xl animate-fade-in mt-4 shadow-sm">
                        <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                            <CheckCircle2 className="text-emerald-500" size={20} />
                            {t.tactics.analysis}
                        </h4>
                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{scenarioResult}</p>
                        <button 
                            onClick={loadNewScenario}
                            className="mt-4 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-md transition-colors"
                        >
                            {t.tactics.next}
                        </button>
                    </div>
                )}
            </div>
        )}
    </div>
  );

  const renderChat = () => (
    <div className="flex flex-col h-[calc(100vh-140px)]">
        <div className="flex-1 overflow-y-auto space-y-4 pb-4 scrollbar-hide pr-2">
            {chatMessages.map((msg) => (
                <div 
                    key={msg.id} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                        msg.role === 'user' 
                        ? 'bg-emerald-600 text-white rounded-br-none' 
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                    }`}>
                        {msg.role === 'model' && (
                            <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                                <Brain size={12} />
                                <span>Coach</span>
                            </div>
                        )}
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                            {msg.text}
                        </p>
                    </div>
                </div>
            ))}
            {isTyping && (
                <div className="flex justify-start">
                     <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-none p-4 flex gap-1 shadow-sm">
                        <span className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce delay-75"></span>
                        <span className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce delay-150"></span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        <div className="mt-4 relative">
            <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={t.coach.placeholder}
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl py-4 pl-4 pr-12 focus:outline-none focus:border-emerald-500 shadow-lg placeholder-slate-400 transition-colors"
            />
            <button 
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="absolute right-2 top-2 p-2 bg-emerald-600 rounded-lg text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
            >
                <Send size={18} />
            </button>
        </div>
    </div>
  );

  return (
    <div className={`${isDarkMode ? 'dark' : ''} h-full`}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex justify-center transition-colors duration-300">
        <div className="w-full max-w-md md:max-w-2xl bg-white dark:bg-slate-900 min-h-screen relative shadow-2xl overflow-hidden flex flex-col transition-colors duration-300">
          
          {/* Header */}
          <header className="p-5 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 flex justify-between items-center transition-colors duration-300">
              <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center transform rotate-3 shadow-md">
                      <Activity size={20} className="text-white" />
                  </div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Pitch<span className="text-emerald-500">IQ</span></h1>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleLanguage}
                  className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Switch Language"
                >
                  <Globe size={18} />
                  <span className="sr-only">Language</span>
                </button>
                <button 
                  onClick={toggleDarkMode}
                  className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Toggle Theme"
                >
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden ml-1">
                    <img src="https://picsum.photos/100/100" alt="Avatar" className="w-full h-full object-cover opacity-80" />
                </div>
              </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-5 overflow-y-auto">
            {view === ViewState.DASHBOARD && renderDashboard()}
            {view === ViewState.DRILLS && renderDrills()}
            {view === ViewState.ANALYST && renderAnalyst()}
            {view === ViewState.TACTICS && renderTactics()}
            {view === ViewState.IQ_COACH && renderChat()}
          </main>

          {/* Bottom Navigation */}
          <nav className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-3 grid grid-cols-5 gap-1 transition-colors duration-300">
              <button 
                  onClick={() => setView(ViewState.DASHBOARD)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${view === ViewState.DASHBOARD ? 'text-emerald-600 dark:text-emerald-500 bg-slate-100 dark:bg-slate-800' : 'text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
              >
                  <LayoutDashboard size={20} />
                  <span className="text-[9px] font-medium uppercase tracking-wide">{t.nav.stats}</span>
              </button>
              <button 
                  onClick={() => setView(ViewState.DRILLS)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${view === ViewState.DRILLS ? 'text-emerald-600 dark:text-emerald-500 bg-slate-100 dark:bg-slate-800' : 'text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
              >
                  <Dumbbell size={20} />
                  <span className="text-[9px] font-medium uppercase tracking-wide">{t.nav.train}</span>
              </button>
              <button 
                  onClick={() => setView(ViewState.ANALYST)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${view === ViewState.ANALYST ? 'text-emerald-600 dark:text-emerald-500 bg-slate-100 dark:bg-slate-800' : 'text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
              >
                  <Video size={20} />
                  <span className="text-[9px] font-medium uppercase tracking-wide">{t.nav.analyst}</span>
              </button>
              <button 
                  onClick={() => setView(ViewState.TACTICS)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${view === ViewState.TACTICS ? 'text-emerald-600 dark:text-emerald-500 bg-slate-100 dark:bg-slate-800' : 'text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
              >
                  <Brain size={20} />
                  <span className="text-[9px] font-medium uppercase tracking-wide">{t.nav.tactics}</span>
              </button>
              <button 
                  onClick={() => setView(ViewState.IQ_COACH)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${view === ViewState.IQ_COACH ? 'text-emerald-600 dark:text-emerald-500 bg-slate-100 dark:bg-slate-800' : 'text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
              >
                  <MessageSquare size={20} />
                  <span className="text-[9px] font-medium uppercase tracking-wide">{t.nav.coach}</span>
              </button>
          </nav>

        </div>
      </div>
    </div>
  );
};

export default App;