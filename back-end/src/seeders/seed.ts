import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import sequelize from '../config/database';
import '../models/index';
import { User, Student, Teacher, Course, Enrollment, Grade } from '../models/index';

// ─── Tipos auxiliares ─────────────────────────────────────────────────────────

interface GradeDef {
  gradeType: string;
  score: number;
  weight: number;
  comments: string;
}

interface StudentGrades {
  [courseCode: string]: GradeDef[];
}

// ─── Utilidad para registrar notas ────────────────────────────────────────────

async function seedGrades(
  enrollmentId: number,
  gradedById: number,
  grades: GradeDef[]
): Promise<void> {
  for (const g of grades) {
    await Grade.findOrCreate({
      where: { enrollmentId, gradeType: g.gradeType },
      defaults: {
        enrollmentId,
        gradeType: g.gradeType,
        score: g.score,
        weight: g.weight,
        comments: g.comments,
        gradedById,
      },
    });
  }
}

// ─── Definición de notas por estudiante ───────────────────────────────────────
//
//  Pesos estándar: Parcial 1 (0.30) · Parcial 2 (0.30) · Examen Final (0.40)
//  Nota mínima de aprobación: 7.00
//
//  Estudiantes y promedios aproximados:
//    Juan Pérez       → mix (7-8.5)     aprox. 7.8 gral.
//    María López      → excelente       aprox. 9.0 gral.
//    Pedro Sánchez    → irregular       aprox. 6.4 gral. (reprueba 3 materias)
//    Sofía Ramírez    → buena           aprox. 8.2 gral.
//    Diego Torres     → promedio bajo   aprox. 6.6 gral. (reprueba 3 materias)
//    Valeria Mora     → sobresaliente   aprox. 9.4 gral.
//    Andrés Castro    → con dificultades aprox. 5.9 gral. (reprueba 4 materias)
//    Carmen Vega      → buena           aprox. 8.1 gral.

const GRADE_DATA: Record<string, StudentGrades> = {
  // ── Juan Pérez ───────────────────────────────────────────────────────────────
  'EST-2026-001': {
    'MAT-101': [
      { gradeType: 'parcial1',     score: 8.5, weight: 0.30, comments: 'Buen desempeño en álgebra' },
      { gradeType: 'parcial2',     score: 7.0, weight: 0.30, comments: 'Mejoró en geometría' },
      { gradeType: 'examen_final', score: 9.0, weight: 0.40, comments: 'Excelente examen final' },
    ],
    'LEN-101': [
      { gradeType: 'parcial1',     score: 7.5, weight: 0.30, comments: '' },
      { gradeType: 'parcial2',     score: 6.5, weight: 0.30, comments: 'Necesita mejorar la redacción' },
      { gradeType: 'examen_final', score: 8.0, weight: 0.40, comments: 'Buena recuperación' },
    ],
    'CIE-101': [
      { gradeType: 'parcial1',     score: 7.0, weight: 0.30, comments: '' },
      { gradeType: 'parcial2',     score: 7.5, weight: 0.30, comments: 'Demostró interés en el laboratorio' },
      { gradeType: 'examen_final', score: 8.0, weight: 0.40, comments: '' },
    ],
    'HIS-101': [
      { gradeType: 'parcial1',     score: 6.0, weight: 0.30, comments: 'Confundió algunas fechas' },
      { gradeType: 'parcial2',     score: 7.0, weight: 0.30, comments: 'Mejoró la organización' },
      { gradeType: 'examen_final', score: 7.5, weight: 0.40, comments: '' },
    ],
    'INF-101': [
      { gradeType: 'parcial1',     score: 9.0, weight: 0.30, comments: 'Muy hábil con la computadora' },
      { gradeType: 'parcial2',     score: 8.5, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 9.5, weight: 0.40, comments: 'Proyecto de programación destacado' },
    ],
  },

  // ── María López ─────────────────────────────────────────────────────────────
  'EST-2026-002': {
    'MAT-101': [
      { gradeType: 'parcial1',     score: 9.5, weight: 0.30, comments: 'Sobresaliente' },
      { gradeType: 'parcial2',     score: 8.0, weight: 0.30, comments: 'Muy bien' },
      { gradeType: 'examen_final', score: 9.2, weight: 0.40, comments: '' },
    ],
    'LEN-101': [
      { gradeType: 'parcial1',     score: 9.0, weight: 0.30, comments: 'Excelente análisis literario' },
      { gradeType: 'parcial2',     score: 9.5, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 9.0, weight: 0.40, comments: 'Ensayo muy bien estructurado' },
    ],
    'CIE-101': [
      { gradeType: 'parcial1',     score: 8.5, weight: 0.30, comments: '' },
      { gradeType: 'parcial2',     score: 9.0, weight: 0.30, comments: 'Excelente en biología' },
      { gradeType: 'examen_final', score: 9.5, weight: 0.40, comments: '' },
    ],
    'HIS-101': [
      { gradeType: 'parcial1',     score: 9.0, weight: 0.30, comments: '' },
      { gradeType: 'parcial2',     score: 8.5, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 9.0, weight: 0.40, comments: 'Análisis histórico profundo' },
    ],
    'INF-101': [
      { gradeType: 'parcial1',     score: 8.0, weight: 0.30, comments: '' },
      { gradeType: 'parcial2',     score: 9.0, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 8.5, weight: 0.40, comments: '' },
    ],
  },

  // ── Pedro Sánchez ────────────────────────────────────────────────────────────
  'EST-2026-003': {
    'MAT-101': [
      { gradeType: 'parcial1',     score: 6.0, weight: 0.30, comments: 'Dificultades con álgebra' },
      { gradeType: 'parcial2',     score: 5.5, weight: 0.30, comments: 'Necesita refuerzo' },
      { gradeType: 'examen_final', score: 7.0, weight: 0.40, comments: 'Mejoró algo al final' },
    ],
    'LEN-101': [
      { gradeType: 'parcial1',     score: 7.0, weight: 0.30, comments: '' },
      { gradeType: 'parcial2',     score: 6.5, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 7.5, weight: 0.40, comments: '' },
    ],
    'CIE-101': [
      { gradeType: 'parcial1',     score: 6.5, weight: 0.30, comments: '' },
      { gradeType: 'parcial2',     score: 7.0, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 7.0, weight: 0.40, comments: '' },
    ],
    'HIS-101': [
      { gradeType: 'parcial1',     score: 7.5, weight: 0.30, comments: '' },
      { gradeType: 'parcial2',     score: 7.0, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 8.0, weight: 0.40, comments: '' },
    ],
    'INF-101': [
      { gradeType: 'parcial1',     score: 5.0, weight: 0.30, comments: 'Poca práctica en casa' },
      { gradeType: 'parcial2',     score: 6.0, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 6.5, weight: 0.40, comments: 'No alcanzó el mínimo' },
    ],
  },

  // ── Sofía Ramírez ────────────────────────────────────────────────────────────
  'EST-2026-004': {
    'MAT-101': [
      { gradeType: 'parcial1',     score: 8.0, weight: 0.30, comments: '' },
      { gradeType: 'parcial2',     score: 8.5, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 8.0, weight: 0.40, comments: '' },
    ],
    'LEN-101': [
      { gradeType: 'parcial1',     score: 7.5, weight: 0.30, comments: '' },
      { gradeType: 'parcial2',     score: 8.0, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 8.5, weight: 0.40, comments: '' },
    ],
    'CIE-101': [
      { gradeType: 'parcial1',     score: 9.0, weight: 0.30, comments: 'Excelente práctica de laboratorio' },
      { gradeType: 'parcial2',     score: 8.5, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 9.0, weight: 0.40, comments: '' },
    ],
    'HIS-101': [
      { gradeType: 'parcial1',     score: 8.0, weight: 0.30, comments: '' },
      { gradeType: 'parcial2',     score: 7.5, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 8.5, weight: 0.40, comments: '' },
    ],
    'INF-101': [
      { gradeType: 'parcial1',     score: 7.5, weight: 0.30, comments: '' },
      { gradeType: 'parcial2',     score: 8.0, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 8.0, weight: 0.40, comments: '' },
    ],
  },

  // ── Diego Torres ─────────────────────────────────────────────────────────────
  'EST-2026-005': {
    'MAT-101': [
      { gradeType: 'parcial1',     score: 5.5, weight: 0.30, comments: 'No entregó tareas' },
      { gradeType: 'parcial2',     score: 6.0, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 6.5, weight: 0.40, comments: 'Por debajo del mínimo' },
    ],
    'LEN-101': [
      { gradeType: 'parcial1',     score: 7.0, weight: 0.30, comments: '' },
      { gradeType: 'parcial2',     score: 7.0, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 7.5, weight: 0.40, comments: '' },
    ],
    'CIE-101': [
      { gradeType: 'parcial1',     score: 6.0, weight: 0.30, comments: 'Faltó a varias clases' },
      { gradeType: 'parcial2',     score: 5.5, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 7.0, weight: 0.40, comments: '' },
    ],
    'HIS-101': [
      { gradeType: 'parcial1',     score: 6.5, weight: 0.30, comments: '' },
      { gradeType: 'parcial2',     score: 7.0, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 7.0, weight: 0.40, comments: '' },
    ],
    'INF-101': [
      { gradeType: 'parcial1',     score: 8.0, weight: 0.30, comments: 'Buen manejo de herramientas' },
      { gradeType: 'parcial2',     score: 7.5, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 8.0, weight: 0.40, comments: '' },
    ],
  },

  // ── Valeria Mora ─────────────────────────────────────────────────────────────
  'EST-2026-006': {
    'MAT-101': [
      { gradeType: 'parcial1',     score: 9.5, weight: 0.30, comments: '' },
      { gradeType: 'parcial2',     score: 9.0, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 9.5, weight: 0.40, comments: 'La mejor nota del grupo' },
    ],
    'LEN-101': [
      { gradeType: 'parcial1',     score: 9.0, weight: 0.30, comments: '' },
      { gradeType: 'parcial2',     score: 9.5, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 10.0, weight: 0.40, comments: 'Ensayo perfecto' },
    ],
    'CIE-101': [
      { gradeType: 'parcial1',     score: 9.0, weight: 0.30, comments: '' },
      { gradeType: 'parcial2',     score: 9.0, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 9.5, weight: 0.40, comments: '' },
    ],
    'HIS-101': [
      { gradeType: 'parcial1',     score: 8.5, weight: 0.30, comments: '' },
      { gradeType: 'parcial2',     score: 9.0, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 9.0, weight: 0.40, comments: '' },
    ],
    'INF-101': [
      { gradeType: 'parcial1',     score: 9.5, weight: 0.30, comments: '' },
      { gradeType: 'parcial2',     score: 9.0, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 9.5, weight: 0.40, comments: 'Proyecto de app destacado' },
    ],
  },

  // ── Andrés Castro ────────────────────────────────────────────────────────────
  'EST-2026-007': {
    'MAT-101': [
      { gradeType: 'parcial1',     score: 4.5, weight: 0.30, comments: 'No aprobó el parcial' },
      { gradeType: 'parcial2',     score: 5.0, weight: 0.30, comments: 'Tiene dificultades de base' },
      { gradeType: 'examen_final', score: 6.0, weight: 0.40, comments: 'No alcanzó el mínimo' },
    ],
    'LEN-101': [
      { gradeType: 'parcial1',     score: 6.0, weight: 0.30, comments: '' },
      { gradeType: 'parcial2',     score: 6.5, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 6.0, weight: 0.40, comments: 'Reprobado' },
    ],
    'CIE-101': [
      { gradeType: 'parcial1',     score: 5.5, weight: 0.30, comments: '' },
      { gradeType: 'parcial2',     score: 6.0, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 7.0, weight: 0.40, comments: '' },
    ],
    'HIS-101': [
      { gradeType: 'parcial1',     score: 7.0, weight: 0.30, comments: '' },
      { gradeType: 'parcial2',     score: 7.0, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 7.5, weight: 0.40, comments: '' },
    ],
    'INF-101': [
      { gradeType: 'parcial1',     score: 6.0, weight: 0.30, comments: 'Poca asistencia' },
      { gradeType: 'parcial2',     score: 6.5, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 7.0, weight: 0.40, comments: '' },
    ],
  },

  // ── Carmen Vega ──────────────────────────────────────────────────────────────
  'EST-2026-008': {
    'MAT-101': [
      { gradeType: 'parcial1',     score: 8.0, weight: 0.30, comments: '' },
      { gradeType: 'parcial2',     score: 7.5, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 8.5, weight: 0.40, comments: '' },
    ],
    'LEN-101': [
      { gradeType: 'parcial1',     score: 8.5, weight: 0.30, comments: '' },
      { gradeType: 'parcial2',     score: 8.0, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 8.0, weight: 0.40, comments: '' },
    ],
    'CIE-101': [
      { gradeType: 'parcial1',     score: 7.5, weight: 0.30, comments: '' },
      { gradeType: 'parcial2',     score: 8.0, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 8.5, weight: 0.40, comments: '' },
    ],
    'HIS-101': [
      { gradeType: 'parcial1',     score: 8.0, weight: 0.30, comments: '' },
      { gradeType: 'parcial2',     score: 8.5, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 8.0, weight: 0.40, comments: '' },
    ],
    'INF-101': [
      { gradeType: 'parcial1',     score: 7.0, weight: 0.30, comments: '' },
      { gradeType: 'parcial2',     score: 7.5, weight: 0.30, comments: '' },
      { gradeType: 'examen_final', score: 8.0, weight: 0.40, comments: '' },
    ],
  },
};

// ─── Función principal ────────────────────────────────────────────────────────

async function seed() {
  await sequelize.sync();
  console.log('📦 Tablas sincronizadas.');

  const hash = (pwd: string) => bcrypt.hash(pwd, 10);

  // ── Usuarios ─────────────────────────────────────────────────────────────────

  const [_admin] = await User.findOrCreate({
    where: { email: 'admin@escuela.com' },
    defaults: { name: 'Administrador Sistema', email: 'admin@escuela.com', password: await hash('Admin123!'), role: 'admin', active: true },
  });

  // Docentes
  const [userGarcia] = await User.findOrCreate({
    where: { email: 'garcia@escuela.com' },
    defaults: { name: 'Prof. Carlos García', email: 'garcia@escuela.com', password: await hash('Docente123!'), role: 'teacher', active: true },
  });
  const [userMartinez] = await User.findOrCreate({
    where: { email: 'martinez@escuela.com' },
    defaults: { name: 'Prof. Ana Martínez', email: 'martinez@escuela.com', password: await hash('Docente123!'), role: 'teacher', active: true },
  });
  const [userTorres] = await User.findOrCreate({
    where: { email: 'torres@escuela.com' },
    defaults: { name: 'Prof. Roberto Torres', email: 'torres@escuela.com', password: await hash('Docente123!'), role: 'teacher', active: true },
  });

  // Estudiantes
  const studentUsers = [
    { email: 'juan@escuela.com',    name: 'Juan Pérez' },
    { email: 'maria@escuela.com',   name: 'María López' },
    { email: 'pedro@escuela.com',   name: 'Pedro Sánchez' },
    { email: 'sofia@escuela.com',   name: 'Sofía Ramírez' },
    { email: 'diego@escuela.com',   name: 'Diego Torres' },
    { email: 'valeria@escuela.com', name: 'Valeria Mora' },
    { email: 'andres@escuela.com',  name: 'Andrés Castro' },
    { email: 'carmen@escuela.com',  name: 'Carmen Vega' },
  ];
  const userInstances: User[] = [];
  for (const u of studentUsers) {
    const [instance] = await User.findOrCreate({
      where: { email: u.email },
      defaults: { name: u.name, email: u.email, password: await hash('Alumno123!'), role: 'student', active: true },
    });
    userInstances.push(instance);
  }
  const [userJuan, userMaria, userPedro, userSofia, userDiego, userValeria, userAndres, userCarmen] = userInstances;

  console.log('✅ Usuarios creados (1 admin, 3 docentes, 8 estudiantes).');

  // ── Perfiles de docentes ──────────────────────────────────────────────────────

  const [garcia] = await Teacher.findOrCreate({
    where: { userId: userGarcia.id },
    defaults: { userId: userGarcia.id, teacherCode: 'DOC-001', specialization: 'Matemáticas y Ciencias', phone: '0991111111' },
  });
  const [martinez] = await Teacher.findOrCreate({
    where: { userId: userMartinez.id },
    defaults: { userId: userMartinez.id, teacherCode: 'DOC-002', specialization: 'Lengua y Ciencias Sociales', phone: '0992222222' },
  });
  const [torres] = await Teacher.findOrCreate({
    where: { userId: userTorres.id },
    defaults: { userId: userTorres.id, teacherCode: 'DOC-003', specialization: 'Tecnología e Informática', phone: '0993333333' },
  });

  console.log('✅ Perfiles de docentes creados.');

  // ── Perfiles de estudiantes ───────────────────────────────────────────────────

  const studentProfiles = [
    { user: userJuan,    code: 'EST-2026-001', birth: '2005-03-15', phone: '0991234567', address: 'Calle Principal 123',     guardian: 'María Pérez',    guardianPhone: '0997654321' },
    { user: userMaria,   code: 'EST-2026-002', birth: '2005-07-22', phone: '0993456789', address: 'Av. Los Pinos 45',        guardian: 'Roberto López',  guardianPhone: '0996789012' },
    { user: userPedro,   code: 'EST-2026-003', birth: '2005-11-08', phone: '0994567890', address: 'Jr. Las Flores 78',       guardian: 'Carmen Sánchez', guardianPhone: '0995678901' },
    { user: userSofia,   code: 'EST-2026-004', birth: '2006-02-14', phone: '0995678901', address: 'Pasaje El Sol 12',        guardian: 'Luis Ramírez',   guardianPhone: '0994321098' },
    { user: userDiego,   code: 'EST-2026-005', birth: '2005-09-30', phone: '0996789012', address: 'Calle Los Álamos 56',     guardian: 'Rosa Torres',    guardianPhone: '0993210987' },
    { user: userValeria, code: 'EST-2026-006', birth: '2006-04-18', phone: '0997890123', address: 'Av. República 234',       guardian: 'Elena Mora',     guardianPhone: '0992109876' },
    { user: userAndres,  code: 'EST-2026-007', birth: '2005-06-25', phone: '0998901234', address: 'Barrio La Esperanza 89',  guardian: 'Jorge Castro',   guardianPhone: '0991098765' },
    { user: userCarmen,  code: 'EST-2026-008', birth: '2006-01-10', phone: '0999012345', address: 'Calle Bolívar 7',         guardian: 'Ana Vega',       guardianPhone: '0990987654' },
  ];

  const studentInstances: Student[] = [];
  for (const p of studentProfiles) {
    const [s] = await Student.findOrCreate({
      where: { userId: p.user.id },
      defaults: {
        userId: p.user.id,
        studentCode: p.code,
        birthDate: p.birth,
        phone: p.phone,
        address: p.address,
        guardianName: p.guardian,
        guardianPhone: p.guardianPhone,
      },
    });
    studentInstances.push(s);
  }

  console.log('✅ Perfiles de estudiantes creados.');

  // ── Cursos ────────────────────────────────────────────────────────────────────

  const courseDefs = [
    { code: 'MAT-101', name: 'Matemáticas I',      description: 'Álgebra básica, geometría y trigonometría',                 credits: 4, teacherId: garcia.id },
    { code: 'LEN-101', name: 'Lengua y Literatura', description: 'Comprensión lectora, gramática y producción textual',       credits: 3, teacherId: martinez.id },
    { code: 'CIE-101', name: 'Ciencias Naturales',  description: 'Biología, química básica y ecología',                      credits: 3, teacherId: garcia.id },
    { code: 'HIS-101', name: 'Historia Universal',  description: 'Historia antigua, medieval y moderna',                     credits: 3, teacherId: martinez.id },
    { code: 'INF-101', name: 'Informática Básica',  description: 'Fundamentos de computación, ofimática y programación web', credits: 3, teacherId: torres.id },
  ];

  const courseInstances: Course[] = [];
  for (const c of courseDefs) {
    const [course] = await Course.findOrCreate({
      where: { code: c.code },
      defaults: { ...c, period: '2026-I', active: true },
    });
    courseInstances.push(course);
  }

  const courseByCode: Record<string, Course> = {};
  for (const c of courseInstances) courseByCode[c.code] = c;

  console.log('✅ Cursos creados (5 materias).');

  // ── Matrículas ────────────────────────────────────────────────────────────────

  const enrollmentMap: Record<string, Enrollment> = {};

  for (const student of studentInstances) {
    for (const course of courseInstances) {
      const [enrollment] = await Enrollment.findOrCreate({
        where: { studentId: student.id, courseId: course.id, period: '2026-I' },
        defaults: { studentId: student.id, courseId: course.id, period: '2026-I', status: 'active' },
      });
      enrollmentMap[`${student.studentCode}-${course.code}`] = enrollment;
    }
  }

  console.log('✅ Matrículas creadas (8 estudiantes × 5 cursos = 40 matrículas).');

  // ── Calificaciones ────────────────────────────────────────────────────────────
  //
  //  Docente asignado por curso:
  //    MAT-101, CIE-101 → García
  //    LEN-101, HIS-101 → Martínez
  //    INF-101           → Torres

  const courseTeacher: Record<string, number> = {
    'MAT-101': userGarcia.id,
    'LEN-101': userMartinez.id,
    'CIE-101': userGarcia.id,
    'HIS-101': userMartinez.id,
    'INF-101': userTorres.id,
  };

  for (const [studentCode, courseGrades] of Object.entries(GRADE_DATA)) {
    for (const [courseCode, grades] of Object.entries(courseGrades)) {
      const enrollmentKey = `${studentCode}-${courseCode}`;
      const enrollment = enrollmentMap[enrollmentKey];
      if (!enrollment) continue;
      const gradedById = courseTeacher[courseCode];
      await seedGrades(enrollment.id, gradedById, grades);
    }
  }

  console.log('✅ Calificaciones creadas (8 est. × 5 cursos × 3 tipos = 120 registros).');

  // ── Resumen final ─────────────────────────────────────────────────────────────

  console.log('\n🎉 Seed completado exitosamente.\n');
  console.log('── Credenciales de prueba ──────────────────────────────────');
  console.log('  Administrador:');
  console.log('    admin@escuela.com           Admin123!');
  console.log('\n  Docentes:');
  console.log('    garcia@escuela.com           Docente123!  (Matemáticas + Ciencias)');
  console.log('    martinez@escuela.com         Docente123!  (Lengua + Historia)');
  console.log('    torres@escuela.com           Docente123!  (Informática)');
  console.log('\n  Estudiantes (contraseña: Alumno123!):');
  console.log('    juan@escuela.com     EST-2026-001  Promedio ~7.8');
  console.log('    maria@escuela.com    EST-2026-002  Promedio ~9.0  ★');
  console.log('    pedro@escuela.com    EST-2026-003  Promedio ~6.9  (reprueba INF)');
  console.log('    sofia@escuela.com    EST-2026-004  Promedio ~8.2');
  console.log('    diego@escuela.com    EST-2026-005  Promedio ~6.9  (reprueba MAT+CIE)');
  console.log('    valeria@escuela.com  EST-2026-006  Promedio ~9.4  ★★');
  console.log('    andres@escuela.com   EST-2026-007  Promedio ~6.0  (reprueba MAT+LEN+CIE+INF)');
  console.log('    carmen@escuela.com   EST-2026-008  Promedio ~8.0');
  console.log('────────────────────────────────────────────────────────────');

  await sequelize.close();
}

seed().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
