# Typographie Unifiée - Quick Reference

## 🎯 Système Actuel

```
Font Unique: Hind Vadodara
Weights: 300, 400, 500, 600, 700
```

## 📝 Utilisation

### Headings
```tsx
<h1 className="text-4xl font-bold">Title</h1>
<h2 className="text-3xl font-bold">Subtitle</h2>
<h3 className="text-2xl font-semibold">Section</h3>
```

### Body Text
```tsx
<p>Regular paragraph (default)</p>
<p className="font-medium">Emphasized text</p>
<span className="font-light text-xs">Meta info</span>
```

### Buttons
```tsx
<button className="font-medium">Click Me</button>
```

### Forms
```tsx
<label className="text-sm font-medium">Label</label>
<input placeholder="Text input" />
<span className="text-xs font-light">Help text</span>
```

## 🎨 Weight Hierarchy

```
font-light (300)   → Subtle, meta
font-normal (400)  → Body text (default)
font-medium (500)  → Emphasis, buttons
font-semibold (600) → Strong emphasis
font-bold (700)    → Headings
```

## ⚠️ À Éviter

```tsx
❌ <h1 className="font-zain">Title</h1>     // Zain supprimée
❌ <p className="font-sans">Text</p>        // Redondant
❌ @import url('...Zain...')                 // Plus dans CSS
```

## ✅ Performance

**Avant** : 2 fonts (Zain + Inter) = 210KB  
**Après** : 1 font (Hind Vadodara) = 95KB  
**Gain** : -55% 🎉

## 📚 Docs Complètes

Voir `TYPOGRAPHY_UNIFIED.md` pour le guide détaillé.
