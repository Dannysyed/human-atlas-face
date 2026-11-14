# (source fbx, [source base names], layer, structure slug, sided, merge?)  sided=True -> expects ".l"/".r"
S='SkeletalSystem100'; M='MuscularSystem100'; N='NervousSystem100'; C='CardioVascular41'; R='Regions_of_human_body100'; V='VisceralSystem100'
def B(name,slug,sided=True,src=S,layer='bones'): return (src,[name],layer,slug,sided)
ITEMS=[
 B('Frontal bone','frontal_bone',False), B('Parietal bone','parietal_bone'), B('Occipital bone','occipital_bone',False),
 B('Temporal bone','temporal_bone'), B('Sphenoid bone','sphenoid_bone',False), B('Ethmoid bone','ethmoid_bone',False),
 B('Maxilla','maxilla'), B('Zygomatic bone','zygomatic_bone'), B('Nasal bone','nasal_bone'), B('Lacrimal bone','lacrimal_bone'),
 B('Palatine bone','palatine_bone'), B('Inferior nasal concha bone','inferior_nasal_concha'), B('Vomer','vomer',False),
 B('Mandible','mandible',False), B('Hyoid bone','hyoid_bone',False), B('Atlas (C1)','atlas_c1',False), B('Axis (C2)','axis_c2',False),
 B('Major alar cartilage','major_alar_cartilage'), B('Lateral process of nasal septal cartilage','lateral_nasal_cartilage'), B('Nasal septal cartilage','septal_cartilage',False),
 (S,[f'Upper {t}.{s}' for t in ['medial incisor','lateral incisor','canine','first premolar','second premolar','first molar tooth','second molar tooth'] for s in 'lr'],'bones','maxillary_teeth',False),
 (S,[f'Lower {t}.{s}' for t in ['medial incisor','lateral incisor','canine','first premolar','second premolar','first molar tooth','second molar tooth'] for s in 'lr'],'bones','mandibular_teeth',False),
]
def Mu(name,slug): return (M,[name],'muscles',slug,True)
ITEMS+=[Mu(n,s) for n,s in [
 ('Frontalis muscle','frontalis'),('Occipitalis muscle','occipitalis'),('Temporoparietalis muscle','temporoparietalis'),('Epicranial aponeurosis','epicranial_aponeurosis'),
 ('Procerus muscle','procerus'),('Corrugator supercilii','corrugator_supercilii'),('Orbital part of orbicularis oculi','orbicularis_oculi_orbital'),('Palpebral part of orbicularis oculi','orbicularis_oculi_palpebral'),
 ('Nasalis muscle','nasalis'),('Depressor septi nasi','depressor_septi_nasi'),('Levator nasolabialis','levator_labii_superioris_alaeque_nasi'),('Levator labii superioris','levator_labii_superioris'),
 ('Levator anguli oris','levator_anguli_oris'),('Zygomaticus major muscle','zygomaticus_major'),('Zygomaticus minor muscle','zygomaticus_minor'),('Risorius muscle','risorius'),
 ('Bucinator','buccinator'),('Orbicularis oris muscle','orbicularis_oris'),('Depressor anguli oris','depressor_anguli_oris'),('Depressor labii inferioris','depressor_labii_inferioris'),
 ('Mentalis muscle','mentalis'),('Platysma','platysma'),
 ('Temporalis muscle','temporalis'),('Superficial part of masseter','masseter_superficial'),('Deep part of masseter','masseter_deep'),('Medial pterygoid muscle','medial_pterygoid'),
 ('Superior head of lateral pterygoid muscle','lateral_pterygoid_superior'),('Inferior head of lateral pterygoid muscle','lateral_pterygoid_inferior'),
 ('Sternocleidomastoid muscle','sternocleidomastoid'),('Anterior belly of digastric muscle','digastric_anterior'),('Posterior belly of digastric muscle','digastric_posterior'),
 ('Mylohyoid muscle','mylohyoid'),('Stylohyoid muscle','stylohyoid'),
 ('Levator palpebrae superioris','levator_palpebrae_superioris'),('Superior rectus muscle','superior_rectus'),('Inferior rectus muscle','inferior_rectus'),
 ('Medial rectus muscle','medial_rectus'),('Lateral rectus muscle','lateral_rectus'),('Superior oblique muscle','superior_oblique'),('Inferior oblique muscle','inferior_oblique'),
]]
def Ne(name,slug): return (N,[name],'nerves',slug,True)
ITEMS+=[Ne(n,s) for n,s in [
 ('Facial nerve (VII)','facial_nerve'),('Chorda tympani','chorda_tympani'),('Trigeminal nerve (V)','trigeminal_nerve'),('Sensory root of trigeminal nerve','trigeminal_sensory_root'),('Motor root of trigeminal nerve','trigeminal_motor_root'),
 ('Ophthalmic nerve','ophthalmic_nerve'),('Maxillary nerve','maxillary_nerve'),
 ('Anterior division of mandibular nerve','mandibular_nerve_anterior'),('Posterior division of mandibular nerve','mandibular_nerve_posterior'),
 ('Buccal nerve','buccal_nerve'),('Lingual nerve','lingual_nerve'),('Inferior alveolar nerve','inferior_alveolar_nerve'),('Mental nerve','mental_nerve'),('Nerve to mylohyoid muscle','nerve_to_mylohyoid'),
 ('Optic nerve (II)','optic_nerve'),('Oculomotor nerve (III)','oculomotor_nerve'),('Trochlear nerve (IV)','trochlear_nerve'),('Abducens nerve (VI)','abducens_nerve'),('Hypoglossal nerve (XII)','hypoglossal_nerve'),
]]
def A(name,slug,layer='vessels'): return (C,[name],layer,slug,True)
ITEMS+=[A(n,s) for n,s in [
 ('External carotid artery','external_carotid_artery'),('Internal carotid artery','internal_carotid_artery'),('Facial artery','facial_artery'),('Angular artery','angular_artery'),
 ('Superior labial artery','superior_labial_artery'),('Inferior labial artery','inferior_labial_artery'),('Submental artery','submental_artery'),
 ('Superficial temporal artery','superficial_temporal_artery'),('Frontal branch of superficial temporal artery','superficial_temporal_artery_frontal_branch'),('Transverse facial artery','transverse_facial_artery'),
 ('Maxillary artery','maxillary_artery'),('Inferior alveolar artery','inferior_alveolar_artery'),('Infra-orbital artery','infraorbital_artery'),('Occipital artery','occipital_artery'),
 ('Ophthalmic artery','ophthalmic_artery'),('Supra-orbital artery','supraorbital_artery'),('Supratrochlear artery','supratrochlear_artery'),
 ('Facial vein','facial_vein'),('Angular vein','angular_vein'),('Superior labial vein','superior_labial_vein'),('Inferior labial veins','inferior_labial_veins'),('Submental vein','submental_vein'),
 ('Common facial vein','common_facial_vein'),('Retromandibular vein','retromandibular_vein'),('Superficial temporal veins','superficial_temporal_veins'),
 ('Internal jugular vein','internal_jugular_vein'),('External jugular vein','external_jugular_vein'),('Posterior auricular vein','posterior_auricular_vein'),
]]
ITEMS+=[
 (N,['Sclera','Cornea','Iris'],'eyes','eyeball',True),
 (N,['Lacrimal gland'],'eyes','lacrimal_gland',True),
 (V,['Parotid gland','(Accessory parotid gland)'],'eyes','parotid_gland',True),
 (V,['Parotid duct'],'eyes','parotid_duct',True),
 (V,['Submandibular gland'],'eyes','submandibular_gland',True),
]
def Sk(names,slug): return (R,names,'skin',slug,True)
ITEMS+=[
 Sk(['Frontal region','Eyebrow'],'frontal_region'),Sk(['Parietal region'],'parietal_region'),Sk(['Occipital region'],'occipital_region'),Sk(['Temporal region'],'temporal_region'),Sk(['Mastoid region'],'mastoid_region'),
 Sk(['Orbital region'],'orbital_region'),Sk(['Infra-orbital region'],'infraorbital_region'),Sk(['Nasal region'],'nasal_region'),Sk(['Zygomatic region'],'zygomatic_region'),
 Sk(['Buccal region','Nasolabial sulcus'],'buccal_region'),Sk(['Parotideomasseteric region'],'parotideomasseteric_region'),
 Sk(['Oral region','Angle of mouth','Labial commissure','Philtrum','Tubercle of upper lip'],'oral_region'),Sk(['Mental region','Mentolabial sulcus'],'mental_region'),
 Sk(['Auricular region','Helix','Antihelix','Crura of antihelix','Tragus','Antitragus','Lobule of auricle','Concha of auricle','Cavity of concha','Cymba conchae','Scapha','Triangular fossa','Fossa antihelica','Intertragic incisure','Posterior auricular groove','Anterior notch of auricle','Apex of auricle','Auricular tubercle','Eminentia conchae','Eminentia scaphae','Eminentia fossae triangularis'],'auricle'),
 Sk(['Submandibular triangle'],'submandibular_triangle'),Sk(['Submental triangle'],'submental_triangle'),Sk(['Carotid triangle'],'carotid_triangle'),Sk(['Muscular triangle'],'muscular_triangle'),
 Sk(['Sternocleidomastoid region','Lesser supraclavicular fossa'],'sternocleidomastoid_region'),Sk(['Lateral region of neck'],'lateral_region_of_neck'),Sk(['Posterior region of neck'],'posterior_region_of_neck'),
]
LAYER_PREFIX={'bones':'bone','muscles':'muscle','nerves':'nerve','vessels':'vessel','eyes':'organ','skin':'skin'}

# ---------- v2 additions ----------
ITEMS+=[
 (S,['Sinus of frontal bone'],'eyes','frontal_sinus',False),
 (S,['Sinus of sphenoid bone'],'eyes','sphenoidal_sinus',False),
 (S,['Anterior cells of ethmoid bone','Middle cells of ethmoid bone','Posterior cells of ethmoid bone'],'eyes','ethmoidal_cells',True),
 (V,['Tongue'],'eyes','tongue',False,{'subdiv':2,'maxv':5000}),
 (V,['Sublingual gland'],'eyes','sublingual_gland',True),
 (N,['Lacrimal sac'],'eyes','lacrimal_sac',True),
 (N,['Nasolacrimal duct'],'eyes','nasolacrimal_duct',True),
 (M,['Geniohyoid muscle'],'muscles','geniohyoid',True),
 (M,['Genioglossus muscle'],'muscles','genioglossus',True),
 (M,['Hyoglossus muscle'],'muscles','hyoglossus',True),
]
ITEMS+=[A(n,s) for n,s in [
 ('Middle meningeal artery','middle_meningeal_artery'),('Buccal artery','buccal_artery'),('Anterior deep temporal artery','anterior_deep_temporal_artery'),
 ('Posterior deep temporal artery','posterior_deep_temporal_artery'),('Descending palatine artery','descending_palatine_artery'),('Posterior superior alveolar artery','posterior_superior_alveolar_artery'),
 ('Mental branch of inferior alveolar artery','mental_artery'),('Lacrimal artery','lacrimal_artery'),('Ascending pharyngeal artery','ascending_pharyngeal_artery'),('Vertebral artery','vertebral_artery'),
 ('Lingual vein','lingual_vein'),('Maxillary veins','maxillary_veins'),('Superior ophthalmic vein','superior_ophthalmic_vein'),('Inferior ophthalmic vein','inferior_ophthalmic_vein'),
 ('Transverse sinus','transverse_sinus'),('Sigmoid sinus','sigmoid_sinus'),('Cavernous sinus','cavernous_sinus'),
]]
ITEMS+=[
 (C,['Superior sagittal sinus'],'vessels','superior_sagittal_sinus',False),
 (C,['Straight sinus'],'vessels','straight_sinus',False),
 # brain (merged from Z-Anatomy gyri / parts); 'groups' gathers all descendant meshes
 (N,[],'brain','cerebral_hemisphere',True,{'groups':['Frontal lobe.g','Parietal lobe.g','Temporal lobe.g','Occipital lobe.g','Limbic lobe.g','Insula.g'],'maxv':14000}),
 (N,[],'brain','cerebellum',False,{'groups':['Cerebellum.g'],'maxv':9000}),
 (N,[],'brain','brainstem',False,{'groups':['Midbrain.g','Brainstem.g'],'maxv':6000,'extra':['Pons.l','Pons.r','Medulla oblongata.l','Medulla oblongata.r']}),
 (N,['Corpus callosum'],'brain','corpus_callosum',False,{'maxv':2000}),
 (N,['Falx cerebri'],'brain','falx_cerebri',False,{'maxv':3000}),
]
LAYER_PREFIX['brain']='brain'
# Z-Anatomy attachment markers (.o = origin, .e = insertion) -> our muscle slugs
MARKERS={
 'Anterior belly of digastric muscle':['digastric_anterior'],'Bucinator':['buccinator'],'Depressor anguli oris':['depressor_anguli_oris'],
 'Depressor labii inferioris':['depressor_labii_inferioris'],'Depressor septi nasi':['depressor_septi_nasi'],'Frontalis muscle':['frontalis'],
 'Geniohyoid muscle':['geniohyoid'],'Lateral pterygoid muscle':['lateral_pterygoid_superior','lateral_pterygoid_inferior'],'Levator anguli oris':['levator_anguli_oris'],
 'Levator labii superioris':['levator_labii_superioris'],'Levator nasolabialis':['levator_labii_superioris_alaeque_nasi'],'Masseter':['masseter_superficial','masseter_deep'],
 'Medial pterygoid muscle':['medial_pterygoid'],'Mentalis muscle':['mentalis'],'Mylohyoid muscle':['mylohyoid'],'Nasalis muscle':['nasalis'],'Occipitalis muscle':['occipitalis'],
 'Orbicularis oris muscle':['orbicularis_oris'],'Orbital part of orbicularis oculi':['orbicularis_oculi_orbital'],'Procerus muscle':['procerus'],
 'Sternocleidomastoid muscle':['sternocleidomastoid'],'Temporalis muscle':['temporalis'],'Zygomaticus major muscle':['zygomaticus_major'],'Zygomaticus minor muscle':['zygomaticus_minor'],
}
# facial nerve split: reference centroids (left side, Blender world coords, |x|) of the tube components -> branch
FACIAL_REF=[((0.0387,-0.0055,1.5611),'SPLIT'),((0.0494,-0.0362,1.5651),'zygomatic'),((0.0426,-0.0566,1.5477),'buccal'),((0.059,-0.0362,1.5814),'temporal'),
 ((0.0475,-0.0153,1.5277),'cervical'),((0.0471,0.0089,1.5779),'trunk'),((0.0417,-0.0062,1.5851),'trunk'),((0.0399,-0.0693,1.554),'zygomatic'),
 ((0.0608,-0.0467,1.6038),'temporal'),((0.0416,-0.0506,1.5134),'marginal'),((0.0314,-0.0776,1.534),'buccal'),((0.0053,0.0144,1.5792),'trunk')]
FACIAL_SLUG={'trunk':'facial_nerve','temporal':'facial_temporal_branches','zygomatic':'facial_zygomatic_branches','buccal':'facial_buccal_branches','marginal':'facial_marginal_mandibular_branch','cervical':'facial_cervical_branch'}
