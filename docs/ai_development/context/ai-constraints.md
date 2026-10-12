# AI Context Constraints

- The project runs with Vite as the primary development server (`npm run dev`).
- React (ES6+/JSX) is the primary component runtime with modular architecture.
- Keep UI components thin and side-effect free; delegate side effects to custom hooks (`/hooks`) and service adapters (`/services`).
- Place domain behavior, storage serialization, and API calls in `/services` modules (`supabase.js`, `storage.js`).
- Preserve deterministic app composition and context state providers in `src/context/` (`AuthContext.jsx`, `WellnessContext.jsx`).
- Prefer explicit imports and stable module boundaries across components, hooks, and services.
- Adhere strictly to the Sisu Sea-Themed CSS Custom Properties and a11y focus states defined in `golden-rules.md`.
- Ensure Instant Guest Access via `localStorage` is maintained alongside Supabase Auth sync.

