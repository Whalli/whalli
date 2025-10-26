# Architecture des Sidebars - Whalli Web App

## Vue d'ensemble

L'application Whalli utilise un système de **deux sidebars** pour offrir une navigation intuitive et contextuelle :

1. **Primary Sidebar** (Sidebar principale) - Toujours visible, toujours rétractée (icônes uniquement)
2. **Context Sidebar** (Sidebar contextuelle) - Affiche le contenu contextuel selon la page

```
┌─────┬────────────┬──────────────────────┐
│ P   │  Context   │                      │
│ R   │  Sidebar   │   Main Content       │
│ I   │            │                      │
│ M   │  - Chats   │   Chat messages,     │
│ A   │  - Projects│   Project details,   │
│ R   │  - etc.    │   etc.               │
│ Y   │            │                      │
│     │            │                      │
└─────┴────────────┴──────────────────────┘
 64px     288px         Flexible
```

---

## 1. Primary Sidebar (Sidebar principale)

### Caractéristiques
- **Position** : Extrême gauche, fixe
- **Largeur** : Toujours 64px (w-16)
- **État** : Toujours rétractée (icônes seulement)
- **Contenu** : Navigation principale + profil utilisateur

### Navigation
Organisée en 3 sections :

#### Main
- 💬 **Chat** (`/chat`) - Conversations AI
- 📋 **Projects** (`/projects`) - Gestion de projets
- 🌿 **Mindmaps** (`/mindmaps`) - Cartes mentales

#### Tools
- 🎨 **Presets** (`/presets`) - Préréglages AI
- 🔍 **Search** (`/search`) - Recherche globale

#### System
- ⚙️ **Settings** (`/settings`) - Paramètres
- ❓ **Help** (`/help`) - Aide

### Profil utilisateur
- Avatar avec initiale
- Bouton de déconnexion
- Tooltips au hover

### Fichier
`apps/web/components/primary-sidebar.tsx`

---

## 2. Context Sidebar (Sidebar contextuelle)

### Caractéristiques
- **Position** : À gauche, après la Primary Sidebar
- **Largeur** : 288px (w-72) quand ouverte, 0px quand fermée
- **État** : Collapsible, auto-hide si aucun contenu
- **Contenu** : Dynamique selon la page

### Gestion du contenu
Le contenu est géré via le **PageContext** :

```tsx
// Dans une page
import { usePageWidgets } from '@/contexts/page-context';
import { ChatHistoryList } from '@/components/chat-history-list';

export default function ChatPage() {
  usePageWidgets([
    {
      id: 'chat-history',
      title: 'Conversations',
      content: <ChatHistoryList />,
    },
  ]);
  
  // ...
}
```

### Contenu par page

| Page | Contenu de la Context Sidebar |
|------|------------------------------|
| `/chat` | Liste des conversations avec bouton "New Chat" |
| `/chat/[id]` | Liste des conversations (même chose) |
| `/projects` | Liste des projets (placeholder) |
| `/mindmaps` | Liste des mindmaps (placeholder) |
| `/presets` | *(Vide pour l'instant)* |
| `/search` | *(Vide pour l'instant)* |
| `/settings` | *(Vide pour l'instant)* |
| `/help` | *(Vide pour l'instant)* |

### Fichiers
- `apps/web/components/context-sidebar.tsx` - Composant sidebar
- `apps/web/contexts/page-context.tsx` - Context provider
- `apps/web/components/chat-history-list.tsx` - Liste des chats
- `apps/web/components/project-list.tsx` - Liste des projets
- `apps/web/components/mindmap-list.tsx` - Liste des mindmaps

---

## 3. Raccourcis clavier

| Raccourci | Action |
|-----------|--------|
| `⌘B` / `Ctrl+B` | Toggle Context Sidebar (si contenu disponible) |

**Note** : Le raccourci `⌘.` pour une sidebar droite a été retiré car nous n'utilisons plus de sidebar à droite.

---

## 4. PageContext API

### Hook `usePageWidgets`

Permet de définir le contenu de la Context Sidebar pour une page :

```tsx
usePageWidgets([
  {
    id: 'unique-id',        // ID unique du widget
    title: 'Widget Title',  // Titre affiché dans le header
    content: <Component />, // Composant React à afficher
  },
]);
```

**Fonctionnalités** :
- Auto-cleanup au démontage du composant
- Supporte un seul widget par page (pour la Context Sidebar)
- Auto-show de la sidebar si contenu disponible

### Context Provider

Le `PageContextProvider` est déjà intégré dans `AppShell` :

```tsx
// apps/web/components/app-shell-v2.tsx
export function AppShell({ children }: AppShellProps) {
  return (
    <PageContextProvider>
      <AppShellContent>{children}</AppShellContent>
    </PageContextProvider>
  );
}
```

---

## 5. Composants de liste

### ChatHistoryList

**Fonctionnalités** :
- Affiche toutes les conversations de l'utilisateur
- Bouton "New Chat" en haut
- Highlight de la conversation active
- Navigation vers `/chat/[id]` au clic
- Affiche : titre, modèle, date de mise à jour
- Compteur de conversations en bas

**Fichier** : `apps/web/components/chat-history-list.tsx`

### ProjectList

**État** : Placeholder pour les projets futurs

**Fonctionnalités prévues** :
- Liste des projets
- Bouton "New Project"
- Navigation vers `/projects/[id]`

**Fichier** : `apps/web/components/project-list.tsx`

### MindmapList

**État** : Placeholder pour les mindmaps futurs

**Fonctionnalités prévues** :
- Liste des mindmaps
- Bouton "New Mindmap"
- Navigation vers `/mindmaps/[id]`

**Fichier** : `apps/web/components/mindmap-list.tsx`

---

## 6. Comportement responsive

### Desktop (> 1024px)
- Primary Sidebar : Toujours visible (64px)
- Context Sidebar : Collapsible (288px / 0px)
- Main Content : Flexible

### Mobile (< 1024px)
**TODO** : Implémentation à venir
- Primary Sidebar : Menu hamburger
- Context Sidebar : Full-width overlay ou drawer
- Main Content : Full-width

---

## 7. Styling

### Couleurs
- **Background sidebars** : `bg-zinc-900`
- **Borders** : `border-zinc-800`
- **Active item** : `bg-blue-600` avec `shadow-blue-600/20`
- **Hover** : `bg-zinc-800`

### Transitions
- **Sidebar collapse** : `transition-all duration-300`
- **Hover effects** : `transition-colors`

### Tooltips (Primary Sidebar)
```css
.group:hover .tooltip {
  opacity: 1;
}
```

---

## 8. Architecture des fichiers

```
apps/web/
├── components/
│   ├── app-shell-v2.tsx          # Layout principal
│   ├── primary-sidebar.tsx       # Navigation principale (icônes)
│   ├── context-sidebar.tsx       # Sidebar contextuelle
│   ├── chat-history-list.tsx     # Liste des conversations
│   ├── project-list.tsx          # Liste des projets
│   └── mindmap-list.tsx          # Liste des mindmaps
├── contexts/
│   └── page-context.tsx          # Context pour les widgets
└── app/(app)/
    ├── layout.tsx                # Layout avec AppShell
    ├── chat/
    │   ├── page.tsx              # Liste chats + Context Sidebar
    │   └── [id]/page.tsx         # Chat detail + Context Sidebar
    ├── projects/page.tsx         # Projects + Context Sidebar
    ├── mindmaps/page.tsx         # Mindmaps + Context Sidebar
    ├── presets/page.tsx          # Presets (pas de Context)
    ├── search/page.tsx           # Search (pas de Context)
    ├── settings/page.tsx         # Settings (pas de Context)
    └── help/page.tsx             # Help (pas de Context)
```

---

## 9. Exemples d'utilisation

### Ajouter du contenu contextuel à une nouvelle page

```tsx
'use client';

import { usePageWidgets } from '@/contexts/page-context';
import { MyCustomList } from '@/components/my-custom-list';

export default function MyPage() {
  // Définir le contenu de la Context Sidebar
  usePageWidgets([
    {
      id: 'my-list',
      title: 'My Items',
      content: <MyCustomList />,
    },
  ]);

  return (
    <div className="p-8">
      {/* Contenu principal de la page */}
    </div>
  );
}
```

### Créer un nouveau composant de liste

```tsx
'use client';

import { Plus } from 'lucide-react';

export function MyCustomList() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
          <Plus className="w-4 h-4" />
          <span>New Item</span>
        </button>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Items ici */}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800">
        <p className="text-xs text-zinc-600 text-center">
          0 items
        </p>
      </div>
    </div>
  );
}
```

---

## 10. TODO / Améliorations futures

### Court terme
- [ ] Implémenter le menu contextuel (3 dots) dans ChatHistoryList
  - Renommer la conversation
  - Supprimer la conversation
  - Dupliquer la conversation
- [ ] Ajouter les vraies listes pour Projects et Mindmaps
- [ ] Améliorer le responsive mobile

### Moyen terme
- [ ] Animations plus fluides (framer-motion)
- [ ] Drag & drop pour réorganiser les items
- [ ] Recherche/filtre dans les listes
- [ ] Raccourcis clavier pour navigation rapide (⌘1, ⌘2, etc.)

### Long terme
- [ ] Panels personnalisables (choisir quoi afficher)
- [ ] Multi-workspace support
- [ ] Thèmes de couleur personnalisables

---

## 11. Notes de conception

### Pourquoi une sidebar principale toujours rétractée ?
- **Gain d'espace** : Plus de place pour le contenu
- **Focus** : Moins de distractions visuelles
- **Moderne** : Design épuré et minimaliste
- **Tooltips** : Libellés au hover suffisent

### Pourquoi séparer Primary et Context Sidebars ?
- **Séparation des préoccupations** : Navigation vs. Contenu
- **Flexibilité** : La Context Sidebar peut être cachée si pas de contenu
- **UX** : Navigation toujours accessible, contexte additionnel optionnel

### Pourquoi PageContext ?
- **Découplage** : Les pages définissent leur propre contenu contextuel
- **Auto-cleanup** : Pas de contenu persistant entre les pages
- **Simplicité** : API simple avec `usePageWidgets`

---

## 12. Support et questions

Pour toute question ou bug, consulter :
- Cette documentation
- Le code source dans `apps/web/components/`
- Les exemples dans `apps/web/app/(app)/`

---

**Version** : 1.0  
**Date** : Octobre 2025  
**Auteur** : Whalli Development Team
