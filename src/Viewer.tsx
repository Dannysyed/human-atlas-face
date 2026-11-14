import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Bvh, Environment, Html, Lightformer, Line, OrbitControls, useGLTF } from '@react-three/drei'
import { EffectComposer, N8AO, Outline, Vignette } from '@react-three/postprocessing'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useAtlas, type MeshInfo, type ViewName, type Quality } from './store'
import { LAYER_BY_ID, colorFor, type LayerId } from './layers'
import { EXPRESSION_BY_ID } from './expressions'
import content from './data/structures.json'

const CONTENT = content as Record<string, { name: string; latin: string }>
const BASE = import.meta.env.BASE_URL
const MODEL_URL: Record<Quality, string> = { high: `${BASE}models/head.glb`, lite: `${BASE}models/head-lite.glb` }
const DRACO_URL = `${BASE}draco/`

const SELECT_EMISSIVE = new THREE.Color('#38c8ff')
const GROUP_EMISSIVE = new THREE.Color('#7ee0ff')
const HOVER_EMISSIVE = new THREE.Color('#5b7a99')
const ORIGIN_COLOR = new THREE.Color('#ff5b5b')
const INSERTION_COLOR = new THREE.Color('#4fa8ff')

type AtlasMesh = THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>

/** shared registry so camera rig / labels can find meshes by stable anatomical id (glTF extras), never by uuid */
export const registry = {
  byId: new Map<string, AtlasMesh>(),
  markers: [] as AtlasMesh[],
  headCenter: new THREE.Vector3(),
  root: null as THREE.Object3D | null,
}
const uTime = { value: 0 }

function makeMaterial(layer: LayerId, sid: string, q: Quality) {
  const color = colorFor(sid, layer)
  const p: THREE.MeshPhysicalMaterialParameters = { color, side: THREE.DoubleSide, roughness: 0.5, metalness: 0 }
  if (layer === 'muscles') Object.assign(p, { roughness: 0.48, sheen: 0.7, sheenColor: new THREE.Color('#ff9c8c'), sheenRoughness: 0.45, clearcoat: 0.12, clearcoatRoughness: 0.5 })
  if (layer === 'bones') Object.assign(p, sid.endsWith('_teeth') ? { roughness: 0.18, clearcoat: 0.9, clearcoatRoughness: 0.15 } : { roughness: 0.38, clearcoat: 0.35, clearcoatRoughness: 0.35 })
  if (layer === 'vessels') Object.assign(p, { roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.25 })
  if (layer === 'nerves') Object.assign(p, { roughness: 0.35, clearcoat: 0.4, emissive: new THREE.Color('#3a2c00') })
  if (layer === 'eyes') Object.assign(p, sid === 'organ.eyeball' ? { roughness: 0.08, clearcoat: 1 } : { roughness: 0.45, sheen: 0.4, sheenColor: new THREE.Color('#ffe2b0') })
  if (layer === 'skin') Object.assign(p, { roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color('#ffd0b8') })
  if (layer === 'brain') Object.assign(p, { roughness: 0.6, sheen: 0.5, sheenColor: new THREE.Color('#ffd6d6') })
  if (q === 'lite') {
    // cheaper standard material on low-end devices
    const { sheen: _s, sheenColor: _sc, sheenRoughness: _sr, clearcoat: _c, clearcoatRoughness: _cr, ...std } = p
    void _s; void _sc; void _sr; void _c; void _cr
    return new THREE.MeshStandardMaterial(std) as unknown as THREE.MeshPhysicalMaterial
  }
  return new THREE.MeshPhysicalMaterial(p)
}

function addImpulseShader(mat: THREE.Material, impulse: { value: number }) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime
    shader.uniforms.uImpulse = impulse
    shader.vertexShader = 'attribute float aDist;\nvarying float vDist;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvDist = aDist;')
    shader.fragmentShader = 'uniform float uTime;\nuniform float uImpulse;\nvarying float vDist;\n' + shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
      float ph = fract(vDist * 1.6 - uTime * 0.85);
      float pulse = smoothstep(0.0, 0.06, ph) * smoothstep(0.24, 0.06, ph);
      totalEmissiveRadiance += uImpulse * pulse * vec3(1.0, 0.9, 0.45) * 3.0;`,
    )
  }
  mat.customProgramCacheKey = () => 'nerve-impulse'
}

function Model({ quality, onOutline }: { quality: Quality; onOutline: (o: THREE.Object3D[]) => void }) {
  const { scene } = useGLTF(MODEL_URL[quality], DRACO_URL)
  const setMeshes = useAtlas((s) => s.setMeshes)
  const hover = useAtlas((s) => s.hover)
  const glowing = useRef<{ mesh: AtlasMesh; strong: boolean }[]>([])

  const byId = useMemo(() => {
    const map = new Map<string, AtlasMesh>()
    const markers: AtlasMesh[] = []
    scene.position.set(0, 0, 0)
    const box = new THREE.Box3().setFromObject(scene)
    const center = box.getCenter(new THREE.Vector3())
    scene.traverse((o) => {
      const mesh = o as AtlasMesh
      const ud = o.userData as Record<string, string>
      if (!mesh.isMesh) return
      mesh.geometry.computeBoundingBox()
      mesh.userData.localCenter = mesh.geometry.boundingBox!.getCenter(new THREE.Vector3())
      if (ud.markerFor) {
        mesh.material = new THREE.MeshStandardMaterial({ color: ud.markerType === 'origin' ? ORIGIN_COLOR : INSERTION_COLOR, emissive: ud.markerType === 'origin' ? ORIGIN_COLOR : INSERTION_COLOR, emissiveIntensity: 0.35, roughness: 0.4, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, side: THREE.DoubleSide }) as unknown as THREE.MeshPhysicalMaterial
        mesh.visible = false
        mesh.renderOrder = 10
        mesh.raycast = () => {}
        markers.push(mesh)
        return
      }
      if (!ud.anatomyId) return
      const layer = ud.layer as LayerId
      mesh.material = makeMaterial(layer, ud.structureId, quality)
      mesh.userData.baseEmissive = mesh.material.emissive.clone()
      mesh.renderOrder = LAYER_BY_ID[layer].order
      if (layer === 'nerves') {
        mesh.userData.impulse = { value: 0 }
        addImpulseShader(mesh.material, mesh.userData.impulse)
      }
      map.set(ud.anatomyId, mesh)
    })
    // per-vertex distance from the brainstem drives the nerve-impulse animation (pulses travel proximal -> distal)
    const stem = map.get('brain.brainstem')
    const origin = stem ? (stem.userData.localCenter as THREE.Vector3).clone() : center.clone()
    map.forEach((m) => {
      if (m.userData.layer !== 'nerves') return
      const pos = m.geometry.attributes.position
      const d = new Float32Array(pos.count)
      const v = new THREE.Vector3()
      for (let i = 0; i < pos.count; i++) d[i] = v.fromBufferAttribute(pos, i).distanceTo(origin) * 12
      m.geometry.setAttribute('aDist', new THREE.BufferAttribute(d, 1))
    })
    scene.position.copy(center).multiplyScalar(-1)
    registry.byId = map
    registry.markers = markers
    registry.headCenter.set(0, 0, 0)
    registry.root = scene
    return map
  }, [scene, quality])

  useEffect(() => {
    const infos: MeshInfo[] = []
    byId.forEach((m) => {
      const u = m.userData as Record<string, string>
      infos.push({ id: u.anatomyId, structureId: u.structureId, layer: u.layer as LayerId, side: u.side as MeshInfo['side'], sourceNames: u.sourceNames, group: u.group })
    })
    setMeshes(infos)
    ;(window as unknown as Record<string, unknown>).__atlasReady = true
  }, [byId, setMeshes])

  // store -> materials (imperative; avoids re-rendering hundreds of meshes)
  useEffect(() => {
    const apply = (s: ReturnType<typeof useAtlas.getState>) => {
      const expr = s.expression ? EXPRESSION_BY_ID[s.expression] : null
      const glow: { mesh: AtlasMesh; strong: boolean }[] = []
      const outline: THREE.Object3D[] = []
      byId.forEach((mesh, id) => {
        const u = mesh.userData as Record<string, string>
        const layer = u.layer as LayerId
        const ls = s.layers[layer]
        const isSel = s.selected === id
        const inGroup = !!s.highlight?.includes(id)
        let visible: boolean = ls.visible && ls.opacity > 0.01 && !s.hidden[id]
        let opacity = ls.opacity
        let exprHit = false
        if (s.isolated) { visible = s.isolated.includes(id); opacity = 1 }
        if (expr) {
          if (layer === 'muscles') { exprHit = expr.muscles.includes(u.structureId); visible = true; opacity = exprHit ? 1 : 0.1 }
          else if (layer === 'nerves') { exprHit = expr.nerves.includes(u.structureId); visible = exprHit; opacity = 1 }
          else if (layer === 'skin' || layer === 'vessels' || layer === 'brain') visible = false
          else { visible = ls.visible; opacity = 1 }
        }
        if (isSel || inGroup) { visible = true; opacity = Math.max(opacity, 0.92) }
        mesh.visible = visible
        mesh.userData.effOpacity = opacity
        const mat = mesh.material as THREE.MeshPhysicalMaterial & { transparent: boolean }
        mat.opacity = opacity
        const transparent = opacity < 0.99
        if (mat.transparent !== transparent) { mat.transparent = transparent; mat.needsUpdate = true }
        mat.depthWrite = !transparent
        if (isSel || inGroup || exprHit) { glow.push({ mesh, strong: isSel }); if (visible) outline.push(mesh) }
        else if (s.hovered === id) mat.emissive.copy(HOVER_EMISSIVE).multiplyScalar(0.6)
        else mat.emissive.copy(mesh.userData.baseEmissive as THREE.Color)
        if (mesh.userData.impulse) (mesh.userData.impulse as { value: number }).value = (isSel || inGroup || exprHit) && visible ? 1 : 0
      })
      glowing.current = glow
      onOutline(outline)
      // origin / insertion markers of the selected muscle
      const sel = s.selected ? byId.get(s.selected) : undefined
      const su = sel?.userData as Record<string, string> | undefined
      for (const mk of registry.markers) {
        const mu = mk.userData as Record<string, string>
        mk.visible = !!su && su.layer === 'muscles' && mu.markerFor === su.structureId && (mu.side === su.side || su.side === 'midline')
      }
    }
    apply(useAtlas.getState())
    return useAtlas.subscribe(apply)
  }, [byId, onOutline])

  // animation: explode, glow pulse, nerve impulses, gentle idle "breathing"
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    uTime.value = t
    const s = useAtlas.getState()
    const k = 1 - Math.pow(0.002, dt)
    const target = new THREE.Vector3()
    const moveTo = (mesh: THREE.Mesh, layer: LayerId) => {
      const c = mesh.userData.localCenter as THREE.Vector3
      target.copy(c).sub(scene.position.clone().multiplyScalar(-1)).multiplyScalar(s.explode * LAYER_BY_ID[layer].explode)
      mesh.position.lerp(target, k)
    }
    byId.forEach((mesh) => moveTo(mesh, mesh.userData.layer as LayerId))
    for (const mk of registry.markers) moveTo(mk, 'bones')
    for (const g of glowing.current) {
      const a = g.strong ? 0.55 + 0.35 * Math.sin(t * 3.2) : 0.3 + 0.22 * Math.sin(t * 2.4)
      g.mesh.material.emissive.copy(g.strong ? SELECT_EMISSIVE : GROUP_EMISSIVE).multiplyScalar(a)
    }
    const breathe = s.autoRotate ? 1 + 0.004 * Math.sin(t * 1.3) : 1
    scene.scale.setScalar(breathe)
  })

  const pickable = (o: THREE.Object3D) => {
    const m = o as AtlasMesh
    const s = useAtlas.getState()
    return m.visible && !!m.userData.anatomyId && ((m.userData.effOpacity as number) > 0.15 || s.selected === m.userData.anatomyId)
  }
  const firstHit = (e: ThreeEvent<PointerEvent | MouseEvent>) => e.intersections.find((i) => pickable(i.object))

  return (
    <primitive
      object={scene}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        if (e.delta > 6) return
        const hit = firstHit(e)
        const s = useAtlas.getState()
        if (!hit) { s.select(null); return }
        const id = hit.object.userData.anatomyId as string
        hit.object.userData.labelLocal = hit.object.worldToLocal(hit.point.clone())
        s.select(id, hit.point.toArray() as [number, number, number])
        s.setAutoRotate(false)
        s.focus(id)
      }}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        if (e.pointerType !== 'mouse') return
        e.stopPropagation()
        const id = (firstHit(e)?.object.userData.anatomyId as string) ?? null
        if (useAtlas.getState().hovered !== id) hover(id)
        document.body.style.cursor = id ? 'pointer' : 'default'
      }}
      onPointerOut={() => { hover(null); document.body.style.cursor = 'default' }}
    />
  )
}

/** floating label with a leader line for the selected structure */
function SelectionLabel() {
  const selected = useAtlas((s) => s.selected)
  const meshes = useAtlas((s) => s.meshes)
  const group = useRef<THREE.Group>(null)
  const lineRef = useRef<{ geometry: { setPositions: (p: number[]) => void } } | null>(null)
  const info = meshes.find((m) => m.id === selected)
  useFrame(({ camera }) => {
    const mesh = selected ? registry.byId.get(selected) : undefined
    if (!mesh || !group.current) return
    const local = (mesh.userData.labelLocal as THREE.Vector3 | undefined) ?? (mesh.userData.localCenter as THREE.Vector3)
    const anchor = mesh.localToWorld(local.clone())
    const out = anchor.clone().sub(registry.headCenter)
    out.y = Math.max(out.y, 0) + 0.02
    const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion)
    const side = Math.sign(out.dot(camRight)) || 1
    const pos = anchor.clone().add(camRight.multiplyScalar(0.07 * side)).add(new THREE.Vector3(0, 0.035, 0))
    group.current.position.copy(pos)
    lineRef.current?.geometry.setPositions([anchor.x, anchor.y, anchor.z, pos.x, pos.y, pos.z])
  })
  if (!info) return null
  const c = CONTENT[info.structureId]
  return (
    <>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Line ref={lineRef as any} points={[[0, 0, 0], [0, 0, 0]]} color="#7dd3fc" lineWidth={1.5} transparent opacity={0.9} depthTest={false} renderOrder={20} />
      <group ref={group}>
        <Html center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
          <div className="glass rounded-lg px-2.5 py-1 text-left whitespace-nowrap shadow-lg" style={{ borderColor: 'rgba(125,211,252,.45)' }}>
            <div className="text-[12px] font-semibold text-white">{c?.name ?? info.structureId}{info.side !== 'midline' ? ` (${info.side === 'left' ? 'L' : 'R'})` : ''}</div>
            <div className="text-[10px] text-sky-300/90 italic">{c?.latin}</div>
          </div>
        </Html>
      </group>
    </>
  )
}

const VIEW_DIRS: Record<ViewName, [number, number, number]> = {
  front: [0, 0.05, 1], back: [0, 0.05, -1], left: [1, 0.05, 0], right: [-1, 0.05, 0], top: [0, 1, 0.02], oblique: [0.55, 0.12, 0.85],
}

function CameraRig({ controls }: { controls: React.RefObject<OrbitControlsImpl | null> }) {
  const camCmd = useAtlas((s) => s.camCmd)
  const { camera } = useThree()
  const anim = useRef<{ pos: THREE.Vector3; target: THREE.Vector3; t: number } | null>(null)
  useEffect(() => {
    if (!camCmd || !controls.current) return
    const dist = window.innerWidth < 640 ? 0.95 : 0.72
    if (camCmd.kind === 'view') {
      const d = new THREE.Vector3(...VIEW_DIRS[camCmd.view]).normalize()
      anim.current = { target: new THREE.Vector3(0, 0, 0), pos: d.multiplyScalar(dist), t: 0 }
    } else {
      const obj = registry.byId.get(camCmd.id)
      if (!obj) return
      const sphere = new THREE.Box3().setFromObject(obj).getBoundingSphere(new THREE.Sphere())
      const dir = camera.position.clone().sub(controls.current.target).normalize()
      const d = Math.min(Math.max(sphere.radius * 4.2, 0.3), dist)
      anim.current = { target: sphere.center.clone(), pos: sphere.center.clone().add(dir.multiplyScalar(d)), t: 0 }
    }
  }, [camCmd, controls, camera])
  useFrame((_, dt) => {
    const a = anim.current
    if (!a || !controls.current) return
    a.t += dt
    const k = 1 - Math.pow(0.004, dt)
    camera.position.lerp(a.pos, k)
    controls.current.target.lerp(a.target, k)
    controls.current.update()
    if (a.t > 1.6) anim.current = null
  })
  return null
}

function FpsProbe() {
  const acc = useRef({ frames: 0, t: 0 })
  useFrame((_, dt) => {
    const a = acc.current
    a.frames++; a.t += dt
    if (a.t >= 0.5) {
      const fps = Math.round(a.frames / a.t)
      ;(window as unknown as Record<string, unknown>).__atlasFps = fps
      const el = document.getElementById('fps')
      if (el) el.textContent = `${fps} fps`
      a.frames = 0; a.t = 0
    }
  })
  return null
}

export default function Viewer() {
  const controls = useRef<OrbitControlsImpl | null>(null)
  const quality = useAtlas((s) => s.quality)
  const autoRotate = useAtlas((s) => s.autoRotate)
  const [outline, setOutline] = useState<THREE.Object3D[]>([])
  const mobile = typeof window !== 'undefined' && window.innerWidth < 640
  const start = new THREE.Vector3(...VIEW_DIRS.oblique).normalize().multiplyScalar(mobile ? 0.95 : 0.72)
  const high = quality === 'high'
  const maxDpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, high ? 2 : 1.5)
  return (
    <Canvas
      camera={{ position: start.toArray(), fov: 35, near: 0.01, far: 20 }}
      dpr={[1, maxDpr]}
      gl={{ antialias: !high, alpha: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      onPointerDown={() => useAtlas.getState().autoRotate && useAtlas.getState().setAutoRotate(false)}
      onPointerMissed={(e) => { if (e.type === 'click') useAtlas.getState().select(null) }}
    >
      {high && <color attach="background" args={['#0d141d']} />}
      <ambientLight intensity={0.22} />
      <directionalLight position={[2, 3, 4]} intensity={1.5} />
      <directionalLight position={[-3, 1, -2]} intensity={0.6} color="#9cc3ff" />
      <directionalLight position={[0, -2, 3]} intensity={0.25} color="#ffd8c8" />
      <Environment resolution={128}>
        <Lightformer intensity={2} position={[0, 4, 4]} scale={[8, 3, 1]} />
        <Lightformer intensity={1} position={[-5, 1, 0]} rotation-y={Math.PI / 2} scale={[6, 4, 1]} color="#8fb7ff" />
        <Lightformer intensity={1} position={[5, 0, -1]} rotation-y={-Math.PI / 2} scale={[6, 4, 1]} color="#ffd9c2" />
      </Environment>
      <Suspense fallback={null}>
        <Bvh firstHitOnly={false}>
          <Model key={quality} quality={quality} onOutline={setOutline} />
        </Bvh>
        <SelectionLabel />
      </Suspense>
      <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.08} minDistance={0.12} maxDistance={2} rotateSpeed={0.8} autoRotate={autoRotate} autoRotateSpeed={0.7} />
      <CameraRig controls={controls} />
      <FpsProbe />
      {high && (
        <EffectComposer multisampling={4} autoClear={false}>
          <N8AO halfRes aoRadius={0.02} distanceFalloff={0.5} intensity={1.6} quality="medium" />
          <Outline selection={outline} edgeStrength={3.5} visibleEdgeColor={0x7dd3fc} hiddenEdgeColor={0x1e6a8a} blur xRay />
          <Vignette eskil={false} offset={0.3} darkness={0.65} />
        </EffectComposer>
      )}
    </Canvas>
  )
}
