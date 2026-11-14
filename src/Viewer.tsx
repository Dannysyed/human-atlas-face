import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Bvh, Environment, Lightformer, OrbitControls, useGLTF } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useAtlas, type MeshInfo, type ViewName } from './store'
import { LAYER_BY_ID, colorFor, type LayerId } from './layers'

const MODEL_URL = `${import.meta.env.BASE_URL}models/head.glb`
const DRACO_URL = `${import.meta.env.BASE_URL}draco/`
useGLTF.preload(MODEL_URL, DRACO_URL)

const SELECT_EMISSIVE = new THREE.Color('#29b6f6')
const HOVER_EMISSIVE = new THREE.Color('#5b7a99')
const BLACK = new THREE.Color('#000000')

type AtlasMesh = THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>

function Model({ center }: { center: React.MutableRefObject<THREE.Vector3> }) {
  const { scene } = useGLTF(MODEL_URL, DRACO_URL)
  const setMeshes = useAtlas((s) => s.setMeshes)
  const select = useAtlas((s) => s.select)
  const hover = useAtlas((s) => s.hover)

  // Build materials once and index meshes by their stable anatomical id (glTF node extras, NOT three.js uuids)
  const byId = useMemo(() => {
    const map = new Map<string, AtlasMesh>()
    scene.traverse((o) => {
      const mesh = o as AtlasMesh
      const ud = o.userData as Record<string, string>
      if (!mesh.isMesh || !ud.anatomyId) return
      const layer = ud.layer as LayerId
      mesh.material = new THREE.MeshStandardMaterial({
        color: colorFor(ud.structureId, layer),
        roughness: layer === 'bones' ? 0.62 : layer === 'nerves' ? 0.45 : layer === 'skin' ? 0.7 : 0.5,
        metalness: 0,
        side: THREE.DoubleSide,
        emissive: layer === 'nerves' ? new THREE.Color('#3a2c00') : BLACK.clone(),
      })
      mesh.userData.baseEmissive = (mesh.material.emissive as THREE.Color).clone()
      mesh.renderOrder = LAYER_BY_ID[layer].order
      map.set(ud.anatomyId, mesh)
    })
    const box = new THREE.Box3().setFromObject(scene)
    center.current.copy(box.getCenter(new THREE.Vector3()))
    scene.position.copy(center.current).multiplyScalar(-1)
    return map
  }, [scene, center])

  useEffect(() => {
    const infos: MeshInfo[] = []
    byId.forEach((m) => {
      const u = m.userData as Record<string, string>
      infos.push({ id: u.anatomyId, structureId: u.structureId, layer: u.layer as LayerId, side: u.side as MeshInfo['side'], sourceNames: u.sourceNames })
    })
    setMeshes(infos)
    ;(window as unknown as Record<string, unknown>).__atlasReady = true
  }, [byId, setMeshes])

  // Apply store state to materials imperatively (no React re-render of 250+ meshes)
  useEffect(() => {
    const apply = (s: ReturnType<typeof useAtlas.getState>) => {
      byId.forEach((mesh, id) => {
        const layer = mesh.userData.layer as LayerId
        const ls = s.layers[layer]
        const isSel = s.selected === id
        let visible: boolean = ls.visible && ls.opacity > 0.01 && !s.hidden[id]
        if (s.isolated) visible = s.isolated.includes(id)
        let opacity = s.isolated ? 1 : ls.opacity
        if (isSel) opacity = Math.max(opacity, 0.92)
        mesh.visible = visible
        const mat = mesh.material as THREE.MeshStandardMaterial & { transparent: boolean }
        mat.opacity = opacity
        const transparent = opacity < 0.99
        if (mat.transparent !== transparent) { mat.transparent = transparent; mat.needsUpdate = true }
        mat.depthWrite = !transparent
        const e = mat.emissive
        if (isSel) e.copy(SELECT_EMISSIVE).multiplyScalar(0.85)
        else if (s.hovered === id) e.copy(HOVER_EMISSIVE).multiplyScalar(0.6)
        else e.copy(mesh.userData.baseEmissive as THREE.Color)
      })
    }
    apply(useAtlas.getState())
    return useAtlas.subscribe(apply)
  }, [byId])

  const pickable = (o: THREE.Object3D) => {
    const s = useAtlas.getState()
    const m = o as AtlasMesh
    return m.visible && !!m.userData.anatomyId && (s.isolated ? true : s.layers[m.userData.layer as LayerId].opacity > 0.15 || s.selected === m.userData.anatomyId)
  }
  const firstHit = (e: ThreeEvent<PointerEvent | MouseEvent>) => e.intersections.find((i) => pickable(i.object))?.object

  return (
    <primitive
      object={scene}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        if (e.delta > 6) return
        const hit = firstHit(e)
        select(hit ? (hit.userData.anatomyId as string) : null)
      }}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        if (e.pointerType !== 'mouse') return
        e.stopPropagation()
        const id = (firstHit(e)?.userData.anatomyId as string) ?? null
        if (useAtlas.getState().hovered !== id) hover(id)
        document.body.style.cursor = id ? 'pointer' : 'default'
      }}
      onPointerOut={() => { hover(null); document.body.style.cursor = 'default' }}
    />
  )
}

const VIEW_DIRS: Record<ViewName, [number, number, number]> = {
  front: [0, 0.05, 1], back: [0, 0.05, -1], left: [1, 0.05, 0], right: [-1, 0.05, 0], top: [0, 1, 0.02], oblique: [0.55, 0.12, 0.85],
}

function CameraRig({ controls }: { controls: React.RefObject<OrbitControlsImpl | null> }) {
  const camCmd = useAtlas((s) => s.camCmd)
  const { camera, scene } = useThree()
  const anim = useRef<{ pos: THREE.Vector3; target: THREE.Vector3; t: number } | null>(null)
  useEffect(() => {
    if (!camCmd || !controls.current) return
    const dist = window.innerWidth < 640 ? 0.95 : 0.72
    if (camCmd.kind === 'view') {
      const d = new THREE.Vector3(...VIEW_DIRS[camCmd.view]).normalize()
      anim.current = { target: new THREE.Vector3(0, 0, 0), pos: d.multiplyScalar(dist), t: 0 }
    } else {
      let obj: THREE.Object3D | undefined
      scene.traverse((o) => { if (o.userData.anatomyId === camCmd.id) obj = o })
      if (!obj) return
      const sphere = new THREE.Box3().setFromObject(obj).getBoundingSphere(new THREE.Sphere())
      const dir = camera.position.clone().sub(controls.current.target).normalize()
      const d = Math.min(Math.max(sphere.radius * 4.2, 0.22), dist)
      anim.current = { target: sphere.center.clone(), pos: sphere.center.clone().add(dir.multiplyScalar(d)), t: 0 }
    }
  }, [camCmd, controls, camera, scene])
  useFrame((_, dt) => {
    const a = anim.current
    if (!a || !controls.current) return
    a.t += dt
    const k = 1 - Math.pow(0.0005, dt)
    camera.position.lerp(a.pos, k)
    controls.current.target.lerp(a.target, k)
    controls.current.update()
    if (a.t > 1.4) anim.current = null
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
  const center = useRef(new THREE.Vector3())
  const select = useAtlas((s) => s.select)
  const mobile = typeof window !== 'undefined' && window.innerWidth < 640
  const start = new THREE.Vector3(...VIEW_DIRS.oblique).normalize().multiplyScalar(mobile ? 0.95 : 0.72)
  return (
    <Canvas
      camera={{ position: start.toArray(), fov: 35, near: 0.01, far: 20 }}
      dpr={[1, Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, mobile ? 1.75 : 2)]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      onPointerMissed={(e) => { if (e.type === 'click') select(null) }}
    >
      <ambientLight intensity={0.25} />
      <directionalLight position={[2, 3, 4]} intensity={1.6} />
      <directionalLight position={[-3, 1, -2]} intensity={0.6} color="#9cc3ff" />
      <Environment resolution={128}>
        <Lightformer intensity={2} position={[0, 4, 4]} scale={[8, 3, 1]} />
        <Lightformer intensity={1} position={[-5, 1, 0]} rotation-y={Math.PI / 2} scale={[6, 4, 1]} color="#8fb7ff" />
        <Lightformer intensity={1} position={[5, 0, -1]} rotation-y={-Math.PI / 2} scale={[6, 4, 1]} color="#ffd9c2" />
      </Environment>
      <Suspense fallback={null}>
        <Bvh firstHitOnly={false}>
          <Model center={center} />
        </Bvh>
      </Suspense>
      <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.08} minDistance={0.12} maxDistance={2} rotateSpeed={0.8} />
      <CameraRig controls={controls} />
      <FpsProbe />
    </Canvas>
  )
}
