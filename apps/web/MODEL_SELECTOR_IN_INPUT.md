# Model Selector in Chat Input - Design Update

## 🎯 Objectif

Déplacer le sélecteur de modèle depuis la sidebar vers la **zone de saisie du message** pour une UX plus intuitive, inspirée de l'interface Grok.

## ✅ Modifications Implémentées

### 1. **ChatInput avec Model Selector Intégré**

**Avant** :
- Modèle sélectionné uniquement depuis ChatSidebar
- ChatInput recevait seulement `isDisabled`
- Header affichait le modèle sélectionné

**Maintenant** :
```tsx
<ChatInput
  onSendMessage={sendMessage}
  isDisabled={isStreaming || !selectedModel}
  apiUrl={apiUrl}
  models={models}                    // ✅ NOUVEAU
  selectedModel={selectedModel}      // ✅ NOUVEAU
  onSelectModel={setSelectedModel}   // ✅ NOUVEAU
/>
```

### 2. **Interface du Sélecteur**

#### Position
- **Localisation** : Coin gauche de la zone de saisie
- **Avant** : File Upload en premier
- **Maintenant** : Model Selector → File Upload → Textarea → Voice → Send

#### Design
```
┌──────────────────────────────────────────────────┐
│ [GPT-4 ▾]  📎  Type a message...       🎤  ➤    │
└──────────────────────────────────────────────────┘
     ↑
  Sélecteur de modèle
```

#### Style
- Bouton sobre : `px-3 py-2 rounded-lg`
- Hover : `hover:bg-gray-100`
- Affichage : `ModelName + Company + ChevronDown`
- Dropdown : Popup au-dessus (bottom-full)

### 3. **Dropdown des Modèles**

```tsx
<div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-lg">
  {models.map(model => (
    <button>
      <div className="text-sm font-medium">{model.name}</div>
      <div className="text-xs text-gray-500">{model.company}</div>
      {/* Checkmark si sélectionné */}
    </button>
  ))}
</div>
```

**Features** :
- ✅ Liste déroulante au-dessus du bouton
- ✅ Affichage du nom + company
- ✅ Checkmark (✓) pour le modèle actif
- ✅ Hover effect sur chaque option
- ✅ Backdrop pour fermer au click extérieur
- ✅ Max height avec scroll (`max-h-96 overflow-y-auto`)

### 4. **Header Simplifié**

**Avant** :
```tsx
<header>
  <button>☰</button>
  {selectedModel && (
    <div>
      <div>{selectedModel.name}</div>
      <span>{selectedModel.company}</span>
    </div>
  )}
  <button>New Chat</button>
</header>
```

**Maintenant** :
```tsx
<header>
  <button>☰</button>
  <h1>Chat</h1>              {/* ✅ Titre simple */}
  <button>
    <Plus /> New Chat        {/* ✅ Icon + texte */}
  </button>
</header>
```

## 🎨 Visual Layout

### Desktop - État Fermé (NO SIDEBAR)
```
┌────────────────────────────────────────────────────┐
│  Chat                                 ➕ New Chat  │
├────────────────────────────────────────────────────┤
│                                                    │
│            Messages Area (Full Width)              │
│                                                    │
├────────────────────────────────────────────────────┤
│ [GPT-4o ▾]  📎  Type a message...     🎤  ➤       │
└────────────────────────────────────────────────────┘
```

### Desktop - Dropdown Ouvert (NO SIDEBAR)
```
┌────────────────────────────────────────────────────┐
│  Chat                                 ➕ New Chat  │
├────────────────────────────────────────────────────┤
│                                                    │
│   ┌──────────────────────┐                        │
│   │ ✓ GPT-4o             │                        │
│   │   OpenAI          ✓  │                        │
│   ├──────────────────────┤                        │
│   │   GPT-4 Turbo        │                        │
│   │   OpenAI             │                        │
│   ├──────────────────────┤                        │
│   │   Claude 3.5 Sonnet  │                        │
│   │   Anthropic          │                        │
│   └──────────────────────┘                        │
│                                                    │
├────────────────────────────────────────────────────┤
│ [GPT-4o ▾]  📎  Type a message...     🎤  ➤       │
└────────────────────────────────────────────────────┘
       Plus de sidebar, interface épurée
```

### Mobile
```
┌──────────────────────────────┐
│  Chat          ➕ New Chat    │
├──────────────────────────────┤
│                              │
│    Messages Area             │
│                              │
├──────────────────────────────┤
│ [GPT-4o ▾] 📎               │
│ Type message...      🎤  ➤  │
└──────────────────────────────┘
   Sélecteur responsive
```

## 📦 Types

### ChatModel Interface
```typescript
export interface ChatModel {
  id: string;
  name: string;
  company: string;
  description?: string;
}
```

### ChatInput Props
```typescript
interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isDisabled: boolean;
  apiUrl: string;
  models?: ChatModel[];                      // ✅ NOUVEAU
  selectedModel?: ChatModel | null;          // ✅ NOUVEAU
  onSelectModel?: (model: ChatModel) => void; // ✅ NOUVEAU
}
```

## 🔄 Data Flow

```
ChatUI (NO SIDEBAR)
  ├─ useChatModels(apiUrl)
  │    ├─ models: ChatModel[]
  │    ├─ selectedModel: ChatModel | null
  │    └─ setSelectedModel: (model) => void
  │
  ├─ ChatMessages (messages area)
  │
  └─ ChatInput (with integrated model selector)
       ├─ Receives: models, selectedModel, onSelectModel
       ├─ Renders: Model selector button
       └─ onClick: Opens dropdown with all models
```

## ⚙️ État Local

```typescript
const [showModelSelector, setShowModelSelector] = useState(false);
```

- `false` : Dropdown fermé
- `true` : Dropdown ouvert
- Toggle sur click du bouton
- Ferme sur click backdrop ou sélection

## 🎯 UX Improvements

### Avantages

1. **Contexte immédiat** : Modèle visible là où on tape
2. **Moins de clics** : Pas besoin d'ouvrir la sidebar
3. **Mobile-friendly** : Sélecteur toujours accessible
4. **Cohérence** : Comme Grok, ChatGPT, Claude
5. **Espace économisé** : Header plus simple

### Comportement

- **Placeholder dynamique** :
  - Sans modèle : `"Select a model to start chatting..."`
  - Avec modèle : `"Type a message or use / for commands..."`
  
- **Disabled state** :
  - Sans modèle : Input désactivé
  - Streaming : Sélecteur désactivé
  
- **Focus** :
  - Click sélecteur → Ouvre dropdown
  - Sélection modèle → Ferme dropdown + focus textarea

## 🎨 Styling Details

### Bouton Sélecteur
```css
/* Base */
px-3 py-2 text-sm font-medium text-gray-700
rounded-lg transition

/* Hover */
hover:bg-gray-100

/* Disabled */
disabled:opacity-50 disabled:cursor-not-allowed
```

### Dropdown
```css
/* Container */
absolute bottom-full left-0 mb-2
w-64 bg-white rounded-lg shadow-lg border
max-h-96 overflow-y-auto z-20

/* Item */
w-full text-left px-3 py-2 rounded-lg
hover:bg-gray-100 transition

/* Selected */
bg-blue-50
```

### Backdrop
```css
fixed inset-0 z-10
```

## 🧪 Testing Checklist

- [ ] Bouton sélecteur apparaît correctement
- [ ] Click ouvre le dropdown
- [ ] Liste complète des modèles affichée
- [ ] Modèle sélectionné a checkmark (✓)
- [ ] Click modèle change la sélection
- [ ] Dropdown se ferme après sélection
- [ ] Click backdrop ferme dropdown
- [ ] Placeholder change selon état
- [ ] Input désactivé sans modèle
- [ ] Mobile : bouton responsive
- [ ] Desktop : dropdown bien positionné
- [ ] Scroll fonctionne si >10 modèles

## 📝 Fichiers Modifiés

| Fichier | Lignes Modifiées | Description |
|---------|------------------|-------------|
| `ChatInput.tsx` | ~80 lignes | Ajout model selector + dropdown |
| `ChatUI.tsx` | ~30 lignes | **SUPPRESSION ChatSidebar** + header simplifié |
| `index.ts` | 1 ligne | Export ChatModel type |

### Suppressions
- ❌ **ChatSidebar** complètement retiré de ChatUI
- ❌ État `sidebarOpen` supprimé
- ❌ Bouton toggle sidebar (☰) supprimé
- ❌ Import `useState` retiré
- ❌ Import `ChatSidebar` retiré

## 🚀 Future Enhancements

### Phase 1 (Court terme)
- [ ] Grouper modèles par company (headers)
- [ ] Afficher icônes des providers
- [ ] Search/filter dans dropdown
- [ ] Keyboard navigation (↑↓ pour sélection)

### Phase 2 (Moyen terme)
- [ ] Afficher pricing/coût estimé
- [ ] Show model capabilities (context length, etc.)
- [ ] Favorites/recent models
- [ ] Model comparison tooltip

### Phase 3 (Long terme)
- [ ] Custom model configurations
- [ ] Temperature/parameters inline
- [ ] Multi-model parallel queries
- [ ] Model performance metrics

## 🎯 Design Inspiration

Inspiré de :
- **Grok (xAI)** : Model selector in input
- **ChatGPT** : Dropdown style
- **Claude** : Clean minimal design
- **Perplexity** : Compact selector

---

**Version**: 1.0  
**Date**: Octobre 2025  
**Status**: ✅ Implémenté et Documenté  
**Author**: Whalli Team
