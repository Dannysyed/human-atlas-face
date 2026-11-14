import json,numpy as np,matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
d=json.load(open('/tmp/fn.json'))
fig,axs=plt.subplots(1,2,figsize=(18,9))
cols=plt.cm.tab20(np.linspace(0,1,20))
for ax,(i,j,t) in zip(axs,[(1,2,'lateral (y=front<-, z up)'),(0,2,'frontal (x, z)')]):
    for k in ['Mandible','Zygomatic bone.l','Temporal bone.l','Maxilla.l']:
        p=np.array(d[k]); 
        if k=='Mandible' and i==0: pass
        ax.scatter(p[:,i],p[:,j],s=0.3,c='lightgrey')
    p=np.array(d['parotid']); ax.scatter(p[:,i],p[:,j],s=0.5,c='wheat')
    for n,part in enumerate(d['parts']):
        p=np.array(part); ax.scatter(p[:,i],p[:,j],s=1,color=cols[n%20]); 
        m=p.mean(0); ax.text(m[i],m[j],str(n),fontsize=14,weight='bold')
    ax.set_aspect('equal'); ax.set_title(t)
axs[0].invert_xaxis()
plt.tight_layout(); plt.savefig('/workspace/atlas-face/shots/fn_parts.png',dpi=80)
