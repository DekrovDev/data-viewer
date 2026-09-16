# Data Viewer

[![Production](https://img.shields.io/badge/domain-data.dekrov.com-blue.svg)](https://data.dekrov.com/)
[![GitHub Pages](https://img.shields.io/badge/deployment-GitHub%20Pages-blue.svg)](https://pages.github.com/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)

A fast, private, developer-centric client-side utility for inspecting, navigating, formatting, and analyzing structured data.

Published at **[data.dekrov.com](https://data.dekrov.com/)**.

Built with a clean dark-mode developer aesthetic inspired by modern IDEs. **100% client-side** — your data never leaves your browser.

---

## 🎯 Supported Formats

- **JSON** (Active & Fully Featured):
  - High-performance lazy tree rendering
  - Array chunking for large lists
  - Real-time search across keys and values
  - Safe path copy generator (dot notation & bracket escaping)
  - Instant format & minify
  - Structural metrics & deep depth statistics
  - Local history (up to 5 recent documents stored in localStorage)
- **Future Modular Formats (Architecture Ready)**:
  - CSV / TSV
  - SQLite (.sqlite, .db)
  - Parquet
  - YAML / XML

---

## ✨ Features (JSON Module)

- **🌳 Lazy Tree View**:
  - Recursively explore nested objects and arrays.
  - Collapsed nodes do not render hidden DOM elements, ensuring smooth performance even on large documents.
  - Chunk rendering in batches of 100 items for massive arrays.
  - Collection item count indicators (users Array(25), settings Object(8)).
  - Expand +1 / +2 Levels, Collapse All, and safe Expand All controls.
  - Optional visual **Sort Keys** toggle.
  - Subtle, high-contrast syntax styling distinguishing keys, strings, numbers, booleans, and nulls.

- **🎯 Safe Path Copying**:
  - Copy safe access paths directly to your clipboard for any key or value.
  - Standard dot notation for valid identifiers (user.profile.name).
  - Index brackets for arrays (users[3].email).
  - Safe bracket notation with full string escaping for keys containing dots, spaces, quotes, or reserved words ([hello.world][some key]).

- **🔍 Full-Text Search & Tree Navigation**:
  - Real-time search across object keys, string values, numbers, and boolean values.
  - Match counter (3 of 12 matches) with Previous / Next navigation.
  - Automatically unfolds and scrolls to parent nodes when stepping through search results.
  - Highlighted search match text.

- **⚡ Instant Format & Minify**:
  - **Format**: Pretty-prints valid JSON with clean 2-space indentation.
  - **Minify**: Compresses JSON to a single line without whitespace.
  - **Copy**: One-click clipboard copy with feedback toasts.
  - **Clear**: Quick reset without losing saved history.

- **📊 Comprehensive Statistics**:
  - Instant structural metrics computed separately from the UI:
    - Byte size (formatted in B, KB, MB)
    - Total key count
    - Object count
    - Array count
    - Primitive count
    - Maximum nesting depth

- **🛡️ Robust Parser & Error Diagnostics**:
  - Debounced input processing (~250ms) to ensure smooth typing.
  - Precise line and column error indicators for invalid syntax.
  - Supports all standard JSON root values: objects ({}), arrays ([]), 
ull, 	rue, alse, 123, and hello.

- **📁 Drag & Drop and File Detection**:
  - Drag and drop data files directly into the window or editor.
  - Automatic format detection via file extension and MIME type.
  - File download utility to export data.

- **🕒 Local History**:
  - Automatically saves the last 5 valid documents (< 1 MB) in localStorage.
  - Preview snippets, timestamps, and file sizes.
  - One-click restoration of previous sessions.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| Ctrl + Enter / Cmd + Enter | Format JSON (2 spaces) |
| Ctrl + Shift + C / Cmd + Shift + C | Copy Formatted JSON |
| Ctrl + F / Cmd + F | Focus Search Input |
| Ctrl + B / Cmd + B | Toggle Input Editor Panel |
| Enter (in Search) | Next Match |
| Shift + Enter (in Search) | Previous Match |
| Tab (in Editor) | Indent 2 spaces |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (Node.js 20+ recommended)
- npm, pnpm, or yarn

### Installation
`ash
# Clone the repository
git clone https://github.com/DekrovDev/data-viewer.git

# Navigate into project directory
cd data-viewer

# Install dependencies
npm install

# Start local development server
npm run dev
`

The application will be accessible at http://localhost:5173.

### Production Build
`ash
npm run build
`
The optimized production bundle will be generated in the dist/ directory, including the custom domain CNAME file pointing to data.dekrov.com.

### Testing & Type Checking
`ash
# Run unit tests
npm test

# Run TypeScript type check
npm run typecheck
`

---

## 🏗️ Architecture

The codebase follows a modular design pattern:

`	ext
data-viewer/
├── .github/workflows/deploy.yml   # GitHub Pages deployment workflow
├── public/
│   ├── CNAME                      # Custom domain definition (data.dekrov.com)
│   └── favicon.svg                # Application favicon
├── src/
│   ├── core/                      # Core cross-cutting foundational services
│   │   ├── detection/             # Multi-format detection (extension & MIME)
│   │   └── files/                 # Universal file reader and downloader
│   ├── shared/                    # Shared reusable design system & utilities
│   │   ├── components/
│   │   │   ├── ui/                # Accessible Radix primitives (Button, Tooltip, Dialog, Badge, Tabs)
│   │   │   ├── Header.tsx         # Top bar with format indicator & navigation
│   │   │   └── EmptyState.tsx     # Format-agnostic start screen
│   │   └── lib/                   # Formatting and class name utilities
│   ├── modules/
│   │   └── json/                  # Isolated JSON viewer module
│   │       ├── components/        # Tree, Editor, Search, Pretty, Raw, StatusBar
│   │       ├── hooks/             # Parser, Search, and History hooks
│   │       ├── lib/               # jsonPath, jsonStats, parser helpers
│   │       ├── types/             # JSON data contracts & interfaces
│   │       └── index.ts           # Module barrel export
│   ├── App.tsx                    # Main coordinator container
│   ├── index.css                  # Global styles and design tokens
│   └── main.tsx                   # React application entry point
├── test/
│   └── verify.mjs                 # Unit tests (Path builder, stats, format detection)
├── index.html                     # HTML template
├── package.json                   # Project metadata
├── tailwind.config.js             # Dark-first developer theme
├── tsconfig.json                  # Strict TypeScript configuration
└── vite.config.ts                 # Vite bundler configuration (base: '/')
`

---

## 🔒 Privacy Guarantee

This tool operates **entirely within your browser's JavaScript runtime**.
No tracking, no telemetry, no analytics, no external servers, and no network requests with your payload are ever made.
