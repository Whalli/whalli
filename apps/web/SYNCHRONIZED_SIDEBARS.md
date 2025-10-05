# Sidebars Synchronisées - Comportement Mobile

## 📱 Vue d'ensemble

Les deux sidebars (primary navigation + secondary contextual) s'ouvrent et se ferment **ENSEMBLE** sur mobile avec un **seul bouton**.

## 🎯 Comportement

### Desktop (≥ 1024px)
```
┌──────┬─────────────┬────────────────────────┐
│ NAV  │  CONTEXT    │      CONTENU          │
│ 80px │   256px     │       Flexible        │
│      │             │                       │
│ 💬   │  Pinned     │    Page Content       │
│ ✓    │  Recent     │                       │
│ 📁   │             │                       │
└──────┴─────────────┴────────────────────────┘
     Toujours visibles, pas de boutons
```

### Mobile (< 1024px) - État Fermé
```
┌────────────────────────────────────────────┐
│  ☰                                         │ ← Bouton SOBRE (pas de bg)
│                                            │
│                                            │
│          CONTENU PLEINE LARGEUR           │
│                                            │
│                                            │
└────────────────────────────────────────────┘
       Les deux sidebars sont cachées
       Bouton discret: text-foreground/70
```

### Mobile (< 1024px) - État Ouvert
```
     ╔════════╦═══════════════════════════╗
     ║        │   [OVERLAY NOIR 50%]      ║
     ║ ┌──┬───┴─────┐                     ║
     ║ │✕ │ CONTEXT │                     ║ ← X sobre dans sidebar
     ║ │W │  256px  │     CONTENU         ║
     ║ │  │         │     (derrière)      ║
     ║ │💬│ Pinned  │                     ║
     ║ │✓ │ Recent  │                     ║
     ║ │📁│         │                     ║
     ║ │  │         │                     ║
     ║ └──┴─────────┘                     ║
     ║  80px                              ║
     ╚════════════════════════════════════╝
    Bouton ☰ a disparu, X sobre en haut de sidebar
    Click X ou overlay → ferme tout
```

## 🔧 Implémentation

### État Unique
```typescript
// UN SEUL état pour contrôler les deux sidebars
const [areSidebarsOpen, setAreSidebarsOpen] = useState(false);
```

### Toggle
```typescript
const toggleSidebars = () => {
  setAreSidebarsOpen(!areSidebarsOpen);
};
```

### Fermeture
```typescript
const closeSidebars = () => {
  setAreSidebarsOpen(false);
};
```

### Bouton Hamburger (sobre, disparaît)
```tsx
// N'apparaît QUE quand fermé
{!areSidebarsOpen && (
  <button
    onClick={toggleSidebars}
    className="lg:hidden fixed top-4 left-4 z-[60] p-2.5 text-foreground/70 hover:text-foreground transition-colors"
  >
    <Menu className="h-6 w-6" />
  </button>
)}
```

### Bouton Fermeture (sobre, dans sidebar)
```tsx
// Dans la sidebar primary
{areSidebarsOpen && (
  <button
    onClick={closeSidebars}
    className="lg:hidden mb-4 p-2 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
  >
    <X className="h-6 w-6" />
  </button>
)}
```

### Overlay
```tsx
{areSidebarsOpen && (
  <div
    className="lg:hidden fixed inset-0 bg-black/50 z-40"
    onClick={closeSidebars}
  />
)}
```

### Primary Sidebar
```tsx
<aside className={`
  fixed left-0 top-0 z-50 w-20
  lg:translate-x-0
  ${areSidebarsOpen ? 'translate-x-0' : '-translate-x-full'}
`}>
```

### Secondary Sidebar
```tsx
<aside className={`
  fixed top-0 z-40 w-64
  lg:left-20 lg:translate-x-0
  ${areSidebarsOpen ? 'left-20 translate-x-0' : '-translate-x-full'}
`}>
```

## 🎬 Animations

### Ouverture (300ms)
1. User tap sur ☰ sobre
2. Bouton ☰ disparaît immédiatement
3. État: `areSidebarsOpen = true`
4. Overlay fade-in (opacity 0 → 50%)
5. Primary sidebar glisse: `translateX(-100%) → translateX(0)` à left-0
6. Secondary sidebar glisse: `translateX(-100%) → translateX(0)` à left-20
7. Bouton ✕ sobre apparaît en haut de la sidebar
8. Résultat: Les deux côte-à-côte en overlay

### Fermeture (300ms)
1. User tap sur ✕ sobre dans sidebar OU sur overlay
2. État: `areSidebarsOpen = false`
3. Bouton ✕ disparaît
4. Les deux sidebars glissent: `translateX(0) → translateX(-100%)`
5. Overlay fade-out (opacity 50% → 0)
6. Bouton ☰ sobre réapparaît en haut à gauche

## ✅ Avantages

1. **Simplicité**: Un seul bouton, comportement clair
2. **Design sobre**: Pas de background, juste icône discrète
3. **UX cohérente**: Les deux sidebars forment un tout
4. **Interface propre**: Bouton disparaît quand pas nécessaire
5. **Performance**: Un seul état, un seul re-render
6. **Visibilité**: Les deux sidebars visibles ensemble (navigation + contexte)
7. **Code propre**: Moins de logique conditionnelle

## 📊 Comparaison

### Avant (v1.0) - Deux boutons indépendants
```
❌ Deux boutons (gauche + droite)
❌ Deux états séparés (isPrimaryOpen, isSecondaryOpen)
❌ Peut ouvrir l'un sans l'autre
❌ Plus de logique de gestion
❌ UX confuse (quel bouton pour quoi?)
```

### Maintenant (v1.1) - Synchronisé
```
✅ UN SEUL bouton (gauche)
✅ UN SEUL état (areSidebarsOpen)
✅ Ouvre/ferme LES DEUX ensemble
✅ Logique simplifiée
✅ UX claire (menu = tout s'ouvre)
```

## 🎯 Cas d'Usage

### Scénario 1: Consultation
```
User est sur /chat (mobile)
├─ Tap ☰
├─ Les deux sidebars apparaissent
├─ Voit navigation (💬✓📁) + historique chats
├─ Peut naviguer ou choisir chat
└─ Tap overlay pour fermer
```

### Scénario 2: Navigation rapide
```
User est sur /tasks (mobile)
├─ Tap ☰
├─ Les deux sidebars apparaissent
├─ Voit navigation + filtres/stats tasks
├─ Tap 📁 pour aller vers projects
└─ Auto-ferme et navigue
```

### Scénario 3: Contexte complet
```
User est sur /projects (mobile)
├─ Tap ☰
├─ Les deux sidebars apparaissent
├─ Voit navigation + liste projets
├─ Peut filtrer, voir stats, choisir projet
└─ Tap sur projet dans liste contextuelle
```

## 🔬 Détails Techniques

### Z-index Hierarchy
```
z-60  → Bouton toggle (toujours accessible)
z-50  → Primary sidebar (navigation)
z-40  → Secondary sidebar + Overlay
```

### Positioning Mobile
```typescript
Primary Sidebar:
  - fixed left-0 top-0
  - width: 80px
  - transform: translateX(-100%) → translateX(0)

Secondary Sidebar:
  - fixed top-0
  - left: 0 (fermée) → left-20 (ouverte, à côté de primary)
  - width: 256px
  - transform: translateX(-100%) → translateX(0)
```

### Timing
```css
transition: transform 300ms ease-in-out
```

## 🧪 Testing Checklist

- [ ] Toggle button appears on mobile (<1024px)
- [ ] Both sidebars slide in together
- [ ] Primary at left-0 (80px)
- [ ] Secondary at left-20 (256px), next to primary
- [ ] Overlay appears behind sidebars
- [ ] Click overlay closes both
- [ ] Click X button closes both
- [ ] Click nav link closes both + navigates
- [ ] Smooth 300ms animations
- [ ] Desktop: button hidden, sidebars always visible

## 📝 Notes

- **Design inspiré de**: Apps mobiles modernes (Slack, Discord)
- **Philosophie**: Menu = accès complet (navigation + contexte)
- **Performance**: Un seul re-render au toggle
- **Accessibility**: ARIA labels, keyboard ESC (à implémenter)

---

**Version**: 1.1  
**Date**: Octobre 2025  
**Status**: ✅ Implémenté et Documenté
