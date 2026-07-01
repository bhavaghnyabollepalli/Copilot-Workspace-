export type AgentName = 
  | 'Research Agent' 
  | 'Writing Agent' 
  | 'Coding Agent' 
  | 'PDF Agent' 
  | 'Data Agent' 
  | 'Planning Agent';

export type AgentStatus = 'Idle' | 'Thinking' | 'Searching' | 'Writing' | 'Finished';

export interface Agent {
  name: AgentName;
  description: string;
  status: AgentStatus;
  skills: string[];
  color: string; // Tailwind class
}

export interface Citation {
  title: string;
  url: string;
  snippet?: string;
}

export interface ChartDataPoint {
  name: string;
  value?: number;
  users?: number;
  tasks?: number;
  [key: string]: string | number | undefined;
}

export interface TimelineStep {
  agent: string;
  action?: string;
  tool?: string;
  status: string;
  duration?: number;
  timestamp: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'system' | 'assistant';
  content: string;
  timestamp: string;
  agentsUsed?: AgentName[];
  timelineSteps?: TimelineStep[];
  citations?: Citation[];
  chartData?: ChartDataPoint[];
  codeSnippet?: string;
  filesAttached?: string[];
  isBookmarked?: boolean;
}

export interface SavedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadDate: string;
  contentSnippet?: string;
  numericColumns?: string[];
  chartData?: ChartDataPoint[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'Planning' | 'In Progress' | 'Completed';
  dueDate: string;
  progress: number; // 0-100
  tasksCount: { total: number; completed: number };
}

export interface AppSettings {
  theme: 'light' | 'dark';
  language: string;
  aiModel: string;
  notificationsEnabled: boolean;
  mockBypassEnabled: boolean; // toggle backend vs front-only simulation
  apiKeys: {
    gemini: string;
    supabaseUrl: string;
    supabaseKey: string;
  };
}
