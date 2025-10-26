# Chat Home Page - Documentation

## Vue d'ensemble

La page d'accueil du chat (`/chat`) offre une interface élégante et intuitive pour démarrer de nouvelles conversations avec l'IA, inspirée par ChatGPT et Grok.

## Caractéristiques principales

### 1. Design centré et minimaliste

```
┌────────────────────────────────────────┐
│                                        │
│              [Logo W]                  │
│                                        │
│     Comment puis-je vous aider ?      │
│   Posez-moi une question ou...       │
│                                        │
│  ┌──────────┐  ┌──────────┐          │
│  │ 💡       │  │ ✍️       │          │
│  │ Concept  │  │ Contenu  │          │
│  └──────────┘  └──────────┘          │
│                                        │
│  ┌─────────────────────────────────┐  │
│  │ GPT-4o ▼                       │  │
│  ├─────────────────────────────────┤  │
│  │ [📎]  Écrivez votre message... │  │
│  │                            [→] │  │
│  └─────────────────────────────────┘  │
│                                        │
└────────────────────────────────────────┘
```

### 2. Logo et titre

- Logo "W" avec dégradé bleu-violet
- Titre d'accueil personnalisé : "Comment puis-je vous aider ?"
- Sous-titre invitant à l'interaction

### 3. Cartes de suggestions

4 cartes cliquables avec suggestions de prompts :

| Icône | Titre | Prompt suggéré |
|-------|-------|----------------|
| 💡 | Expliquer un concept | "Explique-moi la relativité générale..." |
| ✍️ | Rédiger du contenu | "Aide-moi à écrire un email professionnel" |
| 🔍 | Analyser des données | "Comment analyser ce fichier CSV ?" |
| 🎨 | Générer des idées | "Donne-moi des idées créatives..." |

**Comportement** : Cliquer sur une carte pré-remplit le champ de message.

### 4. Sélecteur de modèle

Dropdown permettant de choisir le modèle d'IA :

- **GPT-4o** - Most capable model
- **GPT-4 Turbo** - Fast and powerful  
- **GPT-3.5 Turbo** - Quick responses

**Emplacement** : En haut de la zone d'input, avec icône ✨ (Sparkles)

### 5. Gestion des pièces jointes

#### Types de fichiers supportés
- **Images** : `image/*` (JPEG, PNG, GIF, etc.)
- **Documents** : `.pdf`, `.doc`, `.docx`, `.txt`

#### Interface
- **Bouton d'ajout** : Icône trombone (📎) à gauche de l'input
- **Preview des images** : Miniature 80x80px avec bouton de suppression
- **Preview des documents** : Badge avec nom de fichier tronqué

#### Fonctionnalités
- Multi-upload (plusieurs fichiers à la fois)
- Suppression individuelle (bouton ❌ sur chaque pièce jointe)
- Preview automatique pour les images (Base64)

### 6. Zone de saisie

#### Caractéristiques
- **Textarea auto-expandable** : S'agrandit avec le contenu
- **Hauteur max** : 200px avec scroll
- **Placeholder** : "Écrivez votre message... (Shift+Enter pour nouvelle ligne)"
- **Raccourcis** :
  - `Enter` : Envoyer le message
  - `Shift + Enter` : Nouvelle ligne

#### Bouton d'envoi
- **État actif** : Bleu avec ombre quand message ou pièces jointes présents
- **État désactivé** : Gris quand input vide
- **Icône** : Flèche d'envoi (→)

### 7. Footer informatif

Disclaimer en bas de page :
> "Whalli peut faire des erreurs. Vérifiez les informations importantes."

## Flux utilisateur

### Démarrer une nouvelle conversation

1. **Utilisateur arrive sur `/chat`**
   - Voit la page d'accueil avec logo et suggestions
   - La sidebar contextuelle affiche l'historique des conversations

2. **Utilisateur écrit un message**
   - Peut cliquer sur une suggestion ou écrire librement
   - Peut ajouter des pièces jointes (images, documents)
   - Peut changer le modèle d'IA

3. **Utilisateur envoie le message**
   - Un nouveau chat est créé avec le titre = début du message
   - Le message est envoyé
   - **Redirection automatique** vers `/chat/[id]`

### Cas d'usage

#### Envoi simple
```typescript
message = "Explique-moi la blockchain"
model = "gpt-4o"
→ Crée chat + envoie message + redirige
```

#### Envoi avec pièces jointes
```typescript
message = "Analyse cette image"
attachments = [image.png]
model = "gpt-4o"
→ Crée chat + envoie message avec attachements + redirige
```

## Architecture technique

### État local

```typescript
interface State {
  message: string;                    // Contenu du message
  selectedModel: Model;               // Modèle sélectionné
  showModelSelect: boolean;           // Visibilité du dropdown
  attachments: Attachment[];          // Fichiers attachés
  sending: boolean;                   // État d'envoi
}

interface Attachment {
  id: string;                         // ID unique généré
  file: File;                         // Objet File natif
  type: 'image' | 'document';         // Type déterminé par MIME
  preview?: string;                   // Base64 pour images
}

interface Model {
  id: string;                         // 'gpt-4o', 'gpt-4-turbo', etc.
  name: string;                       // Nom affiché
  description: string;                // Description courte
}
```

### Hooks utilisés

```typescript
// Navigation
const router = useRouter();

// Sidebar contextuelle
usePageWidgets([
  {
    id: 'chat-history',
    title: 'Conversations',
    content: <ChatHistoryList />,
  },
]);

// Référence au input file caché
const fileInputRef = useRef<HTMLInputElement>(null);
```

### Fonctions principales

#### `handleFileSelect()`
- Lit les fichiers sélectionnés
- Crée les objets Attachment
- Génère les previews pour les images (FileReader)
- Ajoute à l'état `attachments`

#### `removeAttachment(id)`
- Filtre l'attachment par ID
- Met à jour l'état

#### `handleSend()`
1. Crée un nouveau chat via `api.createChat()`
2. Envoie le premier message via `api.sendMessage()`
3. Navigue vers `/chat/[id]`

#### `handleKeyDown()`
- Détecte `Enter` (sans Shift) pour envoyer
- Permet `Shift+Enter` pour nouvelle ligne

## Styling

### Couleurs et thème

```css
/* Logo */
bg-gradient-to-br from-blue-500 to-purple-600
shadow-lg shadow-blue-500/20

/* Cartes de suggestion */
bg-zinc-900/50 hover:bg-zinc-800/50
border-zinc-800 hover:border-zinc-700

/* Input container */
bg-zinc-900 border-zinc-800
rounded-2xl shadow-2xl

/* Bouton d'envoi (actif) */
bg-blue-600 hover:bg-blue-700
shadow-lg shadow-blue-600/20

/* Dropdown modèle */
bg-zinc-800 border-zinc-700
hover:bg-zinc-700
```

### Responsive

- **Max-width** : 768px (3xl)
- **Padding** : Adaptatif selon la taille d'écran
- **Grid suggestions** : 2 colonnes (peut être 1 en mobile)

### Animations

- **Transitions** : `transition-all` sur les cartes et boutons
- **Hover effects** : Changement de couleur sur hover
- **Textarea auto-resize** : Smooth height adjustment

## Intégration avec l'API

### Création du chat

```typescript
POST /api/chats
Body: {
  title: string,    // Premiers 50 caractères du message
  model: string,    // ID du modèle sélectionné
}
Response: Chat
```

### Envoi du message

```typescript
POST /api/chats/:id/messages
Body: {
  content: string,  // Contenu du message
}
Response: {
  userMessage: Message,
  assistantMessage: Message,
}
```

**Note** : Les pièces jointes ne sont pas encore implémentées côté backend. Pour l'instant, seul le texte est envoyé.

## TODO / Améliorations futures

### Court terme
- [ ] Implémenter l'upload réel des pièces jointes
  - Modifier l'API pour accepter des multipart/form-data
  - Stocker les fichiers (S3, Cloudinary, etc.)
  - Passer les URLs au modèle d'IA
- [ ] Ajouter un indicateur de chargement pendant l'envoi
- [ ] Gérer les erreurs avec des toasts/notifications

### Moyen terme
- [ ] Drag & drop pour les pièces jointes
- [ ] Support des fichiers Excel, CSV
- [ ] Historique des prompts récents
- [ ] Templates de prompts personnalisés
- [ ] Raccourcis clavier pour sélection rapide du modèle

### Long terme
- [ ] Support de la voix (speech-to-text)
- [ ] Génération d'images (DALL-E, Midjourney)
- [ ] Partage de conversations
- [ ] Export en PDF/Markdown

## Cas limites et gestion d'erreurs

### Fichiers trop volumineux
**TODO** : Ajouter validation côté client
```typescript
if (file.size > 10 * 1024 * 1024) { // 10MB
  alert('File too large');
  return;
}
```

### Types de fichiers non supportés
**Actuel** : Le `accept` de l'input file limite déjà
**À améliorer** : Validation explicite + message d'erreur

### Échec de création du chat
**Actuel** : `console.error()` + `sending` reste à true
**À améliorer** : Afficher erreur à l'utilisateur + reset état

### Message vide
**Protégé** : Le bouton d'envoi est désactivé si message vide ET aucune pièce jointe

## Accessibilité

- ✅ Boutons avec `title` pour tooltips
- ✅ `alt` sur les images
- ✅ Labels implicites (`aria-label` sur boutons)
- ⚠️ **À améliorer** : 
  - Focus management (keyboard navigation)
  - ARIA roles pour le dropdown
  - Screen reader announcements

## Performance

- ✅ FileReader asynchrone pour les previews
- ✅ Next.js Image pour optimisation automatique
- ✅ Composants fonctionnels avec hooks
- ⚠️ **À surveiller** :
  - Taille des previews Base64 en mémoire
  - Re-renders inutiles (useCallback/useMemo si nécessaire)

## Tests suggérés

### Tests manuels
1. Écrire un message → Envoyer → Vérifier redirection
2. Ajouter une image → Vérifier preview → Supprimer → Vérifier disparition
3. Ajouter un PDF → Vérifier badge → Envoyer
4. Changer de modèle → Vérifier persistance
5. Shift+Enter → Vérifier nouvelle ligne
6. Enter → Vérifier envoi

### Tests automatisés (à implémenter)
```typescript
describe('ChatPage', () => {
  it('should show welcome screen', () => {});
  it('should enable send button when message is typed', () => {});
  it('should create chat and redirect on send', () => {});
  it('should allow file attachments', () => {});
  it('should change model selection', () => {});
});
```

---

**Fichier** : `apps/web/app/(app)/chat/page.tsx`  
**Lignes** : ~306  
**Dépendances** : Next.js, React, Lucide Icons, API Client  
**Version** : 1.0  
**Date** : Octobre 2025
