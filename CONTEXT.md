# X17 — Scintillateur Calibration Dashboard

## Contexte

Outil de calibration en énergie pour les scintillateurs de l'expérience X17 (recherche du boson X17,
Université de Montréal). L'objectif est de produire la relation linéaire **E(ADC) = a·ADC + b** pour
un détecteur donné à partir de sources radioactives de référence.

L'outil tourne **localement** sur le laptop de l'utilisateur. Pas de déploiement cloud prévu.

---

## Architecture cible

```
x17-calibration/
├── app.py                  # Flask — routes et upload CSV (à faire)
├── analysis/               # (à faire)
│   ├── __init__.py
│   ├── io.py               # parse_csv(), validate_columns()
│   ├── fitting.py          # fit_gaussian(), fit_erfc()
│   └── calibration.py      # linear_regression(), build_calibration()
├── static/                 # (frontend actuel — à déplacer ici lors du wiring Flask)
│   ├── index.html          # page d'accueil (16 cartes scintillateurs)
│   ├── detector.html       # page de détail — sources + résultat + histogrammes
│   ├── style.css
│   ├── data.js             # couche données + localStorage
│   ├── shared.js           # toggles d'accordéons + clock + init router
│   ├── home.js             # rendu de la grille d'accueil
│   ├── detector.js         # logique de la page de détail
│   └── charts.js           # placeholders Canvas — à remplacer par Plotly
├── data/
│   └── calibrations.json   # persistance locale (à faire — actuellement localStorage)
└── requirements.txt        # (à faire)
```

**Stack :**
- Backend : **Flask** (Python) — scipy, numpy pour les fits (à mettre en place)
- Frontend : **HTML/CSS/JS vanilla** (en place) + **Plotly.js** via CDN (à intégrer)
- Persistance : **localStorage** côté navigateur (en place, transitoire) → migrer vers `calibrations.json`

---

## État actuel

### Frontend — mockup interactif complet

- [x] **Structure HTML séparée** : `index.html` (accueil), `detector.html` (détail unifié, paramétré par `?id=N`)
- [x] **CSS extrait** dans `style.css` avec design tokens (dark mode permanent via variables `--color-*`, `--font-*`, `--border-radius-*`)
- [x] **JS découpé en 5 fichiers** : `data.js` / `shared.js` / `home.js` / `charts.js` / `detector.js` (≈70/50/30/130/270 lignes)
- [x] **Couche données (`data.js`)** : tableau `detectors[]` (16 entrées), `DEFAULT_DETECTORS` en seed, persistance dans `localStorage` sous `x17-detectors-v2`. API : `loadDetectors()`, `saveDetectors()`, `setDetector(id, patch)`, `resetDetectors()`.
- [x] **Page d'accueil** : 16 cartes scintillateurs rendues depuis `detectors[]` en grille 2 colonnes (responsive 1 colonne < 760px). Chaque carte = dot statut + nom + équation E(ADC) + accordéon avec isotopes + bouton "See histograms".
- [x] **Page de détail** : lit `?id=N`, charge `detectors[id]`, peuple le `result-card` (équation, R², RMS, points), la liste de sources à gauche, et 3 sections d'histogrammes + régression à droite. Bounce vers `index.html` si id inconnu.
- [x] **Gestion des sources** :
  - Ajout : bouton "Add source" auto-assigne le premier isotope disponible (limite : 4 isotopes max)
  - Suppression : bouton rouge avec **double-clic de confirmation** (3 s d'armement, animation pulsée)
  - Changement d'isotope : radios par source, classes `.selected` qui suivent, **exclusion mutuelle** entre sources (les isotopes pris par d'autres sources sont grisés)
  - Numérotation auto-renumérotée dans l'ordre du DOM après ajout/suppression
  - Status "No data uploaded" par source (à droite du nom), masqué quand tous les CSV seraient uploadés
- [x] **Synchronisation données ↔ DOM** : chaque mutation (add / delete / change isotope) appelle `syncDetectorFromDOM()` → met à jour `detectors[currentId].sources` + sauvegarde dans `localStorage`. Au retour vers l'accueil (`pageshow`), `detectors` est rechargé depuis `localStorage` et la grille est re-rendue.
- [x] **Navigation** : logo cliquable, bouton "Home" centré, clic-droit/ctrl-clic fonctionnels (vraies balises `<a href>`).
- [x] **Composants visuels** : nav avec horloge HH:MM:SS, accordéons (toggle calib / src / hist), badges, métriques R²/RMS/Points dans le `result-card`, graphes histogrammes côte à côte par source.
- [x] **Graphes placeholder** : 4 fonctions Canvas (raw, NaI+gauss, scatter U/D+erfc, régression) dans `charts.js`, dessinent du bruit + des pseudo-pics. **À jeter** en bloc au passage Plotly.

### Backend — non commencé

- [ ] `app.py` (Flask) — aucune route
- [ ] Modules `analysis/` — aucun
- [ ] Pas de fichier `requirements.txt`
- [ ] Aucun calcul scientifique réel : équations / R² / RMS sont des valeurs mock dans `DEFAULT_DETECTORS`
- [ ] Pas d'upload réel : les zones "Drag here or import" sont visuelles seulement

---

## Données d'entrée

Par calibration : **3 fichiers CSV par source** (un par détecteur physique) + identité de l'isotope.

| Fichier | Détecteur physique | Contenu attendu |
|---------|-----------|-----------------|
| `nai_*.csv` | NaI | Colonnes : `channel`, `counts` |
| `up_*.csv` | PMT Up (U) | Colonnes : `channel`, `counts` (ou `adc`, `n`) |
| `down_*.csv` | PMT Down (D) | Colonnes : `channel`, `counts` |

Isotopes supportés : ¹³⁷Cs · ⁶⁰Co · ²⁰⁴Bi · ²²⁸Th (énergies de référence connues et à coder en dur côté backend).

Plusieurs sources peuvent être ajoutées à une même session de calibration — chaque source ajoute
une rangée dans chaque section d'histogramme et un point supplémentaire à la régression linéaire.

---

## Prochaines étapes

### Court terme — Brancher le backend Flask (≈ 3–5 jours)

Le mockup frontend est essentiellement complet et persiste son état. Il faut maintenant **remplacer le mock par du vrai calcul**.

**Étape 1 — Setup Flask de base (½ journée)**
- Créer `app.py`, `requirements.txt` (flask, scipy, numpy, pandas)
- Déplacer les fichiers frontend dans `static/` (ajuster les chemins relatifs si besoin)
- Route `GET /` qui sert `static/index.html`
- Route `GET /api/calibrations` qui retourne le contenu de `data/calibrations.json` (avec fallback sur `DEFAULT_DETECTORS` si le fichier n'existe pas)
- Côté JS : dans `data.js`, ajouter une `loadDetectorsFromBackend()` async qui appelle `fetch('/api/calibrations')`. Garder `localStorage` comme fallback hors-ligne (et pour les tests sans Flask).
- Ajouter `data/calibrations.json` au `.gitignore`

**Étape 2 — Module `analysis/io.py` (½ journée)**
- `parse_csv(file_obj)` → DataFrame normalisé (channel, counts), supporte les alias `adc`/`n`
- `validate_columns(df)` → erreur claire si colonnes manquantes ou type incorrect
- Tests unitaires sur des CSV synthétiques (au moins 1 cas valide + 3 cas d'erreur)

**Étape 3 — Fit gaussien NaI (1 journée)**
- `analysis/fitting.py:fit_gaussian(channels, counts, n_peaks)` → liste de pics `[{mu, sigma, amplitude, sigma_mu, sigma_sigma}]`
- Détection automatique via `scipy.signal.find_peaks` puis fit `scipy.optimize.curve_fit`
- Retourne aussi un échantillonnage dense de la courbe ajustée (pour Plotly)
- Tester sur un CSV réel de ¹³⁷Cs (1 pic, ~662 keV) et ²²⁸Th (2 pics)

**Étape 4 — Upload + analyse end-to-end pour 1 source (1 journée)**
- Route `POST /api/detectors/<id>/sources/<src_idx>/upload` acceptant 1 à 3 CSV (NaI + U + D)
- Le backend stocke les fichiers (ou juste leur contenu parsé) et lance le fit NaI
- Réponse JSON : `{nai_peaks: [...], nai_fit_curve: [[x,y],...], raw_data: [...]}`
- Côté JS : dans `detector.js`, brancher les `<div class="upload-zone">` à un input file caché qui POST le fichier, met à jour le `src-status` ("Uploaded ✓"), puis appelle `renderHistogramRows()` avec les vraies données

**Étape 5 — Plotly.js (½ journée)**
- Inclure Plotly via CDN dans `detector.html` et `index.html` (utile aussi pour les futurs sparkline du home)
- Supprimer `charts.js` (les 4 fonctions Canvas placeholder)
- Réécrire `drawDetailCharts()` dans `detector.js` pour appeler `Plotly.newPlot(canvasId, traces, layout)` à partir des données reçues du backend
- Les `<canvas>` deviennent des `<div>` (Plotly aime les divs)

---

### Moyen terme — Pipeline d'analyse complet (≈ 1–2 semaines)

**Fit erfc sur scatter U/D**
- `analysis/fitting.py:fit_erfc(adc_U, adc_D)` → paramètres erfc, point de coupure α et son incertitude
- Scatter plot Plotly (points U vs D) avec courbe erfc superposée
- Le calcul est lancé après l'upload des CSV `up_*.csv` et `down_*.csv` d'une source

**Régression linéaire E(ADC)**
- `analysis/calibration.py:linear_regression(adc_peaks, energies_ref, weights)` → `{a, sigma_a, b, sigma_b, r2, rms, points}`
- Pondération par les incertitudes des pics gaussiens
- Bande de confiance 95% calculée côté Python, transmise comme `[x[], y_lo[], y_hi[]]` à Plotly
- Points colorés par source/isotope (palette `SOURCE_COLORS` déjà définie dans `detector.js`)
- Le `result-card` se met à jour automatiquement quand assez de pics ont été identifiés

**Recalcul temps-réel multi-sources**
- Toute mutation côté détail (add source / upload CSV / change isotope) déclenche un POST vers le backend qui ré-exécute le pipeline et renvoie le nouveau `detectors[id].fit`
- Le frontend met à jour la régression linéaire, le `result-card`, et les histogrammes sans reload
- Persistance du résultat dans `data/calibrations.json` après chaque update (le backend remplace `localStorage` comme source de vérité)

**Export**
- Bouton "Export CSV" → coefficients + incertitudes pour le détecteur courant (route `GET /api/detectors/<id>/export?format=csv`)
- Bouton "Export PDF" → rapport avec tous les graphes (optionnel, via `weasyprint` ou impression navigateur)
- Bouton "Recalibrate" sur le `result-card` qui force un re-fit complet

---

### Long terme — Robustesse, ergonomie, packaging (≈ 1–2 semaines supplémentaires)

**Qualité d'analyse**
- Détection et signalement visuel des fits qui divergent (badge rouge "Fit failed" sur la carte du home)
- Paramètres initiaux configurables (champ avancé dans l'accordéon source, pour donner un coup de pouce au `curve_fit`)
- Résidus du fit gaussien affichés sous chaque histogramme NaI
- Comparaison visuelle entre deux sessions de calibration (overlay des régressions linéaires)

**UX**
- **Drag-and-drop fonctionnel** sur les zones d'upload (event listeners `dragover`/`drop`)
- **Détection automatique de l'isotope** depuis le nom du fichier CSV (regex `nai_cs137_*` → ¹³⁷Cs, etc.)
- Mode **"re-calibrate"** : rouvrir une session passée, modifier une source, ré-exécuter le pipeline
- Icônes Tabler chargées via CDN (actuellement les balises `<i class="ti ti-*">` n'affichent rien — les icônes sont absentes)
- Indicateur de progression pendant les uploads/fits longs (spinner ou barre)

**Technique**
- Packaging en exécutable standalone avec `pyinstaller` (zéro dépendance à installer pour l'équipe)
- Alternative : `Makefile` + `requirements.txt` pour un `make run` simple sur Linux/macOS
- Tests d'intégration end-to-end (upload CSV → fit → JSON response → DOM update) avec Playwright ou similaire
- Migration éventuelle des `<script>` vers des **modules ES6** (`type="module"`, `import`/`export`) si le code dépasse ~1500 lignes
- Versionnage de `STORAGE_KEY` à chaque changement de shape de `detectors[]` (déjà à v2 — bumper à v3 si on ajoute des champs)

---

## Notes importantes pour Claude Code

- **Pas de framework JS** — JS vanilla uniquement, pas de React/Vue. Les `fetch()` sont simples.
- **Plotly.js via CDN** dans le HTML, pas de bundler.
- **Tout le calcul scientifique reste en Python** (Flask/scipy). Le frontend ne fait que visualiser du JSON.
- Les fits doivent retourner les **incertitudes** (σ) en plus des valeurs centrales — c'est critique pour E(ADC).
- Commencer par faire tourner le pipeline complet sur **un seul isotope (¹³⁷Cs, 1 pic)** avant de généraliser.
- Le fichier `data/calibrations.json` doit être ignoré par git (`.gitignore`) — données de labo locales.
- **Shape `detectors[]` actuelle** (versionnée `x17-detectors-v2` dans `localStorage`) :
  ```js
  {
    id: 0,
    status: 'ok' | 'old',           // dot vert / gris sur la carte home
    fit: {a, sigA, b, sigB, r2, rms, points},
    sources: [{isotope: '¹³⁷Cs'}, ...]   // extensible avec {files: {nai, up, down}}
  }
  ```
  Toute modification de cette shape doit bumper le `STORAGE_KEY` dans `data.js` pour invalider les anciens caches navigateur.
- **Découpe des scripts** : `data.js` ne touche jamais au DOM, `shared.js` est chargé partout, `home.js` et `detector.js` sont mutuellement exclusifs (chargés selon la page). Le routing init dans `shared.js` utilise `typeof X === 'function'` pour appeler la bonne render-fn.
- Quand `charts.js` sera supprimé (passage à Plotly), retirer aussi son `<script>` de `detector.html`.
