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
├── app.py                  # Flask — routes et upload CSV
├── analysis/
│   ├── __init__.py
│   ├── io.py               # parse_csv(), validate_columns()
│   ├── fitting.py          # fit_gaussian(), fit_erfc()
│   └── calibration.py      # linear_regression_NaI(), build_calibration()
├── static/
│   ├── index.html          # SPA — page d'accueil + new calibration
│   ├── style.css
│   └── app.js              # fetch() vers Flask, Plotly.js rendering
├── data/
│   └── calibrations.json   # persistance locale des sessions
└── requirements.txt
```

**Stack :**
- Backend : **Flask** (Python) — scipy, numpy pour les fits
- Frontend : **HTML/CSS/JS vanilla** + **Plotly.js** (CDN)
- Persistance : fichier JSON local (pas de base de données)

---

## État actuel

- [x] Maquette HTML/CSS/JS interactive complète (mockup statique, sans backend)
- [x] Layout validé : nav + page accueil + vue "New calibration" (1/3 left / 2/3 right)
- [x] Composants UI fonctionnels : accordéons sources, accordéons histogrammes, résultat E(ADC)
- [x] Graphes placeholder dessinés en Canvas (raw, NaI+gauss, scatter U/D+erfc, régression linéaire)
- [ ] Aucun backend — tout est statique

---

## Données d'entrée

Par calibration : **3 fichiers CSV** (un par détecteur) + identité de l'isotope source.

| Fichier | Détecteur | Contenu attendu |
|---------|-----------|-----------------|
| `nai_*.csv` | NaI | Colonnes : `channel`, `counts` |
| `up_*.csv` | PMT Up (U) | Colonnes : `channel`, `counts` (ou `adc`, `n`) |
| `down_*.csv` | PMT Down (D) | Colonnes : `channel`, `counts` |

Isotopes supportés : ¹³⁷Cs · ⁶⁰Co · ²⁰⁴Bi · ²²⁸Th (énergies de référence connues et codées en dur).

Plusieurs sources peuvent être ajoutées à une même session de calibration — chaque source ajoute
une rangée dans chaque section d'histogramme et un point supplémentaire à la régression linéaire.

---

## Prochaines étapes

### Court terme — Fondations (≈ 3–5 jours)

**Étape 1 — Structure Flask de base (½ journée)**
- Créer `app.py` avec une route `GET /` servant `index.html`
- Route `POST /upload` recevant les 3 CSV + métadonnées (nom source, isotope)
- Réponse JSON brute (juste les données parsées, pas encore de fit)

**Étape 2 — Module `analysis/io.py` (½ journée)**
- `parse_csv(file)` → DataFrame normalisé
- `validate_columns(df)` → erreur claire si colonnes manquantes ou mauvais format
- Tests unitaires sur des CSV synthétiques

**Étape 3 — Fit gaussien NaI (1 journée)**
- `fit_gaussian(channels, counts, n_peaks)` → µ, σ, amplitude, incertitudes
- Détection automatique des pics (scipy `find_peaks`) + fit `curve_fit`
- Retourne aussi les points de la courbe fit pour Plotly
- Tester sur un CSV réel de ¹³⁷Cs (1 pic) et ²²⁸Th (2 pics)

**Étape 4 — Wiring frontend → backend (1 journée)**
- Remplacer les Canvas placeholder par de vrais graphes Plotly.js
- Le `fetch('/upload', {method:'POST', body: formData})` retourne du JSON
- Plotly.js consomme le JSON et rend l'histogramme brut + NaI+gauss
- Les accordéons histogrammes s'ouvrent seulement quand les données sont prêtes

**Étape 5 — Persistance JSON (½ journée)**
- Après une calibration réussie, sauvegarder dans `data/calibrations.json`
- La page d'accueil charge ce fichier au démarrage et affiche les sessions passées

---

### Moyen terme — Analyse complète (≈ 1–2 semaines)

**Fit erfc sur scatter U/D**
- `fit_erfc(adc_U, adc_D)` → paramètres erfc, point de coupure α
- Scatter plot Plotly avec courbe erfc superposée

**Régression linéaire E(ADC)**
- `linear_regression(adc_peaks, energies_ref)` → a, b, σ_a, σ_b, R²
- Bande de confiance 95% sur le graphe Plotly
- Points colorés par isotope source
- Équation E(ADC) = (a ± σ_a)·ADC + (b ± σ_b) affichée en haut du panneau droit

**Gestion multi-sources dynamique**
- "Add source" ajoute un bloc accordéon côté gauche via JS
- Chaque source uploadée met à jour la régression linéaire en temps réel
- Les histogrammes s'organisent par source dans chaque section accordéon

**Export**
- Bouton "Export CSV" → coefficients de calibration + incertitudes
- Bouton "Export PDF" → rapport de calibration avec tous les graphes (optionnel, via `weasyprint` ou impression navigateur)

---

### Long terme — Robustesse et ergonomie (≈ 1–2 semaines supplémentaires)

**Qualité d'analyse**
- Gestion des fits qui divergent (alertes visuelles, paramètres initiaux configurables)
- Comparaison visuelle entre deux sessions de calibration
- Résidus du fit gaussien affichés sous chaque histogramme

**UX**
- Drag-and-drop fonctionnel sur les zones d'upload
- Détection automatique de l'isotope depuis le nom du fichier CSV (pattern matching)
- Mode "re-calibrate" : recharger une session existante et modifier une source

**Technique**
- Packaging en exécutable standalone avec `pyinstaller` (zéro dépendance à installer pour l'équipe)
- Ou `Makefile` + `requirements.txt` pour un `make run` simple

---

## Notes importantes pour Claude Code

- **Pas de framework JS** — JS vanilla uniquement, pas de React/Vue. Les `fetch()` sont simples.
- **Plotly.js via CDN** dans le HTML, pas de bundler.
- **Tout le calcul scientifique reste en Python** (Flask/scipy). Le frontend ne fait que visualiser du JSON.
- Les fits doivent retourner les **incertitudes** (σ) en plus des valeurs centrales — c'est critique pour E(ADC).
- Commencer par faire tourner le pipeline complet sur **un seul isotope (¹³⁷Cs, 1 pic)** avant de généraliser.
- Le fichier `data/calibrations.json` doit être ignoré par git (`.gitignore`) — données de labo locales.
