import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  Sparkles, 
  Layers, 
  History, 
  FolderOpen, 
  Settings as SettingsIcon, 
  Sun, 
  Moon, 
  Mic, 
  Paperclip, 
  Send, 
  Search, 
  CheckCircle2, 
  BookMarked, 
  Copy, 
  Download, 
  Plus, 
  ArrowRight, 
  FileText, 
  ChevronRight, 
  Code2, 
  TrendingUp, 
  Calendar, 
  Trash2, 
  RefreshCw, 
  ExternalLink,
  Briefcase,
  Play,
  AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar
} from 'recharts';
import confetti from 'canvas-confetti';
import type { 
  Agent, 
  AgentName, 
  Message, 
  SavedFile, 
  Project, 
  AppSettings, 
  TimelineStep,
  Citation,
  ChartDataPoint
} from './types';

// Mock Initial Data
const INITIAL_AGENTS: Agent[] = [
  { name: 'Research Agent', description: 'Web queries, summaries, citations, news search', status: 'Idle', skills: ['Web Search', 'Data Mining', 'Topic Synthesizer', 'Citation Generator'], color: 'border-cyan-500 text-cyan-500' },
  { name: 'Writing Agent', description: 'Emails, blogs, documentation, social media writing', status: 'Idle', skills: ['Tone Adjuster', 'SEO Optimization', 'Copywriting', 'Document Structuring'], color: 'border-violet-500 text-violet-500' },
  { name: 'Coding Agent', description: 'Code generation, refactoring, explanation, bug fixing', status: 'Idle', skills: ['Code Generation', 'Algorithmic Optimization', 'Repository Review', 'Syntax Linter'], color: 'border-emerald-500 text-emerald-500' },
  { name: 'PDF Agent', description: 'PDF text layer extraction, tables, Q&A synthesis', status: 'Idle', skills: ['Text Extraction', 'Document Summarizer', 'PDF OCR', 'Table Extractor'], color: 'border-amber-500 text-amber-500' },
  { name: 'Data Agent', description: 'CSV analyzer, charts generator, trend detection', status: 'Idle', skills: ['CSV Parser', 'Regression Analysis', 'Chart Renderer', 'Anomaly Detection'], color: 'border-rose-500 text-rose-500' },
  { name: 'Planning Agent', description: 'Roadmaps, travel schedules, sprint plans', status: 'Idle', skills: ['Timeline Builder', 'Dependency Scheduler', 'Sprint Backlog', 'Sprint Planning'], color: 'border-indigo-500 text-indigo-500' }
];

const INITIAL_PROJECTS: Project[] = [
  { id: '1', title: 'AI Workspace Scaffolding', description: 'Implement workspace framework and global Tailwind styles', status: 'Completed', dueDate: '2026-07-03', progress: 100, tasksCount: { total: 3, completed: 3 } },
  { id: '2', title: 'Supabase Data Schema Sync', description: 'Design storage buckets and relational workspace tables', status: 'In Progress', dueDate: '2026-07-15', progress: 45, tasksCount: { total: 8, completed: 4 } },
  { id: '3', title: 'Gemini Agent Orchestrator', description: 'Configure routing nodes and parallel processing logic', status: 'Planning', dueDate: '2026-08-01', progress: 10, tasksCount: { total: 5, completed: 0 } }
];

const INITIAL_FILES: SavedFile[] = [
  { id: '1', name: 'Q2_Financial_Report.csv', size: '1.2 MB', type: 'CSV', uploadDate: '2026-06-28', numericColumns: ['sales', 'profit', 'expenses'], chartData: [
    { name: 'Apr', sales: 4000, profit: 2400, expenses: 1600 },
    { name: 'May', sales: 5200, profit: 3100, expenses: 2100 },
    { name: 'Jun', sales: 6800, profit: 4600, expenses: 2200 }
  ] },
  { id: '2', name: 'Product_Roadmap_2026.pdf', size: '4.8 MB', type: 'PDF', uploadDate: '2026-06-30', contentSnippet: 'This document details key product releases for Q3/Q4 including automated agent dashboards.' }
];

const INITIAL_HISTORY: Message[] = [
  { 
    id: 'h1', 
    sender: 'user', 
    content: 'Summarize the financial status from last month', 
    timestamp: 'Yesterday, 4:32 PM', 
    isBookmarked: true 
  },
  { 
    id: 'h2', 
    sender: 'assistant', 
    content: '### Q2 Financial Overview\nBased on your CSV data, profits grew **48.3%** from April to June. Major drivers included reduced operations spending and a surge in user signups.', 
    timestamp: 'Yesterday, 4:33 PM',
    agentsUsed: ['Data Agent', 'Writing Agent'],
    isBookmarked: true
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'agents' | 'projects' | 'history' | 'files' | 'settings'>('home');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [prompt, setPrompt] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [files, setFiles] = useState<SavedFile[]>(INITIAL_FILES);
  const [history, setHistory] = useState<Message[]>(INITIAL_HISTORY);
  
  // App States
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSecs, setVoiceSecs] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTimeline, setActiveTimeline] = useState<TimelineStep[]>([]);
  const [currentTool, setCurrentTool] = useState<string>('');
  
  // Settings
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'dark',
    language: 'English',
    aiModel: 'Gemini 2.5 Flash',
    notificationsEnabled: true,
    mockBypassEnabled: false,
    apiKeys: { gemini: '', supabaseUrl: '', supabaseKey: '' }
  });

  // Current Active Chat Messages
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'welcome', 
      sender: 'assistant', 
      content: "Hello! I am your **AI Workspace Copilot**. Upload files, ask coding questions, extract PDFs, or let me plan projects for you. How can I assist you today? 👋", 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }
  ]);

  // Home Dashboard Checklists State
  const [todayTasks, setTodayTasks] = useState([
    { id: 1, text: 'Review Data Agent charts summary', done: false },
    { id: 2, text: 'Write product updates blog post', done: false },
    { id: 3, text: 'Plan next sprint roadmap milestones', done: false },
    { id: 4, text: 'Test code execution component wrapper', done: false }
  ]);

  // File Upload Drag and Drop states
  const [isDragActive, setIsDragActive] = useState(false);

  // References
  const voiceTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync dark theme on init
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Scroll to chat bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTimeline]);

  // Handle task checkboxes + Confetti
  const toggleTask = (id: number) => {
    setTodayTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextState = !t.done;
        if (nextState) {
          confetti({
            particleCount: 80,
            spread: 50,
            origin: { y: 0.8 },
            colors: ['#6366f1', '#a78bfa', '#f472b6']
          });
        }
        return { ...t, done: nextState };
      }
      return t;
    }));
  };

  // Voice Input Simulation
  const toggleVoiceRecording = () => {
    if (isRecording) {
      clearInterval(voiceTimerRef.current!);
      setIsRecording(false);
      // Insert mock speech
      setPrompt('Create a 3-phase roadmap and draft a newsletter about agentic AI workspaces.');
      setVoiceSecs(0);
    } else {
      setIsRecording(true);
      setVoiceSecs(0);
      voiceTimerRef.current = window.setInterval(() => {
        setVoiceSecs(s => s + 1);
      }, 1000);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Simulate file upload
      const newFile: SavedFile = {
        id: Math.random().toString(),
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: file.name.split('.').pop()?.toUpperCase() || 'TXT',
        uploadDate: new Date().toISOString().split('T')[0]
      };
      
      if (newFile.type === 'CSV') {
        newFile.numericColumns = ['sales', 'users', 'tasks'];
        newFile.chartData = [
          { name: 'Jul', sales: 7400, users: 4900, tasks: 920 },
          { name: 'Aug', sales: 8600, users: 5500, tasks: 1040 },
          { name: 'Sep', sales: 9800, users: 6700, tasks: 1200 }
        ];
      }
      setFiles(prev => [newFile, ...prev]);
      
      confetti({
        particleCount: 30,
        spread: 30,
        colors: ['#10b981', '#34d399']
      });
    }
  };

  // Drag & drop file handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      const newFile: SavedFile = {
        id: Math.random().toString(),
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: file.name.split('.').pop()?.toUpperCase() || 'TXT',
        uploadDate: new Date().toISOString().split('T')[0]
      };
      setFiles(prev => [newFile, ...prev]);
      confetti({ particleCount: 30, spread: 30 });
    }
  };

  // Submit Prompt to Agents Orchestration
  const handlePromptSubmit = async (customPrompt?: string) => {
    const activePrompt = customPrompt || prompt;
    if (!activePrompt.trim()) return;

    setActiveTab('chat');
    setIsExecuting(true);
    setPrompt('');
    
    // User Message
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      content: activePrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      filesAttached: selectedFile ? [selectedFile.name] : undefined
    };
    setMessages(prev => [...prev, userMsg]);
    setSelectedFile(null);

    // Call Backend if Mock Bypass is enabled, else use Mock Simulator
    try {
      let selectedAgents: AgentName[] = [];
      let serverResponse: any = null;

      // Check if server is reachable or bypass toggle is off
      if (settings.mockBypassEnabled) {
        // Real API Mode
        const analyzeRes = await fetch('http://localhost:5000/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: activePrompt })
        });
        const analyzeData = await analyzeRes.json();
        selectedAgents = analyzeData.selectedAgents;
        
        // Execute steps on server
        const execRes = await fetch('http://localhost:5000/api/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: activePrompt, agents: selectedAgents })
        });
        serverResponse = await execRes.json();
      } else {
        // Frontend local simulator (Production design)
        // Rule-based routing simulation
        const low = activePrompt.toLowerCase();
        if (low.includes('search') || low.includes('research') || low.includes('news') || low.includes('find')) {
          selectedAgents.push('Research Agent');
        }
        if (low.includes('write') || low.includes('draft') || low.includes('email') || low.includes('post') || low.includes('blog')) {
          selectedAgents.push('Writing Agent');
        }
        if (low.includes('code') || low.includes('react') || low.includes('typescript') || low.includes('explain') || low.includes('programming')) {
          selectedAgents.push('Coding Agent');
        }
        if (low.includes('csv') || low.includes('chart') || low.includes('data') || low.includes('table')) {
          selectedAgents.push('Data Agent');
        }
        if (low.includes('pdf') || low.includes('document') || low.includes('summarize')) {
          selectedAgents.push('PDF Agent');
        }
        if (low.includes('plan') || low.includes('roadmap') || low.includes('schedule') || low.includes('sprint')) {
          selectedAgents.push('Planning Agent');
        }
        
        if (selectedAgents.length === 0) {
          selectedAgents.push('Research Agent');
          selectedAgents.push('Writing Agent');
        }
      }

      // Step 1: Analyzer status
      setActiveTimeline([
        { agent: 'Task Analyzer', action: 'Route Mapping', tool: 'Routing Parser', status: 'Parsing user prompt intent...', timestamp: new Date().toLocaleTimeString() }
      ]);
      await delay(600);

      setActiveTimeline(prev => [
        ...prev,
        { agent: 'Task Analyzer', action: 'Dispatch', tool: 'Router API', status: `Dispatched tasks to specialized sub-agents: ${selectedAgents.join(', ')}`, timestamp: new Date().toLocaleTimeString() }
      ]);
      await delay(500);

      // Start executing each assigned agent sequentially
      let simulatedOutput = '';
      let simulatedCitations: Citation[] = [];
      let simulatedChartData: ChartDataPoint[] = [];
      let simulatedCode = '';

      for (const agentName of selectedAgents) {
        // Set agent state active
        setAgents(prev => prev.map(a => a.name === agentName ? { ...a, status: 'Thinking' } : a));
        setActiveTimeline(prev => [
          ...prev,
          { agent: agentName, action: 'Thinking', tool: 'Cognitive Engine', status: 'Generating task context and approach...', timestamp: new Date().toLocaleTimeString() }
        ]);
        await delay(800);

        if (agentName === 'Research Agent') {
          setAgents(prev => prev.map(a => a.name === agentName ? { ...a, status: 'Searching' } : a));
          setCurrentTool('Google Search Crawler');
          setActiveTimeline(prev => [
            ...prev,
            { agent: agentName, action: 'Searching', tool: 'Google Search Crawler', status: 'Scanning web publications and latest AI whitepapers...', timestamp: new Date().toLocaleTimeString() }
          ]);
          await delay(900);
          
          simulatedCitations.push(
            { title: 'AI Workspace Orchestras', url: 'https://workspacecopilot.ai/blog/multi-agents', snippet: 'Guide on routing workflows dynamically to micro agents.' },
            { title: 'Designing Premium SaaS Dashboards', url: 'https://linear.app/design/rounded-cards', snippet: 'Best practices for rounded border layouts and soft shadows.' }
          );

          simulatedOutput += `### 🔍 Research Findings\nHere is what I gathered from the search workspace:\n- **Advanced Orchestration**: Micro-agent chains display a **40% increase** in complex project timeline accuracy.\n- **SaaS Layout Standards**: Using glassmorphism overlays, soft shadows, and clean left sidebars significantly lowers user dropoff rates.\n\n`;
        }

        if (agentName === 'Writing Agent') {
          setAgents(prev => prev.map(a => a.name === agentName ? { ...a, status: 'Writing' } : a));
          setCurrentTool('Markdown Composer');
          setActiveTimeline(prev => [
            ...prev,
            { agent: agentName, action: 'Writing', tool: 'Markdown Composer', status: 'Formulating structured markdown output copy...', timestamp: new Date().toLocaleTimeString() }
          ]);
          await delay(900);

          simulatedOutput += `### 📝 Document Content\nHere is your tailored newsletter copy:\n\n---\n**Subject: Unleashing Agentic Productivity with AI Copilots**\n\nDear Workspace Members,\n\nWe are entering the era of active multi-agent AI assistants. Unlike chat bubbles, active copilots analyze your workflows, split goals into checklists, parse complex Excel/CSV files instantly, and plan your schedules in Gantt roadmaps.\n\nKey advantages of this dashboard include:\n1. Dedicated sidebar views for file cataloging and settings configurations.\n2. Built-in interactive visual chart widgets for data metrics.\n3. Automatic history persistence.\n\nFeel free to explore our settings panel and toggle the dark mode.\n\nBest wishes,\n**The AI Workspace Copilot Team**\n---\n\n`;
        }

        if (agentName === 'Coding Agent') {
          setAgents(prev => prev.map(a => a.name === agentName ? { ...a, status: 'Writing' } : a));
          setCurrentTool('TypeScript Compiler');
          setActiveTimeline(prev => [
            ...prev,
            { agent: agentName, action: 'Writing', tool: 'TypeScript Compiler', status: 'Validating React syntax and tailwind styling hooks...', timestamp: new Date().toLocaleTimeString() }
          ]);
          await delay(900);

          simulatedCode = `import React from 'react';\nimport { CheckCircle2 } from 'lucide-react';\n\nexport const SuccessWidget = ({ title }: { title: string }) => {\n  return (\n    <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30">\n      <CheckCircle2 className="w-5 h-5 text-emerald-500" />\n      <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{title}</span>\n    </div>\n  );\n};`;

          simulatedOutput += `### 💻 React Components Code\nBelow is the customized TypeScript widget built with Tailwind classes:\n\n\`\`\`tsx\n${simulatedCode}\n\`\`\`\n\n`;
        }

        if (agentName === 'PDF Agent') {
          setAgents(prev => prev.map(a => a.name === agentName ? { ...a, status: 'Thinking' } : a));
          setCurrentTool('OCR Document Extractor');
          setActiveTimeline(prev => [
            ...prev,
            { agent: agentName, action: 'Analyzing', tool: 'OCR Document Extractor', status: 'Reading PDF document schema and scanning text formatting...', timestamp: new Date().toLocaleTimeString() }
          ]);
          await delay(900);

          simulatedOutput += `### 📄 PDF Document Analysis\nI have successfully scanned and indexed the text nodes of the uploaded PDF:\n\n- **Overview**: The roadmap document emphasizes migrating core data feeds to Supabase relational tables.\n- **Sprint Distribution**: Recommends allocating 4 development slots for sidebar and layouts and 3 slots for agent workflows.\n\n`;
        }

        if (agentName === 'Data Agent') {
          setAgents(prev => prev.map(a => a.name === agentName ? { ...a, status: 'Writing' } : a));
          setCurrentTool('CSV Charting Engine');
          setActiveTimeline(prev => [
            ...prev,
            { agent: agentName, action: 'Writing', tool: 'CSV Charting Engine', status: 'Compiling numeric arrays and generating chart coordinates...', timestamp: new Date().toLocaleTimeString() }
          ]);
          await delay(900);

          simulatedChartData = [
            { name: 'Week 1', sales: 2400, users: 1200, tasks: 150 },
            { name: 'Week 2', sales: 3800, users: 1900, tasks: 220 },
            { name: 'Week 3', sales: 4300, users: 2400, tasks: 310 },
            { name: 'Week 4', sales: 5900, users: 3100, tasks: 480 },
            { name: 'Week 5', sales: 7200, users: 4300, tasks: 620 }
          ];

          simulatedOutput += `### 📊 Data Trends Table\nHere is the trend projection parsed from your sales workbook:\n\n| Week | Gross Revenue | User Registration | Completed Backlog |\n| :--- | :--- | :--- | :--- |\n| Week 1 | $2,400 | 1,200 | 150 |\n| Week 2 | $3,800 | 1,900 | 220 |\n| Week 3 | $4,300 | 2,400 | 310 |\n| Week 4 | $5,900 | 3,100 | 480 |\n| Week 5 | $7,200 | 4,300 | 620 |\n\n`;
        }

        if (agentName === 'Planning Agent') {
          setAgents(prev => prev.map(a => a.name === agentName ? { ...a, status: 'Writing' } : a));
          setCurrentTool('Gantt Scheduler API');
          setActiveTimeline(prev => [
            ...prev,
            { agent: agentName, action: 'Writing', tool: 'Gantt Scheduler API', status: 'Creating milestones and timeline schedule arrays...', timestamp: new Date().toLocaleTimeString() }
          ]);
          await delay(900);

          simulatedOutput += `### 📅 Development Sprint Plan\nHere is your multi-phase timeline:\n- **Milestone A (Kickoff - Days 1 to 3)**: Global layout, light/dark styling sync, collateral upload component integration.\n- **Milestone B (Integration - Days 4 to 7)**: Multi-agent routing backend, chart layout components, and speech recorders.\n- **Milestone C (Launch - Days 8 to 10)**: Automated test suits execution and settings sync dashboard telemetry.\n\n`;
        }

        setAgents(prev => prev.map(a => a.name === agentName ? { ...a, status: 'Finished' } : a));
      }

      // Final Answer Compilation
      const finalMsg: Message = {
        id: Math.random().toString(),
        sender: 'assistant',
        content: settings.mockBypassEnabled && serverResponse ? serverResponse.mergedOutput : simulatedOutput,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentsUsed: selectedAgents,
        timelineSteps: activeTimeline,
        citations: settings.mockBypassEnabled && serverResponse ? serverResponse.citations : simulatedCitations,
        chartData: settings.mockBypassEnabled && serverResponse ? serverResponse.chartData : simulatedChartData,
        codeSnippet: settings.mockBypassEnabled && serverResponse ? serverResponse.code : simulatedCode
      };

      setMessages(prev => [...prev, finalMsg]);
      setHistory(prev => [finalMsg, ...prev]);

      // Reset all agent status to Idle
      await delay(500);
      setAgents(prev => prev.map(a => ({ ...a, status: 'Idle' })));
      setCurrentTool('');

      // Confetti on finish
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });

    } catch (err) {
      console.error(err);
      // Fallback message
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'system',
        content: '⚠️ Failed to connect to local backend. Make sure backend is running on `http://localhost:5000` or disable *Backend Bypass* in Settings to run in standalone sandbox mode.',
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsExecuting(false);
      setActiveTimeline([]);
    }
  };

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  // Copy to clipboard helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  // Trigger quick prompt helper
  const handleQuickAction = (actionType: string) => {
    let q = '';
    if (actionType === 'research') q = 'Research the latest improvements in multi-agent routing engines.';
    if (actionType === 'write') q = 'Write a LinkedIn post announcing a new premium SaaS project manager.';
    if (actionType === 'csv') q = 'Analyze this sales CSV and generate Week-on-Week metrics with charts.';
    if (actionType === 'pdf') q = 'Summarize this PDF documentation and extract key sprint recommendations.';
    if (actionType === 'code') q = 'Generate a TypeScript React code snippet for a success widget banner.';
    if (actionType === 'plan') q = 'Create a 3-phase study roadmap for learning backend databases.';
    
    setPrompt(q);
    handlePromptSubmit(q);
  };

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* LEFT SIDEBAR */}
      <aside className={`flex flex-col border-r border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-64'} shrink-0 z-20`}>
        
        {/* LOGO */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 shadow-md shadow-indigo-500/20 text-white shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          {!isSidebarCollapsed && (
            <div>
              <h1 className="font-bold text-sm tracking-wide bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Copilot Workspace
              </h1>
              <p className="text-[10px] text-slate-400 font-mono">v1.2.0 Production</p>
            </div>
          )}
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'home' ? 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-l-2 border-indigo-500 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'}`}
          >
            <Home className="w-4.5 h-4.5" />
            {!isSidebarCollapsed && <span>Dashboard</span>}
          </button>
          
          <button 
            onClick={() => { setActiveTab('chat') }}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'chat' ? 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-l-2 border-indigo-500 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'}`}
          >
            <Sparkles className="w-4.5 h-4.5" />
            {!isSidebarCollapsed && <span>AI Chat Arena</span>}
          </button>

          <button 
            onClick={() => setActiveTab('agents')}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'agents' ? 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-l-2 border-indigo-500 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'}`}
          >
            <Layers className="w-4.5 h-4.5" />
            {!isSidebarCollapsed && <span>Active Agents</span>}
          </button>

          <button 
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'projects' ? 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-l-2 border-indigo-500 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'}`}
          >
            <Briefcase className="w-4.5 h-4.5" />
            {!isSidebarCollapsed && <span>Projects</span>}
          </button>

          <button 
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'history' ? 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-l-2 border-indigo-500 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'}`}
          >
            <History className="w-4.5 h-4.5" />
            {!isSidebarCollapsed && <span>History Logs</span>}
          </button>

          <button 
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'files' ? 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-l-2 border-indigo-500 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'}`}
          >
            <FolderOpen className="w-4.5 h-4.5" />
            {!isSidebarCollapsed && <span>Files Manager</span>}
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'settings' ? 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-l-2 border-indigo-500 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'}`}
          >
            <SettingsIcon className="w-4.5 h-4.5" />
            {!isSidebarCollapsed && <span>Settings</span>}
          </button>
        </nav>

        {/* BOTTOM SIDEBAR BAR */}
        <div className="p-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-slate-700" />}
          </button>
          
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden md:block"
          >
            <ChevronRight className={`w-4.5 h-4.5 transition-transform ${isSidebarCollapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </aside>

      {/* CENTER WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative bg-slate-50/20 dark:bg-slate-950/20">
        
        {/* TOP GLASSPHORMIC BAR */}
        <header className="sticky top-0 h-16 border-b border-slate-200/40 dark:border-slate-800/40 glass-effect flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-100 capitalize">
              {activeTab === 'home' ? 'Overview Dashboard' : activeTab}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Active Workspace
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveTab('settings')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{settings.aiModel}</span>
            </button>
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <div className="flex-1 p-6 max-w-6xl w-full mx-auto">
          
          {/* 1. HOME DASHBOARD VIEW */}
          {activeTab === 'home' && (
            <div className="space-y-8 animate-fade-in">
              
              {/* GOOD MORNING PROMPT JUMBOTRON */}
              <div className="p-8 rounded-3xl bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent border border-slate-200/50 dark:border-slate-800/50 relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <span className="text-sm font-semibold text-indigo-500 tracking-wider uppercase">Workspace Core</span>
                  <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
                    Good Morning 👋
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 max-w-xl">
                    What would you like to accomplish today? Upload documents or select a template to kick off micro-agents orchestration.
                  </p>

                  {/* PROMPT CONTAINER BAR */}
                  <div className="mt-6 flex flex-col md:flex-row items-stretch gap-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                    
                    <div className="flex-1 flex items-center gap-2 px-3">
                      <Search className="w-5 h-5 text-slate-400 shrink-0" />
                      <input 
                        type="text" 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Research AI Agents, summarize this PDF, analyze my CSV..."
                        className="bg-transparent border-0 outline-none w-full text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:ring-0"
                        onKeyDown={(e) => e.key === 'Enter' && handlePromptSubmit()}
                      />
                    </div>

                    <div className="flex items-center gap-1.5 px-2 justify-end border-t md:border-t-0 md:border-l border-slate-200/60 dark:border-slate-800/60 pt-2 md:pt-0">
                      
                      {/* ATTACH FILE BUTTON */}
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative ${selectedFile ? 'text-emerald-500 hover:text-emerald-600' : ''}`}
                        title="Attach spreadsheets/PDF/code"
                      >
                        <Paperclip className="w-5 h-5" />
                        {selectedFile && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept=".csv,.pdf,.txt,.docx,image/*" 
                      />

                      {/* SIMULATED VOICE BUTTON */}
                      <button 
                        onClick={toggleVoiceRecording}
                        className={`p-2 rounded-xl transition-all flex items-center gap-1.5 ${isRecording ? 'bg-red-500 text-white animate-pulse px-3' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        title="Voice Speech-to-text input"
                      >
                        <Mic className="w-5 h-5" />
                        {isRecording && <span className="text-[11px] font-mono font-medium">{voiceSecs}s</span>}
                      </button>

                      {/* SUBMIT BUTTON */}
                      <button 
                        onClick={() => handlePromptSubmit()}
                        disabled={isExecuting || !prompt.trim()}
                        className="p-2.5 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                      >
                        <Send className="w-4 h-4" />
                      </button>

                    </div>
                  </div>

                  {/* Attached file status */}
                  {selectedFile && (
                    <div className="flex items-center gap-2 p-1.5 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs w-fit">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="font-medium">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB) Attached</span>
                      <button onClick={() => setSelectedFile(null)} className="ml-1 text-emerald-700 dark:text-emerald-300 font-bold hover:underline">Remove</button>
                    </div>
                  )}

                  {/* SUGGESTED CHIPS */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button onClick={() => handleQuickAction('research')} className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200/50 dark:border-slate-800/50 text-[11px] font-medium text-slate-600 dark:text-slate-300 transition-all flex items-center gap-1.5">
                      <span>Research AI Agents</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </button>
                    <button onClick={() => handleQuickAction('pdf')} className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200/50 dark:border-slate-800/50 text-[11px] font-medium text-slate-600 dark:text-slate-300 transition-all flex items-center gap-1.5">
                      <span>Summarize this PDF</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </button>
                    <button onClick={() => handleQuickAction('csv')} className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200/50 dark:border-slate-800/50 text-[11px] font-medium text-slate-600 dark:text-slate-300 transition-all flex items-center gap-1.5">
                      <span>Analyze my CSV</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </button>
                    <button onClick={() => handleQuickAction('code')} className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200/50 dark:border-slate-800/50 text-[11px] font-medium text-slate-600 dark:text-slate-300 transition-all flex items-center gap-1.5">
                      <span>Generate React code</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>

                </div>

                {/* Decorative backgrounds */}
                <div className="absolute right-0 bottom-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -z-10" />
                <div className="absolute left-1/3 top-0 w-60 h-60 bg-purple-500/5 rounded-full blur-3xl -z-10" />
              </div>

              {/* QUICK ACTION CARDS */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-400 tracking-wider uppercase">Templates & Quick Launches</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div 
                    onClick={() => handleQuickAction('research')}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 hover:border-cyan-500/30 dark:hover:border-cyan-500/30 shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Search className="w-5 h-5" />
                    </div>
                    <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Research Topic</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Queries, citations, summaries</p>
                  </div>

                  <div 
                    onClick={() => handleQuickAction('write')}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 hover:border-violet-500/30 dark:hover:border-violet-500/30 shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Draft Document</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Blogs, LinkedIn drafts, emails</p>
                  </div>

                  <div 
                    onClick={() => handleQuickAction('code')}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Code2 className="w-5 h-5" />
                    </div>
                    <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Generate Code</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Explain, review, refactor</p>
                  </div>

                  <div 
                    onClick={() => handleQuickAction('plan')}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Plan Project</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Roadmaps, study logs, timelines</p>
                  </div>
                </div>
              </div>

              {/* DASHBOARD WIDGETS GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. TODAY'S CHECKLIST */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <CheckCircle2 className="w-4.5 h-4.5 text-indigo-500" />
                      <span>Today's Checklist</span>
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {todayTasks.filter(t => t.done).length}/{todayTasks.length} Done
                    </span>
                  </div>
                  <div className="flex-1 space-y-2.5">
                    {todayTasks.map((task) => (
                      <label 
                        key={task.id} 
                        className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all duration-200 ${task.done ? 'bg-slate-50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-950/20 text-slate-400 line-through' : 'bg-white dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                      >
                        <input 
                          type="checkbox" 
                          checked={task.done} 
                          onChange={() => toggleTask(task.id)}
                          className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4"
                        />
                        <span>{task.text}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 2. RECENT CONVERSATIONS */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <History className="w-4.5 h-4.5 text-indigo-500" />
                      <span>Recent Activity</span>
                    </h4>
                    <button onClick={() => setActiveTab('history')} className="text-[11px] text-indigo-500 hover:underline">View All</button>
                  </div>
                  <div className="flex-1 space-y-3">
                    {history.slice(0, 3).map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => {
                          setMessages(prev => [...prev, item]);
                          setActiveTab('chat');
                        }}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/30 dark:border-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-all text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                            {item.content.length > 35 ? item.content.substring(0, 35) + '...' : item.content}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0 font-mono">{item.timestamp}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {item.agentsUsed?.map((ag, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[9px] font-mono">
                              {ag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. AI USAGE STATISTICS */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <TrendingUp className="w-4.5 h-4.5 text-indigo-500" />
                      <span>Copilot Usage Metrics</span>
                    </h4>
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="h-28 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[
                          { name: 'W1', usage: 12 },
                          { name: 'W2', usage: 19 },
                          { name: 'W3', usage: 32 },
                          { name: 'W4', usage: 45 },
                          { name: 'W5', usage: 60 }
                        ]}>
                          <defs>
                            <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                          <Area type="monotone" dataKey="usage" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorUsage)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="pt-3 border-t border-slate-200/40 dark:border-slate-800/40 grid grid-cols-2 gap-2 text-center text-[11px]">
                      <div>
                        <p className="text-slate-400">Total Run Queries</p>
                        <p className="text-base font-bold text-indigo-500">142</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Active Agents Triggered</p>
                        <p className="text-base font-bold text-purple-500">6</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* 2. CHAT VIEW */}
          {activeTab === 'chat' && (
            <div className="space-y-6 animate-fade-in flex flex-col min-h-[500px]">
              
              {/* MESSAGES FLOW CONTAINER */}
              <div className="flex-1 space-y-6 mb-24">
                {messages.map((item) => (
                  <div 
                    key={item.id} 
                    className={`flex gap-4 p-5 rounded-2xl border transition-all duration-300 ${item.sender === 'user' ? 'bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/50 max-w-[85%] ml-auto shadow-sm' : item.sender === 'system' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs w-full' : 'bg-transparent border-transparent'}`}
                  >
                    
                    {/* SENDER AVATAR */}
                    {item.sender === 'assistant' && (
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/10">
                        <Sparkles className="w-4.5 h-4.5 animate-pulse" />
                      </div>
                    )}

                    {/* CONTENT CONTAINER */}
                    <div className="flex-1 space-y-4 overflow-hidden">
                      
                      {/* HEADER info */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-medium text-slate-600 dark:text-slate-400 font-mono">
                          {item.sender === 'user' ? 'USER SESSION' : item.sender === 'system' ? 'SYSTEM NOTIFICATION' : 'COPILOT ASSISTANT'}
                        </span>
                        <span>{item.timestamp}</span>
                      </div>

                      {/* TEXT / MARKDOWN RENDERER */}
                      <div className="prose-custom text-sm text-slate-700 dark:text-slate-300 break-words">
                        {item.content.split('\n').map((line, idx) => {
                          if (line.startsWith('### ')) {
                            return <h3 key={idx} className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-4 mb-2">{line.replace('### ', '')}</h3>;
                          }
                          if (line.startsWith('#### ')) {
                            return <h4 key={idx} className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-3 mb-1.5">{line.replace('#### ', '')}</h4>;
                          }
                          if (line.startsWith('- ')) {
                            return <li key={idx} className="ml-4 list-disc mb-1">{line.replace('- ', '')}</li>;
                          }
                          if (line.startsWith('|')) {
                            // Basic Table Row Render
                            const cells = line.split('|').filter(c => c.trim() !== '');
                            if (line.includes('---')) return null; // skip dividers
                            return (
                              <div key={idx} className="grid grid-cols-4 gap-2 border-b border-slate-200/40 dark:border-slate-800/40 py-1.5 px-2 font-mono text-[11px]">
                                {cells.map((c, cellIdx) => (
                                  <span key={cellIdx} className="truncate">{c.trim()}</span>
                                ))}
                              </div>
                            );
                          }
                          return <p key={idx} className="mb-2 leading-relaxed">{line}</p>;
                        })}
                      </div>

                      {/* DISPLAY INTERACTIVE CHARTS (for CSV outputs) */}
                      {item.chartData && item.chartData.length > 0 && (
                        <div className="mt-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <TrendingUp className="w-4 h-4 text-emerald-500" />
                              <span>Dynamic Workbook Visualization</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">Interactive Chart Widget</span>
                          </div>

                          <div className="h-56 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={item.chartData}>
                                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                                <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                                <Bar dataKey="sales" fill="#6366f1" radius={[4, 4, 0, 0]} name="Value Target" />
                                <Bar dataKey="users" fill="#a78bfa" radius={[4, 4, 0, 0]} name="Active Accounts" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      {/* DISPLAY CODE BLOCK */}
                      {item.codeSnippet && (
                        <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden font-mono text-xs shadow-sm bg-slate-900 text-slate-200">
                          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-950">
                            <span className="text-[10px] text-slate-400">TypeScript / React Component</span>
                            <button 
                              onClick={() => copyToClipboard(item.codeSnippet || '')}
                              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy code</span>
                            </button>
                          </div>
                          <pre className="p-4 overflow-x-auto leading-relaxed select-text">
                            <code>{item.codeSnippet}</code>
                          </pre>
                        </div>
                      )}

                      {/* CITATION CARDS */}
                      {item.citations && item.citations.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">Sources & Citations</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {item.citations.map((cite, cIdx) => (
                              <a 
                                key={cIdx} 
                                href={cite.url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 hover:border-indigo-500/20 hover:bg-slate-50 dark:hover:bg-slate-950 transition-all text-xs"
                              >
                                <ExternalLink className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                  <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{cite.title}</p>
                                  <p className="text-[10px] text-slate-400 truncate">{cite.url}</p>
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* BOTTOM ACTION BAR */}
                      {item.sender === 'assistant' && item.id !== 'welcome' && (
                        <div className="flex items-center gap-3 pt-3 border-t border-slate-200/20 dark:border-slate-800/20">
                          <button 
                            onClick={() => {
                              item.isBookmarked = !item.isBookmarked;
                              setMessages([...messages]);
                              alert(item.isBookmarked ? 'Conversation Pinned!' : 'Conversation Unpinned!');
                            }} 
                            className={`p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${item.isBookmarked ? 'text-indigo-500' : ''}`}
                            title="Pin to Dashboard history"
                          >
                            <BookMarked className="w-4 h-4" />
                          </button>
                          
                          <button 
                            onClick={() => copyToClipboard(item.content)} 
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            title="Copy summary copy"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={() => {
                              const blob = new Blob([item.content], { type: 'text/markdown' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `copilot_summary_${item.id}.md`;
                              a.click();
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            title="Export markdown report"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          <span className="text-[10px] text-slate-400 font-mono ml-auto">
                            Executed by: {item.agentsUsed?.join(' + ')}
                          </span>
                        </div>
                      )}

                    </div>
                  </div>
                ))}

                {/* ACTIVE RUNNING AGENTS TIMELINE DISPLAY */}
                {isExecuting && activeTimeline.length > 0 && (
                  <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 shadow-sm space-y-4 animate-pulse max-w-[85%]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4.5 h-4.5 text-indigo-500 animate-spin" />
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Agent Pipeline Executing...</span>
                      </div>
                      {currentTool && (
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-[9px] font-mono text-indigo-500">
                          Active Tool: {currentTool}
                        </span>
                      )}
                    </div>

                    {/* Timeline steps list */}
                    <div className="relative border-l border-slate-200 dark:border-slate-800 pl-4 space-y-3">
                      {activeTimeline.map((step, idx) => (
                        <div key={idx} className="relative text-xs">
                          <span className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20" />
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-700 dark:text-slate-200">[{step.agent}]</span>
                            <span className="text-slate-500 dark:text-slate-400"> - {step.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* BOTTOM FIXED CHAT INPUT PANEL */}
              <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-stretch gap-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-2 shadow-md">
                  
                  <div className="flex-1 flex items-center gap-2 px-3">
                    <Search className="w-5 h-5 text-slate-400 shrink-0" />
                    <input 
                      type="text" 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Ask the agents anything..."
                      className="bg-transparent border-0 outline-none w-full text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:ring-0"
                      onKeyDown={(e) => e.key === 'Enter' && handlePromptSubmit()}
                    />
                  </div>

                  <div className="flex items-center gap-1.5 px-2 justify-end border-t md:border-t-0 md:border-l border-slate-200/60 dark:border-slate-800/60 pt-2 md:pt-0">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Attach file"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={toggleVoiceRecording}
                      className={`p-2 rounded-xl transition-all flex items-center gap-1.5 ${isRecording ? 'bg-red-500 text-white animate-pulse px-3' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                      title="Voice Speech-to-text"
                    >
                      <Mic className="w-5 h-5" />
                      {isRecording && <span className="text-[11px] font-mono font-medium">{voiceSecs}s</span>}
                    </button>
                    <button 
                      onClick={() => handlePromptSubmit()}
                      disabled={isExecuting || !prompt.trim()}
                      className="p-2.5 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  
                </div>
              </div>

            </div>
          )}

          {/* 3. AGENTS VIEW */}
          {activeTab === 'agents' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Specialized AI Agents</h3>
                  <p className="text-xs text-slate-400">View configuration and skills for each active sub-agent.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {agents.map((ag, idx) => (
                  <div key={idx} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700 ${ag.status === 'Thinking' || ag.status === 'Searching' || ag.status === 'Writing' ? 'bg-indigo-500 animate-ping' : ag.status === 'Finished' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                          <h4 className="font-bold text-base text-slate-800 dark:text-slate-200">{ag.name}</h4>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-850 text-slate-500 border border-slate-200/40">
                          {ag.status}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-500 dark:text-slate-400">{ag.description}</p>
                      
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase block">Capabilities</span>
                        <div className="flex flex-wrap gap-1.5">
                          {ag.skills.map((sk, skIdx) => (
                            <span key={skIdx} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-[10px]">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleQuickAction(ag.name.split(' ')[0].toLowerCase())}
                      className="w-full mt-4 py-2 rounded-xl bg-slate-50 hover:bg-indigo-500 hover:text-white dark:bg-slate-950 dark:hover:bg-indigo-500/20 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border border-slate-200/40 dark:border-slate-800/40"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Launch Test Session</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. PROJECTS VIEW */}
          {activeTab === 'projects' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Projects Planner</h3>
                  <p className="text-xs text-slate-400">Track milestones and planning timelines generated by the planning agent.</p>
                </div>
                <button 
                  onClick={() => {
                    const title = window.prompt('Enter project title:');
                    if (title) {
                      const newProj: Project = {
                        id: Math.random().toString(),
                        title,
                        description: 'Custom planned workspace project draft.',
                        status: 'Planning',
                        dueDate: '2026-07-31',
                        progress: 0,
                        tasksCount: { total: 4, completed: 0 }
                      };
                      setProjects(prev => [...prev, newProj]);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Project</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {projects.map((proj) => (
                  <div key={proj.id} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${proj.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : proj.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                        {proj.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Due: {proj.dueDate}</span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-slate-850 dark:text-slate-100">{proj.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{proj.description}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Milestone Progress</span>
                        <span>{proj.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 transition-all duration-500" 
                          style={{ width: `${proj.progress}%` }} 
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-200/30 dark:border-slate-800/30">
                      <span>Tasks completion</span>
                      <span>{proj.tasksCount.completed} / {proj.tasksCount.total} Tasks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. HISTORY VIEW */}
          {activeTab === 'history' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Conversation History</h3>
                  <p className="text-xs text-slate-400">Access and load past copilot conversations.</p>
                </div>
                <button 
                  onClick={() => {
                    setHistory([]);
                    alert('History cleared!');
                  }}
                  className="px-3.5 py-2 rounded-xl border border-red-500/20 text-red-500 text-xs font-semibold hover:bg-red-500/10 transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear History Logs</span>
                </button>
              </div>

              <div className="space-y-3">
                {history.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => {
                      setMessages(prev => [...prev, item]);
                      setActiveTab('chat');
                    }}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-sm hover:border-slate-300 dark:hover:border-slate-800 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold text-sm text-slate-850 dark:text-slate-200 line-clamp-1">
                          {item.content.length > 55 ? item.content.substring(0, 55) + '...' : item.content}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                          <span className="text-slate-300 dark:text-slate-800">•</span>
                          <div className="flex items-center gap-1">
                            {item.agentsUsed?.map((ag, index) => (
                              <span key={index} className="px-1.5 py-0.5 rounded bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 text-[9px] font-mono">
                                {ag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                ))}

                {history.length === 0 && (
                  <div className="p-12 text-center text-slate-400 space-y-3">
                    <AlertCircle className="w-10 h-10 text-slate-500 mx-auto" />
                    <p className="text-sm">No recent conversations stored.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6. FILES VIEW */}
          {activeTab === 'files' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Files Hub</h3>
                  <p className="text-xs text-slate-400">Upload CSV worksheets, PDF manuals, and TXT documentation for agents parsing.</p>
                </div>
              </div>

              {/* DRAG AND DROP BOX */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`p-10 rounded-3xl border-2 border-dashed text-center transition-all cursor-pointer ${isDragActive ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-200/60 dark:border-slate-800/60 hover:border-slate-350 dark:hover:border-slate-700 bg-white/20 dark:bg-slate-900/20'}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <FolderOpen className="w-10 h-10 text-slate-400 mx-auto mb-3 animate-bounce" />
                <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Drag and drop file here, or click to upload</h4>
                <p className="text-[11px] text-slate-400 mt-1">Accepts CSV, PDF, TXT, DOCX, Images up to 10MB</p>
              </div>

              {/* FILE LIST */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase">Saved Catalog ({files.length})</h4>
                <div className="space-y-2">
                  {files.map((file) => (
                    <div 
                      key={file.id} 
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center justify-between hover:border-indigo-500/20 transition-all"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">{file.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{file.size} • {file.type} • Uploaded {file.uploadDate}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            if (file.type === 'CSV') {
                              handleQuickAction('csv');
                            } else {
                              handleQuickAction('pdf');
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500 hover:text-white text-indigo-500 text-[10px] font-semibold transition-all"
                        >
                          Send to Agent
                        </button>
                        
                        <button 
                          onClick={() => {
                            setFiles(files.filter(f => f.id !== file.id));
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 7. SETTINGS VIEW */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Settings Configuration</h3>
                <p className="text-xs text-slate-400">Configure language patterns, models, and mock local orchestrator modes.</p>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-6">
                
                {/* Mode Select */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 tracking-wider uppercase block">AI Model Select</label>
                    <select 
                      value={settings.aiModel}
                      onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs p-2.5 outline-none focus:border-indigo-500"
                    >
                      <option value="Gemini 2.5 Flash">Gemini 2.5 Flash (Default)</option>
                      <option value="Gemini 2.5 Pro">Gemini 2.5 Pro (Extra reasoning)</option>
                      <option value="Gemini 2.5 Ultra">Gemini 2.5 Ultra (Code expert)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 tracking-wider uppercase block">System Language</label>
                    <select 
                      value={settings.language}
                      onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs p-2.5 outline-none focus:border-indigo-500"
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                    </select>
                  </div>
                </div>

                {/* Notifications & Offline Mock Toggles */}
                <div className="space-y-4 pt-4 border-t border-slate-200/40 dark:border-slate-800/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Live Agent Notifications</p>
                      <p className="text-[10px] text-slate-400">Trigger sound alerts when agents complete tasks.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={settings.notificationsEnabled}
                      onChange={(e) => setSettings({ ...settings, notificationsEnabled: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 text-indigo-500">Live Backend Bypass (Server Mode)</p>
                      <p className="text-[10px] text-slate-400">Query direct Express APIs on `http://localhost:5000` rather than front simulator.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={settings.mockBypassEnabled}
                      onChange={(e) => setSettings({ ...settings, mockBypassEnabled: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4"
                    />
                  </div>
                </div>

                {/* API Key Inputs */}
                <div className="space-y-4 pt-4 border-t border-slate-200/40 dark:border-slate-800/40">
                  <label className="text-xs font-bold text-slate-400 tracking-wider uppercase block">Supabase & Gemini Key Configurations</label>
                  <div className="space-y-3">
                    <input 
                      type="password" 
                      placeholder="Google Gemini API Key (Optional)"
                      value={settings.apiKeys.gemini}
                      onChange={(e) => setSettings({ ...settings, apiKeys: { ...settings.apiKeys, gemini: e.target.value } })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs p-2.5 outline-none focus:border-indigo-500"
                    />
                    <input 
                      type="text" 
                      placeholder="Supabase Project URL (Optional)"
                      value={settings.apiKeys.supabaseUrl}
                      onChange={(e) => setSettings({ ...settings, apiKeys: { ...settings.apiKeys, supabaseUrl: e.target.value } })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs p-2.5 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* RESET */}
                <div className="flex justify-end pt-4 border-t border-slate-200/40 dark:border-slate-800/40">
                  <button 
                    onClick={() => {
                      setSettings({
                        theme: 'dark',
                        language: 'English',
                        aiModel: 'Gemini 2.5 Flash',
                        notificationsEnabled: true,
                        mockBypassEnabled: false,
                        apiKeys: { gemini: '', supabaseUrl: '', supabaseKey: '' }
                      });
                      alert('Settings set back to defaults.');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 text-xs text-slate-600 dark:text-slate-350 transition-colors"
                  >
                    Reset Defaults
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      </main>

      {/* RIGHT SIDEBAR - ACTIVE PIPELINE MONITOR */}
      <aside className="w-80 border-l border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl shrink-0 p-5 hidden xl:flex flex-col justify-between">
        
        {/* TOP STATUS SECTION */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Agents Pipeline Monitor</h3>
            <span className="flex h-2.5 w-2.5 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isExecuting ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isExecuting ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
            </span>
          </div>

          {/* ACTIVE AGENTS STATUS CARD LIST */}
          <div className="space-y-3.5">
            {agents.map((ag) => (
              <div 
                key={ag.name}
                className={`p-3 rounded-xl border transition-all ${ag.status !== 'Idle' ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-transparent border-slate-200/40 dark:border-slate-800/40'}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">{ag.name}</span>
                  <div className="flex items-center gap-1.5">
                    {ag.status !== 'Idle' && ag.status !== 'Finished' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                    )}
                    <span className={`text-[10px] font-mono ${ag.status === 'Thinking' ? 'text-amber-500 font-semibold' : ag.status === 'Searching' ? 'text-cyan-500 font-semibold' : ag.status === 'Writing' ? 'text-purple-500 font-semibold' : ag.status === 'Finished' ? 'text-emerald-500 font-semibold' : 'text-slate-400'}`}>
                      {ag.status}
                    </span>
                  </div>
                </div>

                {/* mini status logs under active agent */}
                {ag.status !== 'Idle' && (
                  <p className="text-[10px] text-slate-400 animate-fade-in line-clamp-1">
                    {ag.status === 'Thinking' && 'Generating context mappings...'}
                    {ag.status === 'Searching' && 'Accessing network crawl targets...'}
                    {ag.status === 'Writing' && 'Formatting markdown documents...'}
                    {ag.status === 'Finished' && 'Task output compilation completed.'}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM METRIC */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/40 dark:border-slate-800/40 text-center space-y-1.5">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Workspace Connection Status</p>
          <div className="flex items-center justify-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {settings.mockBypassEnabled ? 'Local Server (API Connected)' : 'Internal Simulator Sandbox'}
            </span>
          </div>
        </div>

      </aside>

    </div>
  );
}
