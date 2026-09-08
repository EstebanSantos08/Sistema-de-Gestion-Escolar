// ─── Auth / Users ────────────────────────────────────────────────────────────

export type Role = 'admin' | 'teacher' | 'student' | 'parent';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

// ─── Students ────────────────────────────────────────────────────────────────

export interface StudentProfile {
  id: number;
  userId: number;
  studentCode: string;
  birthDate: string;
  phone: string;
  address: string;
  guardianName: string;
  guardianPhone: string;
  enrolledAt: string;
}

export interface Student {
  id: number;
  name: string;
  email: string;
  role: 'student';
  active: boolean;
  studentProfile?: StudentProfile;
}

// ─── Teachers ────────────────────────────────────────────────────────────────

export interface TeacherProfile {
  id: number;
  userId: number;
  teacherCode: string;
  specialization: string;
  phone: string;
}

export interface Teacher {
  id: number;
  name: string;
  email: string;
  role: 'teacher';
  active: boolean;
  teacherProfile?: TeacherProfile;
}

// ─── Courses ─────────────────────────────────────────────────────────────────

export interface Course {
  id: number;
  name: string;
  code: string;
  description: string;
  credits: number;
  period: string;
  teacherId: number;
  active: boolean;
  teacher?: {
    id: number;
    user?: { name: string };
  };
  enrollmentsCount?: number;
  enrolledCount?: number;
}

// ─── Enrollments ─────────────────────────────────────────────────────────────

export type EnrollmentStatus = 'active' | 'withdrawn' | 'completed';

export interface Enrollment {
  id: number;
  studentId: number;
  courseId: number;
  period: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  student?: {
    id: number;
    studentCode: string;
    user?: { name: string; email: string };
  };
  course?: Course;
}

// ─── Grades ──────────────────────────────────────────────────────────────────

export type GradeType = 'parcial1' | 'parcial2' | 'examen_final' | 'tarea' | 'proyecto';

export interface Grade {
  id: number;
  enrollmentId: number;
  gradeType: GradeType;
  score: number;
  weight: number;
  comments: string;
  gradedAt: string;
  gradedById: number;
}

export interface CourseGradeRow {
  enrollmentId: number;
  studentId: number;
  studentCode: string;
  name: string;
  status: EnrollmentStatus;
  gradesCount: number;
  weightedAverage: number;
  passed: boolean;
}

export interface StudentGradeByCourse {
  courseId: number;
  courseName: string;
  courseCode: string;
  teacherName: string;
  enrollmentStatus: EnrollmentStatus;
  grades: { gradeType: GradeType; score: number; weight: number; comments?: string }[];
  weightedAverage: number;
  passed: boolean;
}

export interface StudentGradesResponse {
  student: { id: number; name: string; studentCode: string };
  period: string;
  courses: StudentGradeByCourse[];
  generalAverage: number;
}

// ─── Asistencia ────────────────────────────────────────────────────────────────

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: string;
  courseId: number;
  courseName?: string;
  studentId: number;
  studentName: string;
  studentCode: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  notes?: string;
}

// ─── Actividades ───────────────────────────────────────────────────────────────

export type ActivityType = 'tarea' | 'examen' | 'taller' | 'proyecto' | 'deber';
export type ActivityStatus = 'programada' | 'en_curso' | 'completada';

export interface ClassActivity {
  id: string;
  courseId: number;
  courseName: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  type: ActivityType;
  status: ActivityStatus;
  createdAt: string;
}

// ─── Observaciones ─────────────────────────────────────────────────────────────

export type ObservationType = 'positiva' | 'recomendacion' | 'atencion';
export type ObservationVisibility = 'ESTUDIANTE_Y_PADRES' | 'SOLO_ESTUDIANTE' | 'SOLO_DOCENTE';

export interface StudentObservation {
  id: string;
  studentId: number;
  studentName: string;
  studentCode: string;
  courseId: number;
  courseName: string;
  type: ObservationType;
  title: string;
  detail: string;
  date: string;
  visibility: ObservationVisibility;
}

// ─── Comunicados ───────────────────────────────────────────────────────────────

export type AnnouncementPriority = 'normal' | 'importante' | 'urgente';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  courseId?: number | null; // null = Todos los cursos
  courseName?: string;
  priority: AnnouncementPriority;
  publishDate: string;
  authorName: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── API standard response ────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: unknown[];
}

// ─── Backend Domain Models (Canonical API) ───────────────────────────────────

export interface ApiActivity {
  id: number;
  courseId: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  type: ActivityType;
  status: ActivityStatus;
  maxScore: number;
  createdAt?: string;
  updatedAt?: string;
  course?: Course;
}

export type SubmissionStatus =
  | 'pendiente'
  | 'en_proceso'
  | 'entregada'
  | 'en_revision'
  | 'completada'
  | 'devuelta';

export interface EvidenceRecord {
  id: number;
  submissionId: number;
  type: 'imagen' | 'video' | 'documento' | 'audio';
  fileName: string;
  mimeType?: string | null;
  fileSize?: number | null;
  caption?: string | null;
  createdAt: string;
}

export interface SubmissionRecord {
  id: number;
  activityId: number;
  studentId: number;
  representativeId?: number | null;
  status: SubmissionStatus;
  submittedAt: string | null;
  studentNotes: string | null;
  teacherFeedback: string | null;
  score: number | null;
  createdAt?: string;
  updatedAt?: string;
  student?: {
    id: number;
    studentCode?: string;
    user?: {
      id: number;
      name: string;
      email: string;
    };
  };
  evidences?: EvidenceRecord[];
  activity?: {
    id: number;
    title: string;
    courseId: number;
    maxScore: number;
    dueDate: string | null;
  };
}

export type BackendObservationType = 'ACADEMIC' | 'BEHAVIORAL' | 'GENERAL';
export type BackendObservationVisibility = 'ESTUDIANTE_Y_PADRES' | 'SOLO_ESTUDIANTE' | 'SOLO_DOCENTE';

export interface BackendObservation {
  id: number;
  studentId: number;
  teacherId: number;
  title: string;
  description: string;
  type: BackendObservationType;
  visibility: BackendObservationVisibility;
  date?: string;
  createdAt?: string;
  updatedAt?: string;
  student?: {
    id: number;
    user?: {
      id: number;
      name: string;
      email: string;
    };
  };
  teacher?: {
    id: number;
    user?: {
      id: number;
      name: string;
      email: string;
    };
  };
}

export interface NormalizedAuditLog {
  id: number;
  actor: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  action: string;
  gradeCategory?: 'task' | 'academic';
  student?: {
    id: number;
    name: string;
  };
  teacher?: {
    id: number;
    name: string;
  };
  course?: {
    id: number;
    name: string;
    code?: string;
  };
  activity?: {
    id: number;
    title: string;
  };
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
  details?: Record<string, unknown>;
}

export interface AuditLogFiltersResponse {
  teachers: Array<{ id: number; name?: string }>;
  students: Array<{ id: number; name?: string }>;
  courses: Array<{ id: number; name: string; code: string }>;
  activities: Array<{ id: number; title: string; courseId: number }>;
  gradeCategories: Array<{ value: string; label: string }>;
  actions: Array<{ value: string; label: string }>;
}

export interface TeacherDailySummary {
  date: string;
  period: string;
  teacher: { id: number; userId: number };
  courses: Array<{ id: number; name: string; code: string; enrolledCount: number }>;
  attendance: Array<{
    id: number;
    studentId: number;
    courseId: number;
    date: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    notes?: string;
    student?: { id: number; user?: { id: number; name: string } };
  }>;
  activities: Array<{
    id: number;
    courseId: number;
    title: string;
    dueDate?: string;
    type: ActivityType;
    status: ActivityStatus;
    submissionsCount?: number;
    gradedCount?: number;
  }>;
  observations: Array<{
    id: number;
    studentId: number;
    title: string;
    description: string;
    type: BackendObservationType;
    student?: { id: number; user?: { id: number; name: string } };
  }>;
  announcements: Array<{
    id: number;
    courseId?: number;
    title: string;
    content: string;
    date?: string;
  }>;
  summary: {
    totalStudents: number;
    presentToday: number;
    absentToday: number;
    activitiesToday: number;
    observationsToday: number;
    announcementsToday: number;
  };
}

export type BackendAttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface BackendAttendance {
  id: number;
  studentId: number;
  courseId: number;
  date: string;
  status: BackendAttendanceStatus;
  remarks: string | null;
  registeredById: number;
  createdAt?: string;
  updatedAt?: string;
  student?: {
    id: number;
    studentCode?: string;
    user?: {
      id: number;
      name: string;
      email: string;
    };
  };
  course?: {
    id: number;
    name: string;
    code?: string;
  };
  registeredBy?: {
    id: number;
    name: string;
  };
}

export type AnnouncementTargetRole = 'ALL' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface BackendAnnouncement {
  id: number;
  title: string;
  content: string;
  targetRole: AnnouncementTargetRole;
  courseId: number | null;
  authorId: number;
  createdAt: string;
  updatedAt?: string;
  course?: {
    id: number;
    name: string;
    code?: string;
  };
  author?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}


