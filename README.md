# TrafficMitra — Nagpur Municipal Corporation & Traffic Police Platform

> **Production-grade civic-technology platform for reporting traffic bottlenecks, accidents, rash driving, and parking violations with real-time GPS pin accuracy, DigiLocker sandbox identity verification, AI-assisted description & severity triage, public audit timelines, and an authority GIS command dashboard.**

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 TRAFFICMITRA ARCHITECTURE                   │
└─────────────────────────────────────────────────────────────┘
               ▲                                ▲
               │ (Citizen Web Portal)           │ (Authority Command)
┌──────────────┴──────────────┐   ┌─────────────┴─────────────┐
│  React (Vite) + TypeScript  │   │  GIS Live Command Map     │
│  Tailwind CSS Design System │   │  Filterable Ledger View   │
│  TanStack Query + Leaflet   │   │  AI Officer Briefings     │
│  Persistent AI Assistant    │   │  Tow Dispatch & Analytics │
└──────────────┬──────────────┘   └─────────────┬─────────────┘
               │                                │
               └───────────────┬────────────────┘
                               │ RESTful JSON API
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Node.js + Express                       │
│    • Auth & JWT Sessions    • DigiLocker Sandbox OAuth Flow │
│    • Multer File Storage    • Transactional HTML Notifications│
│    • LLM Service (Prompts)  • Parking Enforcement Suite     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│         SQLite / PostgreSQL Relational Data Engine          │
│    • Users & DigiLocker Ref • Complaints & Audit History    │
│    • Departments & Officers • Evidence Files & Indexes      │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ Key Features

1. **Multi-Step Complaint Filing**:
   - **6 Grievance Categories**: Illegal Parking & Obstruction Suite, Traffic Jams, Road Accidents, Signal Malfunctions, Road Damage & Potholes, Rash Driving.
   - **Dedicated Parking Violation Suite**: Sub-type classification (Footpath encroachment, Hospital/Emergency gate blockade, Double parking, No-Parking zone), Vehicle Number Plate capture, vehicle classification, and Tow-Truck Squad dispatch request.
   - **Interactive Leaflet Map**: Pin-drop with GPS live geolocate, accuracy radius indicator, and fast jump chips for Nagpur landmarks (Sitabuldi, Dharampeth, Medical Square, Wardha Road, Sadar).
   - **Evidence Uploader**: Drag-and-drop multi-file upload with validation for photos, audio notes, and video clips.
   - **AI-Assisted Description & Severity Scoring**: Debounced background call to `/api/complaints/ai-assist` providing clear operational rewrites and 0-10 severity score with explainability chips.
   - **Confirmation with QR Code**: Auto-generates unique Ticket ID (`TM-2026-XXXXXX`) and dynamic QR Code linking to the public tracking timeline.

2. **Public Status Tracking (`/track/:ticketId`)**:
   - Visual status timeline: `Submitted` → `Under Review` → `Assigned to Officer` → `In Progress` → `Resolved` → `Closed`.
   - Historical audit log with officer notes, assigned division, and estimated resolution SLA.
   - Dynamic follow-up comment thread allowing citizens to append supplementary evidence while tickets remain open.

3. **DigiLocker Identity Verification (Stage 2)**:
   - Integrates DigiLocker Sandbox OAuth-based document fetch for Driving License & Vehicle RC.
   - Verified users receive the official **"Verified Citizen"** badge, prioritizing their reports on authority dispatch boards.

4. **Authority GIS Command Dashboard**:
   - **Live Command Map**: Severity color-coded pins (Red: ≥8.0, Amber: 5.0-7.9, Blue: <5.0, Green: Resolved) with instant inspector cards.
   - **Complaints Ledger**: Multi-column filterable table sorted by AI priority score, date, zone, and verified reporter status.
   - **AI Officer Briefing**: Concise 2-3 line operational synthesis generated for on-duty field officers.
   - **Tow Squad Dispatch & Status Updater**: Transition complaint states, assign officers/departments, and add private operational notes.

5. **Analytics & Hotspot Heatmap**:
   - Geo-density heatmap overlay across Nagpur wards.
   - KPI metrics: Average resolution hours, SLA compliance %, category distribution, and 7-day trend.

6. **Persistent AI Chatbot Assistant**:
   - Persistent widget mounted sitewide.
   - Real database integration to query live tickets without hallucination.
   - Guided complaint drafting assistant.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation & Run

1. **Clone and install all dependencies**:
   ```bash
   git clone <repo-url>
   cd Hackthon
   npm install
   cd server && npm install
   cd ../client && npm install
   ```

2. **Seed the database with realistic Nagpur test data**:
   ```bash
   npm run seed
   ```

3. **Start both backend and frontend concurrently**:
   ```bash
   npm run dev
   ```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:5000/api](http://localhost:5000/api)
- API Health: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Pre-Configured Demo Accounts

| Role | Email / Phone | Password | Capabilities |
|---|---|---|---|
| **Verified Citizen** | `rajesh.deshmukh@nagpur.in` | `citizen123` | DigiLocker Verified badge, report grievances, track personal dashboard |
| **Unverified Citizen** | `pooja.kulkarni@gmail.com` | `citizen123` | Unverified reporter, standard filing |
| **Traffic Police Officer** | `officer.patil@nagpurtrafficpolice.gov.in` | `officer123` | Badge #NTP-3101, Command Map, status transitions, towing dispatch |
| **Control Room Admin** | `command.control@nmc.gov.in` | `admin123` | Zonal assignments, global analytics, audit logs |

---

## 📦 Environment Variables (`server/.env`)

```env
PORT=5000
JWT_SECRET=trafficmitra-production-secret-key-2026
JWT_REFRESH_SECRET=trafficmitra-refresh-token-key-2026
DIGILOCKER_SANDBOX_CLIENT_ID=NMC_TRAFFICMITRA_SB_01
NODE_ENV=development
```

---

## 🛡️ API Endpoints Summary

- **Auth**: `POST /api/auth/register`, `POST /api/auth/verify-otp`, `POST /api/auth/login`, `POST /api/auth/digilocker/init`, `GET /api/auth/digilocker/callback`, `GET /api/auth/me`
- **Complaints**: `POST /api/complaints`, `GET /api/complaints/my`, `GET /api/complaints/:ticketId`, `POST /api/complaints/:id/followup`, `POST /api/complaints/ai-assist`
- **Authority**: `GET /api/authority/complaints`, `GET /api/authority/complaints/:id`, `PATCH /api/authority/complaints/:id/status`, `PATCH /api/authority/complaints/:id/assign`, `POST /api/authority/complaints/:id/notes`, `GET /api/authority/departments-and-officers`
- **Analytics**: `GET /api/authority/analytics/summary`, `GET /api/authority/analytics/heatmap`
- **Chatbot**: `POST /api/chatbot/message`
