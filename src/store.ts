import { create } from 'zustand'
import { LAYERS, type LayerId } from './layers'

export interface MeshInfo { id: string; structureId: string; layer: LayerId; side: 'left' | 'right' | 'midline'; sourceNames: string; group?: string }
type LayerState = Record<LayerId, { visible: boolean; opacity: number }>
export type ViewName = 'front' | 'left' | 'right' | 'back' | 'top' | 'oblique'
export type Quality = 'high' | 'lite'

const initialLayers = (): LayerState =>
  Object.fromEntries(LAYERS.map((l) => [l.id, { visible: l.defaultVisible, opacity: l.defaultOpacity }])) as LayerState

const defaultQuality = (): Quality => {
  if (typeof window === 'undefined') return 'high'
  const q = new URLSearchParams(window.location.search).get('quality')
  if (q === 'high' || q === 'lite') return q
  const small = window.innerWidth < 768
  const weak = (navigator.hardwareConcurrency ?? 8) <= 4
  return small || weak ? 'lite' : 'high'
}

interface State {
  meshes: MeshInfo[]
  layers: LayerState
  selected: string | null
  selectedPoint: [number, number, number] | null
  hovered: string | null
  hidden: Record<string, true>
  isolated: string[] | null
  highlight: string[] | null
  expression: string | null
  explode: number
  autoRotate: boolean
  quality: Quality
  camCmd: { kind: 'view'; view: ViewName; n: number } | { kind: 'focus'; id: string; n: number } | null
  setMeshes: (m: MeshInfo[]) => void
  toggleLayer: (l: LayerId) => void
  setOpacity: (l: LayerId, o: number) => void
  select: (id: string | null, point?: [number, number, number] | null) => void
  hover: (id: string | null) => void
  hide: (id: string) => void
  isolate: (ids: string[]) => void
  setHighlight: (ids: string[] | null) => void
  setExpression: (id: string | null) => void
  setExplode: (v: number) => void
  setAutoRotate: (v: boolean) => void
  setQuality: (q: Quality) => void
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
  selectedPoint: null,
  hovered: null,
  hidden: {},
  isolated: null,
  highlight: null,
  expression: null,
  explode: 0,
  autoRotate: true,
  quality: defaultQuality(),
  camCmd: null,
  setMeshes: (meshes) => set({ meshes }),
  toggleLayer: (l) => set((s) => ({ layers: { ...s.layers, [l]: { ...s.layers[l], visible: !s.layers[l].visible } } })),
  setOpacity: (l, o) => set((s) => ({ layers: { ...s.layers, [l]: { visible: o > 0 ? true : s.layers[l].visible, opacity: o } } })),
  select: (id, point = null) => set((s) => ({ selected: id, selectedPoint: point, highlight: id && s.highlight?.includes(id) ? s.highlight : null })),
  hover: (id) => set({ hovered: id }),
  hide: (id) => set((s) => ({ hidden: { ...s.hidden, [id]: true }, selected: s.selected === id ? null : s.selected, isolated: s.isolated ? s.isolated.filter((x) => x !== id) : null })),
  isolate: (ids) => set((s) => {
    const layers = { ...s.layers }
    for (const m of s.meshes) if (ids.includes(m.id)) layers[m.layer] = { visible: true, opacity: Math.max(layers[m.layer].opacity, 0.6) }
    return { isolated: ids, layers, hidden: {}, expression: null }
  }),
  setHighlight: (ids) => set({ highlight: ids }),
  setExpression: (id) => set({ expression: id, isolated: null, highlight: null, selected: null, autoRotate: false, camCmd: id ? { kind: 'view', view: 'front', n: ++n } : null }),
  setExplode: (explode) => set({ explode }),
  setAutoRotate: (autoRotate) => set({ autoRotate }),
  setQuality: (quality) => set({ quality }),
  showAll: () => set({ hidden: {}, isolated: null, highlight: null }),
  reset: () => set({ hidden: {}, isolated: null, highlight: null, expression: null, selected: null, selectedPoint: null, explode: 0, layers: initialLayers(), camCmd: { kind: 'view', view: 'oblique', n: ++n } }),
  setView: (view) => set({ camCmd: { kind: 'view', view, n: ++n } }),
  focus: (id) => set({ camCmd: { kind: 'focus', id, n: ++n } }),
}))
