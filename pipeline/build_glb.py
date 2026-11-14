import bpy,bmesh,sys,os,collections,re
from mathutils import Vector, kdtree
sys.path.insert(0,os.path.dirname(__file__))
from config import ITEMS,LAYER_PREFIX,MARKERS,FACIAL_REF,FACIAL_SLUG
Z='/workspace/atlas-face/z/'; OUT=sys.argv[sys.argv.index('--')+1]
MAXV={'skin':2500,'bones':5000,'muscles':3500,'nerves':2500,'vessels':2500,'eyes':2500,'brain':8000}
SUBDIV={'skin':2}
bpy.ops.wm.read_factory_settings(use_empty=True)
keep=set(); report=[]; missing=[]
by_src=collections.defaultdict(list)
for it in ITEMS: by_src[it[0]].append(it)
def link(me,name):
    n=bpy.data.objects.new(name,me); bpy.context.scene.collection.objects.link(n); return n
def bake(o):
    dg=bpy.context.evaluated_depsgraph_get()
    me=bpy.data.meshes.new_from_object(o.evaluated_get(dg)); me.transform(o.matrix_world); me.materials.clear()
    return link(me,'tmp')
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
def finish(n,layer,nid,pid,side,srcnames,maxv=None,subdiv=None,extra_props=None):
    sd=subdiv if subdiv is not None else SUBDIV.get(layer,0)
    if sd: addmod_apply(n,'SUBSURF',levels=sd,render_levels=sd)
    v=len(n.data.vertices); mv=maxv or MAXV[layer]
    if v>mv: addmod_apply(n,'DECIMATE',ratio=mv/v)
    for p in n.data.polygons: p.use_smooth=True
    n.name=nid; n.data.name=nid
    n['anatomyId']=nid; n['structureId']=pid; n['layer']=layer; n['side']=side
    n['sourceNames']=srcnames; n['source']='Z-Anatomy (CC BY-SA 4.0)'
    for k,val in (extra_props or {}).items(): n[k]=val
    report.append((nid,v,len(n.data.vertices))); return n
def descendants(o):
    out=[]
    for c in o.children: out.append(c); out+=descendants(c)
    return out
def split_facial(n,side):
    bm=bmesh.new(); bm.from_mesh(n.data); bm.verts.ensure_lookup_table(); bm.faces.ensure_lookup_table()
    seen={}; comps=[]
    for v in bm.verts:
        if v.index in seen: continue
        st=[v]; c=[]; seen[v.index]=len(comps)
        while st:
            a=st.pop(); c.append(a)
            for e in a.link_edges:
                b=e.other_vert(a)
                if b.index not in seen: seen[b.index]=len(comps); st.append(b)
        comps.append(c)
    big=[c for c in comps if len(c)>40]
    def cen(c): return Vector([sum(abs(v.co.x) if k==0 else v.co[k] for v in c)/len(c) for k in range(3)])
    assign={}
    for c in big:
        cc=cen(c); best=min(FACIAL_REF,key=lambda r:(Vector(r[0])-cc).length); assign[id(c)]=best[1]
        print('FN',side,len(c),[round(x,4) for x in cc],best[1])
    cerv=[c for c in big if assign[id(c)]=='cervical'][0]; top=max(cerv,key=lambda v:v.co.z).co
    stem=[c for c in big if assign[id(c)]=='SPLIT'][0]; cut=min(stem,key=lambda v:(v.co-top).length).co.copy()
    print('FN cut',side,[round(x,4) for x in cut])
    lab={}
    for c in big:
        for v in c:
            l=assign[id(c)]
            if l=='SPLIT': l='marginal' if (v.co.y<cut.y and v.co.z<cut.z+0.002) else 'trunk'
            lab[v.index]=l
    kd=kdtree.KDTree(len(lab))
    for vi in lab: kd.insert(bm.verts[vi].co,vi)
    kd.balance()
    for c in comps:
        if len(c)>40: continue
        for v in c: lab[v.index]=lab[kd.find(v.co)[1]]
    out={}
    for l in sorted(set(lab.values())):
        b2=bm.copy(); b2.faces.ensure_lookup_table(); b2.verts.ensure_lookup_table()
        kill=[f for f in b2.faces if collections.Counter(lab[v.index] for v in f.verts).most_common(1)[0][0]!=l]
        bmesh.ops.delete(b2,geom=kill,context='FACES')
        loose=[v for v in b2.verts if not v.link_faces]; bmesh.ops.delete(b2,geom=loose,context='VERTS')
        me=bpy.data.meshes.new('fn_'+l); b2.to_mesh(me); b2.free()
        out[l]=link(me,'fn_'+l)
    bm.free()
    return out
for src in ['SkeletalSystem100','MuscularSystem100','NervousSystem100','CardioVascular41','VisceralSystem100','Regions_of_human_body100']:
    items=by_src.get(src,[])
    before=set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=Z+src+'.fbx')
    new=[o for o in bpy.data.objects if o not in before]
    names={o.name:o for o in new}
    made=[]
    for it in items:
        s,bases,layer,slug,sided=it[:5]; opts=it[5] if len(it)>5 else {}
        pid=f"{LAYER_PREFIX[layer]}.{slug}"
        if opts.get('groups'):
            pool=[]
            for g in opts['groups']:
                if g in names: pool+=descendants(names[g])
                else: missing.append((src,g,'group'))
            pool+=[names[e] for e in opts.get('extra',[]) if e in names]
            pool=list({o.name:o for o in pool if o.type=='MESH' and len(o.data.vertices)>20 and not re.search(r'\.(j|t|i|s)$',o.name)}.values())
            groups={'left':[],'right':[]} if sided else {'midline':[]}
            for o in pool:
                if sided:
                    cx=sum((o.matrix_world@Vector(c)).x for c in o.bound_box)/8
                    groups['left' if cx>0 else 'right'].append(o)
                else: groups['midline'].append(o)
            for side,objs in groups.items():
                if not objs: missing.append((src,slug,side)); continue
                n=join([bake(o) for o in objs])
                bm=bmesh.new(); bm.from_mesh(n.data); bmesh.ops.remove_doubles(bm,verts=bm.verts,dist=0.0002); bm.to_mesh(n.data); bm.free()
                nid=pid+('.l' if side=='left' else '.r' if side=='right' else '')
                made.append(finish(n,layer,nid,pid,side,f'{len(objs)} merged Z-Anatomy meshes ({", ".join(opts["groups"])})',opts.get('maxv'),opts.get('subdiv')))
            continue
        sides=[('l','left'),('r','right')] if sided else [(None,'midline')]
        for sfx,side in sides:
            srcs=[]
            for b in bases:
                cand=[f'{b}.{sfx}',b] if sfx else [b]
                o=next((names[c] for c in cand if c in names and names[c].type=='MESH'),None)
                if o is None: missing.append((src,b,sfx)); continue
                if sfx and o.name==b and side=='right': continue
                srcs.append(o)
            if not srcs: continue
            truly=bool(sfx) and srcs[0].name.endswith('.'+sfx)
            nid=f"{pid}.{sfx}" if truly else pid
            sd=side if truly else 'midline'
            n=join([bake(o) for o in srcs])
            if pid=='nerve.facial_nerve':
                parts=split_facial(n,sd); bpy.data.objects.remove(n,do_unlink=True)
                for l,obj in parts.items():
                    p2='nerve.'+FACIAL_SLUG[l]
                    made.append(finish(obj,layer,f'{p2}.{sfx}',p2,sd,f'{srcs[0].name} (split: {l})',extra_props={'group':'nerve.facial_nerve'}))
                continue
            made.append(finish(n,layer,nid,pid,sd,', '.join(o.name for o in srcs),opts.get('maxv'),opts.get('subdiv')))
    if src=='SkeletalSystem100':
        for o in new:
            m=re.match(r'^(.*)\.([oe])(\d*)([lr])$',o.name)
            if not (o.type=='MESH' and m and m.group(1) in MARKERS): continue
            side={'l':'left','r':'right'}[m.group(4)]
            for slug in MARKERS[m.group(1)]:
                n=bake(o); kind='origin' if m.group(2)=='o' else 'insertion'
                nid=f"marker.{slug}.{kind}{m.group(3)}.{m.group(4)}"
                if len(n.data.vertices)>500: addmod_apply(n,'DECIMATE',ratio=500/len(n.data.vertices))
                for p in n.data.polygons: p.use_smooth=True
                n.name=nid; n.data.name=nid; n['markerFor']=f'muscle.{slug}'; n['markerType']=kind; n['side']=side; n['sourceNames']=o.name
                made.append(n)
    ks=set(made)|keep
    for o in list(bpy.data.objects):
        if o not in ks: bpy.data.objects.remove(o,do_unlink=True)
    for me in list(bpy.data.meshes):
        if me.users==0: bpy.data.meshes.remove(me)
    keep|=set(made)
    print('DONE',src,len(made))
for r in report: print('ITEM',*r)
print('MISSING',missing)
print('TOTALV',sum(len(o.data.vertices) for o in bpy.data.objects),'OBJ',len(bpy.data.objects))
bpy.ops.export_scene.gltf(filepath=OUT,export_format='GLB',export_extras=True,export_materials='NONE',export_normals=True,export_texcoords=False,export_apply=True,export_yup=True)
