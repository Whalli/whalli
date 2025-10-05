# Whalli Logo Components

Composants React pour les logos Whalli avec couleur personnalisable.

## 📦 Composants

### 1. WhalliIcon
**Baleine seule** - Pour les espaces restreints (sidebar, favicon, etc.)

### 2. WhalliLogo
**Logo complet** - Baleine + texte "Whalli" (headers, landing pages, etc.)

---

## 🎨 Usage

### WhalliIcon (Whale only)

```tsx
import { WhalliIcon } from '@/components/logo';

// Utilisation basique
<WhalliIcon />

// Avec couleur Deep Ocean
<WhalliIcon color="#040069" />

// Taille personnalisée
<WhalliIcon 
  color="#040069" 
  width={48} 
  height={48} 
/>

// Avec Tailwind classes
<WhalliIcon 
  color="#040069" 
  className="hover:opacity-80 transition-opacity" 
/>
```

### WhalliLogo (Full logo)

```tsx
import { WhalliLogo } from '@/components/logo';

// Utilisation basique
<WhalliLogo />

// Avec couleur Deep Ocean
<WhalliLogo color="#040069" />

// Taille personnalisée
<WhalliLogo 
  color="#040069" 
  width={240} 
  height={80} 
/>

// Avec Tailwind classes
<WhalliLogo 
  color="#040069" 
  className="hover:scale-105 transition-transform" 
/>
```

---

## 📐 Props

### WhalliIcon

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `color` | `string` | `"#0000FF"` | Couleur de la baleine |
| `width` | `number` | `40` | Largeur en pixels |
| `height` | `number` | `40` | Hauteur en pixels |
| `className` | `string` | `""` | Classes CSS additionnelles |

### WhalliLogo

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `color` | `string` | `"#0000FF"` | Couleur du logo complet |
| `width` | `number` | `200` | Largeur en pixels |
| `height` | `number` | `60` | Hauteur en pixels |
| `className` | `string` | `""` | Classes CSS additionnelles |

---

## 🎯 Cas d'Usage

### Sidebar Primary (80px)
```tsx
<WhalliIcon 
  color="#040069" 
  width={40} 
  height={40} 
/>
```

### Header Principal
```tsx
<WhalliLogo 
  color="#040069" 
  width={160} 
  height={48} 
/>
```

### Landing Page Hero
```tsx
<WhalliLogo 
  color="#040069" 
  width={320} 
  height={96} 
  className="mb-8" 
/>
```

### Footer
```tsx
<WhalliIcon 
  color="#6366f1" 
  width={32} 
  height={32} 
  className="opacity-60" 
/>
```

---

## 🎨 Couleurs Recommandées

### Deep Ocean Theme
```tsx
// Primary (recommandé)
<WhalliIcon color="#040069" />

// Variants
<WhalliIcon color="#0000FF" />  // Blue standard
<WhalliIcon color="#6366f1" />  // Indigo
<WhalliIcon color="#ffffff" />  // White (dark mode)
```

### Dark Mode
```tsx
{/* Light mode */}
<WhalliIcon color="#040069" className="dark:hidden" />

{/* Dark mode */}
<WhalliIcon color="#ffffff" className="hidden dark:block" />
```

---

## 📝 Installation du SVG

### Étapes :
1. **Copiez votre SVG de la baleine** dans `whalli-icon.tsx`
2. **Copiez votre SVG complet** (baleine + texte) dans `whalli-logo.tsx`
3. **Remplacez les couleurs statiques** :
   - `fill="#0000FF"` → `fill={color}`
   - `stroke="#0000FF"` → `stroke={color}`
4. **Ajustez le viewBox** si nécessaire pour le cadrage

### Exemple de remplacement :

**Avant** :
```tsx
<path fill="#0000FF" d="M10 20..." />
<circle stroke="#0000FF" cx="50" cy="50" r="5" />
```

**Après** :
```tsx
<path fill={color} d="M10 20..." />
<circle stroke={color} cx="50" cy="50" r="5" />
```

---

## 🔧 Intégration dans le Projet

### Sidebar (existant)
```tsx
// components/layout/sidebar.tsx
import { WhalliIcon } from '@/components/logo';

// Remplacer le "W" par :
<WhalliIcon color="#040069" width={40} height={40} />
```

### DualSidebarLayout
```tsx
// components/layout/dual-sidebar-layout.tsx
import { WhalliIcon } from '@/components/logo';

// Remplacer le logo par :
<WhalliIcon color="#040069" width={32} height={32} />
```

### Landing Page
```tsx
// (app)/page.tsx
import { WhalliLogo } from '@/components/logo';

<WhalliLogo 
  color="#040069" 
  width={240} 
  height={80} 
  className="mb-8" 
/>
```

---

## ✅ Checklist

- [ ] Coller SVG de la baleine dans `whalli-icon.tsx`
- [ ] Coller SVG complet dans `whalli-logo.tsx`
- [ ] Remplacer toutes les couleurs statiques par `{color}`
- [ ] Tester avec différentes couleurs
- [ ] Tester avec différentes tailles
- [ ] Intégrer dans sidebar
- [ ] Intégrer dans header
- [ ] Tester dark mode si nécessaire

---

## 🎉 Résultat Attendu

### WhalliIcon
- ✅ Responsive (width/height props)
- ✅ Couleur dynamique
- ✅ Classes Tailwind supportées
- ✅ Accessible (aria-label)

### WhalliLogo
- ✅ Responsive (width/height props)
- ✅ Couleur dynamique
- ✅ Classes Tailwind supportées
- ✅ Accessible (aria-label)

---

**Created**: Oct 4, 2025  
**Status**: ⏳ Waiting for SVG paste  
**Next**: Coller les SVG dans les composants
