# Patch audio · Auditorium des Grandes Serres

Site pour accueillir un artiste : on saisit son patch, et le site dit où brancher chaque ligne
(Rio du plateau, boîtier AV du mur ou micro HF), quels cordons poser aux deux Ghielmetti,
quels abonnements faire dans Dante Controller, où activer la fantôme, et comment brancher
les retours (XT22), les front fills (XT1) et le RTP MIDI.

Site statique HTML + JS (pas de build), même principe que Salle 3D. Accès par mot de passe
(`middleware.js`, variable `SITE_PASSWORD` dans Vercel).

## Fichiers

| Fichier | Rôle |
|---|---|
| `js/data.js` | l'installation : boîtiers, numéros de câbles, Ghielmetti, liaisons, Rio, matrices, parc micros |
| `js/route.js` | le calcul des chemins (fonction pure, testée) |
| `js/app.js` | l'interface |
| `js/baies.js` | l'onglet « Baies » : racks nodal / régie et patchs dessinés point par point avec les cordons du jour |
| `js/learn.js` | l'onglet « Comprendre » (schéma + Dante) |
| `boitiers/` | plaques et tableaux de circuits des boîtiers, repris de Salle 3D |
| `tests/` | `npm test` |

## Données à vérifier sur place

Source : synoptique LGS2-INE-EXE-22-SCH-AUD-TN-8001, indice 0, photo de la baie nodal et
tableau « Régies Auditorium ». Marqués `verifier: true` : BAV-21 et BAV-22 (numéros de câbles).
À confirmer aussi : la liaison entre les switchs Contrôle 1 (nodal) et Contrôle 2 (régie), et
les hauteurs exactes des modules de la baie nodal.

## Déployer

1. Dépôt GitHub `patch-auditorium` (privé).
2. Vercel : Add New → Project → importer le dépôt, Framework « Other ».
3. Settings → Environment Variables : `SITE_PASSWORD`, puis redéployer.
