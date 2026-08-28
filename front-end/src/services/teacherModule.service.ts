import type {
  AttendanceRecord,
  AttendanceStatus,
  ClassActivity,
  StudentObservation,
  Announcement,
} from '@/types';

const STORAGE_KEYS = {
  ATTENDANCE: 'teacher_attendance_records',
  ACTIVITIES: 'teacher_activities_records',
  OBSERVATIONS: 'teacher_observations_records',
  ANNOUNCEMENTS: 'teacher_announcements_records',
};

// Initial seed data for demonstration if localStorage is empty
const INITIAL_ACTIVITIES: ClassActivity[] = [
  {
    id: 'act-1',
    courseId: 1,
    courseName: 'Matemáticas I',
    title: 'Taller de Ecuaciones Lineales',
    description: 'Resolver los ejercicios del capítulo 4 del texto guía.',
    dueDate: '2026-09-05',
    type: 'taller',
    status: 'en_curso',
    createdAt: '2026-08-25',
  },
  {
    id: 'act-2',
    courseId: 1,
    courseName: 'Matemáticas I',
    title: 'Examen de Primer Parcial',
    description: 'Evaluación acumulativa sobre álgebra y trigonometría básica.',
    dueDate: '2026-09-12',
    type: 'examen',
    status: 'programada',
    createdAt: '2026-08-26',
  },
  {
    id: 'act-3',
    courseId: 3,
    courseName: 'Ciencias Naturales',
    title: 'Informe de Laboratorio de Biología',
    description: 'Entrega del reporte del experimento de fotosíntesis.',
    dueDate: '2026-09-02',
    type: 'proyecto',
    status: 'en_curso',
    createdAt: '2026-08-24',
  },
];

const INITIAL_OBSERVATIONS: StudentObservation[] = [
  {
    id: 'obs-1',
    studentId: 1,
    studentName: 'Juan Pérez',
    studentCode: 'EST-2026-001',
    courseId: 1,
    courseName: 'Matemáticas I',
    type: 'positiva',
    title: 'Participación Destacada',
    detail: 'Demuestra gran iniciativa en la resolución de problemas en la pizarra.',
    date: '2026-08-26',
    visibleToParents: true,
  },
  {
    id: 'obs-2',
    studentId: 3,
    studentName: 'Pedro Sánchez',
    studentCode: 'EST-2026-003',
    courseId: 1,
    courseName: 'Matemáticas I',
    type: 'atencion',
    title: 'Falta de Cumplimiento de Deberes',
    detail: 'No presentó la guía de estudio n.º 2. Se le encomendó recuperarla.',
    date: '2026-08-27',
    visibleToParents: true,
  },
];

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Recordatorio de Feria de Ciencias',
    content: 'Se recuerda a todos los estudiantes presentar el bosquejo del proyecto antes del próximo viernes.',
    courseId: null,
    courseName: 'Todos los cursos',
    priority: 'importante',
    publishDate: '2026-08-25',
    authorName: 'Prof. Carlos García',
  },
  {
    id: 'ann-2',
    title: 'Material Extra para Examen de Matemáticas',
    content: 'En la sección de recursos se ha adjuntado la guía resumida para el primer examen parcial.',
    courseId: 1,
    courseName: 'Matemáticas I',
    priority: 'normal',
    publishDate: '2026-08-27',
    authorName: 'Prof. Carlos García',
  },
];

function getFromStorage<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function saveToStorage<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error('Error al guardar en localStorage', err);
  }
}

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  { id: 'att-101', courseId: 1, courseName: 'Matemáticas I', studentId: 1, studentName: 'Juan Pérez', studentCode: 'EST-2026-001', date: '2026-08-28', status: 'present', notes: 'Asistencia regular' },
  { id: 'att-102', courseId: 1, courseName: 'Matemáticas I', studentId: 2, studentName: 'María Rodríguez', studentCode: 'EST-2026-002', date: '2026-08-28', status: 'present', notes: '' },
  { id: 'att-103', courseId: 1, courseName: 'Matemáticas I', studentId: 3, studentName: 'Pedro Sánchez', studentCode: 'EST-2026-003', date: '2026-08-28', status: 'absent', notes: 'Falta no justificada' },
  { id: 'att-104', courseId: 1, courseName: 'Matemáticas I', studentId: 4, studentName: 'Ana López', studentCode: 'EST-2026-004', date: '2026-08-28', status: 'late', notes: 'Atraso de 15 minutos' },
  { id: 'att-105', courseId: 1, courseName: 'Matemáticas I', studentId: 1, studentName: 'Juan Pérez', studentCode: 'EST-2026-001', date: '2026-08-27', status: 'present', notes: '' },
  { id: 'att-106', courseId: 1, courseName: 'Matemáticas I', studentId: 2, studentName: 'María Rodríguez', studentCode: 'EST-2026-002', date: '2026-08-27', status: 'excused', notes: 'Cita médica certificada' },
  { id: 'att-107', courseId: 2, courseName: 'Lengua y Literatura', studentId: 1, studentName: 'Juan Pérez', studentCode: 'EST-2026-001', date: '2026-08-28', status: 'present', notes: '' },
  { id: 'att-108', courseId: 2, courseName: 'Lengua y Literatura', studentId: 3, studentName: 'Pedro Sánchez', studentCode: 'EST-2026-003', date: '2026-08-28', status: 'present', notes: '' },
  { id: 'att-109', courseId: 3, courseName: 'Ciencias Naturales', studentId: 4, studentName: 'Ana López', studentCode: 'EST-2026-004', date: '2026-08-26', status: 'present', notes: '' },
];

export interface AuditLogItem {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  entity: string;
  details: string;
  ip: string;
}

const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  { id: 'log-1', timestamp: '2026-08-28 09:15:22', user: 'Directora María', role: 'admin', action: 'INICIO_SESION', entity: 'Sistema', details: 'Inicio de sesión exitoso desde Panel Web', ip: '192.168.1.10' },
  { id: 'log-2', timestamp: '2026-08-28 08:30:10', user: 'Prof. Carlos García', role: 'teacher', action: 'REGISTRO_ASISTENCIA', entity: 'Matemáticas I', details: 'Guardada asistencia de 4 estudiantes para la fecha 2026-08-28', ip: '192.168.1.15' },
  { id: 'log-3', timestamp: '2026-08-27 16:45:00', user: 'Prof. Carlos García', role: 'teacher', action: 'CREAR_OBSERVACION', entity: 'Pedro Sánchez', details: 'Registrada observación por falta de cumplimiento de deberes', ip: '192.168.1.15' },
  { id: 'log-4', timestamp: '2026-08-27 14:10:05', user: 'Directora María', role: 'admin', action: 'MODIFICAR_MATRICULA', entity: 'Juan Pérez', details: 'Actualizado estado de matrícula a ACTIVA (Período 2026-I)', ip: '192.168.1.10' },
  { id: 'log-5', timestamp: '2026-08-26 11:20:30', user: 'Prof. Carlos García', role: 'teacher', action: 'PUBLICAR_COMUNICADO', entity: 'Feria de Ciencias', details: 'Publicado aviso para todas las familias sobre la Feria de Ciencias', ip: '192.168.1.15' },
  { id: 'log-6', timestamp: '2026-08-25 10:00:12', user: 'Directora María', role: 'admin', action: 'CAMBIO_PERIODO', entity: 'Sistema', details: 'Configurado período académico activo a 2026-I', ip: '192.168.1.10' },
];

export const teacherModuleService = {
  // ── Asistencia ─────────────────────────────────────────────────────────────
  getAttendance(courseId?: number, date?: string): AttendanceRecord[] {
    let list = getFromStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
      saveToStorage(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    }
    if (courseId) {
      list = list.filter((r) => r.courseId === courseId);
    }
    if (date) {
      list = list.filter((r) => r.date === date);
    }
    return list;
  },

  getAuditLogs(): AuditLogItem[] {
    return getFromStorage<AuditLogItem[]>('system_audit_logs', INITIAL_AUDIT_LOGS);
  },


  saveAttendanceBatch(records: Omit<AttendanceRecord, 'id'>[]): AttendanceRecord[] {
    const list = getFromStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
    const updated = [...list];

    records.forEach((newRec) => {
      const idx = updated.findIndex(
        (r) => r.courseId === newRec.courseId && r.studentId === newRec.studentId && r.date === newRec.date
      );
      const recordWithId: AttendanceRecord = {
        ...newRec,
        id: idx >= 0 ? updated[idx].id : `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      };
      if (idx >= 0) {
        updated[idx] = recordWithId;
      } else {
        updated.push(recordWithId);
      }
    });

    saveToStorage(STORAGE_KEYS.ATTENDANCE, updated);
    return updated;
  },

  // ── Actividades ────────────────────────────────────────────────────────────
  getActivities(courseId?: number): ClassActivity[] {
    const list = getFromStorage<ClassActivity[]>(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
      saveToStorage(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
    }
    if (courseId) {
      return list.filter((a) => a.courseId === courseId);
    }
    return list;
  },

  createActivity(data: Omit<ClassActivity, 'id' | 'createdAt'>): ClassActivity {
    const list = this.getActivities();
    const newActivity: ClassActivity = {
      ...data,
      id: `act-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newActivity, ...list];
    saveToStorage(STORAGE_KEYS.ACTIVITIES, updated);
    return newActivity;
  },

  updateActivityStatus(id: string, status: ClassActivity['status']): void {
    const list = this.getActivities();
    const updated = list.map((a) => (a.id === id ? { ...a, status } : a));
    saveToStorage(STORAGE_KEYS.ACTIVITIES, updated);
  },

  deleteActivity(id: string): void {
    const list = this.getActivities();
    const updated = list.filter((a) => a.id !== id);
    saveToStorage(STORAGE_KEYS.ACTIVITIES, updated);
  },

  // ── Observaciones ──────────────────────────────────────────────────────────
  getObservations(studentId?: number, courseId?: number): StudentObservation[] {
    const list = getFromStorage<StudentObservation[]>(STORAGE_KEYS.OBSERVATIONS, INITIAL_OBSERVATIONS);
    if (!localStorage.getItem(STORAGE_KEYS.OBSERVATIONS)) {
      saveToStorage(STORAGE_KEYS.OBSERVATIONS, INITIAL_OBSERVATIONS);
    }
    return list.filter((obs) => {
      if (studentId && obs.studentId !== studentId) return false;
      if (courseId && obs.courseId !== courseId) return false;
      return true;
    });
  },

  createObservation(data: Omit<StudentObservation, 'id' | 'date'>): StudentObservation {
    const list = this.getObservations();
    const newObs: StudentObservation = {
      ...data,
      id: `obs-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };
    const updated = [newObs, ...list];
    saveToStorage(STORAGE_KEYS.OBSERVATIONS, updated);
    return newObs;
  },

  deleteObservation(id: string): void {
    const list = getFromStorage<StudentObservation[]>(STORAGE_KEYS.OBSERVATIONS, INITIAL_OBSERVATIONS);
    const updated = list.filter((o) => o.id !== id);
    saveToStorage(STORAGE_KEYS.OBSERVATIONS, updated);
  },

  // ── Comunicados ────────────────────────────────────────────────────────────
  getAnnouncements(courseId?: number): Announcement[] {
    const list = getFromStorage<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
    if (!localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) {
      saveToStorage(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
    }
    if (courseId) {
      return list.filter((ann) => ann.courseId === null || ann.courseId === courseId);
    }
    return list;
  },

  createAnnouncement(data: Omit<Announcement, 'id' | 'publishDate'>): Announcement {
    const list = this.getAnnouncements();
    const newAnn: Announcement = {
      ...data,
      id: `ann-${Date.now()}`,
      publishDate: new Date().toISOString().split('T')[0],
    };
    const updated = [newAnn, ...list];
    saveToStorage(STORAGE_KEYS.ANNOUNCEMENTS, updated);
    return newAnn;
  },

  deleteAnnouncement(id: string): void {
    const list = getFromStorage<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
    const updated = list.filter((a) => a.id !== id);
    saveToStorage(STORAGE_KEYS.ANNOUNCEMENTS, updated);
  },
};
