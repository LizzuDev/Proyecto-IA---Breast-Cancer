# Golden Rules - Core Engineering Principles

These rules are NON-NEGOTIABLE.

They protect the integrity of the Sisu Health & Wellness application architecture and enforce high standards for accessibility, design fidelity, mascot engagement, state persistence, and clean component-driven development.

If any rule is violated: STOP implementation and fix the issue before proceeding.

---

# 1) Modern Component & Dual-Storage Stack Rule

The application MUST use React, Vite, Tailwind CSS / Custom CSS System, Supabase JS Client, and LocalStorage.

Why this exists:
- Provides a fast, modular frontend component architecture for interactive wellness tools.
- Enables friction-free instant guest access alongside secure cloud synchronization.
- Ensures type-safe state handling and clean maintainability for hackathon development and scaling.

Mandatory:
- Write modular React components (ES6+/JSX).
- Use custom React hooks (`useLocalStorage`, `useSupabaseSync`, `useBreathingTimer`) for state management.
- Integrate Supabase JS Client for Cloud Auth and PostgreSQL sync.
- Use CSS Variables / Tailwind CSS for responsive sea-themed styling.

Forbidden:
- Direct, unmanaged imperative DOM manipulations (`document.getElementById`) bypassing React state.
- Monolithic, single-file applications without modular component decomposition.
- Storing unencrypted sensitive credentials or API keys directly in source files.

Do this instead:
- Create modular components (`/components/MoodCheckIn`, `/components/BreathingVisualizer`, `/components/ValueTracker`, `/components/OtterMascot`).
- Isolate state & storage logic inside dedicated hooks (`/hooks`) and service files (`/services`).

---

# 2) Separation of Concerns Rule

Structure (JSX), Presentation (CSS/Tailwind), Business Logic (Hooks), and Data Services (Supabase/Storage) MUST remain strictly separated.

Why this exists:
- Prevents spaghetti code where API logic, UI rendering, and state mutations are tangled.
- Makes testing and debugging specific wellness tools straightforward.
- Ensures clean code readability and modular reuse.

Mandatory:
- React components define the JSX structure and UI component trees.
- CSS Custom Properties and Tailwind handle visual presentation, sea themes, and animations.
- Custom Hooks encapsulate state management and user interactions.
- Service modules (`/services/supabase.js`, `/services/storage.js`) handle data persistence and API calls.

Forbidden:
- Embedding raw API fetch logic directly inside UI render blocks.
- Inline styles (`style={{ color: 'red' }}`) unless dynamically computed (e.g., breathing scale timers).
- Complex state mutations directly inside JSX event handlers.

Do this instead:
- Handle interactions via custom hooks and helper functions, triggering explicit state updates that re-render components cleanly.

---

# 3) Mobile-First and Responsive Sea-Theme Rule

All designs MUST be implemented mobile-first for sea-themed layouts and interactive components.

Why this exists:
- Users engage with mental health check-ins and breathing visualizers across mobile phones, tablets, and desktop displays.
- Mobile-first layouts ensure fluid responsiveness on small screens before scaling up.

Mandatory:
- Base CSS rules and layouts target small mobile screens first.
- Use responsive CSS Grid / Flexbox and `min-width` media queries for desktop layouts.
- Use fluid units (`clamp()`, `rem`, `vw`, `%`) for typography, breathing visualizers, and card grids.

Forbidden:
- Fixed pixel container dimensions causing horizontal scrolling on mobile screens.
- Desktop-only interactive visualizers that break on touch devices.

Do this instead:
- Utilize fluid containers (`w-full max-w-4xl mx-auto`), flexible CSS Grid grids, and responsive SVG visualizers.

---

# 4) Accessibility (a11y) & Calm UX Rule

The application MUST be fully accessible to all users, including those using screen readers or keyboard navigation, with empathetic, calming interactions.

Why this exists:
- Health and mental wellness applications must be inclusive, soothing, and accessible to everyone.
- Good accessibility improves overall usability and user trust.

Mandatory:
- Use semantic HTML tags (`<header>`, `<main>`, `<nav>`, `<article>`, `<section>`, `<button>`).
- All interactive elements MUST have visible focus states (`:focus-visible`).
- Interactive breathing controls, mood sliders, and soundscape toggles MUST include descriptive ARIA labels.
- Provide `.sr-only` utility text for screen readers (e.g., Sisu the Otter mascot status updates).

Forbidden:
- Using non-interactive elements (`<div>`, `<span>`) as clickable buttons without `role="button"` and `tabindex="0"`.
- Removing focus outlines without an explicit accessible fallback.
- Auto-playing loud audio soundscapes without explicit user consent and volume mute controls.

Do this instead:
- Use native `<button>` elements, provide screen-reader announcements, and allow complete keyboard navigation using `Tab` and `Enter/Space`.

---

# 5) State Management & Dual Persistence Rule

Client-side state MUST be persisted locally (Instant Guest Access) and synchronized with Supabase Cloud DB when authenticated.

Why this exists:
- Users expect instant, friction-free access to check in their emotions and practice breathing without forced login.
- When logged in, user data (mood logs, core value entries, resource progress, streaks) must sync seamlessly across devices.

Mandatory:
- Maintain an offline-first local state using `localStorage` for Guest mode.
- Synchronize local state with Supabase Database when user logs in via Supabase Auth.
- Trigger optimistic UI updates so user interactions feel instantaneous.

Forbidden:
- Losing user check-ins or value progress upon page refresh in Guest mode.
- Failing silently if offline or if Supabase database sync fails.

Do this instead:
- Use a central state management pattern (Custom React Context or Zustand/Hook state), save to `localStorage`, and push to Supabase in the background.

---

# 6) Performance & Soothing Asset Rule

Audio soundscapes, otter mascot vector graphics, and breathing visualizer animations MUST be optimized for fluid, instant performance.

Why this exists:
- Laggy animations or broken audio playback destroy the calming effect of breathing exercises.
- Heavy unoptimized assets cause slow load times and poor user retention.

Mandatory:
- Use compressed vector SVG assets or optimized WebP images for Sisu the Otter mascot expressions.
- Compress ambient sea soundscapes (WebM/MP3 formats) and lazy-load audio assets on demand.
- Use hardware-accelerated CSS properties (`transform`, `opacity`) for smooth 60fps breathing visualizer animations.

Forbidden:
- Uncompressed multi-megabyte image or audio files.
- Triggering layout thrashing or main-thread freezing during breathing visualizer timers.

Do this instead:
- Pre-render SVG visualizers, use `requestAnimationFrame` or CSS keyframes for animations, and reserve space using `aspect-ratio` to prevent cumulative layout shifts.

---

# 7) Design Consistency & Sisu Sea-Themed Identity Rule

The UI MUST maintain the soothing aquatic aesthetic of the Sisu brand with Sisu the Otter mascot integration.

Why this exists:
- Sisu offers a safe, soothing digital sanctuary; visual harmony reinforces tranquility and user trust.
- The mascot Sisu the Otter provides friendly, Duolingo-style emotional encouragement throughout the user journey.

Mandatory:
- Stick strictly to defined CSS Custom Properties for the Sisu Sea Palette:
  - Deep Ocean Slate: `--color-bg-deep` (`#0F172A`), `--color-card-bg` (`#1E293B`)
  - Seafoam Teal: `--color-primary-teal` (`#14B8A6`), `--color-accent-teal` (`#0D9488`)
  - Warm Sand Neutral: `--color-sand-light` (`#FEF3C7`), `--color-sand-accent` (`#FDE68A`)
  - Soft Coral Accent: `--color-coral` (`#F43F5E`)
- Typography stack: `Playfair Display` for headings and milestones; `Manrope`/`Inter` for body copy and resource guides.
- Display Sisu the Otter with dynamic expressions (Joyful, Breathing, Caring, Thoughtful, Milestone Celebration).

Forbidden:
- Introducing generic jarring colors (harsh `#F00`, `#00F`) outside the brand palette.
- Default browser form controls or cold clinical UI styling.

Do this instead:
- Reference CSS variables (`var(--color-primary-teal)`) for all styling, use rounded organic cards (`rounded-2xl`), subtle hover transitions (`transition-all duration-300 ease-in-out`), and soft floating wave visualizers.

---

# Final Principle

Prefer empathy, clarity, simplicity, and semantic correctness over clever hacks. Write code that you and others can easily read, maintain, and expand. Every change MUST improve user well-being, accessibility, or visual/emotional fidelity of Sisu. If it does not, it MUST be revised.

