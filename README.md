# JSON Viewer

[![GitHub Pages](https://img.shields.io/badge/deployment-GitHub%20Pages-blue.svg)](https://pages.github.com/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)

A fast, private, developer-centric client-side utility for inspecting, formatting, minifying, validating, and analyzing JSON data.

Built with a compact dark-mode developer aesthetic inspired by modern IDEs. **100% client-side** — your JSON never leaves your browser.

---

## ✨ Features

- **🌳 Interactive Tree View**:
  - Recursively explore nested objects and arrays.
  - Collection item count indicators (`users Array(25)`, `settings Object(8)`).
  - Expand All / Collapse All controls with safety limits for large JSON documents.
  - Optional visual **Sort Keys** toggle.
  - Subtle, high-contrast syntax styling distinguishing keys, strings, numbers, booleans, and nulls.

- **🎯 Safe Path Copying**:
  - Copy safe access paths directly to your clipboard for any key or value.
  - Standard dot notation for valid identifiers (`user.profile.name`).
  - Index brackets for arrays (`users[3].email`).
  - Safe bracket notation with full string escaping for keys containing dots, spaces, quotes, or special characters (`["hello.world"]["some key"]`).

- **🔍 Full-Text Search & Tree Navigation**:
  - Real-time search across object keys, string values, numbers, and boolean values.
  - Match counter (`3 of 12 matches`) with Previous / Next navigation.
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
  - Debounced input processing (~250ms) to ensure smooth typing on large documents.
  - Precise line and column error indicators for invalid syntax.
  - Supports all standard JSON root values: objects (`{}`), arrays (`[]`), `null`, `true`, `false`, `123`, and `"hello"`.

- **📁 Drag & Drop and File Picker**:
  - Drag and drop `.json` files directly into the editor.
  - Dedicated file upload button supporting `.json` and text files.
  - File download utility to export formatted JSON.

- **🕒 Local History**:
  - Automatically saves the last 5 valid documents (< 1 MB) in `localStorage`.
  - Preview snippets, timestamps, and file sizes.
  - One-click restoration of previous sessions.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl + Enter` / `Cmd + Enter` | Format JSON (2 spaces) |
| `Ctrl + Shift + C` / `Cmd + Shift + C` | Copy Formatted JSON |
| `Ctrl + F` / `Cmd + F` | Focus Search Input |
| `Enter` (in Search) | Next Match |
| `Shift + Enter` (in Search) | Previous Match |
| `Tab` (in Editor) | Indent 2 spaces |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (Node.js 20+ recommended)
- npm or pnpm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/json-viewer.git

# Navigate into project directory
cd json-viewer

# Install dependencies
npm install

# Start local development server
npm run dev
```

The application will be accessible at `http://localhost:5173`.

### Production Build
```bash
npm run build
```
The optimized production bundle will be generated in the `dist/` directory.

---

## 🌐 Deploy to GitHub Pages

This project is pre-configured for GitHub Pages deployment:

1. In `vite.config.ts`, `base: './'` is used to ensure all assets resolve relatively regardless of subpath.
2. An automated GitHub Actions workflow is provided in `.github/workflows/deploy.yml`.
3. In your GitHub repository settings, navigate to **Settings > Pages** and select **GitHub Actions** as the source.
4. Push to the `main` branch:
   ```bash
   git add .
   git commit -m "feat: complete JSON Viewer tool"
   git push origin main
   ```
   The workflow will automatically build and publish the site.

---

## 🏗️ Architecture

```text
json-viewer/
├── .github/workflows/deploy.yml  # GitHub Pages workflow
├── src/
│   ├── components/
│   │   ├── ui/                   # shadcn-inspired primitives (Button, Tooltip, Badge, Dialog)
│   │   ├── EmptyState.tsx        # Empty state with sample loader and dropzone prompt
│   │   ├── Header.tsx            # App bar with title, sample loader, privacy badge
│   │   ├── HistoryPanel.tsx      # Local history slide-over modal
│   │   ├── JsonEditor.tsx        # Left pane editor with line numbers and drag-and-drop
│   │   ├── JsonTree.tsx          # Right pane tree container with expansion controls
│   │   ├── JsonTreeNode.tsx      # Recursive node renderer (expand, types, copy path)
│   │   ├── PrettyView.tsx        # Formatted readonly code block
│   │   ├── RawView.tsx           # Raw unformatted text viewer with wrap toggle
│   │   ├── SearchBar.tsx         # Search bar with count badge and navigation
│   │   ├── StatusBar.tsx         # Bottom status and metrics bar
│   │   └── ViewTabs.tsx          # Tab selector for Tree / Pretty / Raw views
│   ├── hooks/
│   │   ├── useJsonHistory.ts     # LocalStorage history hook
│   │   ├── useJsonParser.ts      # Debounced parser with metrics
│   │   └── useJsonSearch.ts      # Real-time recursive search hook
│   ├── lib/
│   │   ├── file.ts               # File reader and downloader
│   │   ├── json.ts               # Formatter, minifier, key sorter, sample data
│   │   ├── jsonPath.ts           # Safe path builder with bracket escaping
│   │   ├── jsonStats.ts          # Iterative statistics calculator
│   │   └── utils.ts              # Tailwind CSS class merger
│   ├── types/
│   │   └── json.ts               # Recursive JSON TypeScript interfaces
│   ├── App.tsx                   # Main split-view workspace
│   ├── index.css                 # Tailwind directives and dark theme palette
│   └── main.tsx                  # Application entry point
├── index.html                    # HTML shell
├── package.json                  # Dependencies and scripts
├── tailwind.config.js            # Custom dark theme configuration
├── tsconfig.json                 # Strict TypeScript configuration
└── vite.config.ts                # Vite config with relative base
```

---

## 🔒 Privacy Guarantee

This tool operates **entirely within your browser's JavaScript runtime**.
No tracking, no analytics, no external servers, and no network requests with your payload are ever made.
