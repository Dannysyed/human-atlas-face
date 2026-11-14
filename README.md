# Human Atlas 3D — Head & Face prototype

Interactive 3D head/face anatomy viewer (React + TypeScript + Vite, three.js, @react-three/fiber, drei, Zustand, Tailwind). No backend.

- Rotate / zoom / pan, view presets (front, left, right, back, top, ¾)
- 6 layers (skin, muscles, eyes & glands, vessels, nerves, bones & teeth) with toggle + opacity slider
- Click a structure → highlight + info panel (name, Latin/TA name, summary; origin, insertion, innervation, action for muscles)
- Isolate / isolate both sides / hide / show hidden / reset, search, focus

## Data
- `public/models/head.glb` — 258 meshes (135 distinct structures, left/right kept separate), Draco-compressed (~2.3 MB).
  Every glTF node carries `extras` with a stable anatomical ID (`anatomyId`, e.g. `muscle.zygomaticus_major.l`),
  `structureId` (side-independent), `layer`, `side`, `sourceNames`. The app never relies on three.js UUIDs.
- `src/data/structures.json` — static content keyed by `structureId`.

## Pipeline (`pipeline/`)
1. Download Z-Anatomy FBX files (https://github.com/LluisV/Z-Anatomy/tree/PC-Version/Resources/Models/FBX).
2. `blender -b -P pipeline/build_glb.py -- head_raw.glb` (structure list in `pipeline/config.py`; applies transforms,
   subdivides skin, decimates heavy meshes, writes extras).
3. `gltf-transform weld head_raw.glb w.glb && gltf-transform draco w.glb public/models/head.glb`
4. `python pipeline/content.py` regenerates `src/data/structures.json`.

## Licence / attribution
3D models: **Z-Anatomy** (based on BodyParts3D, © DBCLS), **CC BY-SA 4.0**. The derived `head.glb` is shared under
CC BY-SA 4.0 (see `public/models/ATTRIBUTION.txt`). Educational prototype — not for clinical use.
