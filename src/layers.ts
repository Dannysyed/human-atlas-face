export type LayerId = 'skin' | 'muscles' | 'eyes' | 'vessels' | 'nerves' | 'bones'

export interface LayerDef { id: LayerId; label: string; color: string; defaultOpacity: number; defaultVisible: boolean; order: number }

// order: lower = drawn first (deeper)
export const LAYERS: LayerDef[] = [
  { id: 'skin', label: 'Skin', color: '#d8a58a', defaultOpacity: 0.3, defaultVisible: true, order: 5 },
  { id: 'muscles', label: 'Muscles', color: '#c0443f', defaultOpacity: 1, defaultVisible: true, order: 4 },
  { id: 'eyes', label: 'Eyes & glands', color: '#e7c27d', defaultOpacity: 1, defaultVisible: true, order: 3 },
  { id: 'vessels', label: 'Vessels', color: '#e04646', defaultOpacity: 1, defaultVisible: true, order: 2 },
  { id: 'nerves', label: 'Nerves', color: '#f4d03f', defaultOpacity: 1, defaultVisible: true, order: 1 },
  { id: 'bones', label: 'Bones & teeth', color: '#e9dfc9', defaultOpacity: 1, defaultVisible: true, order: 0 },
]
export const LAYER_BY_ID = Object.fromEntries(LAYERS.map((l) => [l.id, l])) as Record<LayerId, LayerDef>

/** colour per structure (stable anatomical id without side suffix) */
export function colorFor(structureId: string, layer: LayerId): string {
  if (layer === 'vessels') return /_vein|veins$/.test(structureId) ? '#3d6fd6' : '#d93a3a'
  if (layer === 'eyes') {
    if (structureId === 'organ.eyeball') return '#eef1f4'
    if (structureId === 'organ.parotid_duct') return '#f0d9a8'
    return '#d9a35f'
  }
  if (layer === 'bones') {
    if (structureId.endsWith('_teeth')) return '#f7f3ea'
    if (structureId.includes('cartilage')) return '#b9d3e0'
    return '#e6dac2'
  }
  if (layer === 'muscles') {
    if (structureId === 'muscle.epicranial_aponeurosis') return '#d9cfc0'
    return '#b8433d'
  }
  if (layer === 'nerves') return '#f2cf3c'
  return LAYER_BY_ID[layer].color
}
