# 🚆 Projet Frontend Vue.js - Recherche d'itinéraires

Ce projet est un **frontend en Vue.js 3 + Vite + Pinia + Vue Router** permettant de rechercher des itinéraires en s'appuyant sur un **backend Spring Boot** (API transport).

---

## ⚙️ Fonctionnalités

- 🔍 **Recherche de lieux** via autocomplétion (`/api/places`).
- 🚌 **Résolution d’itinéraires** (`/api/resolve-journeys`).
- ⏳ **Derniers trajets de la journée** (`/api/journeys/last-of-day`).
- 🎨 Affichage clair des résultats sous forme de **tableau** avec :
  - horaires de départ et d’arrivée,
  - durée totale,
  - nombre de correspondances,
  - parcours détaillé (bus, métro, RER, marche…).

---

## 📂 Structure du projet

```
frontend/
├── src/
│   ├── components/
│   │   └── PlaceAutocomplete.vue   # Champ de recherche avec autocomplétion
│   ├── services/
│   │   ├── http.js                 # Client Axios configuré
│   │   ├── transport.js            # Fonctions d'appel API
│   ├── stores/
│   │   └── journeys.js             # Store Pinia (état global)
│   ├── views/
│   │   ├── HomeView.vue            # Vue principale (formulaire + résultats)
│   │   └── AboutView.vue           # Exemple de vue statique
│   ├── router/
│   │   └── index.js                # Configuration des routes
│   ├── App.vue                     # Layout principal
│   └── main.js                     # Entrée application Vue
└── vite.config.js
```

---

## 🚀 Installation et lancement

### 1. Cloner le projet
```bash
git clone <repo-url> frontend
cd frontend
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Lancer le serveur de dev
```bash
npm run dev
```

Par défaut : [http://localhost:5173](http://localhost:5173)

### 4. Configurer la connexion backend

Créez un fichier `.env.local` à la racine :

```
VITE_API_BASE_URL=http://localhost:8080/api
```

---

## 🖥️ Backend attendu

Le backend est une API Java Spring Boot exposant :

- `GET /api/places?q=` → recherche de lieux
- `GET /api/resolve-journeys?fromQ=&toQ=` → itinéraires entre 2 lieux
- `GET /api/journeys/last-of-day?fromQ=&toQ=` → derniers trajets de la journée

⚠️ **Important** : le frontend valide les champs `fromQ` et `toQ` avant appel, afin d’éviter les erreurs 500.

---

## 📸 Aperçu

- Formulaire avec autocomplétion **Départ / Arrivée**
- Résultats présentés en **tableau lisible**
- Parcours affiché sous forme de **badges colorés** (Bus, RER, Métro, Marche…)

---

## 🛠️ Stack technique

- Vue.js 3 (composition API)
- Vite
- Pinia (state management)
- Vue Router
- Axios
- TailwindCSS (ou classes utilitaires simples)

---

## 👨‍💻 Développement

### Lancer avec un backend local
- Backend Spring Boot sur `http://localhost:8080`
- Frontend Vue.js sur `http://localhost:5173`

### Construire pour production
```bash
npm run build
```

---

## 📜 Licence

Projet réalisé à titre d’exemple pédagogique. Vous pouvez le modifier et l’adapter librement.
