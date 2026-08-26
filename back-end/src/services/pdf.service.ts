import PDFDocument from 'pdfkit';
import { Student, User, Enrollment, Course, Grade, Teacher } from '../models/index';
import { calculateWeightedAverage, isPassed, getGradeLabel } from '../utils/grades';

const SCHOOL_NAME = process.env.SCHOOL_NAME || 'Institución Educativa';
const SCHOOL_ADDRESS = process.env.SCHOOL_ADDRESS || '';
const SCHOOL_PHONE = process.env.SCHOOL_PHONE || '';

// Extended types
type GradeRow = Pick<Grade, 'gradeType' | 'score' | 'weight' | 'comments'>;
type EnrollmentWithData = Omit<Enrollment, 'student' | 'course' | 'grades'> & {
  student?: Student & { user?: User };
  course?: Course & { teacher?: Teacher & { user?: User } };
  grades?: GradeRow[];
};
type StudentWithData = Omit<Student, 'user' | 'enrollments'> & {
  user?: User;
  enrollments?: EnrollmentWithData[];
};
type CourseWithData = Omit<Course, 'teacher' | 'enrollments'> & {
  teacher?: Teacher & { user?: User };
  enrollments?: EnrollmentWithData[];
};

function docBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise(resolve => {
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

function drawHeader(doc: PDFKit.PDFDocument) {
  doc.fontSize(18).font('Helvetica-Bold').text(SCHOOL_NAME, { align: 'center' });
  if (SCHOOL_ADDRESS) doc.fontSize(10).font('Helvetica').text(SCHOOL_ADDRESS, { align: 'center' });
  if (SCHOOL_PHONE) doc.fontSize(10).text(SCHOOL_PHONE, { align: 'center' });
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#2980B9').lineWidth(2).stroke();
  doc.moveDown(0.5);
}

function drawStudentInfo(doc: PDFKit.PDFDocument, student: StudentWithData) {
  const y = doc.y;
  doc.rect(50, y, 495, 60).fillAndStroke('#F5F5F5', '#CCCCCC');
  doc.fillColor('#000000');
  doc.fontSize(11).font('Helvetica-Bold').text('Datos del Estudiante', 60, y + 8);
  doc.font('Helvetica').fontSize(10)
    .text(`Nombre: ${student.user?.name ?? 'N/A'}`, 60, y + 24)
    .text(`Código: ${student.studentCode}`, 60, y + 38);
  doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-EC')}`, 320, y + 24);
  doc.moveDown(4);
}

// ─── Boletín de estudiante ────────────────────────────────────────────────────
export async function generateStudentBulletin(studentId: number, period?: string): Promise<Buffer> {
  const activePeriod = period || process.env.ACTIVE_PERIOD || '2026-I';

  const raw = await Student.findByPk(studentId, {
    include: [
      { model: User, as: 'user', attributes: ['name', 'email'] },
      {
        model: Enrollment, as: 'enrollments',
        where: { period: activePeriod }, required: false,
        include: [
          { model: Course, as: 'course', include: [{ model: Teacher, as: 'teacher', include: [{ model: User, as: 'user', attributes: ['name'] }] }] },
          { model: Grade, as: 'grades' },
        ],
      },
    ],
  });
  if (!raw) throw new Error('Estudiante no encontrado');
  const student = raw as unknown as StudentWithData;

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const bufPromise = docBuffer(doc);

  drawHeader(doc);
  doc.fontSize(14).font('Helvetica-Bold').text('BOLETÍN DE CALIFICACIONES', { align: 'center' });
  doc.fontSize(12).font('Helvetica').text(`Período: ${activePeriod}`, { align: 'center' });
  doc.moveDown(0.8);
  drawStudentInfo(doc, student);

  const enrollments = student.enrollments ?? [];
  let generalAvgSum = 0; let countWithGrades = 0;

  for (const e of enrollments) {
    const course = e.course;
    const teacherName = course?.teacher?.user?.name ?? 'N/A';
    const grades = e.grades ?? [];
    const avg = calculateWeightedAverage(grades.map(g => ({ score: g.score, weight: g.weight })));
    const passed = avg > 0 ? isPassed(avg) : null;
    if (avg > 0) { generalAvgSum += avg; countWithGrades++; }

    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica-Bold').text(course?.name ?? 'N/A');
    doc.fontSize(9).font('Helvetica').fillColor('#555555').text(`Docente: ${teacherName}  |  Créditos: ${course?.credits ?? 0}`);
    doc.fillColor('#000000');

    if (grades.length === 0) {
      doc.fontSize(10).text('  Sin calificaciones registradas.');
    } else {
      grades.forEach(g => {
        doc.fontSize(10).text(`  ${getGradeLabel(g.gradeType)}: ${g.score} (peso: ${(g.weight * 100).toFixed(0)}%)`);
        if (g.comments) doc.fontSize(9).fillColor('#666666').text(`    Obs: ${g.comments}`).fillColor('#000000');
      });
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica-Bold')
        .fillColor(passed === true ? '#1A7B34' : passed === false ? '#C00000' : '#000000')
        .text(`Promedio: ${avg}   ${passed === true ? 'APROBADO' : passed === false ? 'REPROBADO' : ''}`);
      doc.fillColor('#000000');
    }
    doc.moveTo(50, doc.y + 4).lineTo(545, doc.y + 4).strokeColor('#DDDDDD').lineWidth(0.5).stroke();
  }

  const generalAvg = countWithGrades > 0 ? (generalAvgSum / countWithGrades).toFixed(2) : 'N/A';
  doc.moveDown(1);
  const boxY = doc.y;
  doc.rect(50, boxY, 495, 30).fillAndStroke('#E8F4FD', '#2980B9');
  doc.fillColor('#000000').fontSize(13).font('Helvetica-Bold').text(`Promedio General: ${generalAvg}`, 60, boxY + 8);
  doc.moveDown(3);
  doc.fontSize(8).font('Helvetica').fillColor('#888888')
    .text(`Generado el ${new Date().toLocaleDateString('es-EC')} — Documento automático del sistema.`, { align: 'center' });

  doc.end();
  return bufPromise;
}

// ─── Acta de curso ────────────────────────────────────────────────────────────
export async function generateCourseAct(courseId: number): Promise<Buffer> {
  const raw = await Course.findByPk(courseId, {
    include: [
      { model: Teacher, as: 'teacher', include: [{ model: User, as: 'user', attributes: ['name'] }] },
      {
        model: Enrollment, as: 'enrollments',
        include: [
          { model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: ['name'] }] },
          { model: Grade, as: 'grades' },
        ],
      },
    ],
  });
  if (!raw) throw new Error('Curso no encontrado');
  const course = raw as unknown as CourseWithData;

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const bufPromise = docBuffer(doc);

  drawHeader(doc);
  doc.fontSize(14).font('Helvetica-Bold').text('ACTA OFICIAL DE CALIFICACIONES', { align: 'center' });
  doc.fontSize(11).font('Helvetica').text(`${course.name} (${course.code}) — Período: ${course.period}`, { align: 'center' });
  doc.fontSize(10).text(`Docente: ${course.teacher?.user?.name ?? 'N/A'}`, { align: 'center' });
  doc.moveDown(1);

  const enrollments = course.enrollments ?? [];
  enrollments.forEach((e, idx) => {
    const grades = e.grades ?? [];
    const avg = calculateWeightedAverage(grades.map(g => ({ score: g.score, weight: g.weight })));
    const passed = isPassed(avg);
    const name = e.student?.user?.name ?? 'N/A';
    const code = e.student?.studentCode ?? '';
    const y = doc.y;
    doc.fontSize(10).font('Helvetica').fillColor('#000000').text(`${idx + 1}. ${code} — ${name}`, 60, y);
    doc.font(passed ? 'Helvetica-Bold' : 'Helvetica').fillColor(passed ? '#1A7B34' : '#C00000')
      .text(`${avg > 0 ? avg : 'S/N'} ${avg > 0 ? (passed ? 'APROBADO' : 'REPROBADO') : ''}`, 420, y);
    doc.fillColor('#000000');
    doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).strokeColor('#DDDDDD').lineWidth(0.5).stroke();
    doc.moveDown(0.3);
  });

  doc.moveDown(3);
  doc.fontSize(10).font('Helvetica').text('Firma del Docente: _______________________________', { align: 'right' });
  doc.moveDown(0.5);
  doc.text('Fecha: _______________', { align: 'right' });
  doc.end();
  return bufPromise;
}

// ─── Historial académico ──────────────────────────────────────────────────────
export async function generateTranscript(studentId: number): Promise<Buffer> {
  const raw = await Student.findByPk(studentId, {
    include: [
      { model: User, as: 'user', attributes: ['name', 'email'] },
      {
        model: Enrollment, as: 'enrollments',
        include: [{ model: Course, as: 'course' }, { model: Grade, as: 'grades' }],
      },
    ],
  });
  if (!raw) throw new Error('Estudiante no encontrado');
  const student = raw as unknown as StudentWithData;

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const bufPromise = docBuffer(doc);

  drawHeader(doc);
  doc.fontSize(14).font('Helvetica-Bold').text('HISTORIAL ACADÉMICO', { align: 'center' });
  doc.moveDown(0.5);
  drawStudentInfo(doc, student);

  const enrollments = student.enrollments ?? [];
  const periods = [...new Set(enrollments.map(e => e.period))].sort();
  let totalCredits = 0; let approvedCredits = 0; const allAvgs: number[] = [];

  for (const period of periods) {
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica-Bold').text(`Período: ${period}`);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#2980B9').lineWidth(1).stroke();
    doc.moveDown(0.3);

    for (const e of enrollments.filter(en => en.period === period)) {
      const course = e.course;
      const grades = e.grades ?? [];
      const avg = calculateWeightedAverage(grades.map(g => ({ score: g.score, weight: g.weight })));
      const passed = avg > 0 ? isPassed(avg) : null;
      const credits = course?.credits ?? 0;
      totalCredits += credits;
      if (passed === true) { approvedCredits += credits; allAvgs.push(avg); }

      doc.fontSize(10).font('Helvetica').fillColor('#000000')
        .text(`  ${course?.name ?? 'N/A'} (${course?.code ?? ''})`, { continued: true })
        .fillColor(passed === true ? '#1A7B34' : passed === false ? '#C00000' : '#888888')
        .text(`  ${avg > 0 ? avg : 'Sin notas'}  ${passed === true ? 'APROBADO' : passed === false ? 'REPROBADO' : ''}`, { align: 'right' });
      doc.fillColor('#000000');
    }
  }

  const historicAvg = allAvgs.length ? (allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length).toFixed(2) : 'N/A';
  doc.moveDown(1);
  const boxY = doc.y;
  doc.rect(50, boxY, 495, 45).fillAndStroke('#E8F4FD', '#2980B9');
  doc.fillColor('#000000').fontSize(11).font('Helvetica-Bold')
    .text(`Créditos aprobados: ${approvedCredits} / ${totalCredits}`, 60, boxY + 5)
    .text(`Promedio histórico: ${historicAvg}`, 60, boxY + 22);
  doc.moveDown(3);
  doc.fontSize(8).font('Helvetica').fillColor('#888888')
    .text(`Generado el ${new Date().toLocaleDateString('es-EC')} — Documento automático del sistema.`, { align: 'center' });
  doc.end();
  return bufPromise;
}
