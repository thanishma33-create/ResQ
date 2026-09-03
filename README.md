# ResQ – Disaster Relief Resource Tracking and Volunteer Coordination Platform

> **«ResQ is a real-time disaster relief coordination platform that connects emergency requests, rescue teams, volunteers, shelters, resources, and location intelligence to help deliver the right assistance to the right place at the right time.»**

---

![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Authentication-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![WebSockets](https://img.shields.io/badge/WebSockets-Real--Time-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-Maps-199900?style=for-the-badge&logo=leaflet&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## 📑 Table of Contents

- [Overview](#-overview)
  - [Problem Statement](#problem-statement)
  - [The ResQ Solution](#the-resq-solution)
- [🎯 Core Innovation & Project Highlight](#-core-innovation--project-highlight)
- [🖼️ Application Interface & Screenshots](#️-application-interface--screenshots)
- [🎬 Interactive Project Demo & Walkthrough](#-interactive-project-demo--walkthrough)
  - [1-Click Fast Launch](#-1-click-fast-launch)
  - [Access Endpoints](#-access-endpoints)
  - [Pre-Configured Demo Credentials](#-pre-configured-demo-credentials)
  - [Guided Demo Scenario Flow](#-guided-demo-scenario-flow)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [📍 Current Location & Nearby Assistance](#-current-location--nearby-assistance)
- [🧠 AI-Assisted Intelligence & Recommendation](#-ai-assisted-intelligence--recommendation)
- [👥 User Roles & Access Control](#-user-roles--access-control)
- [🔄 Emergency Incident Lifecycle Workflow](#-emergency-incident-lifecycle-workflow)
- [🛠️ Technology Stack](#️-technology-stack)
- [📂 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
  - [Backend Setup](#1-backend-setup)
  - [Frontend Setup](#2-frontend-setup)
- [🔐 Environment Variables](#-environment-variables)
- [🗄️ Database Schema & Storage](#️-database-schema--storage)
- [📡 API Documentation](#-api-documentation)
- [⚡ WebSocket Real-Time Event Stream](#-websocket-real-time-event-stream)
- [📴 Offline-First Architecture & PWA](#-offline-first-architecture--pwa)
- [🗣️ Voice Emergency Reporting](#️-voice-emergency-reporting)
- [🛡️ Security & Privacy](#️-security--privacy)
- [🧪 Testing & Verification](#-testing--verification)
- [🌱 Demo Seed Data](#-demo-seed-data)
- [🔮 Future Enhancements](#-future-enhancements)
- [👥 Team & Project Information](#-team--project-information)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🌍 Overview

### Problem Statement
During severe natural disasters (such as monsoon flash floods, landslides, cyclones, and earthquakes), emergency information is heavily fragmented across chaotic phone calls, social media channels, disparate messaging apps, and isolated agency silos. Responders struggle with:
1. **Lack of Location Clarity**: Victims cannot convey precise coordinates, leading to delayed search and rescue operations.
2. **Resource Misallocation**: Relief items are sent arbitrarily, creating severe surpluses in some relief camps and critical shortages in others.
3. **Inefficient Volunteer Coordination**: Spontaneous volunteers arrive without assignment or skill matching.
4. **Network Blackouts**: Disasters knock out cell towers, causing victim distress signals to be lost when apps require constant connectivity.

### The ResQ Solution
**ResQ** provides an integrated, offline-first, real-time command and response platform that unites victims, rescue squads, volunteers, shelter managers, and disaster operators into a single coordinated operational network.

> **Main Objective:** *«Get the right resource to the right person at the right place at the right time.»*

---

## 🎯 Core Innovation & Project Highlight

```
┌─────────────────────────┐
│ Real Device GPS Tracker │  (W3C Geolocation API: lat, lon, accuracy, timestamp)
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Haversine Proximity API │  (Backend Bounding Box + Spherical Trigonometry Search)
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                   Proximity Assistance                      │
│ ┌───────────────┬─────────────────────────┬───────────────┐ │
│ │ Open Shelters │ Available Stock Depots  │ Rescue Squads │ │
│ └───────────────┴─────────────────────────┴───────────────┘ │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────┐
│  Leaflet Radar Mapping  │  (Interactive Pins, Search Radii: 1, 3, 5, 10, 25 km)
└─────────────────────────┘
```

---

## 🖼️ Application Interface & Screenshots

<div align="center">
  <h3>⚡ Real-Time Operational Command, Proximity Radar & AI Intelligence in Action ⚡</h3>
</div>

<table>
  <tr>
    <td width="50%" align="center">
      <img src="https://drive.google.com/file/d/1G_4K_EXZC8nSfQ28FG4-X4Wim9u-XxUO/view?usp=drive_link" alt="ResQ Live GIS Command Center" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);" />
      <br />
      <b>🌐 Live GIS Disaster Operations Center</b>
      <p><i>Real-time situational awareness with interactive geospatial heatmaps, live alert toasts, and active incident metrics.</i></p>
    </td>
    <td width="50%" align="center">
      <img src="https://drive.google.com/file/d/1-cpdm41M-RFt3hLTgkkGjSara119yu14/view?usp=drive_link" alt="ResQ Emergency SOS and Radar" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);" />

      <br />
      <b>🆘 1-Click SOS & Haversine Proximity Radar</b>
      <p><i>Instant GPS distress dispatch with live proximity radar showing open shelters, supply caches, and nearby rescue squads.</i></p>
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <img src="https://drive.google.com/file/d/1Pcu9y-B0vYUI7v6jHWZQ4TnFNck3NSCe/view?usp=drive_link"ResQ AI Optimization Engine" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);" />
      <br />
      <b>🧠 AI-Assisted Emergency & Dispatch</b>
      <p><i>Ai - assitant emergency detection triage,real time Gis tracking & resource optimization.</i></p>
    </td>
    <td width="50%" align="center">
      <img src="https://drive.google.com/file/d/18QfLKAZYENqWRc31zBsCRD3qhy00klgF/view?usp=drive_link" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);" />
      <br />
      <b>🏫 Relief Shelter Hub </b>
      <p><i>Live bed & ration capacity monitoring, and one-click field mission assignments.</i></p>
    </td>
  </tr>
</table>

---

## 🎬 Interactive Project Demo & Walkthrough

Experience ResQ locally in under 60 seconds with full interactive seed data and real-time WebSocket connectivity.## 🎥 Project Demo

See ResQ in action — from AI-powered emergency triage to ambulance dispatch and real-time location tracking.

▶️ "https://drive.google.com/file/d/1eXqV30OhzwxqtdgkYo5lsrWFK1Fx3SEo/view?usp=drive_link"

### 🚑 Demo Highlights
- 🤖 AI-assisted emergency prioritization
- 🚨 Real-time emergency dispatch
- 📍 Live ambulance tracking
- 🏥 Hospital/resource coordination
- 🗺️ GIS-based location mapping

### ⚡ 1-Click Fast Launch

```bash
# Windows: Double-click or run from terminal
.\start_all.bat
```
*Or launch backend and frontend individually:*
```bash
# Terminal 1: Backend FastAPI Server
.\start_backend.bat

# Terminal 2: Frontend Vite + React Client
.\start_frontend.bat
```

### 🌐 Access Endpoints

| Portal | Local URL | Description |
|---|---|---|
| **Web Application** | [http://127.0.0.1:3000](http://127.0.0.1:3000) | Full responsive PWA web client |
| **Interactive API Docs (Swagger)** | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) | Complete OpenAPI / Swagger interactive testing UI |
| **Alternative API Docs (ReDoc)** | [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc) | Standardized ReDoc technical schema reference |
| **WebSocket Stream** | `ws://127.0.0.1:8000/ws` | Live bi-directional emergency dispatch channel |

### 🔑 Pre-Configured Demo Credentials

The platform is pre-loaded with multi-role accounts for end-to-end simulation:

| Role | Email / Username | Password | Operational Capabilities |
|---|---|---|---|
| **🛡️ System Admin** | `admin` / `admin@resq.org` | `Admin@123` | Full platform control, audit logs, disaster creation, system settings |
| **📡 Disaster Operator** | `operator` / `operator@resq.org` | `Operator@123` | Triage emergencies, assign rescue squads, broadcast alerts, manage shelters |
| **🚨 Rescue Squad Lead** | `rescue_lead` / `team@resq.org` | `Team@123` | Accept dispatches, update field status (`EN_ROUTE`, `ON_SCENE`), upload resolution photos |
| **🤝 Volunteer** | `volunteer1` / `volunteer@resq.org` | `Volunteer@123` | View assigned relief missions, update location and readiness status |
| **🙋 Citizen / Victim** | `citizen` / `citizen@resq.org` | `Citizen@123` | Trigger 1-click SOS, view nearby assistance radar, submit voice reports |

### 🧭 Guided Demo Scenario Flow

1. **Broadcast a Citizen SOS**:
   - Sign in as `citizen` or navigate to `/sos`
   - Click **Activate Emergency SOS** (captures real GPS telemetry, sets priority to `CRITICAL`)
   - Test offline resilience: In DevTools Network tab, switch to *Offline* and trigger SOS; check the local IndexedDB queue and re-connect to see auto-sync.
2. **Review Command Center Alert**:
   - Switch to an `operator` or `admin` window
   - Observe the instant audio/toast alert received via WebSocket without page refresh
   - View the incident on the **Live GIS Map** with priority color rings.
3. **AI Recommendation & Squad Dispatch**:
   - Open **AI Intelligence** (`/ai-intelligence`)
   - Check automated triage scoring and recommended rescue teams based on distance and skill set
   - Dispatch `NDRF Unit 04` and assign specialized medical volunteers.
4. **On-Scene Resolution & Photo Evidence**:
   - Switch to `rescue_lead` account
   - Update mission status from `EN_ROUTE` → `ON_SCENE` → `RESOLVED`
   - Attach on-site proof of rescue photo and submit incident resolution report.

---

## ✨ Key Features

### 🚨 Emergency Management
- **Structured Incident Reporting**: Log emergencies with detailed demographic impacts (children, elderly, pregnant, injured, disabled, and trapped counts).
- **Automated Priority Scoring**: Dynamic weighted priority ranking (0–100) calculated from victim vulnerability, medical urgency, and disaster proximity.
- **Incident Lifecycle Tracking**: Enforces strict audit-logged status transitions (`PENDING` → `VERIFIED` → `ASSIGNED` → `EN_ROUTE` → `ON_SCENE` → `RESOLVED` / `CANCELLED`).
- **Incident Assignment**: Seamless dispatching of specialized rescue units and matched community volunteers.

### 🆘 1-Click Distress SOS
- **Instant GPS Distress Signal**: Broadcasts exact device coordinates with accuracy radius and client timestamp.
- **Immediate Priority Escalation**: Automatically tags SOS incidents as `CRITICAL` severity with top triage ranking.
- **Real-Time Dispatch Push**: Broadcasts instantaneous alerts over WebSockets to all active rescue operators.
- **Offline SOS Queueing**: Saves distress requests locally in IndexedDB when network connectivity is lost, synchronizing automatically when connection resumes.

### 📍 Current Location & Proximity Assistance ("Help Near Me")
- **True Device GPS Telemetry**: Captures high-accuracy device coordinates without assuming any default or fixed city.
- **Geospatial Distance Modeling**: Backend utilizes the Haversine formula to compute exact distance (in km) and urban vehicle ETA estimates.
- **Dynamic Search Radii**: Filter nearby relief assets across **1 km**, **3 km**, **5 km**, **10 km**, and **25 km** perimeters.
- **Interactive Leaflet Mapping**: Visualizes the user's location with a live radar pulse marker alongside surrounding shelters, supply caches, and response teams.
- **Interactive Pin Picker**: Moveable Leaflet pin picker allowing users to tap on the map or click *"Use My GPS Location"* to populate incident coordinates.

### 🏫 Shelter Operations
- **Real-Time Capacity Management**: Tracks total beds, occupied capacity, and available vacancy.
- **Facility Amenities Checklist**: Verifies on-site medical clinics, food mess, potable water, backup electricity, and disability accessibility.
- **Full Shelter Protection**: Automatically marks full camps (`available_capacity <= 0` or `status: FULL`) and filters them out for public citizens to prevent overcrowding.
- **Directions & Navigation**: 1-click external navigation links to Google Maps / OpenStreetMap.

### 📦 Resource Management & Inventory
- **Multi-Category Tracking**: Manages supplies across Water, Food Rations, First Aid Kits, Medicines, Blankets/Bedding, Inflatable Boats, Life Jackets, Ambulances, and Heavy Rescue Equipment.
- **Live Stock Depletion Controls**: Prevents over-allocation and alerts coordinators when depots reach zero stock.
- **Shortage Detection**: Analyzes incoming incident demands against local warehouse stockpiles.

### 🚑 Rescue Team Coordination
- **Squad Rosters & Leadership**: Tracks squad leader, active responder count, base location, and direct phone contact.
- **Specialty Categorization**: Categorizes units by specialty (Flood & Marine Rescue, Search & Extraction, Medical Trauma Response, Coastal Evacuation).
- **Availability State**: Prioritizes `AVAILABLE` teams in search results over `BUSY` or `OFF_DUTY` units.

### 👥 Volunteer Management & Matchmaking
- **Volunteer Onboarding**: Captures volunteer skills (First Aid, Boat Driving, Cooking, Search & Rescue, Logistics), vehicle availability, and location.
- **Status & Workload Tracking**: Tracks active assignments to prevent volunteer burnout and ensure balanced distribution.

### 🌪️ Disaster Monitoring
- **Multi-Hazard Event Tracking**: Catalogs active floods, landslides, cyclones, earthquakes, and industrial hazards with risk level ratings (`low`, `medium`, `high`, `critical`).
- **Perimeter Hazard Zones**: Plots danger zones on Leaflet maps with perimeter warning circles.

### 🌧️ Weather & Risk Warnings
- **Meteorological Telemetry**: Displays temperature, humidity, rainfall (mm), wind speed (km/h), and atmospheric pressure.
- **Multi-Station Coverage**: Nearest-station selection via Haversine distance matching.
- **Hazard Risk Indicators**: Flood and landslide risk gauges with early advisory broadcasts.
  *(Note: Simulated meteorological telemetry engine for development and simulation environments).*

### 📡 Real-Time WebSocket Architecture
- **Instant Event Stream**: Bi-directional communication channel (`ws://.../ws`) delivering real-time incident dispatches, assignment notifications, and status updates with zero polling overhead.

### 📢 Emergency Broadcasts
- **Official Public Alerts**: Authorized operators can issue prioritized broadcast bulletins (`INFO`, `WARNING`, `CRITICAL`, `EVACUATION`) targeting specific geographical zones.

### 📷 Proof of Resolution
- **On-Scene Verification**: Authorized field responders can upload photographic evidence with timestamped resolution notes before closing incidents.

### 🔄 Duplicate Incident Detection
- **Spam & Redundancy Prevention**: Evaluates incoming reports against existing incidents using geographic proximity (within 1.5 km), time cutoffs, emergency category, and text similarity. Flags potential duplicates for operator review without destructive auto-deletion.

### 🗂️ Chronological Incident Audit Trails
- **Complete Incident History**: Logs all lifecycle transitions, assignment dispatches, and notes into an immutable timeline for post-disaster analysis.

### 📴 Offline-First Architecture & PWA
- **Progressive Web App**: Fully installable PWA equipped with a Service Worker, Cache API for offline map tiles and static assets, and IndexedDB for local incident queueing.

### 🗣️ Voice Emergency Reporting
- **Hands-Free Intake**: Integrates the browser Web Speech API for voice-driven distress intake, automatically converting speech to structured emergency forms.

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React + Vite Frontend                   │
│                                                             │
│  ┌──────────────────────┬────────────────────────────────┐  │
│  │ Dashboard & Intel    │ Help Near Me (Proximity Map)   │  │
│  │ Emergencies Console  │ 1-Click SOS Console            │  │
│  │ Shelters & Resources │ Teams & Volunteer Hub          │  │
│  │ Offline Sync Manager │ Evidence & Analytics Suite     │  │
│  └──────────────────────┴────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │
               HTTPS REST API  │  WSS WebSocket Stream
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Python Backend                   │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Routers: Auth, SOS, Emergencies, Locations, Map,      │  │
│  │ Shelters, Resources, Teams, Volunteers, Weather, etc. │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ Services Layer: Location (Haversine), Geocoding,      │  │
│  │ Sync Manager, Duplicate Detection, Audit Logger       │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ AI Decision Suite: Priority Scoring Engine,           │  │
│  │ Resource Recommender, Volunteer Matcher               │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                        SQLAlchemy 2.0 ORM
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      SQLite Database                        │
│   (Users, Emergencies, Shelters, Resources, Teams, etc.)    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📍 Current Location & Nearby Assistance

ResQ does **not** assume any fixed city or default location for the user. Proximity intelligence is driven by real GPS hardware coordinates.

### The Real GPS Flow
1. **User Request**: The user navigates to `/nearby` or clicks *"Use My Current Location"*.
2. **Permission Prompt**: The browser asks *"Allow this site to access your location?"*.
3. **Hardware Acquisition**: `navigator.geolocation.getCurrentPosition()` obtains real hardware coordinates with `{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }`.
4. **Backend Query**: The coordinates are transmitted to `GET /locations/nearby?latitude=<lat>&longitude=<lon>&radius_km=<r>`.
5. **Haversine Distance**: The backend calculates the great-circle spherical distance:
   $$\text{Distance} = 2 R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta \text{lon}}{2}\right)}\right)$$
6. **Leaflet Plotting**: The Leaflet map recenters smoothly to the user's coordinates, drawing a pulse marker and search radius circle around them while plotting nearby open shelters, in-stock supplies, and active rescue teams.

> [!IMPORTANT]
> **No Fake Location Fallbacks:** If location access is denied or unavailable, ResQ does **not** silently inject default coordinates. It displays a clear permission banner and allows manual coordinate entry. Demo records in the database (e.g., in Kochi, Kollam, or Thiruvananthapuram) represent realistic relief assets, not the user's location.

---

## 🧠 AI-Assisted Intelligence & Recommendation

ResQ features a modular, explainable decision-support engine:

### 1. Weighted Triage Priority Scoring Engine
Calculates a deterministic 0–100 priority rating based on domain-specific emergency criteria:
- **Base Severity**: `CRITICAL` (+35), `HIGH` (+25), `MEDIUM` (+15), `LOW` (+5)
- **Vulnerable Demographics**: Children (+5 each), Elderly (+5 each), Pregnant (+10 each), Disabled (+10 each)
- **Urgent Conditions**: Trapped/Rising Water (+20), Urgent Medical Aid (+20)
- **Casualties**: Injured (+8 each)
- **Disaster Hazard Proximity**: Active flood/landslide zone (+10)
- **Time In Queue**: Escalates score over time to prevent starvation of pending requests.

### 2. AI Resource Recommender
Analyzes emergency types and casualty counts to recommend exact supply bundles (e.g., liters of water, meal rations, trauma kits, rescue boats) alongside warehouse stock and shortage warnings.

### 3. AI Volunteer Matchmaker
Calculates a multi-factor suitability score (0–100) evaluating volunteer skill alignment, geographical distance (via Haversine formula), availability status, and current task load.

---

## 👥 User Roles & Access Control

ResQ enforces strict Role-Based Access Control (RBAC) validated on the backend:

| Role | Permissions & Operational Scope |
| :--- | :--- |
| **`citizen`** | Submit emergency requests, trigger 1-Click SOS, view public nearby shelters, supplies, and weather advisories. |
| **`volunteer`** | Access volunteer task queues, accept assignments, update field availability, and report task completion. |
| **`rescue_team`**| View assigned emergency missions, update real-time squad status (`EN_ROUTE`, `ON_SCENE`, `RESOLVED`), and upload resolution evidence photos. |
| **`operator`** | Command dashboard access, verify pending incidents, dispatch rescue teams, allocate resources, issue public broadcasts, and manage shelters. |
| **`admin`** | Full system governance, user account management, RBAC clearance, security configuration, and immutable audit log inspection. |

---

## 🔄 Emergency Incident Lifecycle Workflow

```
┌─────────────┐     Operator Verification      ┌──────────────┐
│   PENDING   │ ─────────────────────────────> │   VERIFIED   │
└─────────────┘                                └──────┬───────┘
       │                                              │
       │ Duplicate / False Alarm                      │ Dispatch Team / Volunteer
       ▼                                              ▼
┌─────────────┐                                ┌──────────────┐
│  CANCELLED  │                                │   ASSIGNED   │
└─────────────┘                                └──────┬───────┘
                                                      │
                                                      │ Squad Departs
                                                      ▼
┌─────────────┐         Evidence Upload        ┌──────────────┐
│  RESOLVED   │ <───────────────────────────── │   EN_ROUTE   │
└─────────────┘         & Scene Clearance      └──────┬───────┘
       ▲                                              │
       │                                              │ Arrives at Coordinates
       │                                              ▼
       │                                       ┌──────────────┐
       └────────────────────────────────────── │   ON_SCENE   │
                                               └──────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technology | Version / Specification | Purpose |
| :--- | :--- | :--- | :--- |
| **Backend Runtime** | Python | 3.10+ | Robust asynchronous server language |
| **Web Framework** | FastAPI | 0.110+ | High-performance asynchronous REST API & OpenAPI docs |
| **ORM** | SQLAlchemy | 2.0+ | Object-relational mapping & database abstractions |
| **Database** | SQLite | 3 | Embedded zero-configuration relational database |
| **Data Validation** | Pydantic | 2.6+ | Strict type checking & payload validation |
| **Authentication** | PyJWT & Passlib / Bcrypt | 2.8+ / 4.1+ | Stateless JWT bearer tokens & salted SHA-256/bcrypt hashes |
| **Real-Time Stream**| WebSockets | 12.0+ | Bi-directional live dispatch events |
| **Testing** | Pytest & HTTPX | 8.1+ / 0.27+ | Automated test suite (57 test cases) |
| **Frontend Runtime**| React | 18.3 | Reactive user interface & component tree |
| **Build Tool** | Vite | 6.x | Fast modern frontend bundler & dev server |
| **Styling** | Tailwind CSS | 3.4 | Utility-first responsive styling |
| **Mapping** | Leaflet & React-Leaflet | 1.9+ / 4.2+ | Interactive geospatial maps & custom pin overlays |
| **Data Viz** | Recharts | 2.15+ | Responsive charts for severity triage & response KPIs |
| **HTTP Client** | Axios | 1.7+ | HTTP communication with interceptors |
| **Offline Storage** | idb (IndexedDB) & Workbox | 8.0+ / 1.3+ | Client-side offline caching & Service Worker PWA |

---

## 📂 Project Structure

```
ResQ-Disaster-Relief/
│
├── backend/
│   ├── main.py                     # FastAPI application entry point, lifespan, & router mounting
│   ├── database.py                 # SQLAlchemy engine, session maker, & schema initialization
│   ├── models.py                   # SQLAlchemy database entity models
│   ├── schemas.py                  # Pydantic schemas for request & response validation
│   ├── auth.py                     # JWT token handling, password hashing, & RBAC dependencies
│   ├── config.py                   # App configuration & environment settings
│   ├── seed.py                     # Multi-region demo seed data generator
│   │
│   ├── ai/                         # AI decision-support algorithms
│   │   ├── priority_engine.py      # Weighted emergency priority calculation (0-100)
│   │   ├── resource_recommender.py # Incident-based supply recommendation
│   │   └── volunteer_matcher.py    # Skill- and distance-based volunteer matching
│   │
│   ├── services/                   # Business logic services
│   │   ├── location_service.py     # Haversine distance, bounding boxes, & nearby queries
│   │   ├── geocoding_service.py    # Dynamic reverse geocoding with caching
│   │   ├── duplicate_service.py    # Incident proximity & text similarity deduplication
│   │   ├── weather_service.py      # Regional weather station simulation & risk scoring
│   │   ├── sync_service.py         # Offline batch sync & latency calculation
│   │   ├── notification_service.py # System notifications engine
│   │   └── audit_service.py        # Operational audit log recorder
│   │
│   ├── utils/                      # Helper utilities
│   │   ├── geo.py                  # Geospatial math functions
│   │   └── websocket_manager.py    # WebSocket connection & broadcasting manager
│   │
│   ├── routers/                    # REST API route handlers
│   │   ├── auth.py                 # User registration, login, & token refresh
│   │   ├── emergencies.py          # Emergency incident CRUD & lifecycle transitions
│   │   ├── sos.py                  # 1-Click SOS distress intake & offline batch sync
│   │   ├── locations.py            # Proximity assistance (/locations/nearby)
│   │   ├── shelters.py             # Shelter capacity & amenities management
│   │   ├── resources.py            # Supply inventory & allocation quotas
│   │   ├── teams.py                # Rescue team management & dispatch
│   │   ├── volunteers.py           # Volunteer registration & task assignments
│   │   ├── weather.py              # Weather alerts & hazard risk assessments
│   │   ├── broadcasts.py           # Public emergency alert broadcasts
│   │   ├── analytics.py            # Aggregate operational statistics
│   │   ├── audit.py                # System audit trail logs
│   │   ├── evidence.py             # Proof of resolution file upload handler
│   │   ├── duplicates.py           # Duplicate incident detection
│   │   ├── incidents.py            # Chronological incident history logs
│   │   ├── map.py                  # Map GIS telemetry layers
│   │   └── websocket.py            # WebSocket endpoint (/ws)
│   │
│   ├── database/                   # SQLite database storage (resq.db)
│   ├── uploads/                    # Uploaded proof-of-resolution evidence images
│   └── tests/                      # Automated Pytest suite (57 tests)
│       ├── conftest.py             # Test database setup & fixtures
│       ├── test_api.py             # General API endpoints & workflow tests
│       ├── test_auth_security.py   # JWT, RBAC, & security policy tests
│       ├── test_nearby_assistance.py # GPS proximity, Haversine, & multi-city tests
│       └── test_sos_offline_sync.py  # SOS intake, offline sync, & idempotency tests
│
├── frontend/
│   ├── index.html                  # HTML5 entry point & PWA meta tags
│   ├── package.json                # Frontend dependencies & scripts
│   ├── vite.config.js              # Vite configuration & PWA Service Worker cache rules
│   ├── tailwind.config.js          # Tailwind CSS design system theme
│   ├── postcss.config.js           # PostCSS plugins
│   │
│   ├── public/                     # Public PWA icons & assets
│   │
│   └── src/
│       ├── main.jsx                # React DOM root entry point
│       ├── App.jsx                 # App routing, layout wrappers, & navigation
│       ├── index.css               # Global styles, Tailwind utilities, & Leaflet overrides
│       │
│       ├── api/                    # Axios API client & interceptors
│       │   └── axiosClient.js      # Base URL configuration & JWT token injection
│       │
│       ├── context/                # Global state providers
│       │   ├── AuthContext.jsx     # Authentication, user role, & session state
│       │   ├── WebSocketContext.jsx# Live WebSocket connection & toast notifications
│       │   └── OfflineContext.jsx  # Network quality, sync status, & offline queues
│       │
│       ├── hooks/                  # Custom React hooks
│       │   └── useCurrentLocation.js # High-accuracy GPS tracking hook
│       │
│       ├── services/               # Client-side services
│       │   ├── locationService.js  # GPS acquisition, Haversine math, & ETA
│       │   ├── nearbyService.js    # Nearby assistance API requests & caching
│       │   ├── locationApi.js      # Location API wrapper
│       │   ├── indexedDB.js        # IndexedDB database operations
│       │   ├── offlineQueue.js     # SOS and incident offline queue manager
│       │   └── syncManager.js      # Automated background sync manager
│       │
│       ├── components/             # Reusable UI components
│       │   ├── common/             # Cards, badges, modals, loaders, sidebar, navbar
│       │   ├── nearby/             # NearbyMap, LocationPermission, CurrentLocation,
│       │   │                       # NearbyShelters, NearbyResources, NearbyTeams
│       │   ├── map/                # MapView, LocationPickerMap, custom markers
│       │   ├── emergency/          # EmergencyCard, EmergencyTable, VoiceReporter,
│       │   │                       # DuplicateModal, EvidenceUploader
│       │   ├── ai/                 # AIRecommendationPanel, AIPriorityBadge
│       │   ├── workflow/           # AssignmentPanel
│       │   ├── timeline/           # IncidentTimeline
│       │   └── broadcast/          # BroadcastBanner
│       │
│       ├── pages/                  # Page route components
│       │   ├── LandingPage.jsx     # Public landing & feature showcase
│       │   ├── LoginPage.jsx       # User authentication & demo accounts
│       │   ├── RegisterPage.jsx    # User registration
│       │   ├── DashboardPage.jsx   # Command dashboard with Current Location card
│       │   ├── NearbyAssistance.jsx# Help Near Me proximity intelligence console
│       │   ├── SOSPage.jsx         # 1-Click SOS distress console
│       │   ├── EmergenciesPage.jsx # Incident management (Grid, Table, Map views)
│       │   ├── EmergencyDetailPage.jsx # Incident details, AI triage, & evidence
│       │   ├── SheltersPage.jsx    # Shelter capacity management
│       │   ├── ResourcesPage.jsx   # Resource inventory & allocations
│       │   ├── TeamsPage.jsx       # Rescue squad management
│       │   ├── VolunteersPage.jsx  # Volunteer management & matching
│       │   ├── DisastersPage.jsx   # Active hazard zones
│       │   ├── WeatherPage.jsx     # Regional weather alerts
│       │   ├── BroadcastsPage.jsx  # Emergency alerts broadcaster
│       │   ├── AnalyticsPage.jsx   # Operational charts & response KPIs
│       │   ├── AuditLogsPage.jsx   # Administrative audit trail
│       │   ├── OfflineQueuePage.jsx# Offline pending queue inspector
│       │   └── ProfilePage.jsx     # User account profile
│       │
│       └── utils/                  # Formatting & math utilities
│           ├── geoUtils.js         # Distance & coordinate utilities
│           ├── formatters.js       # Date, distance, & status string formatters
│           └── speechRecognition.js# Web Speech API wrapper
│
└── README.md                       # Comprehensive project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+** (with `pip` and `venv`)
- **Node.js 18+** (with `npm`)
- Modern web browser (Chrome, Firefox, Edge, Safari) with Geolocation API support

---

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database schema and seed demo records
python seed.py

# Start the FastAPI development server
python main.py
# Or with uvicorn:
# uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

- **Backend API**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to the frontend directory
cd frontend

# Install Node modules
npm install

# Start the Vite development server
npm run dev
```

- **Frontend Application**: [http://127.0.0.1:3000](http://127.0.0.1:3000) (or [http://localhost:3000](http://localhost:3000))

---

## 🔐 Environment Variables

Create a `.env` file in the `backend/` directory based on `.env.example`:

```ini
PROJECT_NAME="ResQ Disaster Relief & Volunteer Coordination"
ENVIRONMENT="development"
DEBUG=True
SECRET_KEY="resq-super-secure-production-ready-jwt-secret-key-replace-in-prod"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DATABASE_URL="sqlite:///./database/resq.db"
UPLOAD_DIR="./uploads"
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000","*"]

# Initial Secure Admin Provisioning
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@ResQ2026!
```

> [!WARNING]
> - Never commit `.env` files with production secrets into version control.
> - Secrets should never be exposed in client-side frontend code.

---

## 🗄️ Database Schema & Storage

ResQ utilizes SQLite with SQLAlchemy ORM. The schema includes:

- **`users`**: Identity, credentials (hashed), contact info, and role (`citizen`, `volunteer`, `rescue_team`, `operator`, `admin`).
- **`emergencies`**: Incident type, coordinates (`latitude`, `longitude`, `gps_accuracy`), severity, priority score, vulnerable demographic counts, trapped/medical flags, status, assigned squad, and reporter info.
- **`shelters`**: Camp name, address, coordinates, total capacity, occupied beds, available capacity, status (`OPEN`, `FULL`), and amenities.
- **`resources`**: Item name, category, total quantity, available quantity, unit, depot coordinates, and location name.
- **`rescue_teams`**: Squad name, leader, specialty, coordinates, status (`AVAILABLE`, `BUSY`, `OFF_DUTY`), active responder count, skills, and equipment.
- **`volunteers`**: Name, phone, coordinates, skills, availability status, and active workload.
- **`volunteer_assignments`**: Emergency reference, volunteer reference, task description, and completion status.
- **`disaster_events`**: Active disaster type, affected area, coordinates, risk level, and active status.
- **`broadcasts`**: Emergency bulletin title, message, severity, target area, expiration, and active status.
- **`evidence_photos`**: Uploaded resolution image paths, notes, and timestamps.
- **`audit_logs`**: User ID, action performed, resource type, target ID, and client IP address.
- **`incident_history`**: Chronological incident timeline entries.

---

## 📡 API Documentation

### Major Endpoint Groups

| Group | Path Prefix | Description |
| :--- | :--- | :--- |
| **Authentication** | `/api/auth` | User registration, login token generation, profile retrieval |
| **Locations & Proximity** | `/locations/nearby` | Haversine proximity assistance (`GET /locations/nearby?latitude=..&longitude=..&radius_km=..`) |
| **Emergencies** | `/api/emergencies` | Create, filter, update status, triage priority, AI recommendations |
| **Distress SOS** | `/api/sos` | Instant SOS distress submission & offline batch synchronization (`/api/sos/sync`) |
| **Shelters** | `/api/shelters` | Shelter registry, occupancy tracking, and amenities management |
| **Resources** | `/api/resources` | Emergency resource stockpiles and allocation quotas |
| **Rescue Teams** | `/api/teams` | Squad management, status toggles, and mission assignments |
| **Volunteers** | `/api/volunteers` | Volunteer registry, skill tagging, and automated matchmaking |
| **Disasters** | `/api/disasters` | Active disaster events and perimeter hazard monitoring |
| **Weather** | `/api/weather` | Regional weather station telemetry and hazard risk indicators |
| **Broadcasts** | `/api/broadcasts` | Public emergency advisory and evacuation alerts |
| **Analytics** | `/api/analytics` | Overview statistics, response metrics, and severity distributions |
| **Audit Logs** | `/api/audit` | Operational audit trail logs for administrative accountability |
| **Resolution Evidence** | `/api/evidence` | On-scene proof photo upload and incident resolution verification |
| **Duplicates** | `/api/duplicates` | Potential duplicate emergency detection |
| **WebSockets** | `/ws` | Live bi-directional real-time event pipeline |

---

## ⚡ WebSocket Real-Time Event Stream

Connect to: `ws://127.0.0.1:8000/ws`

### Broadcast Event Catalog
- `NEW_EMERGENCY`: Broadcast whenever a new emergency incident is logged.
- `SOS_ALERT`: Immediate high-priority alert when an SOS distress signal is triggered.
- `EMERGENCY_UPDATED`: Broadcast when status advances (e.g., `EN_ROUTE`, `ON_SCENE`).
- `TEAM_ASSIGNED`: Broadcast when a rescue team is dispatched to an incident.
- `VOLUNTEER_ASSIGNED`: Broadcast when volunteers are assigned to response tasks.
- `RESOURCE_ALLOCATED`: Broadcast when supplies are allocated from a depot.
- `SHELTER_UPDATED`: Broadcast when shelter occupancy or capacity changes.
- `WEATHER_ALERT`: Broadcast when severe weather advisories are triggered.
- `BROADCAST`: Broadcast when an emergency public bulletin is published.
- `EMERGENCY_RESOLVED`: Broadcast when an incident is verified resolved with evidence.

---

## 📴 Offline-First Architecture & PWA

```
                  User Action (SOS / Emergency)
                                │
                                ▼
                       Progressive Web App
                                │
                 Is Network Online & Connected?
                                │
               ┌────────────────┴────────────────┐
               │                                 │
           YES │                                 │ NO
               ▼                                 ▼
      Transmit to FastAPI                Save to IndexedDB
               │                    (client_id, coordinates, timestamp)
               │                                 │
               │                                 ▼
               │                     Show "QUEUED OFFLINE" Banner
               │                                 │
               │                        Connectivity Restored
               │                                 │
               │                                 ▼
               │                        Sync Manager Triggers
               │                     POST /api/sos/sync (Batch)
               │                                 │
               └────────────────┬────────────────┘
                                │
                                ▼
               Idempotent Database Persistence
              (Prevents Duplicate SOS Submissions)
```

> [!NOTE]
> **Network Reality Clarification:** While ResQ stores emergency requests and caches map data locally on the device when offline, data transmission to emergency operators requires a communication network to become available.

---

## 🗣️ Voice Emergency Reporting

For users in distress or low-literacy scenarios, ResQ incorporates hands-free voice emergency intake:
1. The user taps the microphone icon in the emergency console.
2. The browser's native **Web Speech API** translates spoken words to text in real time.
3. The system extracts casualty counts, hazard descriptions, and urgent needs into structured form fields ready for instant dispatch.

---

## 🛡️ Security & Privacy

- **JWT Authentication**: Stateless token authentication with configurable expiration.
- **Salted Password Hashing**: Passwords stored using SHA-256 and bcrypt hashing.
- **Backend-Enforced Authorization**: Role checks executed securely on the server (`RoleChecker` dependency).
- **Sensitive Location Protection**: Victim coordinates are protected; exact pins are only accessible to authorized emergency responders.
- **Idempotent Synchronization**: `client_sos_id` unique indexing prevents duplicate replay attacks.
- **File Upload Protection**: Content-type validation, unique filenames, and size caps on evidence photos.
- **Audit Logging**: Immutable operational trail tracking all administrative actions.

---

## 🧪 Testing & Verification

ResQ includes an automated Pytest test suite covering authentication, geospatial math, proximity APIs, and offline sync.

```bash
# Navigate to the backend directory
cd backend

# Run the complete test suite
python -m pytest

# Run with verbose output
python -m pytest -vv

# Run specific proximity assistance tests
python -m pytest tests/test_nearby_assistance.py -vv
```

### Test Coverage Summary
- **`tests/test_nearby_assistance.py`**: Validates Haversine distance accuracy, multi-city queries (Kochi, Kollam, Trivandrum), radius variations (1–25 km), zero-stock filtering, full-shelter filtering, and input coordinate bounds.
- **`tests/test_sos_offline_sync.py`**: Validates SOS coordinate preservation, batch sync, idempotency, and latency scoring.
- **`tests/test_auth_security.py`**: Validates JWT authentication, RBAC clearance, and role elevation protections.
- **`tests/test_api.py`**: Validates general CRUD operations, status workflows, and AI recommendation endpoints.

```
====================== 57 passed in 25.14s =======================
```

---

## 🌱 Demo Seed Data

The database includes demo disaster response records across Kerala:
- **Kochi / Ernakulam**: Marine Drive relief depot, boat squads, coastal shelters, and harbour emergencies.
- **Kollam**: Chinnakada resource centers, Port marine squads, and beachfront shelters.
- **Alappuzha**: Kuttanad lowland boat units, drinking water reserves, and community camps.
- **Thiruvananthapuram**: Palayam Central Logistics depot, Medical College health store, NDRF Unit 04, and Thycaud shelter.

> [!IMPORTANT]
> **Database Records vs. User Location:** These sample records exist in the database for demonstration and testing. They are **not** used as the user's current location. The user's location is always dynamically determined by browser GPS.

---

## 🔮 Future Enhancements

- [ ] **Live Meteorological API Integration**: Direct integration with IMD / OpenWeatherMap live radar feeds.
- [ ] **Turn-by-Turn Disaster Routing**: Road network routing avoiding flooded or blocked corridors.
- [ ] **Satellite & Mesh Networking**: LoRa / Bluetooth mesh network bridging for disconnected zones.
- [ ] **SMS Gateway Fallback**: Two-way SMS emergency distress relay for basic feature phones.
- [ ] **Computer Vision Damage Assessment**: Drone and smartphone imagery analysis for rapid structural triage.
- [ ] **Multilingual Voice Support**: Native support for regional languages and dialects.

---

## 👥 Team & Project Information

<div align="center">

### 🌟 Project ResQ
**Empowering Disaster Resilience Through Location Intelligence & Offline-First Systems**

</div>

#### 🏅 Project Leadership & Development Team

| Contributor / Lead | Role | Core Focus & Responsibilities | Links |
|---|---|---|---|
| **Thanishma Shanoje** | **Frontend Developer** | Frontend UI/UX Design & Implementation<br>React 18 PWA Development<br>Leaflet GIS Mapping<br>Responsive & User-Friendly Interface Development | [GitHub](https://github.com/thanishma33-create) · [Email](mailto:thanishma33@gmail.com) |
| **Shisana Fathim** | **Backend Developer** | Backend Development & API Integration<br>Database Management<br>Emergency & Resource Services | [GitHub](https://github.com/shisan) · [Email](mailto:shisanafathim09@gmail.com) |
| **Malavika B** | **AI / Backend & Integration** | AI-Assisted Decision Support<br>Priority & Recommendation Logic<br>Backend Integration | [GitHub](https://github.com/sxanika) · [Email](mailto:sxanika0@gmail.com) |
| **Rishananda** | **UI/UX & Quality Assurance** | UI/UX Design & Usability<br>Interface Evaluation<br>Testing & Quality Assurance | [GitHub](https://github.com/RISHANANDA) · [Email](mailto:rishanandvrajeev@gmail.com) |

### 📌 Project Summary & Repository Details

- **Project Name**: ResQ (Disaster Relief Resource Tracking & Volunteer Coordination Platform)
- **Repository**: [`thanishma33-create/ResQ`](https://github.com/thanishma33-create/ResQ)
- **Target Domain**: Disaster Risk Reduction (DRR), Emergency Logistics, Humanitarian Assistance, Search & Rescue Coordination
- **Core Engineering Highlights**:
  - 🛰️ **True Device GPS Telemetry**: Real-time geolocation tracking with dynamic proximity search across 1–25 km perimeters.
  - 📴 **Zero-Data-Loss Offline Architecture**: IndexedDB client queue paired with Service Worker background synchronization.
  - 🧠 **Dynamic AI Prioritization**: Multi-factor urgency scoring (0–100) weighting vulnerable demographics (elderly, infants, injured, pregnant).
  - ⚡ **Sub-Second WebSocket Dispatch**: Instant push alerts streaming real-time event updates to rescue units without manual polling.
  - 📸 **Photographic Proof of Resolution**: Field verification capture ensuring operational accountability and auditability.

---

## 🤝 Contributing

1. **Fork the Repository**
2. **Create a Feature Branch** (`git checkout -b feature/amazing-feature`)
3. **Commit Your Changes** (`git commit -m "Add amazing feature"`)
4. **Run Test Suites** (`python -m pytest` and `npm run build`)
5. **Push to the Branch** (`git push origin feature/amazing-feature`)
6. **Open a Pull Request**

---

## 📄 License

License information will be added by the project owner.

---

<div align="center">
  <sub>Built with ❤️ for rapid disaster response, search & rescue, and community resilience.</sub>
</div>
