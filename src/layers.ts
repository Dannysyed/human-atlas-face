export type LayerId = 'skin' | 'muscles' | 'eyes' | 'vessels' | 'nerves' | 'bones' | 'brain'

export interface LayerDef { id: LayerId; label: string; color: string; defaultOpacity: number; defaultVisible: boolean; order: number; explode: number }

// order: lower = deeper (drawn first). explode: how far the layer travels when exploded (outer layers further)
export const LAYERS: LayerDef[] = [
  { id: 'skin', label: 'Skin', color: '#d8a58a', defaultOpacity: 0.3, defaultVisible: true, order: 6, explode: 2.2 },
  { id: 'muscles', label: 'Muscles', color: '#c0443f', defaultOpacity: 1, defaultVisible: true, order: 5, explode: 1.6 },
  { id: 'eyes', label: 'Eyes, glands & sinuses', color: '#e7c27d', defaultOpacity: 1, defaultVisible: true, order: 4, explode: 1.1 },
  { id: 'vessels', label: 'Vessels', color: '#e04646', defaultOpacity: 1, defaultVisible: true, order: 3, explode: 1.3 },
  { id: 'nerves', label: 'Nerves', color: '#f4d03f', defaultOpacity: 1, defaultVisible: true, order: 2, explode: 1.2 },
  { id: 'bones', label: 'Bones & teeth', color: '#e9dfc9', defaultOpacity: 1, defaultVisible: true, order: 1, explode: 0.7 },
  { id: 'brain', label: 'Brain & dura', color: '#e8b4b8', defaultOpacity: 1, defaultVisible: false, order: 0, explode: 0.2 },
]
export const LAYER_BY_ID = Object.fromEntries(LAYERS.map((l) => [l.id, l])) as Record<LayerId, LayerDef>

export function colorFor(structureId: string, layer: LayerId): string {
  if (layer === 'vessels') {
    if (structureId.endsWith('_sinus')) return '#3557a8'
    return /_vein|veins$/.test(structureId) ? '#3d6fd6' : '#d93a3a'
  }
  if (layer === 'eyes') {
    if (structureId === 'organ.eyeball') return '#eef1f4'
    if (structureId === 'organ.tongue') return '#c7646a'
    if (/sinus|ethmoidal_cells/.test(structureId)) return '#9fd3e6'
    if (/lacrimal_sac|nasolacrimal|parotid_duct/.test(structureId)) return '#f0d9a8'
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
  if (layer === 'brain') return structureId === 'brain.falx_cerebri' ? '#c9c2d6' : '#e3b3ae'
  return LAYER_BY_ID[layer].color
}
