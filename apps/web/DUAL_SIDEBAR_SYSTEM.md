# Dual Sidebar System - Documentation

## Vue d'ensemble

Le système Whalli utilise maintenant une **architecture à deux sidebars** :

1. **Sidebar Principale** (Navigation) - Toujours visible, icônes verticales à gauche
2. **Sidebar Secondaire** (Contextuelle) - Apparaît selon le contexte (Chat, Tasks, Projects)

```
┌────┬─────────────┬────────────────────────────────┐
│    │             │                                │
│ N  │  CONTEXTUAL │                                │
│ A  │   SIDEBAR   │         MAIN CONTENT           │
│ V  │             │                                │
│    │  (Dynamic)  │                                │
│ I  │             │                                │
│ C  │  - Chats    │                                │
│ O  │  - Tasks    │                                │
│ N  │  - Projects │                                │
│    │             │                                │
│ 💬 │             │                                │
│ ✓  │             │                                │
│ 📁 │             │                                │
│    │             │                                │
│ 👤 │             │                                │
│    │             │                                │
└────┴─────────────┴────────────────────────────────┘
 80px    256px          Flexible width
```

## Composants

### 1. DualSidebarLayout (Principal)

**Fichier** : `src/components/layout/dual-sidebar-layout.tsx`

Composant de layout principal qui gère les deux sidebars.

**Props** :
```typescript
interface DualSidebarLayoutProps {
  children: ReactNode;              // Contenu principal
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  secondarySidebar?: ReactNode;     // Sidebar contextuelle
  showSecondarySidebar?: boolean;   // Afficher ou non la sidebar secondaire
}
```

**Usage** :
```tsx
import { DualSidebarLayout } from '@/components/layout';
import { ChatSecondarySidebar } from '@/components/layout';

<DualSidebarLayout
  user={user}
  showSecondarySidebar={true}
  secondarySidebar={<ChatSecondarySidebar chats={chats} />}
>
  {/* Votre contenu */}
</DualSidebarLayout>
```

**Caractéristiques** :
- Sidebar principale : 80px de largeur, fixe à gauche
- Sidebar secondaire : 256px de largeur, apparaît à droite de la principale
- Contenu principal : Décalage automatique selon la présence de la sidebar secondaire
- Navigation par icônes avec tooltips au survol
- Avatar utilisateur en bas de la sidebar principale

### 2. ChatSecondarySidebar

**Fichier** : `src/components/layout/chat-secondary-sidebar.tsx`

Sidebar contextuelle pour la page Chat.

**Props** :
```typescript
interface ChatSecondarySidebarProps {
  chats?: {
    id: string;
    title: string;
    isPinned?: boolean;
    lastMessage?: string;
    timestamp?: string;
  }[];
}
```

**Sections** :
- **Header** : Titre "Chats" + bouton "New chat" + recherche
- **Pinned** : Liste des chats épinglés avec icône pin
- **History** : Liste des chats récents avec icône historique

**Fonctionnalités** :
- Recherche de chats
- Séparation épinglés/récents
- Aperçu dernier message
- Timestamp relative
- Hover states

### 3. TasksSecondarySidebar

**Fichier** : `src/components/layout/tasks-secondary-sidebar.tsx`

Sidebar contextuelle pour la page Tasks.

**Props** :
```typescript
interface TasksSecondarySidebarProps {
  filters?: {
    status?: string;
    priority?: string;
  };
  onFilterChange?: (filters: any) => void;
  stats?: {
    todo: number;
    inProgress: number;
    completed: number;
  };
}
```

**Sections** :
- **Header** : Titre "Tasks" + bouton "New task"
- **Stats** : Compteurs To Do, In Progress, Completed avec icônes
- **Filters** : Filtres Status, Priority, Project
- **Quick Actions** : Raccourcis "My Tasks", "Assigned to Me", "Due Today", "Overdue"

**Fonctionnalités** :
- Stats temps réel
- Filtres multiples (status, priority, project)
- Actions rapides avec compteurs
- Badges urgents (rouge pour overdue)

### 4. ProjectsSecondarySidebar

**Fichier** : `src/components/layout/projects-secondary-sidebar.tsx`

Sidebar contextuelle pour la page Projects.

**Props** :
```typescript
interface ProjectsSecondarySidebarProps {
  projects?: {
    id: string;
    name: string;
    color: string;
    progress: number;
  }[];
  stats?: {
    total: number;
    active: number;
    archived: number;
  };
}
```

**Sections** :
- **Header** : Titre "Projects" + bouton "New project" + stats cards
- **Filters** : Filtres Status et Sort By
- **Project List** : Liste des projets avec couleurs et progress bars
- **Quick Stats** : Average Progress, Team Members, Active Tasks

**Fonctionnalités** :
- Stats cards (Total, Active, Archived)
- Liste projets avec couleurs custom
- Barres de progression
- Tri et filtres
- Quick stats en bas

## Implémentation par Page

### Page Chat (`/chat`)

```tsx
import { DualSidebarLayout, ChatSecondarySidebar } from '@/components/layout';

const mockChats = [
  { id: '1', title: 'Chat 1', isPinned: true, lastMessage: '...', timestamp: '2h ago' },
  // ...
];

export default function ChatPage() {
  return (
    <DualSidebarLayout
      user={user}
      showSecondarySidebar={true}
      secondarySidebar={<ChatSecondarySidebar chats={mockChats} />}
    >
      <ChatUI userId={userId} apiUrl="http://localhost:3001" />
    </DualSidebarLayout>
  );
}
```

### Page Tasks (`/tasks`)

```tsx
import { DualSidebarLayout, TasksSecondarySidebar } from '@/components/layout';

const taskStats = {
  todo: 5,
  inProgress: 3,
  completed: 8,
};

export default function TasksPage() {
  return (
    <DualSidebarLayout
      user={user}
      showSecondarySidebar={true}
      secondarySidebar={<TasksSecondarySidebar stats={taskStats} />}
    >
      {/* Task content */}
    </DualSidebarLayout>
  );
}
```

### Page Projects (`/projects`)

```tsx
import { DualSidebarLayout, ProjectsSecondarySidebar } from '@/components/layout';

const projectStats = { total: 4, active: 3, archived: 1 };
const projects = [
  { id: '1', name: 'Whalli Core', color: '#040069', progress: 67 },
  // ...
];

export default function ProjectsPage() {
  return (
    <DualSidebarLayout
      user={user}
      showSecondarySidebar={true}
      secondarySidebar={
        <ProjectsSecondarySidebar projects={projects} stats={projectStats} />
      }
    >
      {/* Project content */}
    </DualSidebarLayout>
  );
}
```

### Pages sans Sidebar Secondaire (`/`, `/profile`, `/settings`)

```tsx
import { DualSidebarLayout } from '@/components/layout';

export default function HomePage() {
  return (
    <DualSidebarLayout
      user={user}
      showSecondarySidebar={false}  // Pas de sidebar secondaire
    >
      {/* Content avec seulement la sidebar principale */}
    </DualSidebarLayout>
  );
}
```

## Styles et Thème

### Sidebar Principale (Navigation)
- **Largeur** : 80px (fixe)
- **Background** : `bg-sidebar` (#040069 - Deep Ocean)
- **Position** : `fixed left-0 top-0`
- **Z-index** : 50

### Sidebar Secondaire (Contextuelle)
- **Largeur** : 256px (fixe)
- **Background** : `bg-primary` (#040069)
- **Position** : `fixed left-20 top-0` (à droite de la principale)
- **Z-index** : 40

### Contenu Principal
- **Margin** : 
  - Sans sidebar secondaire : `ml-20` (80px)
  - Avec sidebar secondaire : `ml-[336px]` (80px + 256px)
- **Transition** : Smooth transition sur margin-left (0.3s)

## Responsive (Future Enhancement)

Pour mobile, prévoir :
- Sidebar principale collapsible
- Sidebar secondaire en overlay/drawer
- Toggle buttons appropriés

## Customisation

### Ajouter une Nouvelle Sidebar Contextuelle

1. Créer le composant dans `src/components/layout/[nom]-secondary-sidebar.tsx`
2. Suivre la structure :
   ```tsx
   export function MySecondarySidebar({ props }: MyProps) {
     return (
       <div className="h-full flex flex-col bg-primary text-primary-foreground">
         {/* Header */}
         <div className="p-6 border-b border-primary-foreground/10">
           {/* ... */}
         </div>
         
         {/* Content */}
         <div className="flex-1 overflow-y-auto">
           {/* ... */}
         </div>
         
         {/* Footer (optional) */}
         <div className="p-4 border-t border-primary-foreground/10">
           {/* ... */}
         </div>
       </div>
     );
   }
   ```
3. Exporter dans `src/components/layout/index.ts`
4. Utiliser dans la page correspondante

### Changer les Icônes de Navigation

Dans `dual-sidebar-layout.tsx`, modifier les `NavIcon` :
```tsx
<NavIcon href="/chat" icon="💬" label="Chats" />
<NavIcon href="/tasks" icon="✓" label="Tasks" />
<NavIcon href="/projects" icon="📁" label="Projects" />
```

Ou remplacer par des composants Lucide React :
```tsx
import { MessageSquare, CheckSquare, Folder } from 'lucide-react';

<NavIcon href="/chat" icon={<MessageSquare className="h-6 w-6" />} label="Chats" />
```

## Avantages du Système

1. **Organisation Claire** : Navigation principale simple, contexte détaillé dans sidebar secondaire
2. **Flexibilité** : Sidebar secondaire peut être activée/désactivée par page
3. **Consistency** : Même structure pour toutes les pages contextuelles
4. **Performance** : Sidebar principale légère (icônes uniquement)
5. **UX Optimale** : Accès rapide à la navigation + détails contextuels accessibles

## Fichiers Créés

- `dual-sidebar-layout.tsx` (101 lignes) - Layout principal
- `chat-secondary-sidebar.tsx` (103 lignes) - Sidebar Chat
- `tasks-secondary-sidebar.tsx` (149 lignes) - Sidebar Tasks  
- `projects-secondary-sidebar.tsx` (178 lignes) - Sidebar Projects

**Total** : ~531 lignes de code

## Prochaines Améliorations

- [ ] Responsive mobile (drawer/overlay)
- [ ] Animations transitions sidebar
- [ ] Persistence état sidebar (ouvert/fermé)
- [ ] Keyboard shortcuts
- [ ] Accessibilité (ARIA labels)
- [ ] Loading states pour listes
- [ ] Infinite scroll pour listes longues
- [ ] Drag & drop pour réorganiser

---

**Status** : ✅ Implémenté  
**Version** : 1.0.0  
**Date** : Janvier 2024
