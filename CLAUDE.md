# CLAUDE.md

## Project Overview

Antenna is a native desktop application that serves as a real-time dashboard for monitoring [OpenClaw](https://github.com/openclaw/openclaw) AI agent sessions. It displays active sessions, sub-agents, cron jobs, costs, and 24-hour activity charts. Built with [Wails v2](https://wails.io) (Go backend + web frontend compiled into a single binary).

## Architecture

```
┌──────────────────────────────────────────┐
│         Wails Desktop Application        │
├───────────────────┬──────────────────────┤
│   Go Backend      │   Web Frontend       │
│   (app.go)        │   (vanilla JS)       │
│                   │                      │
│  GetDashboard()   │  Polls every 5s      │
│  GetHourlyActivity│  Chart.js for viz    │
│                   │  DOM updates in-place │
├───────────────────┴──────────────────────┤
│        Reads from: ~/.openclaw/          │
└──────────────────────────────────────────┘
```

- **Backend** (`app.go`, `main.go`): Go — scans `~/.openclaw/agents/main/sessions/` for JSONL transcript files, parses costs and message counts, classifies sessions by kind (main/cron/subagent)
- **Frontend** (`frontend/src/main.js`, `frontend/src/style.css`): Vanilla JavaScript — no framework. Renders dashboard DOM once, then updates values in-place on subsequent polls to avoid flicker
- **Wails bridge**: Auto-generated bindings in `frontend/wailsjs/` expose Go functions (`GetDashboard`, `GetHourlyActivity`) to the frontend

## Project Structure

```
antenna/
├── app.go                  # Backend: session loading, cost parsing, data aggregation
├── main.go                 # Wails entry point, window config, menus
├── go.mod                  # Go module (github.com/Caryyon/antenna)
├── wails.json              # Wails framework configuration
├── frontend/
│   ├── index.html          # Single HTML page
│   ├── package.json        # Frontend deps (vite, chart.js)
│   ├── vite.config.js      # Vite bundler + dev proxy config
│   ├── dev-server.js       # Node.js mock API server for browser dev mode
│   ├── src/
│   │   ├── main.js         # All frontend logic (~407 lines)
│   │   ├── style.css       # Dark theme styles (CSS variables)
│   │   └── app.css         # Legacy/unused
│   └── wailsjs/            # Auto-generated Wails API bindings (DO NOT EDIT)
├── build/
│   ├── appicon.png         # Application icon
│   ├── darwin/             # macOS build config (Info.plist)
│   └── windows/            # Windows build config
└── .github/workflows/
    └── release.yml         # CI: multi-platform release on tag push
```

## Prerequisites

- **Go 1.22+**
- **Node.js 20+**
- **Wails CLI v2.9.0**: `go install github.com/wailsapp/wails/v2/cmd/wails@v2.9.0`
- **OpenClaw** installed with `~/.openclaw` directory populated

## Common Commands

### Development
```bash
wails dev                    # Run app with hot reload (primary dev workflow)
```

### Build
```bash
wails build                          # Build for current platform
wails build -platform darwin/universal   # macOS (Intel + Apple Silicon)
wails build -platform windows/amd64      # Windows
wails build -platform linux/amd64        # Linux
```

### Frontend-only (browser dev mode)
```bash
cd frontend && npm install           # Install frontend deps
cd frontend && npm run dev           # Start Vite dev server
node frontend/dev-server.js          # Start mock API server (separate terminal)
```

### Linux build dependencies
```bash
sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev
```

## Key Backend Concepts (app.go)

- **Session classification**: Sessions are categorized by parsing the metadata key — `main`, `cron`, or `subagent` (see `parseKind()`)
- **Active detection**: A session is "active" if its last modification was within the last 30 minutes
- **Cost parsing**: JSONL transcript files are read line-by-line; each `"type": "message"` entry with `usage.cost.total` is summed. Costs are split into "today" vs "total" based on message timestamps
- **Data source**: All data comes from `~/.openclaw/agents/main/sessions/sessions.json` (metadata) and individual `<sessionId>.jsonl` files (transcripts)
- **Cron names**: Loaded from `~/.openclaw/cron/jobs.json`

## Key Frontend Concepts (main.js)

- **Flicker-free updates**: The DOM is built once on first render (`dashboardInitialized` flag), then only values are updated on subsequent 5-second polls
- **Chart.js**: Used for the 24-hour activity chart (bar chart for messages, line overlay for costs)
- **Wails API calls**: `GetDashboard()` and `GetHourlyActivity()` are imported from auto-generated `wailsjs/go/main/App`

## Code Style

- **Go**: Follow `gofmt` conventions. The codebase is minimal (~330 lines in `app.go`, ~76 in `main.go`) with no external dependencies beyond Wails
- **JavaScript**: Vanilla JS only — no framework (React, Vue, etc.). Keep it simple. Use template literals for HTML generation
- **CSS**: Use CSS variables defined in `style.css` for theming (`--void`, `--panel`, `--green`, `--cyan`, `--purple`, `--orange`). Font is JetBrains Mono
- **General**: This is a lightweight, focused tool. Avoid over-engineering or adding heavy dependencies

## Testing

No formal test suite exists. Test changes manually with `wails dev`. The app requires a populated `~/.openclaw` directory to display data.

## CI/CD

The GitHub Actions workflow (`.github/workflows/release.yml`) triggers on version tags (`v*`):
1. Builds for macOS (universal), Windows (amd64), Linux (amd64) in parallel
2. Packages as DMG, ZIP, and TAR.GZ respectively
3. Creates a GitHub release with all artifacts

## Important Notes

- **Do not edit** files in `frontend/wailsjs/` — these are auto-generated by Wails
- The `frontend/dist/` directory is embedded into the Go binary at compile time via `//go:embed all:frontend/dist`
- The only Go dependency is `github.com/wailsapp/wails/v2 v2.9.0`
- The only runtime frontend dependency is `chart.js@^4.5.1`
