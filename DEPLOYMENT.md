# 🚀 Editron — Production Deployment Guide

This guide details how to deploy **Editron** (DaVinci Resolve-inspired AI Video Editor) to production.

---

## ❓ Can Editron be deployed completely on Vercel?

### **Short Answer:**
> **No, Editron cannot run completely on Vercel alone.** 
> The **Frontend (`client/`)** runs brilliantly on Vercel, but the **Backend (`server/`)** requires a containerized or server environment like **Render**, **Railway**, or a **VPS**.

### **Why Vercel Alone is Not Suitable for the Backend:**
1. **Native FFmpeg Requirement**: Editron uses system-level `ffmpeg` and `ffprobe` binaries to probe media, extract audio waveforms, detect keyframes, and render video tracks. Vercel Serverless Functions do not provide native FFmpeg with H.264/AAC hardware or multi-threading support.
2. **Execution Time Limits**: Video encoding and complex filter chains take anywhere from 10 seconds to several minutes. Vercel Serverless Functions have a strict timeout (10s on Hobby, max 60s/300s on Pro).
3. **Payload Upload Limits**: Vercel Serverless Functions have a maximum request body size limit of **4.5 MB**. Uploading high-res 4K videos, multiple clips, or 10-photo batches will fail.
4. **Filesystem Ephemerality**: Vercel does not allow writing to disk except a small temporary `/tmp` folder (512 MB max) which is wiped immediately after function execution.

---

## 🏗️ Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   USER'S WEB BROWSER                        │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
        Static Assets & UI              API Calls & Media Uploads
               │                               │
               ▼                               ▼
     ┌──────────────────┐           ┌──────────────────────┐
     │   VERCEL EDGE    │           │      RENDER.COM      │
     │  (React 19 SPA)  │           │   (Docker Web Svc)   │
     │                  │           │                      │
     │ • Global CDN     │           │ • Node.js Express    │
     │ • Fast Routing   │           │ • Native FFmpeg 9.0  │
     │ • Instant Deploy │           │ • Groq AI Engine     │
     │                  │           │ • Persistent Disk    │
     └──────────────────┘           └──────────────────────┘
```

| Component | Recommended Platform | Why? |
| :--- | :--- | :--- |
| **Frontend (`client/`)** | **Vercel** | Ultra-fast global Edge CDN, automatic preview URLs, zero maintenance. |
| **Backend (`server/`)** | **Render.com** (Docker) | Includes native FFmpeg, supports 100MB+ uploads, no execution timeouts, persistent storage. |

*(Alternative: You can also deploy **both Frontend and Backend together on Render** as a single containerized service using the included `Dockerfile`)*.

---

## 🛠️ Option 1: Vercel (Frontend) + Render (Backend) [RECOMMENDED]

### Step 1: Deploy Backend to Render.com

1. Push this repository to **GitHub** or **GitLab**.
2. Log in to [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** &rarr; **Web Service**.
4. Connect your GitHub repository.
5. Configure the service:
   - **Name**: `editron-api`
   - **Region**: Choose closest to your users (e.g. *Oregon* or *Frankfurt*)
   - **Environment**: **Docker**
   - **Dockerfile Path**: `./Dockerfile` (or select standard Docker build)
   - **Instance Type**: **Starter** (Recommended for video rendering: 1 CPU, 2 GB RAM). *Free tier will work for light testing, but renders may be slow or sleep after inactivity.*
6. Add **Environment Variables** in the Render dashboard:
   | Variable | Value | Notes |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Production mode |
   | `PORT` | `3001` | Server port |
   | `GROQ_API_KEY` | `gsk_...` | Your Groq API Key (from console.groq.com) |
   | `GROQ_LLM_MODEL` | `gpt-oss-120b` | AI director model (or llama-3.3-70b-versatile) |
   | `GROQ_WHISPER_MODEL` | `whisper-large-v3` | Transcription model |
   | `GROQ_VISION_MODEL` | `llama-3.2-11b-vision-preview` | Scene understanding model |
   | `GROQ_BASE_URL` | `https://api.groq.com/openai/v1` | Groq OpenAI-compatible endpoint |
7. Click **Create Web Service**. Render will build the Docker container, install FFmpeg, and provide you with a live URL, e.g.:
   `https://editron-api.onrender.com`
8. Verify health check by visiting in browser:
   `https://editron-api.onrender.com/api/health`

---

### Step 2: Deploy Frontend to Vercel

1. Log in to [Vercel Dashboard](https://vercel.com/).
2. Click **Add New...** &rarr; **Project**.
3. Import your GitHub repository.
4. Configure Project Settings:
   - **Framework Preset**: **Vite**
   - **Root Directory**: Select `client` (or leave as `./` if using root `vercel.json`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. In **Environment Variables**, add:
   | Variable | Value |
   | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://editron-api.onrender.com/api` |
6. Click **Deploy**.
7. Vercel will build and assign you a global domain, e.g. `https://editron.vercel.app`.

---

## 📦 Option 2: Fullstack All-in-One on Render

If you prefer to deploy everything under **one single URL** without managing two separate services:

1. In Render, select **New +** &rarr; **Web Service**.
2. Select your repository.
3. Select **Docker** runtime.
4. Render will use the root `Dockerfile`:
   - Stage 1 compiles the Vite React frontend.
   - Stage 2 copies the compiled UI into `client/dist` and launches Express with native FFmpeg.
   - Express automatically serves the frontend at `/` and the API at `/api`.
5. Set your environment variables (`GROQ_API_KEY`, etc.).
6. Click **Deploy**. Your complete studio will be accessible at `https://editron.onrender.com`.

---

## ⚙️ Environment Variables Reference

| Variable Name | Default Value | Description |
| :--- | :--- | :--- |
| `GROQ_API_KEY` | *(Empty)* | Your Groq Cloud API key. If omitted, Editron runs in offline/demo mode. |
| `GROQ_LLM_MODEL` | `gpt-oss-120b` | Model used for intelligent timeline editing, color decisions, cuts. |
| `GROQ_WHISPER_MODEL` | `whisper-large-v3` | Model used for word-level speech transcription. |
| `GROQ_VISION_MODEL` | `llama-3.2-11b-vision-preview` | Model used for shot composition & lighting analysis. |
| `GROQ_BASE_URL` | `https://api.groq.com/openai/v1` | API base endpoint. |
| `PORT` | `3001` | Backend port (Render sets this dynamically). |
| `VITE_API_BASE_URL` | `/api` | Frontend API target (set to Render URL on Vercel). |

---

## 💡 Production Best Practices & Tips

1. **Render Free Tier Cold Starts**:
   - The free tier of Render spins down after 15 minutes of inactivity. The first request may take ~50 seconds to boot.
   - Upgrading to the **Starter Plan** ($7/mo) ensures zero cold starts, consistent 1 vCPU performance, and smooth video renders.
2. **Persistent Disk for Render**:
   - If you want uploaded user videos and rendered MP4 files to persist across deploys, add a **Render Disk** mounted at `/app/server/uploads` (size: 10 GB).
3. **CORS Settings**:
   - The backend already has `cors()` enabled for all origins by default. If you want to restrict it, specify your Vercel domain in `server/index.js`.
4. **Cloud Object Storage (S3 / Cloudinary / R2)**:
   - For high-volume production, you can replace local `/uploads` storage with AWS S3, Cloudflare R2, or Supabase Storage for unlimited video capacity.
5. **Debian Base Image (`node:20-bookworm-slim`)**:
   - Always use Debian 12 **Bookworm** (`node:20-bookworm-slim`). Do not use Debian 11 (*bullseye*), as Debian 11 security repositories have moved to archive mirrors and will fail with `404 Not Found` when fetching `ffmpeg`.
