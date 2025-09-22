// Ephemeral in-memory storage for local/dev API stubs.
export const db = {
  users: [
    { id: 'u-sys', role: 'sysadmin', email: 'sys@example.com', active: true },
    { id: 'u-clin', role: 'clinician', email: 'clin@example.com', active: true },
    { id: 'u-teach', role: 'teacher', email: 'teach@example.com', active: true },
  ],
  forms: [
    { id: 'f-1', title: 'Baseline Episode', status: 'active', version: 1 },
  ],
  episodes: [],
  formFields: {
    'f-1': [
      { fieldId: 'fld-ctx', label: 'Context', type: 'select', required: true, options: ['class','recess','lunch','hall','other'], order: 1 },
      { fieldId: 'fld-notes', label: 'Notes', type: 'textarea', required: false, order: 2 },
    ],
  },
}

export function resetDb() {
  db.forms = [{ id: 'f-1', title: 'Baseline Episode', status: 'active', version: 1 }]
  db.episodes = []
  db.formFields = {
    'f-1': [
      { fieldId: 'fld-ctx', label: 'Context', type: 'select', required: true, options: ['class','recess','lunch','hall','other'], order: 1 },
      { fieldId: 'fld-notes', label: 'Notes', type: 'textarea', required: false, order: 2 },
    ],
  }
}
