// Facial-expression demos: which muscles produce each movement and which nerve branches supply them.
export interface Expression { id: string; label: string; emoji: string; muscles: string[]; nerves: string[]; text: string }
export const EXPRESSIONS: Expression[] = [
  { id: 'smile', label: 'Smile', emoji: '😊', muscles: ['muscle.zygomaticus_major', 'muscle.zygomaticus_minor', 'muscle.levator_anguli_oris', 'muscle.risorius', 'muscle.orbicularis_oculi_orbital'], nerves: ['nerve.facial_zygomatic_branches', 'nerve.facial_buccal_branches'],
    text: 'Zygomaticus major pulls the corners of the mouth up and out, helped by zygomaticus minor, levator anguli oris and risorius. In a genuine ("Duchenne") smile the orbital part of orbicularis oculi also contracts, crinkling the skin beside the eyes. Supplied by the zygomatic and buccal branches of the facial nerve.' },
  { id: 'surprise', label: 'Raise brows', emoji: '😮', muscles: ['muscle.frontalis'], nerves: ['nerve.facial_temporal_branches'],
    text: 'Frontalis lifts the eyebrows and wrinkles the forehead horizontally. Supplied by the temporal branches of the facial nerve. It is spared in a stroke but paralysed in Bell\'s palsy.' },
  { id: 'scowl', label: 'Scowl', emoji: '😠', muscles: ['muscle.corrugator_supercilii', 'muscle.procerus', 'muscle.orbicularis_oculi_orbital'], nerves: ['nerve.facial_temporal_branches', 'nerve.facial_zygomatic_branches'],
    text: 'Corrugator supercilii draws the brows together (vertical frown lines), procerus pulls the skin between them down (horizontal lines over the nose), and orbicularis oculi narrows the eyes. Supplied by the temporal and zygomatic branches of the facial nerve.' },
  { id: 'squeeze', label: 'Close eyes tight', emoji: '😣', muscles: ['muscle.orbicularis_oculi_orbital', 'muscle.orbicularis_oculi_palpebral'], nerves: ['nerve.facial_temporal_branches', 'nerve.facial_zygomatic_branches'],
    text: 'The palpebral part of orbicularis oculi closes the lids gently (blinking); the orbital part squeezes them tightly shut. Supplied by the temporal and zygomatic branches of the facial nerve.' },
  { id: 'sneer', label: 'Sneer', emoji: '😒', muscles: ['muscle.levator_labii_superioris_alaeque_nasi', 'muscle.levator_labii_superioris'], nerves: ['nerve.facial_zygomatic_branches', 'nerve.facial_buccal_branches'],
    text: 'Levator labii superioris alaeque nasi raises the upper lip and flares the nostril; levator labii superioris lifts the upper lip. Supplied by the zygomatic and buccal branches of the facial nerve.' },
  { id: 'pucker', label: 'Pucker / blow', emoji: '😗', muscles: ['muscle.orbicularis_oris', 'muscle.buccinator'], nerves: ['nerve.facial_buccal_branches', 'nerve.facial_marginal_mandibular_branch'],
    text: 'Orbicularis oris closes and protrudes the lips; buccinator holds the cheeks firm against the teeth when blowing or whistling. Supplied by the buccal and marginal mandibular branches of the facial nerve.' },
  { id: 'sad', label: 'Sad mouth', emoji: '☹️', muscles: ['muscle.depressor_anguli_oris', 'muscle.depressor_labii_inferioris', 'muscle.mentalis', 'muscle.platysma'], nerves: ['nerve.facial_marginal_mandibular_branch', 'nerve.facial_cervical_branch'],
    text: 'Depressor anguli oris pulls the corners of the mouth down, depressor labii inferioris lowers the lip, mentalis puckers the chin and platysma tenses the neck skin. Supplied by the marginal mandibular and cervical branches of the facial nerve.' },
  { id: 'clench', label: 'Clench jaw', emoji: '😬', muscles: ['muscle.temporalis', 'muscle.masseter_superficial', 'muscle.masseter_deep', 'muscle.medial_pterygoid'], nerves: ['nerve.mandibular_nerve_anterior', 'nerve.mandibular_nerve_posterior'],
    text: 'Not a facial-expression muscle group: temporalis, masseter and medial pterygoid close the jaw. They are muscles of mastication, supplied by the mandibular division of the trigeminal nerve (V3), not the facial nerve.' },
]
export const EXPRESSION_BY_ID = Object.fromEntries(EXPRESSIONS.map((e) => [e.id, e]))
