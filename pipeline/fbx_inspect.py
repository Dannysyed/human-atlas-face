import bpy,sys,json
from mathutils import Vector
fbx=sys.argv[sys.argv.index('--')+1]; out=sys.argv[sys.argv.index('--')+2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=fbx)
res=[]
for o in bpy.data.objects:
    d={'name':o.name,'type':o.type,'parent':o.parent.name if o.parent else None}
    if o.type=='MESH':
        bb=[o.matrix_world@Vector(c) for c in o.bound_box]
        d['v']=len(o.data.vertices); d['f']=len(o.data.polygons)
        d['min']=[min(b[i] for b in bb) for i in range(3)]; d['max']=[max(b[i] for b in bb) for i in range(3)]
        d['mats']=[m.name for m in o.data.materials if m]
    res.append(d)
json.dump(res,open(out,'w'),indent=0)
