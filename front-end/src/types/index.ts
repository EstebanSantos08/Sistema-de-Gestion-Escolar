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
