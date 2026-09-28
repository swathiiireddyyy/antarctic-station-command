# Antarctic Station Command — System Architecture

```mermaid
flowchart TD
    subgraph Client["Client Tier (Browser)"]
        UI["Antarctic Station Command UI (16 Modules)"]
        Charts["Responsive SVG / Canvas Visualizations"]
        DigitalTwin["Interactive 2.5D Digital Twin Model"]
        SoundFX["Web Audio Synthesized Alerts"]
        SyncEngine["Store-and-Forward Offline Sync Engine"]
    end

    subgraph Server["Server Tier (Node.js & Express) - Port 4000"]
        StaticServer["Static Assets Delivery (HTML, CSS, JS, SVG)"]
        Router["REST API Router (/api/*)"]
        SocketServer["Socket.io Real-Time Telemetry Gateway"]
        AuthMiddleware["JWT Verification & Role-Based Access Control"]
        TelemetrySim["Autonomous Antarctic Telemetry Simulator"]
        AlertEngine["Threshold & Sensor Anomaly Engine"]
    end

    subgraph Storage["Data & Storage Tier"]
        InMemory["In-Memory Resilient Cache (Default Fallback)"]
        Postgres[("PostgreSQL Database (Optional)")]
        JSONData["Seed Models (JSON / SQL)"]
    end

    UI -->|HTTP GET /| StaticServer
    UI <-->|WebSocket Stream / Telemetry| SocketServer
    UI -->|REST API Requests| Router
    Router --> AuthMiddleware
    Router --> InMemory
    Router -.->|When Connected| Postgres
    TelemetrySim -->|Periodic Sensor Ticks| SocketServer
    TelemetrySim --> AlertEngine
    AlertEngine -->|Trigger Broadcast| SocketServer
    JSONData --> InMemory
```

## Architectural Highlights
1. **Zero-Configuration Fallback**: The server starts instantly with built-in in-memory fallback stores, meaning PostgreSQL is optional.
2. **Integrated Port Architecture**: Both the interactive frontend and backend API endpoints run together on **Port 4000**.
3. **Store-and-Forward Telemetry**: Supports intermittent satellite communication with an offline queue that replays telemetry upon link reconnection.
4. **Role-Based Access Control (RBAC)**: Supports 5 specialized mission roles (Station Commander, Operations Engineer, Lead Scientist, Medical Officer, and Observer).
