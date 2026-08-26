# CLAUDE.md — Sistema de Gestión Escolar
> Documento de instrucciones completo para Claude Code.
> Lee este archivo de principio a fin antes de escribir cualquier línea de código.

---

## CONTEXTO DEL PROYECTO

Construir un sistema web full-stack de gestión escolar con los siguientes módulos:
- **Matrículas**: registro de estudiantes en cursos por período académico.
- **Calificaciones**: ingreso, edición y ponderación de notas por materia.
- **Reportes**: exportación a Excel (.xlsx) y PDF con diseño profesional.
- **Autenticación por roles**: Administrador, Docente, Estudiante.

El sistema se ejecuta completamente en local. No requiere servicios cloud ni bases de datos externas.

---

## STACK TECNOLÓGICO — OBLIGATORIO

### Backend
| Paquete | Versión mínima | Uso |
|---|---|---|
| Node.js | 20 LTS | Runtime |
| TypeScript | 5.x | Lenguaje |
| Express | 4.x | Framework HTTP |
| Sequelize | 6.x | ORM |
| sqlite3 | 5.x | Driver SQLite |
| jsonwebtoken | 9.x | Autenticación JWT |
| bcryptjs | 2.x | Hash de contraseñas |
| express-validator | 7.x | Validación de inputs |
| exceljs | 4.x | Generación de .xlsx |
| pdfkit | 0.14.x | Generación de PDF |
| cors | 2.x | CORS middleware |
| helmet | 7.x | Headers de seguridad |
| morgan | 1.x | Logger HTTP |
| dotenv | 16.x | Variables de entorno |
| ts-node-dev | 2.x | Hot reload en dev |

### Frontend
| Paquete | Versión mínima | Uso |
|---|---|---|
| React | 18.x | UI framework |
| TypeScript | 5.x | Lenguaje |
| Vite | 5.x | Bundler |
| React Router | 6.x | Navegación SPA |
| Axios | 1.x | Cliente HTTP |
| @tanstack/react-query | 5.x | Server state |
| react-hook-form | 7.x | Formularios |
| zod | 3.x | Validación de esquemas |
| @hookform/resolvers | 3.x | Integración zod+rhf |
| Tailwind CSS | 3.x | Estilos utility-first |
| shadcn/ui | latest | Componentes base |
| lucide-react | latest | Iconos |
| recharts | 2.x | Gráficas |
| react-hot-toast | 2.x | Notificaciones toast |

---

## ESTRUCTURA DE DIRECTORIOS

Crear exactamente esta estructura antes de escribir cualquier código:

```
school-system/
├── CLAUDE.md                          ← Este archivo
├── README.md
├── .gitignore
│
├── backend/
│   ├── .env                           ← Variables de entorno (ver sección ENV)
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   ├── database.sqlite                ← Se crea automáticamente al migrar
│   │
│   └── src/
│       ├── app.ts                     ← Configuración Express principal
│       ├── server.ts                  ← Entry point (puerto, listen)
│       │
│       ├── config/
│       │   ├── database.ts            ← Instancia Sequelize
│       │   └── jwt.ts                 ← Helpers JWT (sign, verify)
│       │
│       ├── models/
│       │   ├── index.ts               ← Exporta todos los modelos y asociaciones
│       │   ├── User.ts
│       │   ├── Student.ts
│       │   ├── Teacher.ts
│       │   ├── Course.ts
│       │   ├── Enrollment.ts
│       │   └── Grade.ts
│       │
│       ├── controllers/
│       │   ├── auth.controller.ts
│       │   ├── user.controller.ts
│       │   ├── student.controller.ts
│       │   ├── teacher.controller.ts
│       │   ├── course.controller.ts
│       │   ├── enrollment.controller.ts
│       │   ├── grade.controller.ts
│       │   └── report.controller.ts
│       │
│       ├── routes/
│       │   ├── index.ts               ← Monta todas las rutas bajo /api
│       │   ├── auth.routes.ts
│       │   ├── user.routes.ts
│       │   ├── student.routes.ts
│       │   ├── teacher.routes.ts
│       │   ├── course.routes.ts
│       │   ├── enrollment.routes.ts
│       │   ├── grade.routes.ts
│       │   └── report.routes.ts
│       │
│       ├── middlewares/
│       │   ├── auth.middleware.ts     ← Verifica JWT en header
│       │   ├── role.middleware.ts     ← Verifica rol requerido
│       │   └── validate.middleware.ts ← Ejecuta express-validator
│       │
│       ├── services/
│       │   ├── excel.service.ts       ← Lógica de generación Excel
│       │   └── pdf.service.ts         ← Lógica de generación PDF
│       │
│       ├── validators/
│       │   ├── auth.validator.ts
│       │   ├── student.validator.ts
│       │   ├── course.validator.ts
│       │   ├── enrollment.validator.ts
│       │   └── grade.validator.ts
│       │
│       ├── types/
│       │   ├── express.d.ts           ← Extiende Request con user: JwtPayload
│       │   └── index.ts               ← Interfaces compartidas
│       │
│       └── seeders/
│           └── seed.ts                ← Datos iniciales de prueba
│
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── postcss.config.js
    ├── index.html
    │
    └── src/
        ├── main.tsx
        ├── App.tsx                    ← Router principal con rutas protegidas
        │
        ├── types/
        │   └── index.ts               ← Interfaces TypeScript del dominio
        │
        ├── lib/
        │   ├── axios.ts               ← Instancia Axios con interceptors
        │   ├── queryClient.ts         ← Instancia React Query
        │   └── utils.ts               ← cn(), formatDate(), formatGrade()
        │
        ├── hooks/
        │   ├── useAuth.ts             ← Estado global de autenticación
        │   ├── useStudents.ts
        │   ├── useCourses.ts
        │   ├── useEnrollments.ts
        │   └── useGrades.ts
        │
        ├── services/
        │   ├── auth.service.ts
        │   ├── student.service.ts
        │   ├── course.service.ts
        │   ├── enrollment.service.ts
        │   ├── grade.service.ts
        │   └── report.service.ts
        │
        ├── components/
        │   ├── ui/                    ← Componentes shadcn/ui generados
        │   ├── layout/
        │   │   ├── Navbar.tsx
        │   │   ├── Sidebar.tsx
        │   │   └── ProtectedRoute.tsx
        │   └── shared/
        │       ├── DataTable.tsx      ← Tabla genérica reutilizable
        │       ├── ConfirmDialog.tsx
        │       ├── PageHeader.tsx
        │       ├── StatCard.tsx
        │       └── GradeBadge.tsx     ← Badge de aprobado/reprobado
        │
        └── pages/
            ├── LoginPage.tsx
            ├── NotFoundPage.tsx
            ├── admin/
            │   ├── AdminDashboard.tsx
            │   ├── UsersPage.tsx
            │   ├── CoursesPage.tsx
            │   ├── EnrollmentsPage.tsx
            │   └── ReportsPage.tsx
            ├── teacher/
            │   ├── TeacherDashboard.tsx
            │   ├── MyCoursesPage.tsx
            │   ├── CourseDetailPage.tsx
            │   └── GradeEntryPage.tsx
            └── student/
                ├── StudentDashboard.tsx
                ├── MyCoursesPage.tsx
                ├── MyGradesPage.tsx
                └── TranscriptPage.tsx
```

---

## VARIABLES DE ENTORNO

### backend/.env
```env
# Servidor
PORT=3001
NODE_ENV=development

# Base de datos SQLite
DB_PATH=./database.sqlite

# JWT
JWT_SECRET=escuela_sistema_jwt_secret_minimo_32_caracteres_2026
JWT_EXPIRES_IN=8h

# CORS — origen del frontend
CORS_ORIGIN=http://localhost:5173

# Institución (para encabezados de reportes)
SCHOOL_NAME=Colegio San Andrés
SCHOOL_ADDRESS=Av. Principal 123, Ciudad
SCHOOL_PHONE=+593 2 123 4567

# Escala de calificaciones
GRADE_MIN=0
GRADE_MAX=10
GRADE_PASS=7

# Período académico activo
ACTIVE_PERIOD=2026-I
```

### frontend/.env
```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Sistema Escolar
```

---

## MODELOS DE BASE DE DATOS

Implementar con Sequelize en TypeScript. Usar `sequelize.sync({ alter: true })` en desarrollo.

### User
```typescript
interface UserAttributes {
  id: number;
  name: string;              // Nombre completo
  email: string;             // UNIQUE, login
  password: string;          // Hash bcrypt, nunca exponer en API
  role: 'admin' | 'teacher' | 'student';
  active: boolean;           // Soft delete
  createdAt: Date;
  updatedAt: Date;
}
```

### Student
```typescript
interface StudentAttributes {
  id: number;
  userId: number;            // FK → User (1:1)
  studentCode: string;       // UNIQUE, ej: "EST-2026-001"
  birthDate: string;         // DATEONLY
  phone: string;
  address: string;
  guardianName: string;      // Nombre del representante
  guardianPhone: string;
  enrolledAt: Date;          // Fecha de primera matrícula
}
```

### Teacher
```typescript
interface TeacherAttributes {
  id: number;
  userId: number;            // FK → User (1:1)
  teacherCode: string;       // UNIQUE, ej: "DOC-001"
  specialization: string;    // Área de especialización
  phone: string;
}
```

### Course
```typescript
interface CourseAttributes {
  id: number;
  name: string;              // Nombre de la materia
  code: string;              // UNIQUE, ej: "MAT-101"
  description: string;
  credits: number;           // DEFAULT 3
  period: string;            // ej: "2026-I"
  teacherId: number;         // FK → Teacher
  active: boolean;
}
```

### Enrollment (Matrícula)
```typescript
interface EnrollmentAttributes {
  id: number;
  studentId: number;         // FK → Student
  courseId: number;          // FK → Course
  period: string;            // ej: "2026-I"
  status: 'active' | 'withdrawn' | 'completed';
  enrolledAt: Date;
  // UNIQUE INDEX: (studentId, courseId, period)
}
```

### Grade (Calificación)
```typescript
interface GradeAttributes {
  id: number;
  enrollmentId: number;      // FK → Enrollment
  gradeType: string;         // 'parcial1' | 'parcial2' | 'examen_final' | 'tarea' | 'proyecto'
  score: number;             // FLOAT, entre GRADE_MIN y GRADE_MAX del .env
  weight: number;            // FLOAT DEFAULT 1.0, peso ponderado (ej: 0.3 = 30%)
  comments: string;          // Observaciones del docente
  gradedAt: Date;
  gradedById: number;        // FK → User (docente que registró)
}
```

### Asociaciones (en models/index.ts)
```typescript
User.hasOne(Student, { foreignKey: 'userId', as: 'studentProfile' });
Student.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(Teacher, { foreignKey: 'userId', as: 'teacherProfile' });
Teacher.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Teacher.hasMany(Course, { foreignKey: 'teacherId', as: 'courses' });
Course.belongsTo(Teacher, { foreignKey: 'teacherId', as: 'teacher' });

Student.hasMany(Enrollment, { foreignKey: 'studentId', as: 'enrollments' });
Enrollment.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

Course.hasMany(Enrollment, { foreignKey: 'courseId', as: 'enrollments' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

Enrollment.hasMany(Grade, { foreignKey: 'enrollmentId', as: 'grades' });
Grade.belongsTo(Enrollment, { foreignKey: 'enrollmentId', as: 'enrollment' });

User.hasMany(Grade, { foreignKey: 'gradedById', as: 'gradedGrades' });
```

---

## API REST — ESPECIFICACIÓN COMPLETA

Base URL: `http://localhost:3001/api`

Todas las rutas protegidas requieren header:
```
Authorization: Bearer <jwt_token>
```

### Respuesta estándar de éxito
```json
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa"
}
```

### Respuesta estándar de error
```json
{
  "success": false,
  "error": "Descripción del error",
  "details": [ ... ]
}
```

---

### AUTH `/api/auth`

#### POST `/api/auth/login`
**Body:**
```json
{ "email": "admin@escuela.com", "password": "Admin123!" }
```
**Response 200:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "user": { "id": 1, "name": "Admin", "email": "...", "role": "admin" }
  }
}
```
**Lógica:**
1. Buscar usuario por email e incluir `active: true`.
2. Comparar password con bcrypt.compare().
3. Si correcto, firmar JWT con payload `{ id, name, email, role }`.
4. Retornar token y datos del usuario (sin password).

#### GET `/api/auth/me`
**Auth:** Cualquier rol.
**Response:** Datos del usuario autenticado con su perfil (student/teacher según rol).

#### PUT `/api/auth/change-password`
**Auth:** Cualquier rol.
**Body:**
```json
{ "currentPassword": "...", "newPassword": "...", "confirmPassword": "..." }
```

---

### USERS `/api/users` — Solo Admin

#### GET `/api/users`
**Query params:** `?page=1&limit=20&role=student&search=Juan&active=true`
**Response:** Lista paginada.
```json
{
  "data": { "users": [...], "total": 100, "page": 1, "totalPages": 5 }
}
```

#### POST `/api/users`
Crear usuario base. Si `role === 'student'`, también crear registro en `students`. Si `role === 'teacher'`, también crear en `teachers`.
**Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@escuela.com",
  "password": "Temp123!",
  "role": "student",
  "studentCode": "EST-2026-001",   // solo si role === 'student'
  "birthDate": "2005-03-15",
  "phone": "0991234567",
  "address": "Calle Principal 123",
  "guardianName": "María Pérez",
  "guardianPhone": "0997654321"
}
```

#### GET `/api/users/:id`
Incluir perfil completo (student o teacher según rol).

#### PUT `/api/users/:id`
Actualizar datos de usuario y perfil asociado.

#### DELETE `/api/users/:id` (Soft delete)
Setear `active: false`. No eliminar físicamente.

---

### STUDENTS `/api/students`

#### GET `/api/students`
**Auth:** Admin, Teacher.
**Query:** `?search=Juan&period=2026-I&page=1&limit=20`
Incluir: `user` (name, email), `enrollments` con count.

#### GET `/api/students/:id`
**Auth:** Admin, Teacher, o el propio estudiante.
Incluir perfil completo con matrículas activas.

#### GET `/api/students/:id/grades`
**Auth:** Admin, Teacher, o el propio estudiante (solo sus propias notas).
Retornar todas las calificaciones agrupadas por enrollment (materia).
```json
{
  "data": {
    "student": { "id": 1, "name": "Juan", "studentCode": "EST-001" },
    "period": "2026-I",
    "courses": [
      {
        "courseId": 1,
        "courseName": "Matemáticas",
        "courseCode": "MAT-101",
        "teacherName": "Prof. García",
        "enrollmentStatus": "active",
        "grades": [
          { "gradeType": "parcial1", "score": 8.5, "weight": 0.3 },
          { "gradeType": "parcial2", "score": 7.0, "weight": 0.3 },
          { "gradeType": "examen_final", "score": 9.0, "weight": 0.4 }
        ],
        "weightedAverage": 8.35,
        "passed": true
      }
    ],
    "generalAverage": 8.1
  }
}
```

#### GET `/api/students/me/grades`
**Auth:** Solo Student. Igual que el anterior pero usando el studentId del token.

---

### TEACHERS `/api/teachers`

#### GET `/api/teachers`
**Auth:** Admin.
Listar con datos de usuario y número de cursos asignados.

#### GET `/api/teachers/me/courses`
**Auth:** Teacher.
Retornar los cursos del período activo asignados al docente autenticado con número de matriculados.

---

### COURSES `/api/courses`

#### GET `/api/courses`
**Auth:** Admin, Teacher.
**Query:** `?period=2026-I&teacherId=2&search=Mat&page=1&limit=20`
Incluir: nombre del docente, número de matriculados.

#### POST `/api/courses`
**Auth:** Admin.
**Body:**
```json
{
  "name": "Matemáticas Avanzadas",
  "code": "MAT-201",
  "description": "Álgebra lineal y cálculo diferencial",
  "credits": 4,
  "period": "2026-I",
  "teacherId": 2
}
```

#### GET `/api/courses/:id`
Incluir: docente con datos de usuario, lista de estudiantes matriculados con sus promedios.

#### PUT `/api/courses/:id`
**Auth:** Admin.

#### DELETE `/api/courses/:id`
**Auth:** Admin. Solo si no tiene matrículas activas.

---

### ENROLLMENTS `/api/enrollments`

#### GET `/api/enrollments`
**Auth:** Admin.
**Query:** `?courseId=1&period=2026-I&status=active&page=1`

#### POST `/api/enrollments`
**Auth:** Admin, Teacher.
**Body:**
```json
{
  "studentId": 3,
  "courseId": 5,
  "period": "2026-I"
}
```
**Validar:** que no exista ya una matrícula activa del mismo estudiante en el mismo curso y período.

#### PUT `/api/enrollments/:id`
**Auth:** Admin.
**Body:** `{ "status": "withdrawn" | "completed" | "active" }`

#### DELETE `/api/enrollments/:id`
**Auth:** Admin. Solo si no tiene calificaciones registradas.

#### GET `/api/enrollments/course/:courseId`
**Auth:** Admin, Teacher (solo sus cursos).
Retornar lista de estudiantes del curso con sus datos completos y promedios calculados.
```json
{
  "data": {
    "course": { "id": 1, "name": "Matemáticas", "period": "2026-I" },
    "students": [
      {
        "enrollmentId": 10,
        "studentId": 3,
        "studentCode": "EST-001",
        "name": "Juan Pérez",
        "status": "active",
        "gradesCount": 3,
        "weightedAverage": 8.35,
        "passed": true
      }
    ]
  }
}
```

---

### GRADES `/api/grades`

#### GET `/api/grades/course/:courseId`
**Auth:** Admin, Teacher (solo sus cursos).
**Query:** `?period=2026-I`
Retornar matriz completa de calificaciones: estudiantes × tipos de nota.

#### POST `/api/grades`
**Auth:** Admin, Teacher.
**Body:**
```json
{
  "enrollmentId": 10,
  "gradeType": "parcial1",
  "score": 8.5,
  "weight": 0.30,
  "comments": "Buen desempeño en álgebra"
}
```
**Validar:**
- `score` entre GRADE_MIN y GRADE_MAX del .env.
- `weight` entre 0 y 1.
- El docente autenticado debe ser el asignado al curso de ese enrollment.
- Si ya existe una nota del mismo tipo para ese enrollment, retornar error 409 (usar PUT para editar).

#### POST `/api/grades/batch`
**Auth:** Admin, Teacher.
Insertar o actualizar múltiples calificaciones en una sola operación.
**Body:**
```json
{
  "courseId": 1,
  "gradeType": "parcial1",
  "weight": 0.30,
  "grades": [
    { "enrollmentId": 10, "score": 8.5, "comments": "" },
    { "enrollmentId": 11, "score": 7.0, "comments": "Recuperó el examen" },
    { "enrollmentId": 12, "score": 9.5, "comments": "" }
  ]
}
```
Usar `upsert` de Sequelize por (enrollmentId, gradeType).

#### PUT `/api/grades/:id`
**Auth:** Admin, Teacher.
**Body:** `{ "score": 9.0, "comments": "Revisado" }`
Registrar quién modificó y cuándo en el campo `gradedById`.

#### DELETE `/api/grades/:id`
**Auth:** Admin únicamente.

---

### REPORTS `/api/reports`

#### GET `/api/reports/excel/course/:courseId`
**Auth:** Admin, Teacher.
**Headers respuesta:**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="notas-MAT-101-2026-I.xlsx"
```

**Contenido del Excel:**
- **Hoja 1 "Resumen":** Nombre institución, nombre curso, docente, período, total estudiantes, promedio grupo, % aprobados.
- **Hoja 2 "Calificaciones":** Tabla con columnas: N°, Código, Nombre Estudiante, Parcial 1 (30%), Parcial 2 (30%), Examen Final (40%), Tareas, Promedio Final, Estado.
  - Formato condicional: fondo verde (#C6EFCE) si ≥ GRADE_PASS, rojo (#FFC7CE) si < GRADE_PASS.
  - Última fila: promedios del grupo con fondo azul (#D6E4F0).
  - Columnas con autoWidth.
- **Hoja 3 "Estadísticas":** Distribución de notas (rangos 0-4, 5-6, 7-8, 9-10), gráfica de barras embebida.

#### GET `/api/reports/excel/student/:studentId`
**Auth:** Admin, Teacher, o el propio estudiante.
**Contenido:**
- Una hoja por período académico cursado.
- Columnas: Materia, Código, Docente, Tipo Nota, Calificación, Peso, Promedio Final, Créditos, Estado.
- Fila de totales con créditos aprobados acumulados.

#### GET `/api/reports/excel/all-grades`
**Auth:** Solo Admin.
**Query:** `?period=2026-I`
Reporte global de todas las calificaciones del período.

#### GET `/api/reports/pdf/student/:studentId`
**Auth:** Admin, Teacher, o el propio estudiante.
**Headers:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="boletin-EST-001-2026-I.pdf"
```

**Estructura del PDF (PDFKit):**
1. **Encabezado:** Nombre de la institución (SCHOOL_NAME), dirección, teléfono. Línea separadora azul.
2. **Título:** "BOLETÍN DE CALIFICACIONES — Período 2026-I".
3. **Datos del estudiante:** Nombre, Código, Fecha emisión, en cuadro con fondo gris claro.
4. **Tabla de calificaciones:** Por cada materia: nombre, docente, desglose de notas, promedio, estado (APROBADO / REPROBADO en rojo o verde).
5. **Promedio general** del período, destacado.
6. **Pie de página:** Fecha de generación, "Este documento es generado automáticamente por el sistema".

#### GET `/api/reports/pdf/course/:courseId`
**Auth:** Admin, Teacher.
**Contenido:** Acta oficial de calificaciones del curso. Todos los estudiantes con sus notas finales, espacio para firma del docente.

#### GET `/api/reports/pdf/transcript/:studentId`
**Auth:** Admin, o el propio estudiante.
**Contenido:** Historial académico completo. Todas las materias cursadas por período, créditos acumulados, promedio histórico.

---

## MIDDLEWARES — IMPLEMENTACIÓN REQUERIDA

### auth.middleware.ts
```typescript
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Token no proporcionado' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Token inválido o expirado' });
  }
};
```

### role.middleware.ts
```typescript
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Acceso denegado: rol insuficiente' });
    }
    next();
  };
};
```

### types/express.d.ts
```typescript
import { JwtPayload } from './index';
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// types/index.ts
export interface JwtPayload {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
}
```

---

## CÁLCULO DE PROMEDIOS PONDERADOS

Implementar como función utilitaria en `src/utils/grades.ts`:

```typescript
export function calculateWeightedAverage(grades: { score: number; weight: number }[]): number {
  if (grades.length === 0) return 0;
  
  const totalWeight = grades.reduce((sum, g) => sum + g.weight, 0);
  
  // Si los pesos suman ~1, usar ponderado directo
  if (Math.abs(totalWeight - 1) < 0.01) {
    return grades.reduce((sum, g) => sum + g.score * g.weight, 0);
  }
  
  // Si los pesos no suman 1 (notas sin ponderar), usar promedio simple
  return grades.reduce((sum, g) => sum + g.score, 0) / grades.length;
}

export function isPassed(average: number, passGrade: number = 7): boolean {
  return average >= passGrade;
}

export function getLetterGrade(score: number): string {
  if (score >= 9) return 'A';
  if (score >= 8) return 'B';
  if (score >= 7) return 'C';
  if (score >= 5) return 'D';
  return 'F';
}
```

---

## SEEDER — DATOS INICIALES

Crear `src/seeders/seed.ts` que al ejecutar con `npm run seed` cree:

### Usuarios
| Nombre | Email | Password | Rol |
|---|---|---|---|
| Administrador Sistema | admin@escuela.com | Admin123! | admin |
| Prof. Carlos García | garcia@escuela.com | Docente123! | teacher |
| Prof. Ana Martínez | martinez@escuela.com | Docente123! | teacher |
| Juan Pérez (EST-2026-001) | juan@escuela.com | Alumno123! | student |
| María López (EST-2026-002) | maria@escuela.com | Alumno123! | student |
| Pedro Sánchez (EST-2026-003) | pedro@escuela.com | Alumno123! | student |

### Cursos (período 2026-I)
| Código | Nombre | Docente | Créditos |
|---|---|---|---|
| MAT-101 | Matemáticas I | Prof. García | 4 |
| LEN-101 | Lengua y Literatura | Prof. Martínez | 3 |
| CIE-101 | Ciencias Naturales | Prof. García | 3 |
| HIS-101 | Historia Universal | Prof. Martínez | 3 |

### Matrículas
Matricular a los 3 estudiantes en todos los cursos del período 2026-I.

### Calificaciones de ejemplo
Para Juan Pérez en MAT-101:
- Parcial 1: 8.5 (peso 0.30)
- Parcial 2: 7.0 (peso 0.30)
- Examen Final: 9.0 (peso 0.40)

---

## FRONTEND — IMPLEMENTACIÓN DETALLADA

### lib/axios.ts
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// Request interceptor: agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: manejar 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### hooks/useAuth.ts
```typescript
// Implementar con Context API o Zustand
// Estado: { user: User | null, token: string | null, isLoading: boolean }
// Acciones: login(email, password), logout(), isAuthenticated, role
// Persistir en localStorage
```

### App.tsx — Rutas protegidas
```typescript
// Estructura de rutas:
// / → redirigir según rol al dashboard correspondiente
// /login → LoginPage (pública)
// /admin/* → solo role === 'admin'
// /teacher/* → role === 'admin' | 'teacher'
// /student/* → role === 'student'
// * → NotFoundPage

// ProtectedRoute verifica: isAuthenticated + role permitido
// Si no autenticado → /login
// Si autenticado pero rol incorrecto → página de acceso denegado
```

---

## PÁGINAS — ESPECIFICACIÓN POR ROL

### LoginPage.tsx
- Formulario centrado con logo de la institución y nombre del sistema.
- Campos: Email, Contraseña (con toggle show/hide).
- Validación con react-hook-form + zod.
- Al hacer submit: llamar `authService.login()`, guardar token y user en localStorage, redirigir según rol.
- Mostrar mensaje de error si credenciales incorrectas.

---

### AdminDashboard.tsx
**Tarjetas de estadísticas (4 cards):**
- Total de estudiantes activos.
- Total de docentes.
- Cursos activos en el período actual.
- Total de matrículas activas.

**Gráfica (Recharts — BarChart):**
- Barras: número de estudiantes matriculados por curso en el período activo.

**Tabla de actividad reciente:**
- Últimas 5 matrículas registradas.

---

### UsersPage.tsx (Admin)
- Tabla paginada con columnas: Nombre, Email, Rol (badge), Estado (activo/inactivo), Acciones.
- Buscador en tiempo real (debounce 300ms).
- Filtro por rol (select: Todos / Admin / Docente / Estudiante).
- Botón "Nuevo Usuario" → abre modal.
- Modal de creación/edición: campos dinámicos según rol seleccionado.
  - Si rol = student: mostrar campos studentCode, birthDate, guardianName, etc.
  - Si rol = teacher: mostrar teacherCode, specialization.
- Botón de activar/desactivar con confirmación.

---

### CoursesPage.tsx (Admin)
- Tabla: Código, Nombre, Docente, Período, Créditos, Matriculados, Estado, Acciones.
- Filtro por período y docente.
- Modal de creación: nombre, código, descripción, créditos, período, selección de docente (dropdown con búsqueda).

---

### EnrollmentsPage.tsx (Admin)
- Filtros: Curso (select), Período (select), Estado (select).
- Tabla: Estudiante, Código, Curso, Período, Estado, Fecha matrícula, Acciones.
- Formulario de nueva matrícula:
  1. Buscar estudiante por nombre o código (búsqueda en tiempo real).
  2. Seleccionar curso del período activo.
  3. Confirmar y guardar.
- Mostrar error si ya existe matrícula del mismo estudiante en el curso.

---

### ReportsPage.tsx (Admin)
- Sección 1: Reportes por curso.
  - Select de período → Select de curso → Botones: "Descargar Excel" y "Descargar PDF (Acta)".
- Sección 2: Reportes por estudiante.
  - Buscador de estudiante → Botones: "Descargar Excel", "Descargar Boletín PDF", "Descargar Historial PDF".
- Sección 3: Reportes globales (solo Admin).
  - Select de período → "Descargar Excel global".

---

### TeacherDashboard.tsx (Docente)
- Bienvenida con nombre del docente.
- Cards: Cursos activos, Total estudiantes a cargo, Notas pendientes por ingresar.
- Lista de cursos del período activo con nombre, código, número de matriculados, link a detalle.

---

### CourseDetailPage.tsx (Docente)
- Encabezado con nombre del curso, código, período.
- Tabla de estudiantes matriculados con columnas: Código, Nombre, Estado matrícula, Promedio actual, Acciones.
- Botón "Ingresar/Editar Notas" → navegar a GradeEntryPage.
- Botones de exportar: Excel y PDF (Acta).

---

### GradeEntryPage.tsx (Docente)
- Select de tipo de nota: Parcial 1, Parcial 2, Examen Final, Tarea, Proyecto.
- Input de peso ponderado (ej: 0.30 para 30%).
- Tabla editable con una fila por estudiante.
  - Columnas: Código, Nombre, Calificación (input numérico), Observaciones.
  - Validar que score esté entre GRADE_MIN y GRADE_MAX.
  - Color de fondo del input: verde si ≥ GRADE_PASS, rojo si no.
- Botón "Guardar todas las notas" → llama POST /grades/batch.
- Si ya existen notas del mismo tipo, cargarlas en los inputs (modo edición).
- Toast de confirmación al guardar.

---

### StudentDashboard.tsx (Estudiante)
- Cards: Materias activas, Promedio general del período, Créditos acumulados.
- Lista de materias del período actual con nombre del docente y promedio de la materia.
- Botón en cada materia: "Ver calificaciones".
- Gráfica de barras (Recharts): promedio por materia del período actual.

---

### MyGradesPage.tsx (Estudiante)
- Título: "Mis Calificaciones — Período 2026-I".
- Un acordeón o card por materia. Al expandir:
  - Tabla: Tipo de Nota, Calificación, Peso, Aporte al Promedio.
  - Barra de progreso visual con el promedio final de la materia.
  - Badge APROBADO (verde) / REPROBADO (rojo).
  - Observaciones del docente si existen.
- Promedio general del período al final.
- Botón de descargar boletín PDF de esa materia.

---

### TranscriptPage.tsx (Estudiante)
- Historial académico completo agrupado por período.
- Por cada período: lista de materias con promedio final y estado.
- Total de créditos aprobados acumulados.
- Botón "Descargar Historial Completo PDF".

---

## GENERACIÓN DE REPORTES — IMPLEMENTACIÓN

### excel.service.ts
```typescript
import ExcelJS from 'exceljs';

export async function generateCourseGradesExcel(courseId: number): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = process.env.SCHOOL_NAME || 'Sistema Escolar';
  workbook.created = new Date();

  // Hoja 1: Resumen
  const summarySheet = workbook.addWorksheet('Resumen');
  // ... configurar encabezado con datos del curso

  // Hoja 2: Calificaciones
  const gradesSheet = workbook.addWorksheet('Calificaciones');
  
  // Encabezado de columnas con estilo
  gradesSheet.columns = [
    { header: 'N°', key: 'index', width: 5 },
    { header: 'Código', key: 'code', width: 15 },
    { header: 'Nombre Estudiante', key: 'name', width: 30 },
    { header: 'Parcial 1 (30%)', key: 'p1', width: 15 },
    { header: 'Parcial 2 (30%)', key: 'p2', width: 15 },
    { header: 'Examen Final (40%)', key: 'ef', width: 18 },
    { header: 'Promedio', key: 'avg', width: 12 },
    { header: 'Estado', key: 'status', width: 12 },
  ];

  // Estilo de encabezado
  gradesSheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    cell.alignment = { horizontal: 'center' };
  });

  // Datos + formato condicional por fila
  students.forEach((student, index) => {
    const row = gradesSheet.addRow({ ... });
    const avgCell = row.getCell('avg');
    const statusCell = row.getCell('status');
    
    if (student.average >= passGrade) {
      avgCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
      statusCell.value = 'APROBADO';
      statusCell.font = { color: { argb: 'FF375623' }, bold: true };
    } else {
      avgCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
      statusCell.value = 'REPROBADO';
      statusCell.font = { color: { argb: 'FF9C0006' }, bold: true };
    }
  });

  return workbook.xlsx.writeBuffer() as Promise<Buffer>;
}
```

### pdf.service.ts
```typescript
import PDFDocument from 'pdfkit';

export function generateStudentBulletin(studentData: any): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    // Encabezado institucional
    doc.fontSize(18).font('Helvetica-Bold').text(process.env.SCHOOL_NAME!, { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(process.env.SCHOOL_ADDRESS!, { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#2980B9').lineWidth(2).stroke();
    doc.moveDown();

    // Título
    doc.fontSize(14).font('Helvetica-Bold').text('BOLETÍN DE CALIFICACIONES', { align: 'center' });
    doc.fontSize(12).text(`Período: ${studentData.period}`, { align: 'center' });
    doc.moveDown();

    // Datos del estudiante en cuadro
    // ... dibujar tabla con PDFKit

    // Tabla de materias y calificaciones
    // ... iterar cursos y dibujar tabla

    doc.end();
  });
}
```

---

## FLUJO DE DESCARGA EN FRONTEND

```typescript
// report.service.ts
export async function downloadExcel(url: string, filename: string) {
  const response = await api.get(url, { responseType: 'blob' });
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function downloadPDF(url: string, filename: string) {
  const response = await api.get(url, { responseType: 'blob' });
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
```

---

## ORDEN DE IMPLEMENTACIÓN RECOMENDADO

Claude Code debe seguir este orden exacto para minimizar bloqueos y dependencias:

```
FASE 1 — Base del proyecto
  1.1  Crear estructura de carpetas (backend y frontend)
  1.2  Configurar package.json, tsconfig.json de ambos proyectos
  1.3  Configurar Tailwind, Vite, ESLint, Prettier
  1.4  Crear archivos .env y .env.example

FASE 2 — Backend: Base de datos y modelos
  2.1  Configurar conexión Sequelize con SQLite (config/database.ts)
  2.2  Implementar todos los modelos (User, Student, Teacher, Course, Enrollment, Grade)
  2.3  Definir todas las asociaciones en models/index.ts
  2.4  Verificar sync({ alter: true }) y que las tablas se crean correctamente
  2.5  Crear el seeder con datos de prueba (npm run seed)

FASE 3 — Backend: Autenticación
  3.1  Implementar auth.controller.ts (login, me, change-password)
  3.2  Implementar auth.middleware.ts (verificar JWT)
  3.3  Implementar role.middleware.ts
  3.4  Implementar auth.routes.ts
  3.5  Probar login y verificar que el token funciona

FASE 4 — Backend: CRUD principal
  4.1  Users (solo admin): CRUD completo con paginación
  4.2  Students: CRUD + endpoint de notas
  4.3  Teachers: CRUD + mis cursos
  4.4  Courses: CRUD con filtros
  4.5  Enrollments: CRUD + validación de duplicados
  4.6  Grades: CRUD + batch + cálculo de promedios

FASE 5 — Backend: Reportes
  5.1  excel.service.ts: reportes por curso y por estudiante
  5.2  pdf.service.ts: boletín y acta
  5.3  report.controller.ts y report.routes.ts
  5.4  Probar descarga de archivos desde el browser

FASE 6 — Frontend: Base y autenticación
  6.1  Configurar React Router con rutas protegidas
  6.2  Implementar useAuth hook con Context
  6.3  Configurar instancia Axios con interceptors
  6.4  Configurar React Query
  6.5  Implementar LoginPage con validación
  6.6  Implementar ProtectedRoute por rol

FASE 7 — Frontend: Vistas del Administrador
  7.1  AdminDashboard con estadísticas y gráfica
  7.2  UsersPage con tabla paginada, modal CRUD
  7.3  CoursesPage
  7.4  EnrollmentsPage con búsqueda de estudiante
  7.5  ReportsPage con botones de descarga

FASE 8 — Frontend: Vistas del Docente
  8.1  TeacherDashboard
  8.2  MyCoursesPage
  8.3  CourseDetailPage
  8.4  GradeEntryPage con tabla editable y batch save

FASE 9 — Frontend: Vistas del Estudiante
  9.1  StudentDashboard con gráfica de rendimiento
  9.2  MyGradesPage con acordeón por materia
  9.3  TranscriptPage con historial completo

FASE 10 — Integración y pulido
  10.1  Verificar todos los flujos end-to-end
  10.2  Manejo de errores consistente en toda la app
  10.3  Loading states y toasts en operaciones asíncronas
  10.4  Responsive design (tablet y desktop)
  10.5  README con instrucciones de instalación
```

---

## REGLAS Y CONVENCIONES DE CÓDIGO

### Backend
- Todas las funciones de controlador deben ser `async` y tener `try/catch`.
- Nunca retornar el campo `password` en ninguna respuesta de la API.
- Usar `req.user.id` para identificar al usuario autenticado, nunca confiar en IDs del body para autorizaciones.
- Los docentes solo pueden ver/editar calificaciones de sus propios cursos. Validar esto explícitamente.
- Los estudiantes solo pueden ver sus propios datos. Validar que `studentId` del recurso corresponde al usuario autenticado.
- Usar transacciones Sequelize en operaciones que involucren múltiples modelos (crear usuario + estudiante).

### Frontend
- Todos los componentes en TypeScript estricto, sin `any`.
- Props tipadas con interfaces.
- Custom hooks para toda la lógica de servidor (no llamar axios directamente en componentes).
- Usar `react-hot-toast` para notificaciones: success en operaciones exitosas, error en fallos.
- Los formularios siempre con react-hook-form + zod, nunca con state manual.
- Confirmar antes de eliminar cualquier registro con un Dialog de shadcn/ui.

---

## VALIDACIONES REQUERIDAS

### En el backend (express-validator)
- Email: formato válido y único en base de datos.
- Password: mínimo 8 caracteres, al menos 1 letra mayúscula y 1 número.
- Score (calificación): número entre GRADE_MIN y GRADE_MAX.
- Weight (peso): número entre 0 y 1.
- StudentCode: alfanumérico, único.
- Period: formato "YYYY-I" o "YYYY-II".

### En el frontend (zod)
- Mismas reglas reflejadas en los esquemas zod de cada formulario.
- Mensajes de error en español.

---

## COMANDOS DEL PROYECTO

### Backend (backend/package.json scripts)
```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "migrate": "ts-node src/config/database.ts",
    "seed": "ts-node src/seeders/seed.ts"
  }
}
```

### Frontend (frontend/package.json scripts)
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts,.tsx"
  }
}
```

### Instalación y arranque completo
```bash
# 1. Clonar e instalar dependencias
cd backend && npm install
cd ../frontend && npm install

# 2. Configurar variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env con los valores reales

# 3. Crear base de datos y datos de prueba
cd backend
npm run seed

# 4. Arrancar en desarrollo (dos terminales)
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
cd frontend && npm run dev

# 5. Abrir en el navegador
# http://localhost:5173
```

---

## CREDENCIALES DE PRUEBA (post-seed)

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | admin@escuela.com | Admin123! |
| Docente | garcia@escuela.com | Docente123! |
| Docente | martinez@escuela.com | Docente123! |
| Estudiante | juan@escuela.com | Alumno123! |
| Estudiante | maria@escuela.com | Alumno123! |
| Estudiante | pedro@escuela.com | Alumno123! |

---

## NOTAS FINALES PARA CLAUDE CODE

1. **No omitas TypeScript**: todos los archivos deben ser `.ts` o `.tsx`, con tipos explícitos.
2. **No uses `any`**: si no conoces el tipo, usa `unknown` y haz type narrowing.
3. **Implementa todos los endpoints listados**: no los marques como "TODO" sin implementar.
4. **El seeder debe funcionar limpiamente**: si se ejecuta dos veces, no debe fallar (usar `findOrCreate`).
5. **Maneja errores de red en el frontend**: siempre mostrar un mensaje al usuario cuando falla una petición.
6. **Los reportes deben ser funcionales**: probar que los archivos Excel y PDF se generan y descargan correctamente.
7. **Diseño responsivo**: usar clases de Tailwind para que funcione bien en pantallas desde 768px.
8. **Seguridad de rutas**: nunca exponer rutas de admin a otros roles, verificar en el middleware del backend.
9. **README completo**: incluir instrucciones de instalación, variables de entorno requeridas y capturas de pantalla.
10. **Sin credenciales hardcodeadas**: todo debe venir del `.env`.
