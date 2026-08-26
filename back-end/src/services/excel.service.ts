import ExcelJS from 'exceljs';
import { Course, Enrollment, Student, User, Grade, Teacher } from '../models/index';
import { calculateWeightedAverage, isPassed, getGradeLabel } from '../utils/grades';

const SCHOOL_NAME = process.env.SCHOOL_NAME || 'Institución Educativa';
const SCHOOL_ADDRESS = process.env.SCHOOL_ADDRESS || '';

// Extended types for includes
type GradeRow = Pick<Grade, 'gradeType' | 'score' | 'weight' | 'comments'>;
type EnrollmentWithData = Omit<Enrollment, 'student' | 'course' | 'grades'> & {
  student?: Student & { user?: User };
  course?: Course & { teacher?: Teacher & { user?: User } };
  grades?: GradeRow[];
};
type StudentWithEnrollments = Omit<Student, 'user' | 'enrollments'> & {
  user?: User;
  enrollments?: EnrollmentWithData[];
};
type CourseWithData = Omit<Course, 'teacher' | 'enrollments'> & {
  teacher?: Teacher & { user?: User };
  enrollments?: EnrollmentWithData[];
};

// ─── Helpers de estilo ────────────────────────────────────────────────────────
function headerStyle(cell: ExcelJS.Cell) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
  cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
  cell.border = {
    top: { style: 'thin' }, bottom: { style: 'thin' },
    left: { style: 'thin' }, right: { style: 'thin' },
  };
}

function passCell(cell: ExcelJS.Cell, passed: boolean) {
  cell.fill = {
    type: 'pattern', pattern: 'solid',
    fgColor: { argb: passed ? 'FFC6EFCE' : 'FFFFC7CE' },
  };
  cell.font = { color: { argb: passed ? 'FF375623' : 'FF9C0006' }, bold: true };
}

// ─── Reporte por curso ────────────────────────────────────────────────────────
export async function generateCourseGradesExcel(courseId: number): Promise<Buffer> {
  const rawCourse = await Course.findByPk(courseId, {
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
  if (!rawCourse) throw new Error('Curso no encontrado');
  const course = rawCourse as unknown as CourseWithData;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = SCHOOL_NAME;
  workbook.created = new Date();

  const enrollments = course.enrollments ?? [];
  const teacherName = course.teacher?.user?.name ?? 'N/A';

  // ── Hoja 1: Resumen ─────────────────────────────────────────────────────────
  const summary = workbook.addWorksheet('Resumen');
  summary.mergeCells('A1:D1');
  const titleCell = summary.getCell('A1');
  titleCell.value = SCHOOL_NAME;
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center' };
  summary.mergeCells('A2:D2');
  summary.getCell('A2').value = SCHOOL_ADDRESS;
  summary.getCell('A2').alignment = { horizontal: 'center' };
  summary.addRow([]);

  const averages = enrollments
    .map(e => calculateWeightedAverage((e.grades ?? []).map(g => ({ score: g.score, weight: g.weight }))))
    .filter(a => a > 0);
  const groupAvg = averages.length ? (averages.reduce((a, b) => a + b, 0) / averages.length).toFixed(2) : 'N/A';
  const passCount = enrollments.filter(e => {
    const avg = calculateWeightedAverage((e.grades ?? []).map(g => ({ score: g.score, weight: g.weight })));
    return isPassed(avg);
  }).length;
  const passRate = enrollments.length ? `${((passCount / enrollments.length) * 100).toFixed(1)}%` : 'N/A';

  const infoRows: [string, string | number][] = [
    ['Curso:', course.name], ['Código:', course.code], ['Docente:', teacherName],
    ['Período:', course.period], ['Total estudiantes:', enrollments.length],
    ['Fecha de generación:', new Date().toLocaleDateString('es-EC')],
    ['Promedio del grupo:', groupAvg], ['% Aprobados:', passRate],
  ];
  infoRows.forEach(([label, value]) => {
    const row = summary.addRow([label, value]);
    row.getCell(1).font = { bold: true };
  });
  summary.getColumn(1).width = 25;
  summary.getColumn(2).width = 30;

  // ── Hoja 2: Calificaciones ──────────────────────────────────────────────────
  const gradesSheet = workbook.addWorksheet('Calificaciones');
  gradesSheet.columns = [
    { header: 'N°', key: 'index', width: 5 },
    { header: 'Código', key: 'code', width: 15 },
    { header: 'Nombre Estudiante', key: 'name', width: 30 },
    { header: 'Parcial 1 (30%)', key: 'p1', width: 16 },
    { header: 'Parcial 2 (30%)', key: 'p2', width: 16 },
    { header: 'Examen Final (40%)', key: 'ef', width: 19 },
    { header: 'Tareas', key: 'tarea', width: 10 },
    { header: 'Proyecto', key: 'proyecto', width: 12 },
    { header: 'Promedio', key: 'avg', width: 12 },
    { header: 'Estado', key: 'status', width: 12 },
  ];
  gradesSheet.getRow(1).eachCell(headerStyle);
  gradesSheet.getRow(1).height = 20;

  enrollments.forEach((e, idx) => {
    const grades = e.grades ?? [];
    const gradeMap: Record<string, number | string> = {};
    grades.forEach(g => { gradeMap[g.gradeType] = g.score; });
    const avg = calculateWeightedAverage(grades.map(g => ({ score: g.score, weight: g.weight })));
    const passed = isPassed(avg);
    const row = gradesSheet.addRow({
      index: idx + 1,
      code: e.student?.studentCode ?? '',
      name: e.student?.user?.name ?? '',
      p1: gradeMap['parcial1'] ?? '', p2: gradeMap['parcial2'] ?? '',
      ef: gradeMap['examen_final'] ?? '', tarea: gradeMap['tarea'] ?? '',
      proyecto: gradeMap['proyecto'] ?? '',
      avg: avg > 0 ? avg : '',
      status: avg > 0 ? (passed ? 'APROBADO' : 'REPROBADO') : 'SIN NOTAS',
    });
    if (avg > 0) { passCell(row.getCell('avg'), passed); passCell(row.getCell('status'), passed); }
  });

  const avgRow = gradesSheet.addRow({ index: '', code: '', name: 'PROMEDIO DEL GRUPO', p1: '', p2: '', ef: '', tarea: '', proyecto: '', avg: groupAvg, status: '' });
  avgRow.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } }; cell.font = { bold: true }; });

  // ── Hoja 3: Estadísticas ─────────────────────────────────────────────────────
  const statsSheet = workbook.addWorksheet('Estadísticas');
  const allAverages = enrollments
    .map(e => calculateWeightedAverage((e.grades ?? []).map(g => ({ score: g.score, weight: g.weight }))))
    .filter(a => a > 0);

  statsSheet.addRow(['Rango', 'Cantidad', 'Porcentaje']);
  statsSheet.getRow(1).eachCell(headerStyle);
  [['0 - 4 (Deficiente)', 0, 4], ['5 - 6 (Regular)', 5, 6], ['7 - 8 (Bueno)', 7, 8], ['9 - 10 (Excelente)', 9, 10]].forEach(([label, min, max]) => {
    const count = allAverages.filter(a => a >= Number(min) && a <= Number(max)).length;
    statsSheet.addRow([label, count, allAverages.length ? `${((count / allAverages.length) * 100).toFixed(1)}%` : '0%']);
  });
  statsSheet.getColumn(1).width = 25; statsSheet.getColumn(2).width = 12; statsSheet.getColumn(3).width = 12;

  return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
}

// ─── Reporte por estudiante ───────────────────────────────────────────────────
export async function generateStudentGradesExcel(studentId: number): Promise<Buffer> {
  const raw = await Student.findByPk(studentId, {
    include: [
      { model: User, as: 'user', attributes: ['name', 'email'] },
      {
        model: Enrollment, as: 'enrollments',
        include: [
          { model: Course, as: 'course', include: [{ model: Teacher, as: 'teacher', include: [{ model: User, as: 'user', attributes: ['name'] }] }] },
          { model: Grade, as: 'grades' },
        ],
      },
    ],
  });
  if (!raw) throw new Error('Estudiante no encontrado');
  const student = raw as unknown as StudentWithEnrollments;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = SCHOOL_NAME;
  workbook.created = new Date();

  const enrollments = student.enrollments ?? [];
  const periods = [...new Set(enrollments.map(e => e.period))].sort();

  for (const period of periods) {
    const sheet = workbook.addWorksheet(period);
    sheet.columns = [
      { header: 'Materia', key: 'course', width: 25 }, { header: 'Código', key: 'code', width: 12 },
      { header: 'Docente', key: 'teacher', width: 22 }, { header: 'Tipo Nota', key: 'type', width: 16 },
      { header: 'Calificación', key: 'score', width: 14 }, { header: 'Peso', key: 'weight', width: 8 },
      { header: 'Promedio Final', key: 'avg', width: 15 }, { header: 'Créditos', key: 'credits', width: 10 },
      { header: 'Estado', key: 'status', width: 12 },
    ];
    sheet.getRow(1).eachCell(headerStyle);

    const periodEnrollments = enrollments.filter(e => e.period === period);
    let totalCredits = 0; let approvedCredits = 0;

    for (const e of periodEnrollments) {
      const course = e.course;
      const teacherName = course?.teacher?.user?.name ?? 'N/A';
      const grades = e.grades ?? [];
      const avg = calculateWeightedAverage(grades.map(g => ({ score: g.score, weight: g.weight })));
      const passed = isPassed(avg);
      const credits = course?.credits ?? 0;
      totalCredits += credits;
      if (passed) approvedCredits += credits;

      if (grades.length === 0) {
        sheet.addRow({ course: course?.name, code: course?.code, teacher: teacherName, type: 'Sin notas', score: '', weight: '', avg: '', credits, status: '' });
      } else {
        grades.forEach((g, i) => {
          const row = sheet.addRow({
            course: i === 0 ? course?.name : '', code: i === 0 ? course?.code : '',
            teacher: i === 0 ? teacherName : '', type: getGradeLabel(g.gradeType),
            score: g.score, weight: g.weight,
            avg: i === 0 ? (avg > 0 ? avg : '') : '',
            credits: i === 0 ? credits : '',
            status: i === 0 ? (avg > 0 ? (passed ? 'APROBADO' : 'REPROBADO') : '') : '',
          });
          if (i === 0 && avg > 0) { passCell(row.getCell('avg'), passed); passCell(row.getCell('status'), passed); }
        });
      }
    }

    const totalsRow = sheet.addRow({ course: 'TOTALES', code: '', teacher: '', type: '', score: '', weight: '', avg: '', credits: totalCredits, status: `${approvedCredits} créditos aprobados` });
    totalsRow.eachCell(c => { c.font = { bold: true }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } }; });
  }

  return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
}

// ─── Reporte global de período ────────────────────────────────────────────────
export async function generateAllGradesExcel(period: string): Promise<Buffer> {
  const rawEnrollments = await Enrollment.findAll({
    where: { period },
    include: [
      { model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: ['name'] }] },
      { model: Course, as: 'course' },
      { model: Grade, as: 'grades' },
    ],
    order: [['courseId', 'ASC'], ['studentId', 'ASC']],
  });
  const enrollments = rawEnrollments as unknown as EnrollmentWithData[];

  const workbook = new ExcelJS.Workbook();
  workbook.creator = SCHOOL_NAME;
  const sheet = workbook.addWorksheet(`Período ${period}`);
  sheet.columns = [
    { header: 'Curso', key: 'course', width: 22 }, { header: 'Estudiante', key: 'student', width: 28 },
    { header: 'Código', key: 'code', width: 15 }, { header: 'Parcial 1', key: 'p1', width: 12 },
    { header: 'Parcial 2', key: 'p2', width: 12 }, { header: 'Examen Final', key: 'ef', width: 14 },
    { header: 'Promedio', key: 'avg', width: 12 }, { header: 'Estado', key: 'status', width: 12 },
  ];
  sheet.getRow(1).eachCell(headerStyle);

  enrollments.forEach(e => {
    const grades = e.grades ?? [];
    const gradeMap: Record<string, number> = {};
    grades.forEach(g => { gradeMap[g.gradeType] = g.score; });
    const avg = calculateWeightedAverage(grades.map(g => ({ score: g.score, weight: g.weight })));
    const passed = isPassed(avg);
    const row = sheet.addRow({
      course: e.course?.name ?? '', student: e.student?.user?.name ?? '',
      code: e.student?.studentCode ?? '',
      p1: gradeMap['parcial1'] ?? '', p2: gradeMap['parcial2'] ?? '',
      ef: gradeMap['examen_final'] ?? '',
      avg: avg > 0 ? avg : '',
      status: avg > 0 ? (passed ? 'APROBADO' : 'REPROBADO') : '',
    });
    if (avg > 0) passCell(row.getCell('status'), passed);
  });

  return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
}
