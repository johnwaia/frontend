# 🎨 Guide d'utilisation CSS avec Bootstrap

## 📋 Vue d'ensemble

Le CSS a été amélioré pour intégrer Bootstrap 5.3.8 tout en conservant vos styles personnalisés. Les classes ont été renommées avec le suffixe `-custom` pour éviter les conflits avec Bootstrap.

## 🔄 Migration des classes

### Anciennes classes → Nouvelles classes

| Ancien | Nouveau | Description |
|--------|---------|-------------|
| `.container` | `.container-custom` | Container personnalisé |
| `.button` | `.btn-custom` | Bouton personnalisé |
| `input[type="text"]` | `.form-control-custom` | Champ de saisie |
| `.tbl` | `.table-custom` | Table personnalisée |
| `.badge` | `.badge-custom` | Badge personnalisé |
| `.route` | `.route-custom` | Container de badges |
| `.card` | `.card-custom` | Carte personnalisée |

## 🎯 Nouvelles possibilités avec Bootstrap

### 1. Système de grille Bootstrap

```html
<div class="container">
  <div class="row">
    <div class="col-md-6">Colonne 1</div>
    <div class="col-md-6">Colonne 2</div>
  </div>
</div>
```

### 2. Composants Bootstrap + Classes personnalisées

```html
<!-- Bouton avec style personnalisé -->
<button class="btn-custom">Mon bouton</button>

<!-- Ou bouton Bootstrap standard -->
<button class="btn btn-primary">Bouton Bootstrap</button>

<!-- Card avec style personnalisé -->
<div class="card-custom">
  <div class="card-custom-body">
    Contenu de la carte
  </div>
</div>

<!-- Table avec style personnalisé -->
<table class="table-custom">
  <thead>
    <tr>
      <th>Colonne 1</th>
      <th>Colonne 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Donnée 1</td>
      <td>Donnée 2</td>
    </tr>
  </tbody>
</table>
```

### 3. Utilitaires Bootstrap disponibles

```html
<!-- Spacing -->
<div class="p-3 m-2">Padding 3, Margin 2</div>

<!-- Couleurs -->
<div class="text-primary bg-light">Texte primary sur fond light</div>

<!-- Flexbox -->
<div class="d-flex justify-content-between align-items-center">
  <span>Gauche</span>
  <span>Droite</span>
</div>

<!-- Responsive -->
<div class="d-none d-md-block">Visible seulement sur desktop</div>
```

## 🎨 Variables CSS personnalisées

Les variables suivantes sont disponibles :

```css
:root {
  --bs-primary: #2563eb;
  --bs-primary-hover: #1d4ed8;
  --bs-secondary: #f3f4f6;
  --bs-border-radius: 0.75rem;
  --bs-box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.05);
}
```

## 🔧 Exemple d'utilisation dans Vue.js

```vue
<template>
  <div class="container-fluid">
    <!-- Header avec Bootstrap Grid -->
    <div class="row mb-4">
      <div class="col">
        <h1 class="text-primary-custom">Mon Application</h1>
      </div>
    </div>
    
    <!-- Formulaire avec classes personnalisées -->
    <div class="row">
      <div class="col-md-6">
        <div class="card-custom">
          <div class="card-custom-body">
            <form>
              <div class="mb-3">
                <label class="form-label">Recherche</label>
                <input type="text" class="form-control-custom" placeholder="Tapez ici...">
              </div>
              <button type="submit" class="btn-custom">Rechercher</button>
            </form>
          </div>
        </div>
      </div>
      
      <!-- Table avec classes personnalisées -->
      <div class="col-md-6">
        <table class="table-custom">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Element 1</td>
              <td>
                <div class="route-custom">
                  <span class="badge-custom">Actif</span>
                  <span class="sep">•</span>
                  <span class="badge-custom">Important</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
```

## 📱 Responsivité améliorée

Le CSS inclut des améliorations responsives automatiques :
- Tables adaptées sur mobile
- Containers ajustés
- Padding réduit sur petit écran

## 🎯 Bonnes pratiques

1. **Utilisez Bootstrap pour la structure** (grid, spacing, typography)
2. **Utilisez les classes personnalisées pour le style** (couleurs, ombres, bordures)
3. **Combinez les deux** pour un design cohérent et flexible

## 🔄 Classes de compatibilité

Pour faciliter la migration, vous pouvez également utiliser les classes bootstrap standard :
- `.btn` + `.btn-primary` au lieu de `.btn-custom`
- `.table` + `.table-striped` au lieu de `.table-custom`
- `.card` + `.card-body` au lieu de `.card-custom`