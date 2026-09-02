# ResQ Frontend - Complete Implementation Plan

ResQ is a disaster relief resource tracking and volunteer coordination platform. This plan details the frontend architecture, design system, route hierarchy, state management, Leaflet GIS integration, WebSockets, Voice reporting, and Offline synchronization.

## User Review Required

> [!IMPORTANT]
> - The frontend will be initialized with **Vite + React** and styled using **Tailwind CSS** with a modern, high-contrast dark command center aesthetic.
> - Full connectivity to the live FastAPI backend (`http://127.0.0.1:8000`) and WebSocket stream (`ws://127.0.0.1:8000/ws`).
> - Interactive Leaflet GIS maps featuring custom color-coded markers for emergencies, rescue teams, shelters, resources, and hazard zones.
> - Browser SpeechRecognition for Voice Emergency Reporting with confirmation fallback.
> - Low-network & Offline synchronization queue with local persistence in `localStorage`.

---

## Architecture & Directory Structure

```
frontend/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── public/
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── api/
    │   └── axiosClient.js          # Central Axios instance with JWT interceptor & error handling
    ├── context/
    │   ├── AuthContext.jsx         # Auth state, login/register/logout, role permissions
    │   ├── WebSocketContext.jsx    # Real-time WebSocket listener with auto-reconnect & toast alerts
    │   └── OfflineContext.jsx      # Network status tracker & offline emergency sync queue
    ├── utils/
    │   ├── geoUtils.js             # Client-side Haversine distance, ETA calculation & location helpers
    │   ├── speechRecognition.js   # Browser Speech Recognition wrapper with fallback
    │   └── formatters.js           # Date, severity, and status formatting utilities
    ├── components/
    │   ├── common/
    │   │   ├── Navbar.jsx          # Top navigation with live status, broadcast ticker & notification bell
    │   │   ├── Sidebar.jsx         # Command center sidebar with role-aware navigation
    │   │   ├── SeverityBadge.jsx   # Visual high-contrast severity tags (Critical, High, Medium, Low)
    │   │   ├── StatusBadge.jsx     # Lifecycle status pill badges
    │   │   ├── NetworkStatus.jsx   # Live connectivity indicator (Online, Weak, Offline)
    │   │   ├── Modal.jsx           # Generic modal dialog
    │   │   └── ToastContainer.jsx  # Real-time alert notifications
    │   ├── dashboard/
    │   │   ├── StatCard.jsx        # Metric KPI cards with glow effects
    │   │   ├── LiveActivityFeed.jsx # Real-time event stream
    │   │   └── QuickActions.jsx    # 1-click action buttons
    │   ├── map/
    │   │   ├── OperationalMapView.jsx # Interactive Leaflet map container
    │   │   ├── MapFilterBar.jsx    # Layer toggle (Emergencies, Teams, Shelters, Resources)
    │   │   └── CustomMarkers.jsx   # SVG / DivIcon pins for different entities
    │   ├── ai/
    │   │   ├── PriorityScoreCard.jsx     # AI priority breakdown & explainable reasons
    │   │   ├── ResourceRecommender.jsx   # AI quota recommendation with shortage warning
    │   │   └── VolunteerMatcher.jsx      # AI volunteer matching rank list
    │   ├── emergency/
    │   │   ├── EmergencyCard.jsx         # Compact card view
    │   │   ├── EmergencyFormModal.jsx    # Create emergency modal with voice trigger
    │   │   ├── VoiceReporterModal.jsx    # Interactive speech transcription modal
    │   │   ├── IncidentTimeline.jsx      # Chronological lifecycle timeline
    │   │   └── EvidenceUploader.jsx      # Proof of resolution file uploader
    │   └── broadcast/
    │       └── BroadcastBanner.jsx       # Global emergency broadcast banner
    └── pages/
        ├── LandingPage.jsx               # Public portal & quick SOS trigger
        ├── LoginPage.jsx                 # Login with demo accounts quick-switcher
        ├── RegisterPage.jsx              # Role-based registration
        ├── DashboardPage.jsx             # Main operational command center
        ├── EmergencyListPage.jsx         # Emergency filterable list & triage
        ├── EmergencyDetailPage.jsx       # Full emergency detail, dispatch & resolution
        ├── SOSPage.jsx                   # High-visibility 1-click SOS distress dispatch
        ├── DisasterEventsPage.jsx        # Active disaster events & impact zones
        ├── LocationIntelligencePage.jsx  # GPS nearest team, shelter, resource calculator
        ├── MedicalVulnerablePage.jsx     # Vulnerability and demographic monitoring
        ├── RescueTeamsPage.jsx           # Team roster, specialties & live telemetry
        ├── AssignmentWorkflowPage.jsx    # Visual assignment & dispatch board
        ├── ResourcesPage.jsx             # Resource inventory & stock monitor
        ├── ResourceAllocationPage.jsx    # Quota allocation & shortage analysis
        ├── VolunteersPage.jsx            # Volunteer directory & skill registry
        ├── VolunteerAssignmentPage.jsx   # AI volunteer dispatch matcher
        ├── SheltersPage.jsx              # Shelter capacities & occupancy manager
        ├── WeatherAlertsPage.jsx         # Meteorology & flood/landslide early warnings
        ├── OperationalMapPage.jsx        # Fullscreen GIS command map
        ├── NotificationsPage.jsx         # Notifications inbox & broadcast history
        ├── BroadcastsPage.jsx            # Public emergency warning creation
        ├── AnalyticsPage.jsx             # Recharts KPI dashboards & time series
        ├── AuditLogsPage.jsx             # Immutable audit trail explorer
        ├── IncidentHistoryPage.jsx       # System-wide incident history search
        └── ProfileSettingsPage.jsx       # User profile & preferences
```

---

## Key Features & User Workflows

1. **Mission-Critical Dark UI**: Sleek glassmorphism command center aesthetic (slate-900 / zinc-950, cyan/amber/rose neon highlights) designed for high situational awareness.
2. **Real-Time WebSockets**: Connects to `ws://127.0.0.1:8000/ws` upon mount. When a new emergency, SOS, or assignment occurs, toast alerts trigger and lists update reactively.
3. **Interactive Leaflet Operational Map**:
   - Custom SVG marker pins for 🔴 Emergencies, 🔵 Rescue Teams, 🟢 Volunteers, 🟠 Resources, 🟣 Shelters, and ⚠️ Disaster Impact Zones.
   - Clickable popups with quick dispatch actions and distance calculation.
4. **Voice Emergency Reporting**:
   - Browser Web Speech API captures audio, displays live transcript, parses keywords (e.g. trapped, injured, flood, children), and auto-fills emergency submission with user confirmation.
5. **Offline Sync & Resilient Local Storage**:
   - Monitors `window.addEventListener('online'/'offline')`.
   - Queues emergency submissions into `localStorage` when offline.
   - Automatically synchronizes via `POST /api/emergencies/sync-offline` when connection restores, showing sync confirmations without data loss.
6. **AI Decision Support Panels**:
   - AI Priority score with explainable reasoning pills.
   - AI Resource Recommender with stock shortage calculations.
   - AI Volunteer Matching with skill fit score, distance, and ETA.
7. **Role-Based Views & Fast Role Switcher**:
   - Preset buttons for Admin, Operator, Citizen, Rescue Team Lead, and Volunteer for instant testing.

---

## Verification Plan

### Automated Build Verification
- Build production bundle: `npm run build` inside `frontend/`.
- Validate zero syntax errors or missing imports.

### Runtime Verification
- Start Vite dev server: `npm run dev -- --host 127.0.0.1 --port 3000`.
- Verify all 25 routes load cleanly with no console errors.
- Test authentication flow (Login with demo accounts: `admin`, `operator`, `citizen`, `rescue_lead`, `volunteer1`).
- Test SOS transmission and emergency creation.
- Test Leaflet map rendering with layer filters and popups.
- Test Recharts analytics rendering with filter controls.
- Test WebSocket event handling.
- Test offline synchronization queue.
