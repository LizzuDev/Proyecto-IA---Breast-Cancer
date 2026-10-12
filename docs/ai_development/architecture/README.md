# Architecture Overview

## Purpose
This document is the fast orientation guide for engineers and AI agents working in this repository. It explains the system boundaries, the layered React component architecture, and the operational rules required to modify the Sisu Health & Wellness application safely.

It is intentionally practical: where components live, how state and logic are split, how data flows between Guest LocalStorage and Supabase Cloud Sync, and which failure modes are most common.

## System Context

```text
Web Browser (Mobile / Desktop)
              |
              v
     [React Virtual DOM / Vite]
              |
      +-------+-------+
      |               |
      v               v
 [React Hooks]   [Tailwind / Custom CSS]
 (State/Context)  (Sea-Theme Palette)
      |
      +---------------+---------------+
      |                               |
      v                               v
[LocalStorage Layer]         [Supabase JS Client]
(Instant Guest Mode)         (Cloud Sync & Auth)
```

The system is a modern, responsive web application designed for high client-side performance, instant offline accessibility, and optional cloud database synchronization.

---

## Core Design Decisions

### Decision 1: Modern Component Architecture (React + Vite + Tailwind / CSS System)
Context: The project requires a dynamic, accessible, and highly responsive frontend for interactive wellness tools (breathing visualizers, mood check-ins, core value tracking).
Decision: Use React with Vite build tooling, custom React hooks, and a CSS system utilizing custom properties and Tailwind utilities.
Rationale: Enables fast component iteration, declarative UI rendering, instant hot module reloading, and smooth hardware-accelerated animations.
Consequences: Code must be modularly structured into reusable React components (`/components`), custom hooks (`/hooks`), and service abstractions (`/services`).

### Decision 2: Layered Component-Hook-Service Architecture
Context: The codebase needs clean separation between UI components, state management, and storage/API integrations.
Decision: Separate JavaScript/JSX logic into three strict layers:
- **Components (`/components`):** Declarative UI elements (e.g., `MoodCheckInCard`, `BreathingVisualizer`, `ValueTracker`, `OtterMascot`). They render JSX and receive props or consume hooks; they contain no direct database queries.
- **Custom Hooks (`/hooks`):** Manage state transitions, breathing animation timers, local storage synchronization, and mood check-in handlers (e.g., `useLocalStorage`, `useSupabaseSync`, `useBreathingTimer`).
- **Services (`/services`):** Pure API and storage modules (`supabase.js`, `storage.js`) responsible for read/write operations with Supabase Cloud DB and browser `localStorage`.
Rationale: Allows swapping backend storage implementations or modifying UI layouts without breaking data logic.
Consequences: Components must never make direct Supabase API calls or `localStorage` reads during rendering; all side effects live in services and custom hooks.

### Decision 3: Mobile-First Sea-Themed Aesthetic with Otter Mascot
Context: Users access mental wellness check-ins on both mobile phones and desktop devices; visual atmosphere must foster tranquility.
Decision: Implement mobile-first layouts with CSS custom properties (`:root`) for the Sisu Sea Palette and integrate interactive Sisu the Otter mascot expressions.
Rationale: Fluid typography (`clamp()`) and seafoam/slate color tokens ensure readability and emotional warmth across all screen sizes.
Consequences: Component styles must use relative units, accessible focus states (`:focus-visible`), and responsive SVG graphics.

### Decision 4: Dual State Persistence (Instant Guest Mode + Supabase Sync)
Context: Users need instant access to log feelings and practice breathing without forced signup, while authenticated users expect multi-device cloud synchronization.
Decision: Use `localStorage` as the primary offline storage engine, with automatic background sync to Supabase PostgreSQL when user authenticates.
Rationale: Ensures zero friction for immediate guest usage, while preserving data securely for registered users.
Consequences: Data service layer is responsible for data serialization, optimistic UI updates, and conflict resolution during sync.

---

## Directory Structure

```text
hackathon-cs-girlies/
├── index.html                    # Root HTML document & font loaders
├── vite.config.js                # Vite build & plugin configuration
├── package.json                  # Dependencies & scripts
├── src/
│   ├── main.jsx                  # Application entry point
│   ├── App.jsx                   # Root App layout & routing
│   ├── components/               # Declarative UI Components
│   │   ├── Header.jsx            # Top navigation & user profile / auth modal trigger
│   │   ├── MoodCheckIn.jsx       # Emotional state selector & journal prompt
│   │   ├── BreathingVisualizer.jsx # Animated sea-wave & otter breathing exercise
│   │   ├── ValueTracker.jsx      # Core values definition & daily alignment tracker
│   │   ├── ResourceHub.jsx       # Smart mental health guide catalog & recommendation cards
│   │   ├── OtterMascot.jsx       # Duolingo-style mascot companion with dynamic expressions
│   │   ├── SoundscapePlayer.jsx  # Ambient sea audio player (waves, rain, stream)
│   │   └── GrowthDashboard.jsx   # Streak tracker, completion milestones, and history
│   ├── context/                  # Centralized Context Providers
│   │   ├── AuthContext.jsx       # Supabase Auth user session provider
│   │   └── WellnessContext.jsx   # Global mood, values, breathing, and streak state
│   ├── hooks/                    # Custom React Hooks
│   │   ├── useLocalStorage.js    # Persistent state hook for Guest Mode
│   │   ├── useSupabaseSync.js    # Data synchronization hook with Supabase DB
│   │   ├── useBreathingTimer.js  # Timer & scale animation controller for breathing
│   │   └── useSoundscape.js      # Ambient audio control hook
│   ├── services/                 # External API & Storage Adapters
│   │   ├── supabase.js           # Supabase JS client configuration
│   │   ├── storage.js            # LocalStorage serialization helpers
│   │   └── resourcesData.js      # Starter curated mental health resources dataset
│   ├── styles/                   # Global Sea-Theme CSS & Custom Properties
│   │   ├── index.css             # Tailwind imports & CSS custom properties
│   │   └── animations.css        # Breathing keyframes & mascot pulse effects
│   └── assets/                   # Vector SVGs, mascot poses, and ambient audio files
├── architecture/                 # Architecture reference and guides
├── context/                      # AI constraints and design contracts
├── golden-rules.md               # Core engineering & architectural principles
└── workflows/                    # AI workflow commands ($prepare, $design-session, etc.)
```

---

## Data Flow (e.g., Daily Mood Check-In)

```text
User selects mood & types reflection in MoodCheckIn component
    |
    v
MoodCheckIn calls logCheckIn(moodData) from WellnessContext
    |
    v
WellnessContext updates in-memory React state array (optimistic UI update)
    |
    v
useLocalStorage serializes updated mood log to localStorage['sisu_mood_logs']
    |
    v
OtterMascot receives updated state and renders celebratory mascot expression
    |
    v
IF User is authenticated:
    useSupabaseSync pushes new mood_checkin record to Supabase PostgreSQL table
    |
    v
GrowthDashboard updates streak count & analytics UI
```

Rules in flow:
- The UI components NEVER touch `localStorage` or Supabase directly. All data updates pass through `WellnessContext` / custom hooks.
- Optimistic updates render UI changes immediately; network sync happens asynchronously in background.
- Service adapters cleanly catch and handle offline network states.

---

## Development Environment

Prerequisites:
- Node.js (v18+ recommended) & npm.
- Modern web browser with ES6 support.

Primary setup:
1. Clone repository and install dependencies: `npm install`
2. Configure environment variables in `.env`: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Run local development server: `npm run dev`
4. Open local dev URL in browser.

---

## Common Pitfalls

### Pitfall 1: Bypassing React State with Direct DOM Queries
Problem: Using `document.getElementById` or inline event bindings in components.
Solution: Use React state (`useState`, `useReducer`) and declarative JSX bindings.

### Pitfall 2: Desktop-Only Layouts & Non-Responsive Canvas/SVG
Problem: Hardcoding pixel widths (`width: 1200px`) causing overflow on mobile devices.
Solution: Mobile-first styling with CSS Grid/Flexbox, `max-w-4xl`, fluid typography (`clamp()`), and responsive SVG containers.

### Pitfall 3: State Desynchronization Between Guest LocalStorage & Supabase
Problem: Updating state locally without scheduling Supabase sync when user logs in.
Solution: `useSupabaseSync` automatically merges `localStorage` guest data into Supabase upon authentication login.

### Pitfall 4: Accessibility & Audio Autoplay Violations
Problem: Playing loud ocean soundscapes automatically without consent, or using unlabelled icon buttons.
Solution: Require explicit user toggle for soundscapes with volume sliders, and include `aria-label` attributes on all controls.

