import type {
  AttendanceRecord,
  AttendanceStatus,
  ClassActivity,
  StudentObservation,
  Announcement,
} from '@/types';

export type {
  AttendanceRecord,
  AttendanceStatus,
  ClassActivity,
  StudentObservation,
  Announcement,
};

export const getTodayStr = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export interface SubmissionItem {
  id: string;
  activityId: string;
  studentId: number;
  studentName: string;
  courseId: number;
  status: 'pendiente' | 'entregada' | 'completada' | 'devuelta' | 'calificada';
  submittedAt: string;
  notes?: string;
  evidenceUrl?: string;
  evidenceName?: string;
  evidenceType?: 'imagen' | 'documento';
  score?: number;
  maxScore?: number;
  feedback?: string;
  gradedAt?: string;
}

const STORAGE_KEYS = {
  ATTENDANCE: 'teacher_attendance_records_v4',
  ACTIVITIES: 'teacher_activities_records_v4',
  OBSERVATIONS: 'teacher_observations_records_v4',
  ANNOUNCEMENTS: 'teacher_announcements_records_v4',
  SUBMISSIONS: 'student_submissions_records_v1',
};

// Initial seed data for demonstration if localStorage is empty
const INITIAL_ACTIVITIES: ClassActivity[] = [
  {
    id: 'act-1',
    courseId: 1,
    courseName: 'Matemáticas I',
    title: 'Taller de Ecuaciones Lineales',
    description: 'Resolver los ejercicios del capítulo 4 del texto guía y adjuntar foto o PDF de la resolución.',
    dueDate: '2026-09-05 23:59',
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
    dueDate: '2026-09-12 23:59',
    type: 'examen',
    status: 'programada',
    createdAt: '2026-08-26',
  },
  {
    id: 'act-3',
    courseId: 2,
    courseName: 'Lengua y Literatura',
    title: 'Análisis Literario y Resumen de Lectura',
    description: 'Redactar un resumen sintético sobre la obra asignada en clase.',
    dueDate: '2026-09-08 23:59',
    type: 'deber',
    status: 'en_curso',
    createdAt: '2026-08-27',
  },
  {
    id: 'act-4',
    courseId: 3,
    courseName: 'Ciencias Naturales',
    title: 'Informe de Laboratorio de Biología',
    description: 'Entrega del reporte del experimento de fotosíntesis con fotos de la evidencia.',
    dueDate: '2026-09-02 23:59',
    type: 'proyecto',
    status: 'en_curso',
    createdAt: '2026-08-24',
  },
  {
    id: 'act-5',
    courseId: 4,
    courseName: 'Historia Universal',
    title: 'Línea de Tiempo del Siglo XX',
    description: 'Elaborar un esquema gráfico con los eventos más importantes del siglo XX.',
    dueDate: '2026-09-10 23:59',
    type: 'taller',
    status: 'en_curso',
    createdAt: '2026-08-28',
  },
  {
    id: 'act-6',
    courseId: 5,
    courseName: 'Informática Básica',
    title: 'Práctica de Programación en Scratch/Python',
    description: 'Desarrollar un script que realice operaciones básicas y adjuntar captura o PDF.',
    dueDate: '2026-09-06 23:59',
    type: 'deber',
    status: 'en_curso',
    createdAt: '2026-08-29',
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
    visibility: 'ESTUDIANTE_Y_PADRES',
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
    visibility: 'ESTUDIANTE_Y_PADRES',
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

const INITIAL_SUBMISSIONS: SubmissionItem[] = [
  {
    id: 'sub-1',
    activityId: 'act-1',
    studentId: 1,
    studentName: 'Juan Pérez',
    courseId: 1,
    status: 'calificada',
    submittedAt: '2026-08-28 14:30',
    notes: 'Adjunto la resolución completa del taller del capítulo 4.',
    evidenceUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
    evidenceName: 'Taller_Ecuaciones_JuanPerez.jpg',
    evidenceType: 'imagen',
    score: 10,
    maxScore: 10,
    feedback: 'Excelente resolución. Todos los ejercicios fueron completados de manera ordenada.',
    gradedAt: '2026-08-29 10:00',
  },
  {
    id: 'sub-2',
    activityId: 'act-1',
    studentId: 2,
    studentName: 'María Rodríguez',
    courseId: 1,
    status: 'entregada',
    submittedAt: '2026-08-29 09:15',
    notes: 'Entregado a tiempo. Saludos docente.',
    evidenceUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    evidenceName: 'Ecuaciones_Maria_Rodrigues.png',
    evidenceType: 'imagen',
  },
  {
    id: 'sub-3',
    activityId: 'act-1',
    studentId: 4,
    studentName: 'Ana López',
    courseId: 1,
    status: 'entregada',
    submittedAt: '2026-08-30 18:45',
    notes: 'Subo las fotos del cuaderno de trabajo.',
    evidenceUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
    evidenceName: 'Resolucion_AnaLopez.png',
    evidenceType: 'imagen',
  },
  {
    id: 'sub-4',
    activityId: 'act-3',
    studentId: 1,
    studentName: 'Juan Pérez',
    courseId: 2,
    status: 'entregada',
    submittedAt: '2026-08-29 11:20',
    notes: 'Resumen literario con análisis sintético.',
    evidenceUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80',
    evidenceName: 'Resumen_Literario_JuanPerez.pdf',
    evidenceType: 'documento',
  },
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
      createdAt: getTodayStr(),
    };
    const updated = [newActivity, ...list];
    saveToStorage(STORAGE_KEYS.ACTIVITIES, updated);
    return newActivity;
  },

  updateActivity(id: string, data: Partial<Omit<ClassActivity, 'id' | 'createdAt'>>): ClassActivity {
    const list = this.getActivities();
    const idx = list.findIndex((a) => a.id === id);
    if (idx < 0) throw new Error('Actividad no encontrada');
    const updatedActivity = { ...list[idx], ...data };
    list[idx] = updatedActivity;
    saveToStorage(STORAGE_KEYS.ACTIVITIES, list);
    return updatedActivity;
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

  // ── Entregas y Evidencias (Límite 1MB) ─────────────────────────────────────
  MAX_FILE_SIZE_BYTES: 1048576, // 1 MB en bytes

  validateAndReadEvidenceFile(file: File): Promise<{ fileName: string; fileUrl: string; fileType: 'imagen' | 'documento' }> {
    return new Promise((resolve, reject) => {
      if (file.size > 1048576) {
        reject(new Error(`El archivo "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB) supera el tamaño máximo permitido de 1 MB.`));
        return;
      }

      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

      if (!isImage && !isPdf) {
        reject(new Error('Formato no permitido. Solo se aceptan imágenes (JPG, PNG) y archivos PDF.'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          fileName: file.name,
          fileUrl: reader.result as string,
          fileType: isImage ? 'imagen' : 'documento',
        });
      };
      reader.onerror = () => reject(new Error('Error al procesar el archivo seleccionado.'));
      reader.readAsDataURL(file);
    });
  },

  getSubmissions(activityId?: string, studentId?: number): SubmissionItem[] {
    const list = getFromStorage<SubmissionItem[]>(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    if (!localStorage.getItem(STORAGE_KEYS.SUBMISSIONS)) {
      saveToStorage(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    }
    return list.filter((s) => {
      if (activityId && s.activityId !== activityId) return false;
      if (studentId && s.studentId !== studentId) return false;
      return true;
    });
  },

  createSubmission(submission: Omit<SubmissionItem, 'id' | 'submittedAt'>): SubmissionItem {
    const list = getFromStorage<SubmissionItem[]>(STORAGE_KEYS.SUBMISSIONS, []);
    const newSub: SubmissionItem = {
      ...submission,
      id: `sub-${Date.now()}`,
      submittedAt: getTodayStr(),
    };
    const updated = [newSub, ...list.filter((s) => !(s.activityId === submission.activityId && s.studentId === submission.studentId))];
    saveToStorage(STORAGE_KEYS.SUBMISSIONS, updated);
    return newSub;
  },

  gradeSubmission(data: {
    submissionId?: string;
    activityId: string;
    studentId: number;
    studentName?: string;
    courseId?: number;
    score: number;
    feedback?: string;
    maxScore?: number;
  }): SubmissionItem {
    const list = getFromStorage<SubmissionItem[]>(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    const maxScore = data.maxScore ?? 10;
    const nowStr = getTodayStr();

    let existingIdx = -1;
    if (data.submissionId) {
      existingIdx = list.findIndex((s) => s.id === data.submissionId);
    } else {
      existingIdx = list.findIndex((s) => s.activityId === data.activityId && s.studentId === data.studentId);
    }

    if (existingIdx >= 0) {
      const updated: SubmissionItem = {
        ...list[existingIdx],
        status: 'calificada',
        score: data.score,
        maxScore,
        feedback: data.feedback,
        gradedAt: nowStr,
      };
      list[existingIdx] = updated;
      saveToStorage(STORAGE_KEYS.SUBMISSIONS, list);
      return updated;
    } else {
      const newSub: SubmissionItem = {
        id: `sub-${Date.now()}`,
        activityId: data.activityId,
        studentId: data.studentId,
        studentName: data.studentName || `Estudiante #${data.studentId}`,
        courseId: data.courseId || 1,
        status: 'calificada',
        submittedAt: getTodayStr(),
        score: data.score,
        maxScore,
        feedback: data.feedback,
        gradedAt: nowStr,
      };
      const updatedList = [newSub, ...list];
      saveToStorage(STORAGE_KEYS.SUBMISSIONS, updatedList);
      return newSub;
    }
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
      date: getTodayStr(),
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
      publishDate: getTodayStr(),
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

  // ── Bitácora ───────────────────────────────────────────────────────────────
  getBitacoraByDate(dateStr: string) {
    const todayStr = getTodayStr();
    const isFuture = dateStr > todayStr;

    if (isFuture) {
      // En fechas futuras: NINGUNA asistencia, observación ni comunicado existe.
      // Únicamente se muestran las actividades programadas para esa fecha límite (status !== 'completada')
      const scheduledActivities = this.getActivities().filter(
        (act) => act.dueDate === dateStr && act.status !== 'completada'
      );
      return {
        date: dateStr,
        isFuture: true,
        attendance: [],
        observations: [],
        announcements: [],
        activities: [],
        scheduledActivities,
        totalRecords: scheduledActivities.length,
      };
    }

    // En fechas presentes/pasadas (dateStr <= todayStr):
    const attendance = this.getAttendance(undefined, dateStr);
    const observations = this.getObservations().filter((o) => o.date === dateStr);
    const announcements = this.getAnnouncements().filter((a) => a.publishDate === dateStr);
    // Solo actividades con estado 'completada' (Finalizada)
    const activities = this.getActivities().filter(
      (act) => act.status === 'completada' && (act.dueDate === dateStr || act.createdAt === dateStr)
    );

    return {
      date: dateStr,
      isFuture: false,
      attendance,
      observations,
      announcements,
      activities,
      scheduledActivities: [],
      totalRecords: attendance.length + observations.length + announcements.length + activities.length,
    };
  },
};
