import { useProgress } from '@react-three/drei'
import { useMemo, useState } from 'react'
import Viewer from './Viewer'
import { useAtlas, type MeshInfo, type ViewName } from './store'
import { LAYERS, LAYER_BY_ID, colorFor } from './layers'
import content from './data/structures.json'

interface Entry { name: string; latin: string; group: string; summary: string; origin?: string; insertion?: string; innervation?: string; action?: string; fibres?: string }
const CONTENT = content as Record<string, Entry>
const sideLabel = (s: MeshInfo['side']) => (s === 'left' ? 'Left' : s === 'right' ? 'Right' : '')
const displayName = (m: MeshInfo) => `${CONTENT[m.structureId]?.name ?? m.structureId}${m.side !== 'midline' ? ` (${sideLabel(m.side).toLowerCase()})` : ''}`

function Loader() {
  const { progress, active } = useProgress()
  const ready = useAtlas((s) => s.meshes.length > 0)
  if (ready && !active) return null
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3">
      <div className="h-1 w-48 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-sky-400 transition-all" style={{ width: `${Math.max(progress, 4)}%` }} /></div>
      <div className="text-xs tracking-widest text-slate-400 uppercase">Loading anatomy · {Math.round(progress)}%</div>
    </div>
  )
}

function Eye({ on }: { on: boolean }) {
  return on ? (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.9 17.9A10.4 10.4 0 0 1 12 19c-7 0-11-7-11-7a19 19 0 0 1 5.1-5.9M9.9 4.2A9.8 9.8 0 0 1 12 4c7 0 11 7 11 7a19 19 0 0 1-2.2 3.2M1 1l22 22" /></svg>
  )
}

function LayerPanel({ onClose }: { onClose?: () => void }) {
  const layers = useAtlas((s) => s.layers)
  const meshes = useAtlas((s) => s.meshes)
  const hidden = useAtlas((s) => s.hidden)
  const isolated = useAtlas((s) => s.isolated)
  const { toggleLayer, setOpacity, showAll, reset } = useAtlas.getState()
  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const m of meshes) c[m.layer] = (c[m.layer] ?? 0) + 1
    return c
  }, [meshes])
  const nHidden = Object.keys(hidden).length
  return (
    <div className="glass flex flex-col gap-1 rounded-2xl p-3 shadow-2xl">
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold tracking-[0.18em] text-slate-400 uppercase">Layers</span>
        {onClose && <button onClick={onClose} className="rounded-md px-2 text-slate-400 hover:text-white" aria-label="Close layers">✕</button>}
      </div>
      {LAYERS.map((l) => {
        const st = layers[l.id]
        return (
          <div key={l.id} className={`rounded-xl px-2 py-2 transition ${st.visible ? 'bg-white/[0.03]' : 'opacity-50'}`} data-layer={l.id}>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color, boxShadow: `0 0 8px ${l.color}88` }} />
              <span className="flex-1 text-sm text-slate-100">{l.label}</span>
              <span className="text-[11px] text-slate-500 tabular-nums">{counts[l.id] ?? 0}</span>
              <button aria-label={`Toggle ${l.label}`} data-toggle={l.id} onClick={() => toggleLayer(l.id)} className={`rounded-md p-1 ${st.visible ? 'text-sky-300 hover:bg-white/10' : 'text-slate-500 hover:bg-white/10'}`}><Eye on={st.visible} /></button>
            </div>
            <div className="mt-1.5 flex items-center gap-2 pl-4">
              <input type="range" min={0} max={100} value={Math.round(st.opacity * 100)} onChange={(e) => setOpacity(l.id, Number(e.target.value) / 100)} className="h-1 flex-1" aria-label={`${l.label} opacity`} data-opacity={l.id} />
              <span className="w-8 text-right text-[11px] text-slate-400 tabular-nums">{Math.round(st.opacity * 100)}%</span>
            </div>
          </div>
        )
      })}
      <div className="mt-2 flex gap-2">
        <button onClick={showAll} disabled={!nHidden && !isolated} className="flex-1 rounded-lg bg-white/5 px-2 py-1.5 text-xs text-slate-200 hover:bg-white/10 disabled:opacity-40">{isolated ? 'Exit isolate' : `Show hidden${nHidden ? ` (${nHidden})` : ''}`}</button>
        <button onClick={reset} className="flex-1 rounded-lg bg-white/5 px-2 py-1.5 text-xs text-slate-200 hover:bg-white/10">Reset all</button>
      </div>
    </div>
  )
}

function Row({ k, v }: { k: string; v?: string }) {
  if (!v) return null
  return (
    <div className="grid grid-cols-[88px_1fr] gap-2 border-t border-white/5 py-1.5 text-[13px]">
      <span className="text-slate-500">{k}</span>
      <span className="text-slate-200">{v}</span>
    </div>
  )
}

function InfoPanel() {
  const selected = useAtlas((s) => s.selected)
  const meshes = useAtlas((s) => s.meshes)
  const isolated = useAtlas((s) => s.isolated)
  const { select, hide, isolate, focus, showAll } = useAtlas.getState()
  const m = meshes.find((x) => x.id === selected)
  if (!m) return null
  const c = CONTENT[m.structureId]
  const layer = LAYER_BY_ID[m.layer]
  const pair = meshes.filter((x) => x.structureId === m.structureId).map((x) => x.id)
  return (
    <div className="glass flex max-h-full flex-col rounded-2xl shadow-2xl" data-testid="info-panel">
      <div className="flex items-start gap-3 p-4 pb-2">
        <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full" style={{ background: colorFor(m.structureId, m.layer) }} />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg leading-tight font-semibold text-white" data-testid="info-name">{c?.name ?? m.structureId}</h2>
          <p className="mt-0.5 text-sm text-sky-300/90 italic">{c?.latin}</p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
            <span className="rounded-full bg-white/8 px-2 py-0.5 text-slate-300">{layer.label}</span>
            {c?.group && <span className="rounded-full bg-white/8 px-2 py-0.5 text-slate-300">{c.group}</span>}
            {m.side !== 'midline' && <span className="rounded-full bg-sky-400/15 px-2 py-0.5 text-sky-200">{sideLabel(m.side)} side</span>}
          </div>
        </div>
        <button onClick={() => select(null)} className="rounded-md px-2 text-slate-400 hover:text-white" aria-label="Close">✕</button>
      </div>
      <div className="scroll-thin overflow-y-auto px-4 pb-3">
        <p className="text-[13px] leading-relaxed text-slate-300">{c?.summary}</p>
        <div className="mt-2">
          <Row k="Origin" v={c?.origin} />
          <Row k="Insertion" v={c?.insertion} />
          <Row k="Innervation" v={c?.innervation} />
          <Row k="Action" v={c?.action} />
          <Row k="Fibres" v={c?.fibres} />
        </div>
        <p className="mt-2 font-mono text-[10px] text-slate-600">id: {m.id} · source: {m.sourceNames}</p>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-white/5 p-3">
        <button onClick={() => focus(m.id)} className="rounded-lg bg-sky-500/20 px-3 py-1.5 text-xs font-medium text-sky-200 hover:bg-sky-500/30">Focus</button>
        {isolated ? (
          <button onClick={showAll} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10">Exit isolate</button>
        ) : (
          <>
            <button onClick={() => isolate([m.id])} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10">Isolate</button>
            {pair.length > 1 && <button onClick={() => isolate(pair)} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10">Isolate both sides</button>}
          </>
        )}
        <button onClick={() => hide(m.id)} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10">Hide</button>
      </div>
    </div>
  )
}

function Search() {
  const meshes = useAtlas((s) => s.meshes)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const results = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return []
    return meshes
      .filter((m) => { const c = CONTENT[m.structureId]; return `${c?.name} ${c?.latin} ${c?.group}`.toLowerCase().includes(t) })
      .sort((a, b) => displayName(a).localeCompare(displayName(b)))
      .slice(0, 12)
  }, [q, meshes])
  const pick = (m: MeshInfo) => {
    const s = useAtlas.getState()
    if (!s.layers[m.layer].visible || s.layers[m.layer].opacity < 0.2) s.setOpacity(m.layer, 1)
    s.select(m.id); s.focus(m.id); setQ(''); setOpen(false)
  }
  return (
    <div className="relative w-full">
      <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)} placeholder="Search structures…" className="glass w-full rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-sky-400/50" />
      {open && results.length > 0 && (
        <div className="glass scroll-thin absolute top-full right-0 left-0 z-30 mt-1 max-h-72 overflow-y-auto rounded-xl py-1 shadow-2xl">
          {results.map((m) => (
            <button key={m.id} onClick={() => pick(m)} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-white/10">
              <span className="h-2 w-2 rounded-full" style={{ background: colorFor(m.structureId, m.layer) }} />
              <span className="flex-1 truncate text-slate-200">{displayName(m)}</span>
              <span className="text-[10px] text-slate-500">{LAYER_BY_ID[m.layer].label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const VIEWS: [ViewName, string][] = [['front', 'Front'], ['left', 'Left'], ['right', 'Right'], ['back', 'Back'], ['top', 'Top'], ['oblique', '¾']]

export default function App() {
  const [layersOpen, setLayersOpen] = useState(false)
  const setView = useAtlas((s) => s.setView)
  const hovered = useAtlas((s) => s.hovered)
  const meshes = useAtlas((s) => s.meshes)
  const hoverInfo = meshes.find((m) => m.id === hovered)
  return (
    <div className="fixed inset-0 overflow-hidden">
      <div className="absolute inset-0"><Viewer /></div>
      <Loader />

      {/* top bar */}
      <header className="pointer-events-none absolute top-0 right-0 left-0 flex flex-wrap items-start gap-3 p-3 sm:p-4">
        <div className="pointer-events-auto flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 text-sm font-bold text-white shadow-lg shadow-sky-500/20">H3</div>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold text-white">Human Atlas 3D</div>
            <div className="text-[11px] tracking-wide text-slate-400">Head &amp; face · prototype</div>
          </div>
        </div>
        <div className="pointer-events-auto order-3 w-full sm:order-none sm:ml-auto sm:w-72"><Search /></div>
        <button onClick={() => setLayersOpen((v) => !v)} className="glass pointer-events-auto ml-auto rounded-xl px-3 py-2 text-sm text-slate-200 sm:hidden">Layers</button>
      </header>

      {/* layers: desktop */}
      <aside className="absolute top-20 left-4 hidden w-64 sm:block"><LayerPanel /></aside>
      {/* layers: mobile drawer */}
      {layersOpen && <aside className="absolute top-28 right-3 left-3 z-20 sm:hidden"><LayerPanel onClose={() => setLayersOpen(false)} /></aside>}

      {/* info */}
      <aside className={`absolute right-3 bottom-28 left-3 z-10 ${layersOpen ? 'hidden sm:block' : ''} max-h-[46vh] sm:top-20 sm:right-4 sm:bottom-auto sm:left-auto sm:max-h-[calc(100vh-150px)] sm:w-[360px]`}><InfoPanel /></aside>

      {/* hover label (desktop) */}
      {hoverInfo && <div className="glass pointer-events-none absolute bottom-20 left-1/2 hidden -translate-x-1/2 rounded-full px-3 py-1 text-xs text-slate-200 sm:block">{displayName(hoverInfo)}</div>}

      {/* view buttons */}
      <div className="absolute bottom-14 left-1/2 flex -translate-x-1/2 gap-1 sm:bottom-6">
        <div className="glass flex gap-0.5 rounded-xl p-1">
          {VIEWS.map(([v, l]) => (
            <button key={v} onClick={() => setView(v)} className="rounded-lg px-2.5 py-1 text-xs text-slate-300 hover:bg-white/10 hover:text-white">{l}</button>
          ))}
        </div>
      </div>

      {/* credit */}
      <footer className="absolute right-0 bottom-0 left-0 flex items-end justify-between gap-3 px-3 pb-1.5 text-[10px] text-slate-500">
        <span>
          3D models: <a className="underline hover:text-slate-300" href="https://www.z-anatomy.com/" target="_blank" rel="noreferrer">Z-Anatomy</a> (based on BodyParts3D), licensed{' '}
          <a className="underline hover:text-slate-300" href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>. <span className="hidden sm:inline">Head subset extracted, decimated &amp; compressed. </span>Educational prototype, not for clinical use.
        </span>
        <span id="fps" className="shrink-0 tabular-nums" />
      </footer>
    </div>
  )
}
