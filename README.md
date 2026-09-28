#  Antarctic Station Command Platform

> Consolidated Operations & Monitoring Command Base for India's Antarctic Research Stations: **Maitri** (Queen Maud Land) & **Bharati** (Larsemann Hills).

[![Live Demo](https://img.shields.io/badge/Render-Live%20Demo-00c7b7?style=for-the-badge&logo=render&logoColor=white)](https://antarctic-station-command.onrender.com)
[![Status](https://img.shields.io/badge/System-Operational-success?style=for-the-badge)](https://antarctic-station-command.onrender.com)

 **Live Deployment**: **[https://antarctic-station-command.onrender.com](https://antarctic-station-command.onrender.com)**

---

##  Quick Start

###  Access Live Cloud Deployment
- **Live Platform**: [https://antarctic-station-command.onrender.com](https://antarctic-station-command.onrender.com)
- **Live API Status**: [https://antarctic-station-command.onrender.com/api/stations](https://antarctic-station-command.onrender.com/api/stations)
- **Live Health Check**: [https://antarctic-station-command.onrender.com/health](https://antarctic-station-command.onrender.com/health)

###  Running Locally

#### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

#### 2. Installation
From the root directory (`antarctic-station-command`):
```bash
npm install
```

#### 3. Launch the Platform
```bash
npm start
```
The entire unified platform will be accessible locally at:
- **Local Web App**: [http://localhost:4000](http://localhost:4000)
- **Local API Status**: [http://localhost:4000/api/stations](http://localhost:4000/api/stations)
- **Local Health Check**: [http://localhost:4000/health](http://localhost:4000/health)

---

##  Project Structure

```
antarctic-station-command/
├── frontend/                     # Interactive Command Platform UI
│   ├── index.html                # Unified single-page application (16 modules)
│   ├── favicon.svg               # Antarctic theme favicon
│   ├── description.html          # Operational architecture overview
│   ├── summary.html              # Executive summary presentation
│   └── react-app/                # Modular React Vite client (alternative frontend)
├── backend/                      # Node.js Server & Real-time Telemetry
│   └── src/
│       ├── index.js              # Server entry point (serves frontend + REST API)
│       ├── config/               # Database and Socket.io configuration
│       ├── middleware/           # JWT & RBAC authorization
│       ├── routes/               # REST API endpoints (sensors, alerts, users, inventory, equipment)
│       ├── services/             # Antarctic telemetry simulator & alert engine
│       └── utils/                # Audit logger and utility routines
├── data/                         # Data Schemas & Seed Records
│   ├── init.sql                  # PostgreSQL schema and initial database seeds
│   ├── stations.json             # Station coordinates and infrastructure specs
│   ├── seed_users.json           # Credentials and roles for the 5 operator personas
│   ├── inventory_seed.json       # Consumables, fuel, water, and ration records
│   └── equipment_seed.json       # Machinery run-time hours and maintenance schedules
├── docs/                         # System Documentation
│   ├── ARCHITECTURE.md           # Architecture flowcharts and system diagrams
│   ├── MODULES_OVERVIEW.md       # Complete guide to all 16 platform modules
│   ├── SIH_Antarctic_Summary.pdf # Official compiled project summary document
│   ├── SIH_Description.pdf       # Technical specification document
│   └── gen_pdf.js                # Documentation export script
├── .env.example                  # Environment configuration template
├── .env                          # Local environment variables
├── .gitignore                    # Version control ignore rules
├── docker-compose.yml            # Docker services for PostgreSQL and Redis
└── package.json                  # Root package definitions and start script
```

---

## 👥 Demo Personas & Roles

Login or switch seamlessly between any of the 5 mission roles:

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Station Commander** | `admin@ncpor.res.in` | `Admin@1234` | Full root access, treaty reports, alert overrides |
| **Operations Engineer** | `operator@maitri.in` | `Operator@1234` | Telemetry, power grid, generator controls, maintenance |
| **Lead Scientist** | `scientist@bharati.in` | `Scientist@1234` | Meteorological data, ozone monitoring, experiment logs |
| **Chief Medical Officer** | `doctor@antarctica.gov.in` | `Doctor@1234` | Crew wellness, medical bay, biometrics, emergency triage |
| **Observer (Guest)** | `guest@iari.in` | `Guest@1234` | Read-only access across all telemetry views |

---

##  16 Core Modules

1. **Dashboard**: High-level station status, temperature, renewable mix, active alerts.
2. **HQ Overview**: Cross-station strategic map (Maitri & Bharati), weather comparisons.
3. **Energy**: Live generation mix, renewable share calculations, surplus/deficit indicators.
4. **Inventory**: Fuel, water, provisions, burn-rate predictions, resupply schedules.
5. **Equipment**: Health scores, operating hours, real service due countdowns.
6. **Environment**: Temperature, atmospheric pressure, wind chill, UV & ozone.
7. **Personnel & Safety**: Three isolated tabs for Roster, Crew Wellness, and Medical Protocols.
8. **Digital Twin**: 2.5D architectural model with subsystem color-coding and sensor overlays.
9. **Connectivity**: Satellite links, signal-to-noise ratio, latency, and link outage simulation.
10. **Alerts**: Real-time alarm matrix, audible sound dispatch, acknowledge and resolve workflows.
11. **Emergency**: Crisis protocols, muster stations, distress beacons, evacuation plans.
12. **Simulations**: Blizzard tests, power blackout scenarios, generator trips.
13. **Logbook**: Automated and manual operational logs with verifiable timestamps.
14. **Analytics**: Yield curves, load projections, efficiency metrics.
15. **Reports**: Antarctic Treaty & Madrid Protocol compliance report generation.
16. **Settings**: Configurable sound alerts, polling frequency, and offline banner display.

---

##  License
MIT License. Developed for Antarctic Research & Extreme Environment Expedition Management.
