# System Architecture & Workflow Flowcharts

This document describes the high-level architecture, multi-agent coordination system, and data analysis pipelines of the AI Workspace Copilot.

---

## 🏗️ High-Level System Architecture

The workspace utilizes a decoupled client-server architecture with an intelligent orchestration layer on the backend and a local fallback sandbox inside the React client.

```mermaid
graph TD
    User([User Prompt / File Upload]) --> UI[React Client App]
    UI --> ThemeEngine[Theme & Navigation State]
    UI --> CoreRouter{API Mode Switch}
    
    %% API Mode
    CoreRouter -->|Bypass Server Mode: Off| SandBox[Browser Sandbox Simulator]
    CoreRouter -->|Bypass Server Mode: On| ExpressAPI[Express Server - Port 5000]
    
    %% Execution Pipeline
    ExpressAPI --> TaskAnalyzer[Task Routing & Prompt Analyzer]
    SandBox --> TaskAnalyzerLocal[Local Prompt Router]
    
    TaskAnalyzer --> AgentChain[Micro-Agents Orchestration]
    TaskAnalyzerLocal --> AgentChainLocal[Simulated Agent Chain]
    
    %% Agents Group
    subgraph Micro-Agents [AI Agents Registry]
        ResearchAgent[Research Agent]
        WritingAgent[Writing Agent]
        CodingAgent[Coding Agent]
        PlanningAgent[Planning Agent]
        DataAgent[Data Agent]
        PDFAgent[PDF Agent]
    end
    
    AgentChain --> Micro-Agents
    AgentChainLocal --> Micro-Agents
    
    %% Outputs
    Micro-Agents --> Merger[Output Synthesis & Compilation]
    Merger --> UIRender[UI Output: Markdown, Recharts, Code Highlighting]
```

---

## 🧭 Multi-Agent Task Routing Workflow

When a query is dispatched, it runs through the Task Analyzer to map which sub-agents have matching capabilities. The selected agents execute sequentially or parallelly, updating active status indicators.

```mermaid
sequenceDiagram
    autonumber
    actor User as User Input
    participant TA as Task Analyzer
    participant R as Research Agent
    participant W as Writing Agent
    participant M as Synthesis Merger
    participant UI as Chat View Layout
    
    User->>TA: "Research AI agents and draft a project plan"
    activate TA
    Note over TA: Analyzes keywords, matches agent skills
    TA-->>UI: Update Active Agents: [Research, Planning]
    deactivate TA
    
    %% Research Execution
    rect rgb(99, 102, 241, 0.05)
        Note over R: Status: Thinking -> Searching
        UI->>R: Execute Web Crawl
        activate R
        R->>UI: Logs: "Scanning web whitepapers..."
        Note over R: Status: Finished
        R-->>M: Citation objects & summaries
        deactivate R
    end
    
    %% Planning Execution
    rect rgb(139, 92, 246, 0.05)
        Note over W: Status: Thinking -> Writing
        UI->>W: Execute Timeline Plan
        activate W
        W->>UI: Logs: "Assembling sprint dates..."
        Note over W: Status: Finished
        W-->>M: Plan markdown & Gantt data
        deactivate W
    end
    
    %% Merger
    M->>M: Sync citations and compile outputs
    M->>UI: Append Final message payload
    UI-->>User: Render Dashboard visual cards & charts
```

---

## 📊 CSV & Data Visualization Pipeline

When a user drops a spreadsheet or text workbook, the Data Agent parses columns, detects numeric columns, and forwards plotted datasets to Recharts.

```mermaid
graph LR
    Upload[CSV Spreadsheet Drop] --> Parser[csv-parser / Readable Stream]
    Parser --> SchemaDetect{Identify Columns}
    SchemaDetect -->|Numeric Fields| NumericArray[Store as Chart Points]
    SchemaDetect -->|Text Labels| NameMapping[Store as X-Axis Categories]
    NumericArray --> Aggregator[Calculate Averages & Sums]
    NameMapping --> Aggregator
    Aggregator --> Recharts[Render Responsive Bar Chart Widget]
```
