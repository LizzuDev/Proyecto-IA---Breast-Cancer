# Design Session: Mood Check-In Redesign

## Feature: Check-In Diary Redesign
**Description**: Transform the current MoodCheckIn component into an organic, interactive "diary" interface. The layout will move away from standard rigid forms to a fluid, glassmorphism-inspired design. It will prioritize mobile-first responsiveness, rigorous accessibility (a11y) standards, and seamlessly integrate SVGs to feel elegant, natural, and calming.

### 1. HTML Structure & Semantics
*   `<section aria-label="Sisu Gratitude Diary">`: The root container, designed to behave like an immersive journal.
*   `<header>`: Instead of basic text headers, this will interlace the `diariodegratitudmarina.svg` dynamically, creating a book-like title area.
*   `<article>`: Forms the "pages" of the diary.
*   `<fieldset>` and `<legend>`: For grouping interactive controls (Mood selection, Energy level) to guarantee screen-reader clarity.

### 2. CSS Architecture & Layout Strategy
*   **Mobile-First Methodology**: 
    * The base design starts on small screens as a vertical scroll of smooth, translucent cards stacked like a beautiful single-page diary entry.
    * Uses `flex-col` natively, with generous vertical rhythm (`space-y-6` or `gap-8`) to give elements room to breathe.
*   **Fully Responsive Expansion (Tablet & Desktop)**: 
    * `sm:`, `md:`, and `lg:` breakpoints will progressively convert the stack into a rich, two-column layout resembling an "open book" or horizontal spread using CSS Grid (`grid-cols-1 lg:grid-cols-2`).
    * On large screens, the journal graphic and mascot can occupy the left "page", while the interactive form anchors the right "page".
*   **Styling & Sisu Palette**:
    * **Opacities & Depth**: Replace solid block colors with translucent overlays (`bg-white/40`, `bg-lagoon-900/30`, `backdrop-blur-xl`) resting on soft, ambient gradients (Seafoam, Sand Light, and Ocean Slate).
    * **Fluidity & Organic Shapes**: Soft, heavy rounded corners (`rounded-[2rem]` or `rounded-[3rem]`) to avoid harsh edges.
    * **Typography**: Elegant serifs (`font-display` / Playfair) for headings and quotes; highly legible sans-serifs (`Manrope` / `Inter`) for functional UI text and tags.

### 3. JavaScript Logic & State Management
*   **State**: Preserve existing state (`selectedMood`, `energyLevel`, `selectedTags`, `reflection`, `submitted`) to ensure seamless integration with `useWellness`.
*   **Interaction**: Emphasize micro-interactions. Ensure state changes (like selecting a mood) trigger soft, CSS-based micro-animations (e.g., subtle scaling or glow) rather than abrupt changes.

### 4. Accessibility Requirements (a11y) [CRITICAL]
*   **Screen Readers**: Every interactive element (SVG buttons, drag sliders, tag toggles) MUST have descriptive `aria-label` or `aria-pressed` states. Wrap radio-button-like behavior in `role="radiogroup"`.
*   **Keyboard Navigation**: Full `Tab` support. Remove default browser outlines and replace them with custom, elegant focus rings (`focus-visible:ring-2 focus-visible:ring-lagoon-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent`).
*   **Color Contrast**: Ensure text placed over translucent backgrounds meets WCAG AA standards. When using `bg-white/40`, text must be a deep `lagoon-900` or `lagoon-950`.
*   **Reduced Motion**: Add `@media (prefers-reduced-motion)` fallbacks for any page-turn or SVG animations to respect user system preferences.

### 5. Performance & Asset Integration
*   **SVG Integration**: Flourishes (`SeaweedFlourish`, `ShellFlourish`, and `diariodegratitudmarina.svg`) will be positioned absolutely (`absolute z-0 opacity-20`) behind the frosted glass cards to create depth without blocking interactions.
*   **CSS Performance**: Heavy use of GPU-accelerated properties (`transform`, `opacity`) for animations rather than animating layout properties like `margin` or `width`.
