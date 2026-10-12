# Design Session: Rediseño Hero Principal

## Feature: Hero / Main Layout Redesign
**Description**: Rediseño de la página de inicio para utilizar la imagen `portada.png` como fondo a pantalla completa (full-bleed), incluyendo el espacio detrás del menú superior (Header). El estilo estará enfocado en minimalismo, accesibilidad y adaptación mobile-first, manteniendo los textos principales existentes y eliminando secciones extra para centrarse en la experiencia inmersiva.

### 1. HTML Structure & Semantics
*   `<main>`: Se modificará el contenedor principal para que no restrinja el hero a un ancho máximo en su parte superior.
*   `<header>`: El header deberá tener un fondo transparente (o translúcido) para permitir que la imagen `portada.png` se vea a través de él, pasando a estar posicionado en `relative` o `absolute` sobre el Hero.
*   `<div>` (Hero Wrapper): Contenedor de ancho y alto completo (`w-full`, `min-h-screen` o proporción adecuada) con la imagen de fondo.
*   `<h1>` / `<p>`: Textos centrados: "Find Your Inner Calm, One Wave at a Time".
*   `<button>`: Call to action principal estilo "Get started" para iniciar el Mood Check-In.

### 2. CSS Architecture & Layout Strategy
*   **Layout**: Flexbox para centrar vertical y horizontalmente los textos dentro del contenedor del Hero.
*   **Background Setup**: 
    *   La imagen `portada.png` usará `background-size: cover` y `background-position: center top`.
    *   **Efecto de fundido**: Un `mask-image: linear-gradient(to bottom, black, transparent)` o un `div` absoluto con gradiente (ej. `bg-gradient-to-b from-transparent to-white`) en la parte inferior para que la imagen se funda suavemente con el fondo claro o blanco del resto de la página.
*   **Mobile-First Strategy**:
    *   Padding vertical reducido en pantallas pequeñas.
    *   Fuentes usando `text-4xl` en móvil y escalando a `md:text-6xl` en pantallas grandes.
*   **Header Adjustments**: Modificar el Header para que en lugar de ocupar espacio estricto, flote por encima del layout base o el layout empiece en `top-0` absoluto.

### 3. JavaScript Logic & State Management
*   **State**: Solo el manejo normal de las pestañas (`setActiveTab`) manejado por React en `App.jsx`.
*   **Events**: Click en el botón CTA debe invocar `setActiveTab('checkin')`.
*   **Data Flow**: Sin cambios, la lógica reside en los Hooks existentes.

### 4. Accessibility Requirements (a11y)
*   [x] Proper ARIA labels en los botones.
*   [x] Keyboard navigation & Focus states (`:focus-visible`).
*   [x] Color contrast compliance: Los textos ("Find your inner calm") deberán probablemente ser oscuros (`text-slate-900` o `bluey-950`) ya que la parte superior de la imagen suele ser el cielo claro, o aplicar una ligerísima sombra de texto (`drop-shadow`) para garantizar legibilidad.

### 5. Performance Considerations
*   [x] Asset optimization: Asegurar que `portada.png` esté comprimida (aunque la dejaremos tal cual de momento al ser provista por el usuario, en prod sería WebP).
*   [x] Avoiding layout shifts (CLS): Asegurar que el contenedor del hero tenga un `min-height` definido.
