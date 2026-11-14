import bpy,sys,os,json,collections
sys.path.insert(0,os.path.dirname(__file__))
from config import ITEMS,LAYER_PREFIX
Z='/workspace/atlas-face/z/'; OUT=sys.argv[sys.argv.index('--')+1]
MAXV={'skin':2500,'bones':5000,'muscles':3500,'nerves':2500,'vessels':2500,'eyes':2500}
SUBDIV={'skin':2,'muscles':0}
bpy.ops.wm.read_factory_settings(use_empty=True)
keep=set(); report=[]; missing=[]
by_src=collections.defaultdict(list)
for it in ITEMS: by_src[it[0]].append(it)
def bake(o,layer):
    """return a new standalone mesh object in world space with modifiers applied"""
    dg=bpy.context.evaluated_depsgraph_get()
    me=bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    me.transform(o.matrix_world)
    me.materials.clear()
    n=bpy.data.objects.new('tmp',me); bpy.context.scene.collection.objects.link(n)
    return n
def join(objs):
    if len(objs)==1: return objs[0]
    with bpy.context.temp_override(active_object=objs[0],object=objs[0],selected_objects=objs,selected_editable_objects=objs):
        bpy.ops.object.join()
    return objs[0]
def addmod_apply(o,mod,**kw):
    m=o.modifiers.new('m',mod)
    for k,v in kw.items(): setattr(m,k,v)
    dg=bpy.context.evaluated_depsgraph_get()
    me=bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    o.modifiers.clear(); old=o.data; o.data=me; bpy.data.meshes.remove(old)
for src,items in by_src.items():
    before=set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=Z+src+'.fbx')
    new=[o for o in bpy.data.objects if o not in before]
    names={o.name:o for o in new}
    made=[]
    for (s,bases,layer,slug,sided) in items:
        sides=[('l','left'),('r','right')] if sided else [(None,None)]
        for sfx,side in sides:
            srcs=[]
            for b in bases:
                cand=[f'{b}.{sfx}'] if sfx else [b]
                if sfx: cand.append(b)  # unsided fallback
                o=next((names[c] for c in cand if c in names and names[c].type=='MESH'),None)
                if o is None: missing.append((src,b,sfx)); continue
                if sfx and o.name==b and side=='right': continue  # unsided used once only
                srcs.append(o)
            if not srcs: continue
            baked=[bake(o,layer) for o in srcs]
            n=join(baked)
            if SUBDIV.get(layer): addmod_apply(n,'SUBSURF',levels=SUBDIV[layer],render_levels=SUBDIV[layer])
            v=len(n.data.vertices)
            if v>MAXV[layer]: addmod_apply(n,'DECIMATE',ratio=MAXV[layer]/v)
            for p in n.data.polygons: p.use_smooth=True
            uni = sfx and srcs[0].name!=bases[0]  # true sided
            pid=f"{LAYER_PREFIX[layer]}.{slug}"
            nid=f"{pid}.{sfx}" if (sfx and srcs[0].name.endswith('.'+sfx)) else pid
            n.name=nid; n.data.name=nid
            n['anatomyId']=nid; n['structureId']=pid; n['layer']=layer
            n['side']=side if nid!=pid else 'midline'
            n['sourceNames']=', '.join(o.name for o in srcs); n['source']='Z-Anatomy (CC BY-SA 4.0)'
            made.append(n); report.append((nid,v,len(n.data.vertices)))
    keepset=set(made)|keep
    for o in list(bpy.data.objects):
        if o not in keepset: bpy.data.objects.remove(o,do_unlink=True)
    for me in list(bpy.data.meshes):
        if me.users==0: bpy.data.meshes.remove(me)
    keep|=set(made)
    print('DONE',src,len(made))
# dedupe unsided duplicates
seen=set()
for o in list(bpy.data.objects):
    pass
for r in report: print('ITEM',*r)
print('MISSING',missing)
print('TOTALV',sum(len(o.data.vertices) for o in bpy.data.objects),'OBJ',len(bpy.data.objects))
bpy.ops.export_scene.gltf(filepath=OUT,export_format='GLB',export_extras=True,export_materials='NONE',export_normals=True,export_texcoords=False,export_apply=True,export_yup=True)
