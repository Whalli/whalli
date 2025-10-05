# Layout Optimization - Consolidation du Système de Layout

## 📋 Vue d'Ensemble

Optimisation architecturale du système de layout pour éviter les imports dupliqués dans chaque page. Utilisation du système de **Route Groups** de Next.js 14 pour centraliser le rendu des layouts dans un composant parent unique.

## 🎯 Problème Résolu

### Avant (Architecture Non Optimale)
Chaque page importait et wrappait son contenu manuellement :

```tsx
// apps/web/src/app/chat/page.tsx
import { DualSidebarLayout } from '@/components/layout/dual-sidebar-layout';
import { ChatSecondarySidebar } from '@/components/layout/chat-secondary-sidebar';

export default function ChatPage() {
  const user = {...};
  const mockChats = [...];
  
  return (
    <DualSidebarLayout user={user} secondarySidebar={<ChatSecondarySidebar chats={mockChats} />}>
      <ChatUI />
    </DualSidebarLayout>
  );
}
```

**Problèmes** :
- ❌ Code dupliqué dans chaque page (import, wrapper, props)
- ❌ Configuration des layouts répétée partout
- ❌ Mock data dupliqué (user, stats, chats)
- ❌ Logique de sélection de layout dispersée
- ❌ Maintenance difficile (changement = modifier toutes les pages)

### Après (Architecture Optimisée)
Un seul layout parent qui route automatiquement :

```tsx
// apps/web/src/app/(app)/layout.tsx
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Logique centralisée de sélection de layout
  if (pathname?.startsWith('/chat')) {
    return <DualSidebarLayout secondarySidebar={<ChatSecondarySidebar />}>
      {children}
    </DualSidebarLayout>;
  }
  
  return <MainLayout>{children}</MainLayout>;
}

// apps/web/src/app/(app)/chat/page.tsx
export default function ChatPage() {
  return <ChatUI />; // Simple et propre !
}
```

**Avantages** :
- ✅ Un seul fichier gère tous les layouts
- ✅ Pages ultra-simplifiées (juste le contenu)
- ✅ Mock data centralisé
- ✅ Logique de routing claire et maintainable
- ✅ Changement de layout = un seul fichier à modifier

## 🏗️ Architecture

### Structure de Fichiers

```
apps/web/src/app/
├── layout.tsx                          # Root layout (inchangé)
├── (app)/                              # Route group pour l'application principale
│   ├── layout.tsx                      # ✨ NOUVEAU : Layout parent intelligent
│   ├── page.tsx                        # Home (simplifié)
│   ├── chat/page.tsx                   # Chat (simplifié)
│   ├── tasks/page.tsx                  # Tasks (simplifié)
│   ├── projects/page.tsx               # Projects (simplifié)
│   ├── profile/page.tsx                # Profile (simplifié)
│   └── settings/page.tsx               # Settings (simplifié)
├── login/page.tsx                      # Hors du route group (pas de layout)
└── signup/page.tsx                     # Hors du route group (pas de layout)
```

### Logique de Routing du Layout

Le fichier `(app)/layout.tsx` utilise `usePathname()` pour déterminer le layout approprié :

```tsx
const pathname = usePathname();

// Routes avec DualSidebarLayout
const dualSidebarRoutes = ['/chat', '/tasks', '/projects'];
const isDualSidebarRoute = dualSidebarRoutes.some(route => pathname?.startsWith(route));

// Routes sans layout (authentification, API)
const noLayoutRoutes = ['/login', '/signup', '/api'];
const shouldSkipLayout = noLayoutRoutes.some(route => pathname?.startsWith(route));

// Sélection automatique
if (shouldSkipLayout) return <>{children}</>;
if (isDualSidebarRoute) return <DualSidebarLayout {...props}>{children}</DualSidebarLayout>;
return <MainLayout user={user}>{children}</MainLayout>;
```

## 🔄 Changements par Page

### 1. Chat Page (`(app)/chat/page.tsx`)

**Avant** (57 lignes) :
```tsx
"use client";

import { DualSidebarLayout } from '@/components/layout/dual-sidebar-layout';
import { ChatSecondarySidebar } from '@/components/layout/chat-secondary-sidebar';
import { ChatUI } from '@/components/chat/chat-ui';

const mockChats = [/* 20+ lignes de données */];

export default function ChatPage() {
  const user = {
    name: 'Demo User',
    email: 'demo@whalli.com',
  };

  return (
    <DualSidebarLayout
      user={user}
      secondarySidebar={<ChatSecondarySidebar chats={mockChats} />}
    >
      <div className="h-[calc(100vh-6rem)]">
        <ChatUI userId={userId} apiUrl="http://localhost:3001" />
      </div>
    </DualSidebarLayout>
  );
}
```

**Après** (11 lignes) :
```tsx
"use client";

import { ChatUI } from '@/components/chat/chat-ui';

export default function ChatPage() {
  const userId = 'demo-user-id';
  
  return (
    <div className="h-[calc(100vh-6rem)]">
      <ChatUI userId={userId} apiUrl="http://localhost:3001" />
    </div>
  );
}
```

**Réduction** : 46 lignes (-80%) 🎉

### 2. Tasks Page (`(app)/tasks/page.tsx`)

**Avant** :
- Importait `DualSidebarLayout` et `TasksSecondarySidebar`
- Calculait `taskStats` pour la sidebar
- Créait un objet `user`
- Wrappait tout dans `<DualSidebarLayout>`

**Après** :
```tsx
export default function TasksPage() {
  // ... logique de gestion des tâches (inchangée)
  
  return (
    <div className="space-y-6">
      {/* UI des tâches */}
    </div>
  );
}
```

**Supprimé** :
- Imports de layout (2 lignes)
- Objet user (4 lignes)
- Calcul taskStats (8 lignes)
- Wrapper DualSidebarLayout (2 lignes)

### 3. Projects Page (`(app)/projects/page.tsx`)

**Avant** :
- Importait `DualSidebarLayout` et `ProjectsSecondarySidebar`
- Calculait `projectStats` pour la sidebar
- Préparait `sidebarProjects` array
- Créait un objet `user`
- Wrappait tout dans `<DualSidebarLayout>`

**Après** :
```tsx
export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  // ... logique de gestion des projets (inchangée)
  
  return (
    <div className="space-y-6">
      {/* UI des projets */}
    </div>
  );
}
```

**Supprimé** :
- Imports de layout (2 lignes)
- Objet user (4 lignes)
- Calculs stats (10+ lignes)
- Wrapper DualSidebarLayout (2 lignes)

### 4. Home Page (`(app)/page.tsx`)

**Avant** :
```tsx
import { MainLayout } from '@/components/layout/main-layout';

export default function HomePage() {
  const user = {
    name: 'Demo User',
    email: 'demo@whalli.com',
  };

  return (
    <MainLayout user={user}>
      <div className="space-y-12">
        {/* Contenu home */}
      </div>
    </MainLayout>
  );
}
```

**Après** :
```tsx
export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Contenu home (inchangé) */}
    </div>
  );
}
```

**Supprimé** :
- Import MainLayout (1 ligne)
- Objet user (4 lignes)
- Wrapper MainLayout (2 lignes)

### 5. Profile Page (`(app)/profile/page.tsx`)

**Avant** :
```tsx
import { MainLayout } from '@/components/layout/main-layout';

export default function ProfilePage() {
  // ... state formData
  
  return (
    <MainLayout user={{ name: formData.name, email: formData.email }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Formulaire profile */}
      </div>
    </MainLayout>
  );
}
```

**Après** :
```tsx
export default function ProfilePage() {
  // ... state formData (inchangé)
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Formulaire profile (inchangé) */}
    </div>
  );
}
```

**Supprimé** :
- Import MainLayout (1 ligne)
- Wrapper MainLayout avec prop user (2 lignes)

### 6. Settings Page (`(app)/settings/page.tsx`)

**Avant** :
```tsx
import { MainLayout } from '@/components/layout/main-layout';

export default function SettingsPage() {
  // ... state settings
  
  const user = {
    name: 'Demo User',
    email: 'demo@whalli.com',
  };

  return (
    <MainLayout user={user}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Paramètres */}
      </div>
    </MainLayout>
  );
}
```

**Après** :
```tsx
export default function SettingsPage() {
  // ... state settings (inchangé)
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Paramètres (inchangés) */}
    </div>
  );
}
```

**Supprimé** :
- Import MainLayout (1 ligne)
- Objet user (4 lignes)
- Wrapper MainLayout (2 lignes)

## 📦 Layout Parent (`(app)/layout.tsx`)

### Code Complet

```tsx
"use client";

import { usePathname } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { DualSidebarLayout } from '@/components/layout/dual-sidebar-layout';
import { ChatSecondarySidebar } from '@/components/layout/chat-secondary-sidebar';
import { TasksSecondarySidebar } from '@/components/layout/tasks-secondary-sidebar';
import { ProjectsSecondarySidebar } from '@/components/layout/projects-secondary-sidebar';

// Mock data centralisé (à remplacer par des appels API)
const mockChats = [
  {
    id: '1',
    title: 'Project Planning',
    preview: 'Let\'s discuss the roadmap...',
    timestamp: '2 hours ago',
    model: 'gpt-4',
  },
  // ... autres chats
];

const mockTaskStats = {
  total: 42,
  completed: 28,
  pending: 10,
  inProgress: 4,
};

const mockProjectStats = {
  total: 8,
  active: 5,
  completed: 3,
};

const mockProjects = [
  {
    id: '1',
    name: 'Whalli Core',
    color: '#040069',
    tasksCount: 12,
    completedTasks: 8,
  },
  // ... autres projets
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Logique de sélection du layout
  const dualSidebarRoutes = ['/chat', '/tasks', '/projects'];
  const isDualSidebarRoute = dualSidebarRoutes.some(route => pathname?.startsWith(route));

  // Fonction pour obtenir la sidebar secondaire appropriée
  const getSecondarySidebar = () => {
    if (pathname?.startsWith('/chat')) {
      return <ChatSecondarySidebar chats={mockChats} />;
    }
    if (pathname?.startsWith('/tasks')) {
      return <TasksSecondarySidebar stats={mockTaskStats} />;
    }
    if (pathname?.startsWith('/projects')) {
      return <ProjectsSecondarySidebar stats={mockProjectStats} projects={mockProjects} />;
    }
    return null;
  };

  // Routes sans layout (authentification, API, etc.)
  const noLayoutRoutes = ['/login', '/signup', '/api'];
  const shouldSkipLayout = noLayoutRoutes.some(route => pathname?.startsWith(route));

  // User mock (à remplacer par Better Auth)
  const user = {
    name: 'Demo User',
    email: 'demo@whalli.com',
  };

  // Rendu conditionnel du layout
  if (shouldSkipLayout) {
    return <>{children}</>;
  }

  if (isDualSidebarRoute) {
    return (
      <DualSidebarLayout
        user={user}
        secondarySidebar={getSecondarySidebar()}
      >
        {children}
      </DualSidebarLayout>
    );
  }

  return <MainLayout user={user}>{children}</MainLayout>;
}
```

### Fonctionnalités

1. **Route Detection** : Utilise `usePathname()` pour identifier la route actuelle
2. **Layout Selector** : Choisit automatiquement entre `DualSidebarLayout` et `MainLayout`
3. **Secondary Sidebar Router** : Sélectionne la sidebar secondaire appropriée (Chat, Tasks, Projects)
4. **No Layout Routes** : Permet de désactiver le layout pour certaines routes (login, signup, API)
5. **Mock Data Centralisé** : Toutes les données de test sont dans un seul fichier

## 🎨 Layouts Disponibles

### 1. MainLayout
**Utilisé pour** : Pages simples (Home, Profile, Settings)

**Caractéristiques** :
- Sidebar principale de navigation (80px, icon-based)
- Pas de sidebar secondaire
- Layout responsive avec toggle mobile

**Routes** :
- `/` (Home)
- `/profile`
- `/settings`

### 2. DualSidebarLayout
**Utilisé pour** : Pages avec sidebar contextuelle (Chat, Tasks, Projects)

**Caractéristiques** :
- Sidebar principale de navigation (80px, icon-based)
- Sidebar secondaire contextuelle (256px, page-specific)
- Responsive avec toggle synchronisé sur mobile

**Routes** :
- `/chat` → ChatSecondarySidebar
- `/tasks` → TasksSecondarySidebar
- `/projects` → ProjectsSecondarySidebar

### 3. No Layout
**Utilisé pour** : Pages sans navigation (Auth, API)

**Caractéristiques** :
- Aucun layout wrapper
- Contenu brut (raw children)
- Page plein écran

**Routes** :
- `/login`
- `/signup`
- `/api/*`

## 🚀 Avantages de l'Architecture

### 1. Maintenabilité
- ✅ Un seul point de changement pour les layouts
- ✅ Logique de routing centralisée
- ✅ Mock data centralisé (facile à remplacer par API)

### 2. Performance
- ✅ Réduction du code dupliqué (-80% sur certaines pages)
- ✅ Bundle size optimisé (un seul import des layouts)
- ✅ Re-renders optimisés (layout persist entre pages)

### 3. Développement
- ✅ Pages ultra-simples (juste le contenu)
- ✅ Nouvelle page = juste le composant, pas de setup layout
- ✅ Tests plus faciles (composants isolés)

### 4. Évolutivité
- ✅ Ajouter un nouveau layout = modifier un seul fichier
- ✅ Changer de layout pour une route = une ligne
- ✅ Intégration Better Auth facilitée (un seul endroit)

## 🔧 Intégration Future : Better Auth

Actuellement, l'objet `user` est mocké dans le layout :

```tsx
const user = {
  name: 'Demo User',
  email: 'demo@whalli.com',
};
```

### Plan d'Intégration

1. **Remplacer le mock par Better Auth** :
```tsx
import { useSession } from '@/lib/auth-client';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const user = session?.user;

  // ... rest du code
}
```

2. **Protéger les routes** :
```tsx
if (!user && !shouldSkipLayout) {
  redirect('/login');
}
```

3. **Passer l'utilisateur réel** :
```tsx
return <MainLayout user={user}>{children}</MainLayout>;
```

## 📊 Statistiques de Réduction de Code

| Page | Avant (lignes) | Après (lignes) | Réduction |
|------|----------------|----------------|-----------|
| Chat | 57 | 11 | -46 (-80%) |
| Tasks | ~80 | ~70 | -10 (-12%) |
| Projects | ~85 | ~75 | -10 (-12%) |
| Home | ~160 | ~153 | -7 (-4%) |
| Profile | ~210 | ~203 | -7 (-3%) |
| Settings | ~230 | ~223 | -7 (-3%) |
| **Total** | **~822** | **~735** | **-87 (-11%)** |

**Note** : La plus grande victoire n'est pas seulement les lignes économisées, mais la **simplification conceptuelle** et la **maintenabilité** du code.

## 🎯 Next Steps

### 1. Intégration Better Auth
- [ ] Installer et configurer Better Auth
- [ ] Remplacer `const user = {...}` par `useSession()`
- [ ] Ajouter protection des routes
- [ ] Gérer les états de chargement/erreur

### 2. API Integration
- [ ] Remplacer `mockChats` par appel API `/api/messages`
- [ ] Remplacer `mockTaskStats` par appel API `/api/tasks/stats`
- [ ] Remplacer `mockProjectStats` par appel API `/api/projects/stats`
- [ ] Remplacer `mockProjects` par appel API `/api/projects`

### 3. Optimisations
- [ ] Implémenter SWR/React Query pour le caching
- [ ] Ajouter loading states pendant fetch API
- [ ] Gérer les erreurs de fetch gracefully
- [ ] Ajouter refresh automatique des stats

### 4. Tests
- [ ] Tests unitaires pour le layout routing
- [ ] Tests d'intégration avec Better Auth
- [ ] Tests E2E de navigation entre pages
- [ ] Tests responsive mobile/desktop

## 📚 Documentation Associée

- **UI_REFACTOR.md** : Documentation complète du système UI
- **DUAL_SIDEBAR_SYSTEM.md** : Guide du système dual sidebar
- **RESPONSIVE_DESIGN.md** : Documentation responsive mobile/desktop
- **EXECUTIVE_SUMMARY.md** : Vue d'ensemble exécutive (français)

## 🎉 Conclusion

Cette optimisation transforme l'architecture d'un système **page-centric** (chaque page gère son layout) en un système **layout-centric** (le layout gère les pages). C'est une approche plus élégante, maintenable et alignée avec les best practices de Next.js 14.

**Principe clé** : *"Don't repeat yourself (DRY)"* - Un seul endroit pour gérer tous les layouts ! 🚀
