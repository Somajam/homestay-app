# Somajam Holidays — Hosting & Database Deployment Runbook

> **Important Reference Document**  
> Keep this document updated whenever infrastructure, environment keys, hosting providers, or database schemas change. Future agents and developers should reference this file directly before initiating builds or deployments.

---

## ⚡ Quick Reference & Cheat Sheet

| Task | Command / Action | Notes |
| :--- | :--- | :--- |
| **Run Local Development** | `npm.cmd run dev` | Runs Vite dev server at `http://localhost:5173/` |
| **Build for Production** | `npm.cmd run build` | Compiles to `/dist` bundle with 0 errors |
| **Deploy to Production** | `git push origin main` | **Automatic!** Vercel deploys `main` branch to production URL |
| **Check Git Status** | `git status` | Verify clean working tree before pushing |

> [!TIP]
> **Windows Environment Note**: Always use `npm.cmd` and `npx.cmd` in Windows PowerShell / Command Prompt rather than bare `npm`/`npx`.

---

## 🌐 1. Hosting Infrastructure (Vercel)

### Project Configuration
* **Hosting Platform:** [Vercel](https://vercel.com/)
* **Linked Git Repository:** `https://github.com/Neenu-Joju/homestay-app.git`
* **Production Branch:** `main`
* **Framework:** Vite 8 + React 19 + Tailwind CSS v4
* **Build Command:** `vite build` (`npm run build`)
* **Output Directory:** `dist`

### How Production Deployment Works (CI/CD Pipeline)
1. **GitHub Integration (Standard Flow):**
   - The production Vercel project is directly connected to the GitHub repository: `Neenu-Joju/homestay-app`.
   - Every time commits are pushed to the `main` branch:
     ```bash
     git add -A
     git commit -m "Your descriptive commit message"
     git push origin main
     ```
   - Vercel automatically detects the push via webhook, installs dependencies, builds the production bundle, and deploys it live to the official production URL.

2. **Why You Should NOT Use `vercel deploy --temporary`:**
   - In terminal sessions where Vercel CLI credentials are not cached, `vercel --prod` will ask for interactive login (`vercel login`).
   - Running `vercel deploy --temporary` generates a temporary, disposable link rather than updating the main client URL.
   - **Always deploy by pushing to `git push origin main`** to update the existing, official Vercel production URL.

### Single Page Application (SPA) Routing
The app uses client-side routing. Direct navigation or refreshing URLs like `/bookings`, `/guests`, or `/login` is handled by `vercel.json` in the root:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Environment Variables on Vercel
Ensure the following environment variables are configured in the **Vercel Project Settings > Environment Variables**:
* `VITE_SUPABASE_URL`: `https://vbsvpvvatfoeybmdvuet.supabase.co`
* `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` *(see Section 2)*

---

## 🗄️ 2. Database Infrastructure (Supabase)

### Project Configuration
* **Database Provider:** [Supabase](https://supabase.com/) (PostgreSQL with Realtime REST & Storage)
* **Project Reference ID:** `vbsvpvvatfoeybmdvuet`
* **Project URL:** `https://vbsvpvvatfoeybmdvuet.supabase.co`
* **API Version:** `@supabase/supabase-js` v2

### Local Environment File (`.env.local`)
The `.env.local` file in the project root contains the connection credentials:
```env
VITE_SUPABASE_URL=https://vbsvpvvatfoeybmdvuet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZic3ZwdnZhdGZvZXlibWR2dWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MzQ1OTYsImV4cCI6MjEwMzMxMDU5Nn0.n6U-Vu_xanxH_ncWHoQZBRFLlf06bUJ_CHFb9o4Y8yI
```

### Client Initialization
Located in [`src/lib/supabase.js`](file:///c:/1.JGM%20Personal%20Data/Neenu%20web%20application/Rejchachan%20homestay/src/lib/supabase.js):
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
```

### Database Schema & Tables
The full SQL migration script is maintained in [`supabase_schema.sql`](file:///c:/1.JGM%20Personal%20Data/Neenu%20web%20application/Rejchachan%20homestay/supabase_schema.sql).

| Table Name | Primary Purpose | Key Fields |
| :--- | :--- | :--- |
| `rooms` | 5 1BHK Cottages inventory | `id`, `room_number` (`No. 1`–`No. 5`), `capacity`, `status`, `price_per_night` |
| `guests` | Master guest directory | `id`, `full_name`, `phone`, `id_document_type`, `id_document_number`, `address` |
| `bookings` | Reservation lifecycles | `id`, `booking_ref` (`SJM-2026-xxx`), `guest_id`, `room_id`, `check_in_date`, `check_out_date`, `status` |
| `documents` | ID compliance photo archives | `id`, `guest_id`, `file_name`, `file_path`, `file_type`, `file_size`, `preview_url` |
| `expenses` | Operations expense ledger | `id`, `title`, `amount`, `category`, `payer`, `receipt_url`, `expense_date` |
| `admin_users` | Staff credentials | `id`, `username`, `password_hash`, `role` |

### Dual-Layer Storage & Offline Resilience
The application uses an offline-first, dual-layer persistence model in [`AppContext.jsx`](file:///c:/1.JGM%20Personal%20Data/Neenu%20web%20application/Rejchachan%20homestay/src/context/AppContext.jsx):
1. **Local State & Storage Cache:**
   - Key storage: `somajam_rooms`, `somajam_guests`, `somajam_bookings`, `somajam_documents`, `somajam_expenses`.
   - All creates, updates, and cancellations instantly update local React state and `localStorage`.
2. **Supabase Cloud Sync:**
   - Background asynchronous synchronization writes all updates to Supabase tables.
   - **Fail-Safe Benefit:** If Supabase is paused (e.g. after free-tier inactivity) or the network is temporarily unavailable, the application remains 100% operational on the local cache without crashing or losing data.

---

## 🚀 3. Step-by-Step Deployment Runbook

### Making Changes and Deploying to Production:
1. **Develop & Test Locally:**
   ```powershell
   npm.cmd run dev
   # Open http://localhost:5173/ and test workflow
   ```
2. **Verify Production Build:**
   ```powershell
   npm.cmd run build
   # Ensure exit code is 0 and no syntax/type errors exist
   ```
3. **Commit & Push to GitHub:**
   ```powershell
   git status
   git add -A
   git commit -m "Your descriptive message"
   git push origin main
   ```
4. **Verify Deployment:**
   - Open your Vercel dashboard or live application URL.
   - Vercel automatically deploys within 30–60 seconds.

---

## 🔒 4. Credentials & Access Summary

* **Default Admin In-App Credentials:**
  - Username: `admin`
  - Password: `somajam2026`
  - Caretaker Username: `caretaker` / Password: `caretaker2026`
* **Pre-Delivery Transaction Data Wipe:**
  - Run [`clean_transactions.sql`](file:///c:/1.JGM%20Personal%20Data/Neenu%20web%20application/Rejchachan%20homestay/clean_transactions.sql) in Supabase SQL Editor.
  - Clears all bookings, guests, ID documents, audit logs, and storage bucket files while preserving master room configurations, pricing, expense payers, and staff directory.
* **GitHub Repository:**
  - URL: `https://github.com/Neenu-Joju/homestay-app.git`
* **Vercel Account:**
  - Connected via GitHub OAuth (`Neenu-Joju`).
