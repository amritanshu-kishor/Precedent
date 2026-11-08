# PRECEDENT — Pharmaceutical Quality Intelligence (Frontend)

Production-ready, enterprise-grade AI SaaS dashboard frontend for **PRECEDENT — AI-Powered Pharmaceutical Manufacturing Quality Intelligence System**.

## Technology Stack
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS (Enterprise Deep Navy & Slate Theme with Emerald / Teal Accents)
- **Data Visualization:** Recharts
- **Iconography:** Lucide React
- **HTTP Client:** Axios with centralized fallback handling
- **Routing:** React Router v6

## Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
The application will launch at **http://localhost:3000** (configured to match backend CORS settings).

### 3. Build for Production
```bash
npm run build
```

## Backend Integration
- **Default Backend Base URL:** `http://127.0.0.1:8004`
- **Vite Proxy:** Automatically proxies `/api` and `/health` requests to `http://127.0.0.1:8004`.
- **Custom Backend URL (optional):** Set `VITE_API_URL` in an `.env` file inside `frontend/`.
- **Resilient Fallback Mode:** If the backend server is offline or unreachable, the frontend seamlessly switches to clearly labeled synthetic demonstration data while keeping the full interactive UI functional. Once the backend starts, click the **Ping / Test** button in the top navigation bar to switch to live API data.

## Implemented Workflows & Pages
1. **Overview:** Deviation statistics, critical alerts, severity distribution, CAPA summary, and backend health status.
2. **Deviations:** Searchable, filterable deviation registry with severity classifications and modal creation.
3. **AI Investigation (Visual Highlight):** Connected 4-agent workflow visualization (`INVESTIGATOR` → `SKEPTIC` → `AUDITOR` → `SYNTHESIZER`), precedent recall, and consensus recommendations.
4. **Recommendations:** Human approval governance gateway with mandatory reviewer rationale, decision audit recording, and one-click CAPA generation.
5. **Historical Precedents:** Hindsight institutional memory explorer and interactive Precedent Reflection tool.
6. **CAPA Management:** Corrective action tracking across lifecycle stages (Proposed, Implemented, Assessed).
7. **Effectiveness Monitoring:** Longitudinal verification queue and empirical assessment logging.
8. **Quality Analytics:** Self-calibration engine metrics, equipment performance charts, and intervention efficacy comparisons.
9. **AI Memory & Governance:** Plant-level memory toggle, transactional outbox sync monitor, and memory retention console.
10. **Inspector Review:** Advisory pre-audit readiness checklist and documentation gap analysis.

*Advisory AI disclaimer: All outputs and metrics are advisory under GMP guidelines and require qualified human review.*

