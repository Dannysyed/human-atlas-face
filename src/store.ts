import { create } from 'zustand'
import { LAYERS, type LayerId } from './layers'

export interface MeshInfo { id: string; structureId: string; layer: LayerId; side: 'left' | 'right' | 'midline'; sourceNames: string }
type LayerState = Record<LayerId, { visible: boolean; opacity: number }>
export type ViewName = 'front' | 'left' | 'right' | 'back' | 'top' | 'oblique'

const initialLayers = (): LayerState =>
  Object.fromEntries(LAYERS.map((l) => [l.id, { visible: l.defaultVisible, opacity: l.defaultOpacity }])) as LayerState

interface State {
  meshes: MeshInfo[]
  layers: LayerState
  selected: string | null
  hovered: string | null
  hidden: Record<string, true>
  isolated: string[] | null
  camCmd: { kind: 'view'; view: ViewName; n: number } | { kind: 'focus'; id: string; n: number } | null
  setMeshes: (m: MeshInfo[]) => void
  toggleLayer: (l: LayerId) => void
  setOpacity: (l: LayerId, o: number) => void
  select: (id: string | null) => void
  hover: (id: string | null) => void
  hide: (id: string) => void
  isolate: (ids: string[]) => void
  showAll: () => void
  reset: () => void
  setView: (v: ViewName) => void
  focus: (id: string) => void
}

let n = 0
export const useAtlas = create<State>((set) => ({
  meshes: [],
  layers: initialLayers(),
  selected: null,
  hovered: null,
  hidden: {},
  isolated: null,
  camCmd: null,
  setMeshes: (meshes) => set({ meshes }),
  toggleLayer: (l) => set((s) => ({ layers: { ...s.layers, [l]: { ...s.layers[l], visible: !s.layers[l].visible } } })),
  setOpacity: (l, o) => set((s) => ({ layers: { ...s.layers, [l]: { visible: o > 0 ? true : s.layers[l].visible, opacity: o } } })),
  select: (id) => set({ selected: id }),
  hover: (id) => set({ hovered: id }),
  hide: (id) => set((s) => ({ hidden: { ...s.hidden, [id]: true }, selected: s.selected === id ? null : s.selected, isolated: s.isolated ? s.isolated.filter((x) => x !== id) : null })),
  isolate: (ids) => set((s) => {
    // make sure the layers of isolated structures are visible
    const layers = { ...s.layers }
    for (const m of s.meshes) if (ids.includes(m.id)) layers[m.layer] = { visible: true, opacity: Math.max(layers[m.layer].opacity, 0.6) }
    return { isolated: ids, layers, hidden: {} }
  }),
  showAll: () => set({ hidden: {}, isolated: null }),
  reset: () => set({ hidden: {}, isolated: null, selected: null, layers: initialLayers(), camCmd: { kind: 'view', view: 'oblique', n: ++n } }),
  setView: (view) => set({ camCmd: { kind: 'view', view, n: ++n } }),
  focus: (id) => set({ camCmd: { kind: 'focus', id, n: ++n } }),
}))
