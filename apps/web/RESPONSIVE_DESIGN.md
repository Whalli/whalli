# Responsive Design - Mobile Implementation

## Vue d'ensemble

Le système Whalli est maintenant **entièrement responsive** avec une approche mobile-first. Les sidebars s'adaptent intelligemment à la taille de l'écran.

## Breakpoints

```
Mobile:  < 1024px (lg breakpoint)
Desktop: ≥ 1024px
```

## Comportement par Appareil

### 📱 Mobile (< 1024px)

#### Bouton Toggle Unique
- **Position**: Fixe en haut à gauche (top-4 left-4)
- **Z-index**: 60 (au-dessus de tout)
- **Action**: Contrôle LES DEUX sidebars simultanément
- **Icons**: Menu (fermé) / X (ouvert)
- **Comportement**: Un seul click ouvre/ferme les deux sidebars ensemble

#### Sidebar Principale ET Secondaire (s'ouvrent ensemble)
- **État par défaut**: Les deux cachées (translate-x-full)
- **Activation**: UN SEUL bouton hamburger (top-left)
- **Position**: Fixed, overlay côte-à-côte
  - Primary: left-0 (80px, z-index: 50)
  - Secondary: left-20 (256px, z-index: 40, à côté de la primary)
- **Animation**: Slide-in simultané depuis la gauche (300ms)
- **Fermeture**: 
  - Click sur overlay
  - Click sur lien de navigation
  - Click sur bouton X
  - Les deux se ferment ENSEMBLE

#### Overlay/Backdrop
- **Background**: `bg-black/50` (semi-transparent)
- **Z-index**: 40 (entre sidebars et boutons)
- **Animation**: Fade-in (300ms)
- **Click**: Ferme toutes les sidebars

#### Bouton Toggle (UN SEUL)
- **Position**: Fixed, coin supérieur gauche
- **Coordonnées**: `top-4 left-4` (z-index: 60)
- **Style**: SOBRE - Pas de background, juste icône + hover
- **Couleur**: `text-foreground/70` → `text-foreground` au hover
- **Icon**: Menu (☰) seulement
- **Visibilité**: Disparaît quand sidebars ouvertes
- **Action**: Ouvre les DEUX sidebars ensemble

#### Bouton Fermeture (dans sidebar)
- **Position**: En haut de la sidebar primary
- **Style**: SOBRE - Icône X sans background
- **Visibilité**: Apparaît seulement sur mobile quand sidebars ouvertes
- **Action**: Ferme les DEUX sidebars

#### Contenu Principal
- **Padding top**: `pt-20` (espace pour boutons)
- **Padding horizontal**: `px-4`
- **Margin**: `ml-0` (pleine largeur)

### 🖥️ Desktop (≥ 1024px)

#### Sidebar Principale
- **État**: Toujours visible
- **Position**: Fixed left-0
- **Largeur**: 80px (DualSidebar) ou 256px (MainLayout)
- **Animation**: Aucune
- **Tooltips**: Visibles au survol

#### Sidebar Secondaire
- **État**: Visible si `showSecondarySidebar={true}`
- **Position**: Fixed left-20 (à droite de la primaire)
- **Largeur**: 256px
- **Animation**: Aucune

#### Boutons Toggle
- **Visibilité**: Cachés (`lg:hidden`)

#### Overlay
- **Visibilité**: Jamais affiché (`lg:hidden`)

#### Contenu Principal
- **Margin left**: 
  - Sans secondary: `lg:ml-20` (80px) ou `lg:ml-64` (256px MainLayout)
  - Avec secondary: `lg:ml-[336px]` (80px + 256px)
- **Padding top**: `lg:pt-0` (pas de boutons)
- **Transition**: Smooth sur margin (300ms)

## Implémentation

### DualSidebarLayout

```tsx
// État unique pour les deux sidebars
const [areSidebarsOpen, setAreSidebarsOpen] = useState(false);

// Fonction de toggle
const toggleSidebars = () => {
  setAreSidebarsOpen(!areSidebarsOpen);
};

// Fonction de fermeture
const closeSidebars = () => {
  setAreSidebarsOpen(false);
};

// Bouton sobre - disparaît quand ouvert
{!areSidebarsOpen && (
  <button
    onClick={toggleSidebars}
    className="lg:hidden fixed top-4 left-4 z-[60] p-2.5 text-foreground/70 hover:text-foreground transition-colors"
  >
    <Menu className="h-6 w-6" />
  </button>
)}

// Bouton X dans la sidebar
{areSidebarsOpen && (
  <button
    onClick={closeSidebars}
    className="lg:hidden mb-4 p-2 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
  >
    <X className="h-6 w-6" />
  </button>
)}

// Overlay
{areSidebarsOpen && (
  <div
    className="lg:hidden fixed inset-0 bg-black/50 z-40"
    onClick={closeSidebars}
  />
)}

// Primary Sidebar
<aside className={`
  fixed left-0 ... z-50
  transition-transform duration-300
  lg:translate-x-0
  ${areSidebarsOpen ? 'translate-x-0' : '-translate-x-full'}
`}>

// Secondary Sidebar (à côté de la primary)
<aside className={`
  fixed top-0 ... z-40
  lg:left-20 lg:translate-x-0
  ${areSidebarsOpen ? 'left-20 translate-x-0' : 'left-0 -translate-x-full lg:translate-x-0'}
`}>
```

### MainLayout

```tsx
// État
const [isSidebarOpen, setIsSidebarOpen] = useState(false);

// Bouton
<button
  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
  className="lg:hidden fixed top-4 left-4 z-50 ..."
>

// Sidebar
<aside className={cn(
  "fixed ... transition-transform duration-300",
  "lg:translate-x-0",
  isSidebarOpen ? "translate-x-0" : "-translate-x-full"
)}>

// Contenu
<main className="pt-20 lg:pt-0 lg:pl-64">
```

## Classes Tailwind Clés

### Responsive Utilities

```css
/* Hidden on mobile, visible on desktop */
lg:hidden    /* Caché sur desktop */
hidden lg:block  /* Visible uniquement desktop */

/* Transform animations */
-translate-x-full   /* Hors écran gauche */
translate-x-0       /* Position normale */
lg:translate-x-0    /* Normal sur desktop */

/* Margin/Padding responsive */
pt-20 lg:pt-0       /* Padding top mobile only */
ml-0 lg:ml-20       /* Margin left desktop only */

/* Z-index layers */
z-[60]  /* Boutons toggle */
z-50    /* Sidebar principale */
z-40    /* Overlay + Sidebar secondaire */
```

### Animation Classes

```css
transition-transform duration-300 ease-in-out
transition-all duration-300
animate-fade-in
```

## Structure HTML Mobile

```html
<!-- Mobile -->
<div class="min-h-screen">
  <!-- Bouton Primary (visible mobile) -->
  <button class="lg:hidden fixed top-4 left-4 z-[60]">
    Menu
  </button>

  <!-- Bouton Secondary (visible mobile si applicable) -->
  <button class="lg:hidden fixed top-4 right-4 z-[60]">
    Menu
  </button>

  <!-- Overlay (visible mobile si sidebar ouverte) -->
  <div class="lg:hidden fixed inset-0 bg-black/50 z-40" />

  <!-- Sidebar Primary (overlay mobile) -->
  <aside class="fixed ... z-50 lg:translate-x-0 -translate-x-full">
    ...
  </aside>

  <!-- Sidebar Secondary (overlay mobile) -->
  <aside class="fixed ... z-40 lg:translate-x-0 -translate-x-full">
    ...
  </aside>

  <!-- Contenu (pleine largeur mobile) -->
  <main class="pt-20 lg:pt-0 lg:ml-[336px]">
    ...
  </main>
</div>
```

## UX Flow Mobile

### Scénario 1: Ouvrir les Sidebars

```
1. User: Tap bouton hamburger sobre (☰) en haut à gauche
2. State: areSidebarsOpen = true
3. UI: 
   - Bouton hamburger disparaît
   - Overlay appears (fade-in)
   - Primary sidebar slides in depuis la gauche (left-0)
   - Secondary sidebar slides in simultanément (left-20, à côté)
   - Les deux sont visibles côte-à-côte
   - Bouton X sobre apparaît dans la sidebar
```

### Scénario 2: Fermer avec X ou Overlay

```
1. User: Tap sur X dans sidebar OU sur overlay (zone noire)
2. State: areSidebarsOpen = false
3. UI:
   - Bouton X dans sidebar disparaît
   - Les deux sidebars slides out ensemble
   - Overlay fades out
   - Bouton hamburger sobre (☰) réapparaît en haut à gauche
```

### Scénario 3: Navigation

```
1. User: Sidebars ouvertes, click sur lien navigation
2. State: areSidebarsOpen = false (auto-close)
3. UI:
   - Les deux sidebars ferment simultanément
   - Overlay disparaît
   - Navigation vers nouvelle page
```

## Gestion d'État

### DualSidebarLayout

```typescript
// UN SEUL état pour les deux sidebars
const [areSidebarsOpen, setAreSidebarsOpen] = useState(false);

// Toggle les deux ensemble
const toggleSidebars = () => {
  setAreSidebarsOpen(!areSidebarsOpen);
};

// Ferme les deux ensemble
const closeSidebars = () => {
  setAreSidebarsOpen(false);
};

// Overlay click - ferme tout
onClick={closeSidebars}

// Navigation click - ferme tout
onClick={() => {
  closeSidebars();
  // Navigate...
}}
```

### MainLayout

```typescript
const [isSidebarOpen, setIsSidebarOpen] = useState(false);

// Toggle
onClick={() => setIsSidebarOpen(!isSidebarOpen)}

// Close on navigation
onClick={() => setIsSidebarOpen(false)}

// Close on overlay
onClick={() => setIsSidebarOpen(false)}
```

## Optimisations Performance

### Transition CSS

```css
/* Utilise transform au lieu de left/right */
/* GPU-accelerated, plus performant */
transform: translateX(-100%);  /* Caché */
transform: translateX(0);       /* Visible */
```

### Conditional Rendering

```tsx
{/* Overlay seulement si sidebar ouverte */}
{isSidebarOpen && <Overlay />}

{/* Bouton secondary seulement si applicable */}
{showSecondarySidebar && <Button />}
```

## Accessibilité Mobile

### Aria Labels

```tsx
aria-label="Toggle menu"
aria-label="Toggle secondary menu"
aria-hidden="true"  // Sur overlay
```

### Touch Targets

- **Minimum**: 44x44 pixels (Apple HIG)
- **Implémenté**: `p-2.5` = 40px + padding = ~48px ✅

### Focus Management

```tsx
// Auto-focus au toggle (future enhancement)
useEffect(() => {
  if (isSidebarOpen) {
    firstLinkRef.current?.focus();
  }
}, [isSidebarOpen]);
```

## Tests Recommandés

### Breakpoints à Tester

- ✅ 375px (iPhone SE)
- ✅ 390px (iPhone 12/13/14)
- ✅ 428px (iPhone Pro Max)
- ✅ 768px (iPad portrait)
- ✅ 1024px (iPad landscape)
- ✅ 1280px (Desktop petit)
- ✅ 1920px (Desktop large)

### Scénarios de Test

1. **Ouvrir/Fermer Primary**
   - Bouton toggle fonctionne
   - Animation smooth
   - Overlay apparaît/disparaît

2. **Ouvrir/Fermer Secondary**
   - Bouton indépendant
   - Pas de conflit avec primary
   - Fermeture sur overlay

3. **Navigation**
   - Click sur lien ferme sidebar
   - Navigation fonctionnelle
   - URL mise à jour

4. **Resize Window**
   - Desktop → Mobile : Boutons apparaissent
   - Mobile → Desktop : Sidebars permanentes

5. **Touch Gestures**
   - Tap outside ferme
   - Pas de scroll body quand sidebar ouverte
   - Smooth scrolling sidebar content

## Améliorations Futures

### Phase 1 (Court terme)
- [ ] Swipe gesture pour ouvrir/fermer
- [ ] Animation spring plus naturelle
- [ ] Lock body scroll quand sidebar ouverte
- [ ] Persistent state (localStorage)

### Phase 2 (Moyen terme)
- [ ] Sidebar width customizable
- [ ] Slide-over direction configurable
- [ ] Keyboard shortcuts (Escape to close)
- [ ] Focus trap dans sidebar

### Phase 3 (Long terme)
- [ ] Gesture recognizer avancé
- [ ] Sidebar partielle (peek)
- [ ] Multi-touch support
- [ ] Haptic feedback

## Debugging

### Common Issues

**Sidebars ne s'ouvrent pas**
- Vérifier `lg:hidden` sur bouton toggle
- Vérifier z-index hierarchy
- Vérifier `areSidebarsOpen` state
- Vérifier que les deux sidebars utilisent le même état

**Overlay ne ferme pas les sidebars**
- Vérifier onClick handler appelle `closeSidebars`
- Vérifier z-index overlay < boutons
- Vérifier state update `setAreSidebarsOpen(false)`

**Une seule sidebar s'ouvre**
- Vérifier que les deux sidebars utilisent `areSidebarsOpen`
- Pas de `isPrimaryOpen` ou `isSecondaryOpen` séparés

**Content pas visible**
- Vérifier `pt-20` sur mobile
- Vérifier z-index content < sidebars
- Vérifier overflow

**Transition saccadée**
- Utiliser `transform` pas `left/right`
- Vérifier `will-change` CSS
- Éviter layout shifts

---

**Status**: ✅ Implémenté et Testé  
**Tested On**: Chrome DevTools, Safari iOS Simulator  
**Browser Support**: Modern browsers (Chrome, Safari, Firefox, Edge)  
**Version**: 1.1.0  
**Date**: Janvier 2024
