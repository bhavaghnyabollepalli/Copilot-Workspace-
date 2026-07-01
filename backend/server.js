const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Set up file uploads
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// Status indicators helper
const AGENT_STATUS = {
  IDLE: 'Idle',
  THINKING: 'Thinking',
  SEARCHING: 'Searching',
  WRITING: 'Writing',
  FINISHED: 'Finished'
};

// Help simulate step responses
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// TASK ANALYZER ENDPOINT
app.post('/api/analyze', async (req, res) => {
  const { prompt, files } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const promptLower = prompt.toLowerCase();
  const selectedAgents = [];
  
  // Rule-based task routing (to simulate Gemini prompt routing)
  if (promptLower.includes('search') || promptLower.includes('research') || promptLower.includes('web') || promptLower.includes('news') || promptLower.includes('compare')) {
    selectedAgents.push('Research Agent');
  }
  if (promptLower.includes('write') || promptLower.includes('draft') || promptLower.includes('email') || promptLower.includes('blog') || promptLower.includes('post') || promptLower.includes('note') || promptLower.includes('linkedin')) {
    selectedAgents.push('Writing Agent');
  }
  if (promptLower.includes('code') || promptLower.includes('react') || promptLower.includes('javascript') || promptLower.includes('html') || promptLower.includes('css') || promptLower.includes('debug') || promptLower.includes('refactor') || promptLower.includes('programming')) {
    selectedAgents.push('Coding Agent');
  }
  if (promptLower.includes('csv') || promptLower.includes('excel') || promptLower.includes('data') || promptLower.includes('chart') || promptLower.includes('graph') || promptLower.includes('trend')) {
    selectedAgents.push('Data Agent');
  }
  if (promptLower.includes('pdf') || promptLower.includes('summarize') || promptLower.includes('extract') || promptLower.includes('document')) {
    selectedAgents.push('PDF Agent');
  }
  if (promptLower.includes('plan') || promptLower.includes('roadmap') || promptLower.includes('schedule') || promptLower.includes('sprint') || promptLower.includes('todo') || promptLower.includes('timeline')) {
    selectedAgents.push('Planning Agent');
  }

  // Default to Research and Writing if nothing matches
  if (selectedAgents.length === 0) {
    selectedAgents.push('Research Agent');
    selectedAgents.push('Writing Agent');
  }

  res.json({
    message: 'Task analyzed successfully',
    selectedAgents,
    timelineSteps: [
      { agent: 'Task Analyzer', status: 'Analyzing prompt syntax and user intent...', duration: 400 },
      { agent: 'Task Analyzer', status: `Dispatched tasks to: ${selectedAgents.join(', ')}`, duration: 300 }
    ]
  });
});

// MULTI-AGENT EXECUTION SIMULATION
app.post('/api/execute', async (req, res) => {
  const { prompt, agents, uploadedFiles } = req.body;
  const promptLower = prompt.toLowerCase();
  
  const steps = [];
  let mergedOutput = '';
  const citations = [];
  const chartData = [];
  let generatedCode = '';

  // 1. RESEARCH AGENT EXECUTION
  if (agents.includes('Research Agent')) {
    steps.push({ agent: 'Research Agent', action: 'Searching the web', tool: 'Search Engine', status: 'Searching for relevant articles and publications...' });
    await delay(500);
    steps.push({ agent: 'Research Agent', action: 'Analyzing sources', tool: 'Web Extractor', status: 'Synthesizing data from top search results...' });
    
    citations.push(
      { title: 'AI Trends 2026', url: 'https://techtrends.io/ai-2026', snippet: 'Discussion on agentic AI replacing simple chatbots' },
      { title: 'Multi-Agent Orchestration Patterns', url: 'https://arxiv.org/abs/2604.1209', snippet: 'Coordinating specialized agents using hierarchical structures' }
    );

    mergedOutput += `### 🔍 Research Summary\nBased on a search of recent developments regarding "${prompt}":\n\n- **Agent Orchestration**: Industry trends show a major shift towards specialized sub-agents working together in a timeline workflow.\n- **Efficiency Gains**: Multi-agent platforms yield up to a 40% reduction in error rates for code generation and project scheduling compared to single-prompt systems.\n\n`;
  }

  // 2. WRITING AGENT EXECUTION
  if (agents.includes('Writing Agent')) {
    steps.push({ agent: 'Writing Agent', action: 'Drafting content', tool: 'Document Composer', status: 'Generating structural outline and writing draft...' });
    await delay(600);
    steps.push({ agent: 'Writing Agent', action: 'Polishing document', tool: 'Grammar Refiner', status: 'Reviewing tone and checking readability index...' });

    mergedOutput += `### 📝 Generated Document\nHere is the polished draft tailored for your request:\n\n---\n#### Subject: Professional Workspace Proposal\n\nHello Team,\n\nI hope this message finds you well. Following our analysis of project requirements, we propose implementing a multi-agent system. This system will orchestrate specialized workflows (Research, Writing, Planning) to streamline operation metrics and elevate our standard SaaS deliverables.\n\nKey highlights include:\n1. Structured layouts with clean, modern sidebar-based navigation.\n2. Built-in interactive visual chart widgets for data metrics.\n3. Automatic history persistence.\n\nPlease let me know your availability for a brief sync later this week to discuss details.\n\nBest regards,\n**Your AI Workspace Copilot**\n---\n\n`;
  }

  // 3. CODING AGENT EXECUTION
  if (agents.includes('Coding Agent')) {
    steps.push({ agent: 'Coding Agent', action: 'Generating code structure', tool: 'Compiler Prompt', status: 'Structuring modular component files...' });
    await delay(500);
    steps.push({ agent: 'Coding Agent', action: 'Writing logic and styles', tool: 'Linter API', status: 'Injecting Tailwind classes and validation hooks...' });

    generatedCode = `import React, { useState } from 'react';
import { Sparkles, Terminal } from 'lucide-react';

interface CopilotCardProps {
  title: string;
  status: 'idle' | 'thinking' | 'finished';
}

export const CopilotCard: React.FC<CopilotCardProps> = ({ title, status }) => {
  const [active, setActive] = useState(false);

  return (
    <div 
      className="p-6 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
      onClick={() => setActive(!active)}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
        <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Status: <span className="font-medium text-indigo-600 dark:text-indigo-400">{status}</span>
      </p>
      {active && (
        <div className="mt-4 p-3 rounded-lg bg-slate-950 text-emerald-400 font-mono text-xs flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          <span>Agent console connected.</span>
        </div>
      )}
    </div>
  );
};`;

    mergedOutput += `### 💻 Coding Solution\nBelow is the generated TypeScript component incorporating modular state, interactive trigger highlights, and Lucide icons:\n\n\`\`\`tsx\n${generatedCode}\n\`\`\`\n\n`;
  }

  // 4. DATA AGENT EXECUTION
  if (agents.includes('Data Agent')) {
    steps.push({ agent: 'Data Agent', action: 'Parsing data file', tool: 'CSV Engine', status: 'Reading spreadsheet columns and headers...' });
    await delay(400);
    steps.push({ agent: 'Data Agent', action: 'Aggregating rows', tool: 'Analytics Module', status: 'Calculating standard deviations and distributions...' });

    // Populate mock chart data
    chartData.push(
      { name: 'Jan', value: 4200, users: 2400, tasks: 400 },
      { name: 'Feb', value: 4900, users: 2800, tasks: 520 },
      { name: 'Mar', value: 5800, users: 3700, tasks: 680 },
      { name: 'Apr', value: 7100, users: 4300, tasks: 810 },
      { name: 'May', value: 8300, users: 5100, tasks: 940 },
      { name: 'Jun', value: 9500, users: 6200, tasks: 1100 }
    );

    mergedOutput += `### 📊 Data Analysis Report\nHere are the aggregated trends derived from the data session:\n\n| Period | Total Value | Active Users | Task Count |\n| :--- | :--- | :--- | :--- |\n| Q1 (Jan-Mar) | 14,900 | 8,900 | 1,600 |\n| Q2 (Apr-Jun) | 24,900 | 15,600 | 2,850 |\n\n**Insights Found:**\n- **Upward Momentum**: Overall value registered a **37.6% growth rate** quarter-over-quarter.\n- **User Peak**: Monthly active users hit a peak of **6,200** in June with standard deviation well within expected SaaS thresholds.\n\n`;
  }

  // 5. PDF AGENT EXECUTION
  if (agents.includes('PDF Agent')) {
    steps.push({ agent: 'PDF Agent', action: 'Extracting text layer', tool: 'OCR Scanner', status: 'Reading embedded fonts and formatting tables...' });
    await delay(500);
    steps.push({ agent: 'PDF Agent', action: 'Creating abstract summaries', tool: 'NL Reader', status: 'Extracting core findings and generating outline...' });

    mergedOutput += `### 📄 PDF Executive Summary\nThe uploaded document was successfully analyzed. Key sections identified:\n\n- **Abstract**: Focuses on scalable web application structures and modern styling principles using atomic layouts.\n- **Methodology**: Evaluates developer velocity improvements from using integrated IDE sidebars and rich animations.\n- **Recommendations**: Recommends implementing full Light/Dark mode themes and dynamic client components to maximize onboarding engagement.\n\n`;
  }

  // 6. PLANNING AGENT EXECUTION
  if (agents.includes('Planning Agent')) {
    steps.push({ agent: 'Planning Agent', action: 'Generating roadmap steps', tool: 'Gantt Builder', status: 'Calculating dependency milestones...' });
    await delay(600);
    steps.push({ agent: 'Planning Agent', action: 'Optimizing resource load', tool: 'Timeline Scheduler', status: 'Finalizing sprint cycles and backlog distribution...' });

    mergedOutput += `### 📅 Project Roadmap & Planning\nHere is a recommended execution path designed for the project:\n\n- **Phase 1: Design & Infrastructure (Days 1-3)**\n  - Set up directory scaffolding and environment routes.\n  - Implement core global style systems and theme providers.\n- **Phase 2: Core Components & Layouts (Days 4-7)**\n  - Design collapsable sidebar navigation, agents timeline, and prompt input boxes.\n  - Add Recharts charting grids for CSV viewing.\n- **Phase 3: Integration & Walkthrough (Days 8-10)**\n  - Hook frontend dashboard elements to live API endpoints.\n  - Conduct automated package builds and verify cross-platform responsiveness.\n\n`;
  }

  res.json({
    mergedOutput,
    steps,
    citations,
    chartData,
    code: generatedCode
  });
});

// CSV UPLOAD AND ANALYSIS ENDPOINT
app.post('/api/upload-csv', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const results = [];
  const bufferStream = new Readable();
  bufferStream.push(req.file.buffer);
  bufferStream.push(null);

  bufferStream
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      // Analyze data to find numeric columns and generate basic chart data
      const numericColumns = [];
      if (results.length > 0) {
        Object.keys(results[0]).forEach(key => {
          const sampleVal = results[0][key];
          if (!isNaN(Number(sampleVal.replace(/[^0-9.-]+/g, '')))) {
            numericColumns.push(key);
          }
        });
      }

      // Prepare standard chart payload (up to 10 rows for clean rendering)
      const chartPoints = results.slice(0, 10).map((row, idx) => {
        const point = { name: row.name || row.label || row.date || row.month || `Row ${idx + 1}` };
        numericColumns.forEach(col => {
          point[col] = Number(row[col].replace(/[^0-9.-]+/g, '')) || 0;
        });
        return point;
      });

      res.json({
        filename: req.file.originalname,
        rowCount: results.length,
        numericColumns,
        chartData: chartPoints,
        summary: `Parsed CSV file successfully. Found ${results.length} rows and ${Object.keys(results[0] || {}).length} columns. Numeric indicators found for charts: ${numericColumns.join(', ')}.`
      });
    })
    .on('error', (err) => {
      res.status(500).json({ error: 'Failed to process CSV file', details: err.message });
    });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', environment: process.env.NODE_ENV || 'development' });
});

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
