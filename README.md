# Human Atlas 3D — Head & Face prototype

Interactive 3D head/face anatomy viewer (React + TypeScript + Vite, three.js, @react-three/fiber, drei, Zustand, Tailwind). No backend.

- Rotate / zoom / pan, view presets (front, left, right, back, top, ¾)
- 6 layers (skin, muscles, eyes & glands, vessels, nerves, bones & teeth) with toggle + opacity slider
- Click a structure → highlight + info panel (name, Latin/TA name, summary; origin, insertion, innervation, action for muscles)
- Isolate / isolate both sides / hide / show hidden / reset, search, focus
- **v2**: facial nerve (CN VII) split into clickable pieces per side — root & trunk, temporal, zygomatic, buccal,
  marginal mandibular, cervical (+ chorda tympani, a separate source mesh). Z-Anatomy has no separate branch meshes,
  so the pieces are a geometric split of the source mesh (`split_facial()` in `pipeline/build_glb.py`); boundaries are approximate.
  Trunk → "Highlight all branches" (pulsing glow + travelling nerve-impulse shader).
- **v2 detail**: brain & dura layer (hemispheres, cerebellum, brainstem, corpus callosum, falx), tongue + extrinsic
  tongue muscles, frontal/sphenoidal sinuses + ethmoidal cells, nasolacrimal apparatus, sublingual gland, more arteries,
  veins and dural venous sinuses; muscle origin (red) / insertion (blue) attachment markers from Z-Anatomy;
  blood supply, nerve supply and clinical notes in the info panel.
- **v2 lively**: auto-rotate + idle breathing, smooth fly-to on select, outline + glow on selection, floating 3D label
  with leader line, animated explode slider, physical materials + SSAO (N8AO), 8 facial-expression demos
  (muscles glow, nerve branches pulse), High/Lite quality toggle (Lite auto on small/low-core devices, `?quality=lite|high`).

## Data
- `public/models/head.glb` — ~410 meshes (327 with anatomy IDs, left/right kept separate, plus attachment markers), Draco-compressed (~3.4 MB, ~940k triangles).
- `public/models/head-lite.glb` — simplified version for the Lite quality setting (~2.0 MB, ~424k triangles).
  Facial-nerve pieces have extras `group: "nerve.facial_nerve"`; markers have `markerFor`, `markerType` (origin/insertion).
  Every glTF node carries `extras` with a stable anatomical ID (`anatomyId`, e.g. `muscle.zygomaticus_major.l`),
  `structureId` (side-independent), `layer`, `side`, `sourceNames`. The app never relies on three.js UUIDs.
- `src/data/structures.json` — static content keyed by `structureId`.

## Pipeline (`pipeline/`)
1. Download Z-Anatomy FBX files (https://github.com/LluisV/Z-Anatomy/tree/PC-Version/Resources/Models/FBX).
2. `blender -b -P pipeline/build_glb.py -- head_raw.glb` (structure list in `pipeline/config.py`; applies transforms,
   subdivides skin, decimates heavy meshes, writes extras).
3. `gltf-transform weld head_raw.glb w.glb && gltf-transform draco w.glb public/models/head.glb`
   Lite: `gltf-transform simplify w.glb lo.glb --ratio 0.4 --error 0.004 && gltf-transform draco lo.glb public/models/head-lite.glb`
4. `python pipeline/content.py` regenerates `src/data/structures.json`.

## Deploy
GitHub Pages from the `gh-pages` branch (Vite `base: './'`): `npm run build && touch dist/.nojekyll`, then push `dist/` to `gh-pages`.
Live: https://dannysyed.github.io/human-atlas-face/

## Licence / attribution
3D models: **Z-Anatomy** (based on BodyParts3D, © DBCLS), **CC BY-SA 4.0**. The derived `head.glb` is shared under
CC BY-SA 4.0 (see `public/models/ATTRIBUTION.txt`). Educational prototype — not for clinical use.
