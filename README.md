# 🎬 EDITRON — Professional AI Video Editor

> **DaVinci Resolve Inspired Non-Linear Editor (NLE) with AI Director, 3-Way Color Grading, Dynamic Animated Subtitles, and Multi-Track Timeline.**

---

## 🌟 Highlights

- **DaVinci Resolve Dark Pro Aesthetic**:
  - Charcoal / graphite UI with DaVinci Resolve tabs: **Media**, **Cut**, **Edit**, **Color**, **Subtitles**, **Deliver**.
  - Dual / Single Program Monitor with Timecode HUD (`00:00:00:00`), Safe Margins (Action / Title / 9:16 Shorts overlay), and frame-stepping.
- **Multi-Track Non-Linear Timeline**:
  - Tracks for **V2** (Overlays/B-Roll), **V1** (Main Video), **S1** (AI Subtitles), and **A1/A2** (Audio/BGM with real-time waveform visualization).
  - Razor / Cut tool (`C`), Ripple Delete (`Delete` / `Backspace`), magnetic snapping (`N`), trimming handles, and playhead scrubbing.
- **DaVinci 3-Way Color Wheels**:
  - Interactive **Lift** (Shadows), **Gamma** (Midtones), **Gain** (Highlights), and **Offset** with chromatic vector pucks and master exposure sliders.
  - Temperature (Kelvin), Tint, Contrast, Saturation, and 1-Click Cinematic Looks (*Teal & Orange, Vintage 35mm, Cyberpunk Neon, Moody Noir, Golden Hour, Clean Studio*).
- **Dynamic Animated Subtitle Engine**:
  - Word-level timestamps & active word animations.
  - Viral styles: **Alex Hormozi** (Bold yellow/green uppercase bounce), **MrBeast Pop**, **Cinematic Minimal**, **Cyberpunk Neon**, and **Modern Boxed**.
  - Interactive word timeline: Click any word to jump playhead right to that moment; edit text inline.
- **AI Model & Architecture**:
  - **Transcription**: Groq `whisper-large-v3` (~200x real-time transcription with word timestamps).
  - **AI Director**: `gpt-oss-120b` (Default) or `llama-3.3-70b-versatile` via Groq or any OpenAI-compatible API.
  - **Zero-Code Change Configuration**: All API keys, model names, and base URLs are read directly from `.env` and can also be modified live via the UI **Settings** modal.
  - **Native FFmpeg 9.0.1 Engine**: Built-in high-performance video probing, 16kHz audio extraction, color grading filter rendering, and video export.

---

## 🚀 Quick Start

### 1. Configure Environment (`.env`)

Copy `.env.example` to `.env` (or customize the existing `.env`):

```env
PORT=3001
CLIENT_PORT=5173

# AI Inference Configuration
GROQ_API_KEY=your_groq_api_key_here
GROQ_BASE_URL=https://api.groq.com/openai/v1

# Models
GROQ_LLM_MODEL=gpt-oss-120b
GROQ_WHISPER_MODEL=whisper-large-v3
```

> **Note**: Editron comes with **Instant Demo / Offline Mode** enabled! Even if you leave `GROQ_API_KEY` blank, the app will run with realistic AI mock reasoning and a pre-rendered 4K test clip so you can test all features immediately.

### 2. Start Both Server & Client

```bash
# Run both Backend API (port 3001) & Frontend (port 5173) concurrently:
npm run dev
```

Open your browser to:
**`http://localhost:5173`**

---

## ⌨️ Professional Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| <kbd>Space</kbd> | Play / Pause playback |
| <kbd>C</kbd> | Razor / Split clip at current playhead |
| <kbd>Delete</kbd> / <kbd>Backspace</kbd> | Delete selected clip |
| <kbd>←</kbd> / <kbd>→</kbd> | Step backward / forward 1 frame (1/30s) |
| <kbd>N</kbd> | Toggle magnetic snapping |

---

## 🏗️ Project Architecture

```
EditronAntigravity/
├── .env                  # Environment config (API keys, models, ports)
├── package.json          # Root scripts (concurrently dev runner)
├── server/               # Node.js + Express + FFmpeg Backend
│   ├── index.js          # Server entry & static file streaming
│   ├── config.js         # Dynamic environment & runtime config manager
│   ├── routes/
│   │   └── api.js        # /upload, /transcribe, /ai-edit, /render, /config
│   └── services/
│       ├── ai.js         # Groq / OpenAI client (gpt-oss-120b & whisper)
│       └── ffmpeg.js     # Native FFmpeg 9.0.1 media pipeline
└── client/               # Vite + React 19 + TypeScript + Tailwind CSS
    ├── src/
    │   ├── App.tsx       # DaVinci Resolve Master Workspace Shell
    │   ├── components/
    │   │   ├── workspace/   # Header & DaVinci page tab switcher
    │   │   ├── monitor/     # Program monitor with real-time WebGL/CSS filters
    │   │   ├── timeline/    # Multi-track timeline, playhead, razor, snapping
    │   │   ├── color/       # 3-Way color grading wheels & LUT presets
    │   │   ├── subtitles/   # Dynamic word-level subtitle styler
    │   │   ├── inspector/   # Transform (zoom/pan/rotation) & audio gain
    │   │   ├── ai/          # Prompt bar with 1-click viral editing chips
    │   │   ├── settings/    # Model name & API key dialog
    │   │   └── export/      # FFmpeg export & download modal
    │   └── services/api.ts  # REST client
```
