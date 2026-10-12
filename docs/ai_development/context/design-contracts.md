# Design Contracts

## Layering Rules
- Components (`/src/components`) may consume Custom Hooks (`/src/hooks`), Contexts (`/src/context`), and UI helper utilities only.
- Custom Hooks (`/src/hooks`) manage React state transitions and call Service modules (`/src/services`).
- Service modules (`/src/services`) interface directly with `localStorage` and Supabase JS Client API.
- Data schemas & types define structured contracts (MoodCheckIn, CoreValue, ValueLog, ResourceItem) without importing UI components.

## Determinism Rules
- App composition and global state providers are centralized in `src/context/` (`AuthContext.jsx`, `WellnessContext.jsx`).
- State mutations produce optimistic UI updates with immediate local storage serialization and background Supabase sync.
- Service functions must be pure in intent, returning explicit success/error results and clean data contracts.
- Otter mascot expressions respond deterministically to wellness state events (check-ins, breathing completions, value streak milestones).

