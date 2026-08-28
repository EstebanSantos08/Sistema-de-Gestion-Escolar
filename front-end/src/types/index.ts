// ─── Auth / Users ────────────────────────────────────────────────────────────

export type Role = 'admin' | 'teacher' | 'student';

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

export type ActivityType = 'tarea' | 'examen' | 'taller' | 'proyecto';
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
  visibleToParents: boolean;
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

