# 🛡️ CISO Security Assessor

A sophisticated AI-powered security assessment tool that performs automated security analysis of software products. Built with React, TypeScript, and Tailwind CSS, featuring a modern IDE-like interface with real-time processing visualization.

![CISO Security Assessor](https://img.shields.io/badge/Status-Production-success)
![React](https://img.shields.io/badge/React-18.x-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Development](#-development)
- [Components Overview](#-components-overview)
- [Utilities](#-utilities)
- [Styling Guide](#-styling-guide)
- [Integration Guide](#-integration-guide)
- [Export Features](#-export-features)
- [Deployment](#-deployment)

---

## ✨ Features

### Core Features
- 🎯 **4-Phase Security Assessment Pipeline** - Entity Resolution, Vulnerability Analysis, Compliance Review, and Risk Assessment
- 📊 **Real-time Processing Visualization** - 2x2 grid of expandable phase cards with live progress tracking
- 📝 **Activity Log System** - Side-sliding panel with real-time processing logs and status indicators
- 💻 **CLI Terminal Interface** - Slide-up terminal for command-line interaction
- 📜 **Past Analysis Archive** - Historical analysis tracking and management
- 📄 **Professional PDF Reports** - Consultant-style reports with proper formatting and footnotes
- 🌐 **Interactive HTML Reports** - Beautiful static HTML exports with enhanced graphics

### UI/UX Features
- 🎨 **Evervault-Inspired Design** - Encrypted cards with animated matrix backgrounds
- 🖱️ **Custom Context Menu** - Right-click menu with analysis actions (desktop only)
- 🔘 **Metallic Report Button** - Animated glowing edges with 3D depth effects
- 📱 **Fully Responsive** - Optimized for desktop and mobile devices
- ⚡ **Performance Optimized** - Efficient rendering and state management
- 🎭 **Smooth Animations** - Polished transitions and hover effects

### Security Features
- 🔐 **CVE Tracking** - Critical vulnerability identification and analysis
- 📊 **Compliance Scoring** - SOC 2 and security standard compliance assessment
- 🎯 **Trust Score Calculation** - Comprehensive security rating system
- 📈 **Trend Analysis** - Historical vulnerability pattern recognition

---

## 🚀 Tech Stack

### Core Technologies
- **React 18** - UI framework with hooks and modern patterns
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 4.0** - Utility-first styling framework
- **Vite** - Fast build tool and dev server

### UI Libraries
- **shadcn/ui** - High-quality component library
- **Lucide React** - Beautiful icon system
- **Recharts** - Charting and data visualization
- **Sonner** - Toast notifications

### Key Dependencies
```json
{
  "react": "^18.x",
  "typescript": "^5.x",
  "tailwindcss": "^4.0",
  "lucide-react": "latest",
  "recharts": "latest"
}
```

---

## 📁 Project Structure

```
/
├── App.tsx                          # Main application component
├── components/                      # React components
│   ├── PhaseCanvas.tsx             # Main canvas with 2x2 phase grid
│   ├── PhaseCard.tsx               # Individual phase card component
│   ├── PhaseDetailsModal.tsx       # Phase details popup
│   ├── WelcomeScreen.tsx           # Initial landing screen
│   ├── ReportView.tsx              # Report display component
│   ├── Citations.tsx               # Activity log panel
│   ├── CliTerminal.tsx             # CLI terminal interface
│   ├── PastAnalysis.tsx            # Historical analysis panel
│   ├── ContextMenu.tsx             # Right-click context menu
│   ├── ShieldLogo.tsx              # Animated logo component
│   ├── SystemStatusModal.tsx       # System status display
│   └── ui/                         # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── progress.tsx
│       └── ... (50+ components)
├── utils/                          # Utility functions
│   ├── reportExport.ts            # HTML report generation
│   └── reportExportPDF.ts         # PDF report generation
├── styles/
│   └── globals.css                # Global styles and animations
└── README.md                       # This file
```

### Component Architecture

```
App.tsx
├── WelcomeScreen (initial state)
├── Main Interface
│   ├── Header
│   │   ├── Logo + Search
│   │   ├── Metallic Report Button
│   │   └── Action Buttons (Activity Log, CLI, etc.)
│   ├── PhaseCanvas (65% width)
│   │   ├── PhaseCard × 4 (2×2 grid)
│   │   ├── Canvas Connections
│   │   └── ContextMenu (right-click)
│   └── Side Panels (overlays)
│       ├── Citations (Activity Log)
│       ├── PastAnalysis
│       └── CliTerminal (bottom)
└── ReportView (modal)
```

---

## 🏁 Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm or yarn package manager

### Installation

1. **Clone the repository** (if applicable)
```bash
git clone <your-repo-url>
cd ciso-security-assessor
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Start development server**
```bash
npm run dev
# or
yarn dev
```

4. **Open browser**
```
http://localhost:5173
```

---

## 💻 Development

### Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Lint code
npm run lint
```

### Development Workflow

1. **Make changes** to components in `/components`
2. **Hot reload** automatically updates the browser
3. **Type checking** ensures type safety
4. **Build** before deploying to production

### Environment Setup

The application runs entirely in the browser with no backend dependencies for the frontend. All API integrations are mocked for demonstration purposes.

---

## 🧩 Components Overview

### Core Components

#### `App.tsx`
- **Purpose**: Main application orchestrator
- **State Management**: 
  - Phases and processing state
  - UI panel visibility
  - Report generation status
- **Key Functions**:
  - `simulateProcessing()` - Orchestrates 4-phase analysis
  - `handleSubmit()` - Processes user queries
  - `handleDownloadPDF()` - Triggers PDF export

#### `PhaseCanvas.tsx`
- **Purpose**: Main visualization canvas with 2×2 phase grid
- **Features**:
  - Responsive grid layout (2×2 desktop, vertical mobile)
  - Canvas-based phase connections
  - Right-click context menu (desktop only)
  - Clipboard fallback for restricted environments
- **Props**:
  ```typescript
  {
    phases: Phase[]
    reportReady?: boolean
    onViewReport?: () => void
    onRerunAnalysis?: () => void
    onClearAnalysis?: () => void
    onDownloadPDF?: () => void
    currentQuery?: string
  }
  ```

#### `PhaseCard.tsx`
- **Purpose**: Individual phase visualization
- **Features**:
  - Expandable/collapsible design
  - Real-time progress tracking
  - Status indicators (pending/active/completed/error)
  - Step-by-step detail display
- **Status Colors**:
  - 🔵 Pending: `slate-700`
  - 🟡 Active: `blue-500` with pulse animation
  - 🟢 Completed: `slate-600`
  - 🔴 Error: `red-500`

#### `Citations.tsx` (Activity Log)
- **Purpose**: Real-time activity logging panel
- **Features**:
  - Side-sliding overlay (desktop right, mobile bottom)
  - Auto-scroll to latest entries
  - Color-coded log levels
  - Timestamp tracking
- **Log Types**:
  - `info` - General information (blue)
  - `active` - Processing (yellow)
  - `completed` - Success (green)
  - `error` - Failures (red)

#### `CliTerminal.tsx`
- **Purpose**: Command-line interface panel
- **Features**:
  - Slide-up from bottom
  - Command history
  - Syntax highlighting
  - System status display

#### `WelcomeScreen.tsx`
- **Purpose**: Initial landing screen
- **Features**:
  - Animated shield logo
  - Example queries
  - Getting started guide

#### `ReportView.tsx`
- **Purpose**: Full-screen report viewer
- **Features**:
  - Trust score visualization
  - CVE summary cards
  - Compliance metrics
  - Vulnerability charts (Recharts)
  - Security score breakdown

#### `ContextMenu.tsx`
- **Purpose**: Right-click context menu (desktop only)
- **Features**:
  - Position-aware rendering
  - Disabled state handling
  - Dividers and danger states
  - Click-outside to close
- **Menu Items**:
  - Re-run Analysis
  - View Report
  - Download PDF Report
  - Copy Results (with clipboard fallback)
  - Copy Report Link (with clipboard fallback)
  - Share Results (if Web Share API available)
  - Clear Analysis

### UI Components (shadcn/ui)

Located in `/components/ui/`, these are pre-built, customizable components:

- `button.tsx` - Button variants and sizes
- `card.tsx` - Card containers with header/content/footer
- `dialog.tsx` - Modal dialogs
- `progress.tsx` - Progress bars
- `badge.tsx` - Status badges
- `tabs.tsx` - Tabbed interfaces
- `table.tsx` - Data tables
- `scroll-area.tsx` - Custom scrollbars
- `tooltip.tsx` - Hover tooltips
- `alert.tsx` - Alert messages
- `separator.tsx` - Visual dividers

[See full list in `/components/ui/`]

---

## 🔧 Utilities

### Report Export Utilities

#### `reportExportPDF.ts`
- **Purpose**: Generate consultant-style PDF reports
- **Features**:
  - Professional formatting with Georgia/Arial fonts
  - Proper page margins and footer spacing
  - Executive summary sections
  - Data tables and charts
  - Footnotes with proper spacing
  - Page breaks and print optimization
- **Usage**:
  ```typescript
  import { downloadConsultantPDF } from './utils/reportExportPDF';
  
  const reportData = {
    query: 'Apache Log4j',
    trustScore: 65,
    criticalCVEs: 2,
    compliance: 78,
    patchResponse: '14 days',
    vulnerabilityData: [...],
    securityScoreData: [...],
    generatedDate: new Date().toLocaleDateString()
  };
  
  downloadConsultantPDF(reportData);
  ```

#### `reportExport.ts`
- **Purpose**: Generate interactive HTML reports
- **Features**:
  - Evervault-inspired dark theme
  - Matrix background effects
  - Metallic gradient cards
  - Color-coded severity badges
  - Animated progress bars
  - Responsive grid layouts
  - Print-optimized styles
- **Usage**:
  ```typescript
  import { downloadHTMLReport } from './utils/reportExport';
  
  downloadHTMLReport(reportData);
  ```

### Clipboard Utility (in PhaseCanvas.tsx)
- **Purpose**: Cross-browser clipboard support
- **Features**:
  - Modern Clipboard API with fallback
  - Works in non-secure contexts
  - Handles restricted iframe permissions
- **Implementation**:
  ```typescript
  // Try modern API first
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback to document.execCommand
    fallbackCopyTextToClipboard(text);
  }
  ```

---

## 🎨 Styling Guide

### Color Palette

```css
/* Primary Colors */
--color-primary: #3b82f6      /* Blue */
--color-secondary: #8b5cf6    /* Purple */

/* Backgrounds */
--bg-black: #000000
--bg-slate-900: #0f172a
--bg-slate-800: #1e293b
--bg-slate-700: #334155

/* Text Colors */
--text-slate-100: #f1f5f9
--text-slate-300: #cbd5e1
--text-slate-400: #94a3b8
--text-slate-500: #64748b

/* Status Colors */
--success: #10b981           /* Green */
--warning: #f59e0b          /* Orange */
--error: #ef4444            /* Red */
--info: #3b82f6             /* Blue */
```

### Tailwind Configuration

Using Tailwind CSS v4.0 with custom configuration in `globals.css`:

```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@layer base {
  :root {
    --color-primary: #3b82f6;
    --color-secondary: #8b5cf6;
  }
  
  body {
    font-family: 'Inter', sans-serif;
  }
}
```

### Custom Animations

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.5s ease-out forwards;
}
```

### Design Patterns

#### Evervault-Style Cards
```tsx
<div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-lg">
  {/* Content */}
</div>
```

#### Matrix Background
```tsx
<div 
  style={{
    backgroundImage: 'radial-gradient(circle, rgba(100, 116, 139, 0.4) 1px, transparent 1px)',
    backgroundSize: '20px 20px'
  }}
/>
```

#### Metallic Button (Report Button)
```tsx
<button
  style={{
    background: 'linear-gradient(135deg, #94a3b8 0%, #cbd5e1 50%, #94a3b8 100%)',
    boxShadow: '0 0 0 1px rgba(148, 163, 184, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
  }}
  className="group hover:scale-105"
>
  {/* Glowing edges animation */}
  <div className="absolute inset-0 opacity-0 group-hover:opacity-100">
    <div className="animate-pulse" 
      style={{
        boxShadow: '0 0 15px 2px rgba(148, 163, 184, 0.6)'
      }}
    />
  </div>
</button>
```

#### Glowing Effects
```tsx
<div className="border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
  {/* Glowing border */}
</div>
```

---

## 🔌 Integration Guide

### Adding New Phases

1. **Define phase in App.tsx**:
```typescript
const initialPhases: Phase[] = [
  // ... existing phases
  {
    id: 'phase_5',
    name: 'New Phase Name',
    description: 'Phase description',
    status: 'pending',
    progress: 0,
    steps: [
      { 
        id: 'step_1', 
        message: 'Step message', 
        detail: 'Step detail',
        status: 'pending' 
      }
    ]
  }
];
```

2. **Update grid layout** in `PhaseCanvas.tsx`:
```typescript
const getPhasePositions = () => {
  return [
    { x: 20, y: 20 },  // Phase 1
    { x: 50, y: 20 },  // Phase 2
    { x: 80, y: 20 },  // Phase 3
    { x: 20, y: 60 },  // Phase 4
    { x: 50, y: 60 },  // Phase 5 (new)
  ];
};
```

3. **Add processing logic**:
```typescript
const processPhase5 = async () => {
  updatePhaseStatus('phase_5', 'active');
  // Processing logic here
  updatePhaseStatus('phase_5', 'completed');
};
```

### Adding Custom Context Menu Items

In `PhaseCanvas.tsx`:

```typescript
const contextMenuItems = [
  // ... existing items
  {
    icon: <YourIcon className="w-4 h-4" />,
    label: 'Your Action',
    onClick: () => handleYourAction(),
    disabled: false,
    divider: false,  // Add divider after this item
    danger: false,   // Red text for dangerous actions
  }
];
```

### Integrating with Backend APIs

Replace mock data with real API calls:

```typescript
// Example: Real API integration
const simulateProcessing = async (query: string) => {
  try {
    // Replace mock with real endpoint
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    
    const data = await response.json();
    
    // Update phases with real data
    setPhases(data.phases);
    setLogs(data.logs);
  } catch (error) {
    console.error('Analysis failed:', error);
  }
};
```

### Adding New Report Sections

In `ReportView.tsx`:

```tsx
{/* Add new section */}
<div className="mb-8">
  <h2 className="text-xl font-mono mb-4 text-slate-200">
    New Section Title
  </h2>
  <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-6">
    {/* Your content */}
  </div>
</div>
```

### Customizing Export Reports

#### PDF Report
Modify `reportExportPDF.ts`:

```typescript
// Add new section to PDF
export function generateConsultantPDFReport(data: ReportData): string {
  return `<!DOCTYPE html>
  <html>
    <!-- ... existing sections ... -->
    
    <!-- New Custom Section -->
    <div class="section">
      <h2 class="section-title">Your Section</h2>
      <div class="data-card">
        <!-- Your content -->
      </div>
    </div>
  </html>`;
}
```

#### HTML Report
Modify `reportExport.ts`:

```typescript
// Add custom styling and sections
export function generateHTMLReport(data: ReportData): string {
  return `<!DOCTYPE html>
  <html>
    <style>
      /* Add custom styles */
      .custom-section {
        background: rgba(30, 41, 59, 0.6);
        border-radius: 12px;
      }
    </style>
    <body>
      <!-- Add custom section -->
      <div class="custom-section">
        <!-- Content -->
      </div>
    </body>
  </html>`;
}
```

---

## 📤 Export Features

### PDF Export
- **Format**: Consultant-style professional report
- **Styling**: Georgia/Arial fonts, proper margins
- **Sections**:
  - Executive Summary
  - Vulnerability Analysis Tables
  - Security Score Breakdown
  - CVE Details
  - Recommendations
  - Data Sources
  - Footnotes
- **File Size**: ~100-200KB depending on data
- **Compatibility**: All modern browsers, printable

### HTML Export
- **Format**: Standalone interactive webpage
- **Styling**: Evervault dark theme, fully responsive
- **Features**:
  - Matrix background animation
  - Color-coded severity badges
  - Interactive charts (static in export)
  - Hover effects preserved
  - Print-optimized CSS
- **File Size**: ~50-150KB
- **Compatibility**: Works offline, all browsers

### Usage Example

```typescript
import { downloadConsultantPDF } from './utils/reportExportPDF';
import { downloadHTMLReport } from './utils/reportExport';

// Prepare report data
const reportData = {
  query: currentQuery,
  trustScore: 65,
  criticalCVEs: 2,
  compliance: 78,
  patchResponse: '14 days',
  vulnerabilityData: [
    { name: 'Critical', count: 2, color: '#ef4444' },
    { name: 'High', count: 5, color: '#f97316' },
    { name: 'Medium', count: 12, color: '#eab308' },
    { name: 'Low', count: 8, color: '#22c55e' }
  ],
  securityScoreData: [
    { category: 'Vulnerability Management', score: 72 },
    { category: 'Patch Response', score: 85 },
    { category: 'Compliance', score: 78 },
    { category: 'Security Posture', score: 65 }
  ],
  generatedDate: new Date().toLocaleDateString()
};

// Download PDF
downloadConsultantPDF(reportData);

// Download HTML
downloadHTMLReport(reportData);
```

---

## 🚢 Deployment

### Build for Production

```bash
# Install dependencies
npm install

# Build optimized production bundle
npm run build

# Output will be in /dist folder
```

### Deployment Platforms

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

#### Netlify
```bash
# Build command
npm run build

# Publish directory
dist
```

#### Static Hosting
1. Build the project: `npm run build`
2. Upload contents of `/dist` to your hosting
3. Configure server to serve `index.html` for all routes

### Environment Variables

Create `.env` file for environment-specific configs:

```env
VITE_API_URL=https://your-api-endpoint.com
VITE_APP_NAME=CISO Security Assessor
VITE_VERSION=1.0.0
```

Access in code:
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Welcome screen displays correctly
- [ ] Search input accepts queries
- [ ] All 4 phases complete successfully
- [ ] Activity log updates in real-time
- [ ] CLI terminal opens and closes
- [ ] Past analysis panel functions
- [ ] Context menu appears on right-click (desktop)
- [ ] Report view displays all sections
- [ ] PDF export downloads correctly
- [ ] HTML export downloads correctly
- [ ] Copy to clipboard works (both modern and fallback)
- [ ] Responsive on mobile devices
- [ ] All animations perform smoothly

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: Clipboard not working
- **Solution**: The app now includes a fallback method. If modern API fails, it uses `document.execCommand('copy')`

**Issue**: Report button not visible
- **Solution**: Ensure `reportReady` state is true after all phases complete

**Issue**: Panels not sliding in/out
- **Solution**: Check if overlay panels have proper z-index and transition classes

**Issue**: Build errors
- **Solution**: Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`

**Issue**: TypeScript errors
- **Solution**: Run type checking: `npm run type-check`

---

## 📚 Additional Resources

### Documentation
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Lucide Icons](https://lucide.dev)
- [Recharts](https://recharts.org)

### Component Libraries Used
- **shadcn/ui** - Pre-built accessible components
- **Lucide React** - Icon library
- **Recharts** - Chart components
- **Sonner** - Toast notifications

---

## 📝 License

This project is proprietary. All rights reserved.

---

## 👥 Contributing

For internal development:

1. Create a feature branch
2. Make changes following the existing patterns
3. Test thoroughly on desktop and mobile
4. Submit for review

---

## 🙏 Acknowledgments

- **Design Inspiration**: Evervault's encrypted card aesthetic
- **UI Components**: shadcn/ui component library
- **Icons**: Lucide icon system
- **Fonts**: Inter by Rasmus Andersson

---

## 📞 Support

For questions or issues, please contact the development team.

---

**Built with ❤️ for enterprise security teams**

*Version 1.0.0 - Last Updated: November 2024*
