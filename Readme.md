# Code Editor

A premium desktop code editor built with **Electron**, **React**, **TypeScript**, and **Monaco Editor** (the same engine powering VS Code).

## Features

- **Monaco Editor** — VS Code's editor engine with full syntax highlighting for 20+ languages
- **IntelliSense** — Smart code completions, parameter hints, and inline suggestions
- **Multi-tab editing** — Open multiple files with Ctrl+Tab cycling
- **Integrated terminal** — Real shell via xterm.js + node-pty (bash/zsh/powershell)
- **File tree explorer** — Recursive directory browsing, create/rename/delete files
- **Find & Replace** — Built into Monaco (Ctrl+F / Ctrl+H)
- **Multiple themes** — Catppuccin Mocha, VS Dark, VS Light, High Contrast, Monokai, GitHub Dark
- **Auto-save** — Debounced 2-second auto-save with dirty indicator
- **Git branch** — Status bar shows current git branch
- **Keyboard shortcuts** — Full keyboard navigation

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop framework | Electron 28 |
| Build tool | electron-vite 2 + Vite 5 |
| UI | React 18 + TypeScript |
| Editor engine | Monaco Editor 0.44 (@monaco-editor/react) |
| Terminal UI | xterm.js 5 + FitAddon + WebLinksAddon |
| Terminal backend | node-pty (pseudo-terminal) |
| Settings storage | electron-store |
| Git integration | simple-git |

## Prerequisites

- Node.js 18+
- npm 9+
- macOS 12+ / Windows 10+ / Ubuntu 20+

On macOS, you'll need Xcode Command Line Tools for building native modules:
```bash
xcode-select --install
```

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd CodeEditor

# Install dependencies (node-pty is rebuilt automatically)
npm install

# Start the development server
npm run dev
```

> **Note:** If running inside VS Code, Cursor, or another Electron-based editor, the dev script automatically unsets `ELECTRON_RUN_AS_NODE` so Electron runs correctly.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Preview production build |
| `npm run package` | Build + package with electron-builder |
| `npm run rebuild` | Rebuild native modules (node-pty) |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘O` | Open file |
| `⌘⇧O` | Open folder |
| `⌘N` | New file |
| `⌘S` | Save |
| `⌘⇧S` | Save As |
| `⌘W` | Close tab |
| `⌘Tab` | Next tab |
| `⌘⇧Tab` | Previous tab |
| `` ⌘` `` | Toggle terminal |
| `⌘B` | Toggle sidebar |
| `⌘,` | Settings |
| `⌘F` | Find (Monaco built-in) |
| `⌘H` | Replace (Monaco built-in) |

> On Windows/Linux, replace `⌘` with `Ctrl`.

## Project Structure

```
src/
├── main/
│   ├── index.ts          # Electron main process, BrowserWindow setup
│   └── ipcHandlers.ts    # IPC handlers: files, terminal, settings, git
├── preload/
│   └── index.ts          # contextBridge — exposes electronAPI to renderer
└── renderer/
    ├── index.html
    └── src/
        ├── App.tsx        # Root component, layout, keyboard shortcuts
        ├── components/
        │   ├── Editor.tsx    # Monaco editor wrapper
        │   ├── FileTree.tsx  # Sidebar file explorer
        │   ├── TabBar.tsx    # Tab management UI
        │   ├── Terminal.tsx  # xterm.js terminal panel
        │   ├── StatusBar.tsx # Bottom status bar
        │   └── Settings.tsx  # Settings modal
        ├── hooks/
        │   ├── useTabs.ts       # Tab state management
        │   ├── useFileSystem.ts # File system operations
        │   └── useTerminal.ts   # Terminal session management
        ├── themes/index.ts      # Theme definitions + language detection
        ├── types/index.ts       # TypeScript interfaces
        └── styles/global.css    # Application CSS (Catppuccin palette)
```

## Packaging

To create a distributable app:

```bash
npm run package
```

Output goes to `dist/`:
- **macOS**: `.dmg` + `.zip`
- **Windows**: NSIS installer + `.zip`
- **Linux**: `.AppImage` + `.deb`

## Architecture

The app follows Electron's security best practices:
- `contextIsolation: true` — renderer is sandboxed
- `nodeIntegration: false` — no direct Node access from renderer
- All Node.js/system APIs are exposed through a typed `contextBridge` in `preload/index.ts`
- IPC handlers in `main/ipcHandlers.ts` validate inputs and handle errors

## Resume Skills Demonstrated

- **TypeScript** — end-to-end typed architecture
- **React** — custom hooks, component composition, performance optimization
- **Electron** — main/renderer process communication, native APIs, packaging
- **Node.js** — file system operations, child processes (node-pty), IPC
- **Monaco Editor** — custom theme registration, LSP configuration, editor API
- **Language Server Protocol** — TypeScript IntelliSense configuration
