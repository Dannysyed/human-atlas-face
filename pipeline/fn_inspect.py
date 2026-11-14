import bpy,bmesh,sys
from mathutils import Vector
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath='/workspace/atlas-face/z/NervousSystem100.fbx')
o=bpy.data.objects['Facial nerve (VII).l']
me=o.data.copy(); me.transform(o.matrix_world)
bm=bmesh.new(); bm.from_mesh(me); bm.verts.ensure_lookup_table()
seen=set(); parts=[]
for v in bm.verts:
    if v.index in seen: continue
    stack=[v]; comp=[]; seen.add(v.index)
    while stack:
        a=stack.pop(); comp.append(a)
        for e in a.link_edges:
            b=e.other_vert(a)
            if b.index not in seen: seen.add(b.index); stack.append(b)
    parts.append(comp)
print('PARTS',len(parts))
for i,c in enumerate(sorted(parts,key=len,reverse=True)):
    cs=[v.co for v in c]
    mn=[min(p[k] for p in cs) for k in range(3)]; mx=[max(p[k] for p in cs) for k in range(3)]
    print('P',i,len(c),[round(x,3) for x in mn],[round(x,3) for x in mx])
print('mods',[m.type for m in o.modifiers])
import json
out={'parts':[[list(v.co) for v in c] for c in sorted(parts,key=len,reverse=True) if len(c)>12]}
bpy.ops.import_scene.fbx(filepath='/workspace/atlas-face/z/SkeletalSystem100.fbx')
for n in ['Mandible','Zygomatic bone.l','Temporal bone.l','Maxilla.l']:
    ob=bpy.data.objects[n]; out[n]=[list(ob.matrix_world@v.co) for v in list(ob.data.vertices)[::7]]
bpy.ops.import_scene.fbx(filepath='/workspace/atlas-face/z/VisceralSystem100.fbx')
ob=bpy.data.objects['Parotid gland.l']; out['parotid']=[list(ob.matrix_world@v.co) for v in ob.data.vertices]
json.dump(out,open('/tmp/fn.json','w'))
