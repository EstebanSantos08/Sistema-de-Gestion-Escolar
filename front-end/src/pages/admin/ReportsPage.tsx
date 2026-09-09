import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileSpreadsheet, FileText, Download, Users, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

import { courseService } from '@/services/course.service';
import { studentService } from '@/services/student.service';
import { enrollmentService } from '@/services/enrollment.service';
import { reportService } from '@/services/report.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function ReportButton({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onClick();
    } catch {
      toast.error('Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="flex items-center gap-2 h-10 px-4"
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-turquoise border-t-transparent" />
      ) : (
        icon
      )}
      <span>{label}</span>
    </Button>
  );
}

export default function ReportsPage() {
  const [coursePeriod, setCoursePeriod] = useState('2026-I');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [studentCourseFilter, setStudentCourseFilter] = useState<string>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [globalPeriod, setGlobalPeriod] = useState('2026-I');

  // Courses list for Section 1 and Section 2 filter
  const { data: coursesData } = useQuery({
    queryKey: ['courses-report', coursePeriod],
    queryFn: () => courseService.list({ period: coursePeriod, limit: 100 }),
    enabled: !!coursePeriod,
  });

  // All courses query for Student Course Filter
  const { data: allCoursesData } = useQuery({
    queryKey: ['all-courses-report'],
    queryFn: () => courseService.list({ limit: 100 }),
  });

  // All students query for Student Combobox
  const { data: allStudentsData, isLoading: loadingAllStudents } = useQuery({
    queryKey: ['all-students-report'],
    queryFn: () => studentService.list({ limit: 100 }),
  });

  // Course specific students query if a course is selected
  const { data: courseStudentsData } = useQuery({
    queryKey: ['course-students-report', studentCourseFilter],
    queryFn: () => enrollmentService.getByCourse(Number(studentCourseFilter)),
    enabled: studentCourseFilter !== 'all' && Boolean(studentCourseFilter),
  });

  const courses = coursesData?.data ?? [];
  const allCoursesList = allCoursesData?.data ?? [];
  
  // Available students dropdown list (filtered by course if selected)
  let availableStudents: { id: number; name: string; studentCode: string }[] = [];

  if (studentCourseFilter !== 'all' && courseStudentsData?.students) {
    availableStudents = (courseStudentsData.students ?? []).map((cs) => ({
      id: cs.studentId,
      name: cs.name,
      studentCode: cs.studentCode,
    }));
  } else if (allStudentsData?.data) {
    availableStudents = allStudentsData.data.map((s) => ({
      id: s.id,
      name: s.name,
      studentCode: s.studentProfile?.studentCode ?? '',
    }));
  }

  const selectedCourse = courses.find((c) => String(c.id) === selectedCourseId);
  const selectedStudent = availableStudents.find((s) => String(s.id) === selectedStudentId);

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="Administración"
        title="Reportes Institucionales"
        description="Generación y descarga de libretas de calificaciones, actas de curso y consolidados escolares oficiales"
      />

      {/* Section 1: By course */}
      <Card accent="violet" className="nk-section">
        <CardHeader className="border-b border-school-border bg-school-bg/50 pb-4">
          <CardTitle className="text-base font-semibold text-school-heading flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-ink-turquoise" />
            Reportes por Curso
          </CardTitle>
          <CardDescription>
            Descarga de planillas Excel y actas de curso oficiales en formato PDF
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-school-heading">Período</Label>
              <Input
                className="w-32"
                value={coursePeriod}
                onChange={(e) => setCoursePeriod(e.target.value)}
                placeholder="2026-I"
                aria-label="Período del curso"
              />
            </div>
            <div className="space-y-1.5 min-w-0 w-full sm:min-w-[260px] flex-1 sm:flex-initial">
              <Label className="text-xs font-semibold text-school-heading">Curso escolar</Label>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <ReportButton
              label="Descargar Planilla Excel"
              icon={<FileSpreadsheet className="h-4 w-4 text-school-success" />}
              disabled={!selectedCourseId}
              onClick={() =>
                reportService.downloadCourseExcel(
                  Number(selectedCourseId),
                  selectedCourse?.code ?? 'curso'
                )
              }
            />
            <ReportButton
              label="Descargar Acta Oficial PDF"
              icon={<FileText className="h-4 w-4 text-ink-turquoise" />}
              disabled={!selectedCourseId}
              onClick={() =>
                reportService.downloadCoursePdf(
                  Number(selectedCourseId),
                  selectedCourse?.code ?? 'curso'
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 2: By student */}
      <Card accent="blue" className="nk-section">
        <CardHeader className="border-b border-school-border bg-school-bg/50 pb-4">
          <CardTitle className="text-base font-semibold text-school-heading flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-ink-turquoise" />
            Reportes Individuales por Estudiante
          </CardTitle>
          <CardDescription>
            Boletines de calificaciones periódicas e historial académico por alumno
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="flex flex-wrap gap-4">
            {/* Filter by course */}
            <div className="space-y-1.5 min-w-0 w-full sm:min-w-[260px]">
              <Label className="text-xs font-semibold text-school-heading flex items-center gap-1.5">
                <Users className="h-4 w-4 text-ink-turquoise" />
                Filtrar por Curso
              </Label>
              <Select
                value={studentCourseFilter}
                onValueChange={(val) => {
                  setStudentCourseFilter(val);
                  setSelectedStudentId('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los cursos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Cursos</SelectItem>
                  {allCoursesList.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select student */}
            <div className="space-y-1.5 min-w-0 w-full sm:min-w-[300px] flex-1">
              <Label className="text-xs font-semibold text-school-heading flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-ink-turquoise" />
                Seleccionar Estudiante
              </Label>
              <Select
                value={selectedStudentId}
                onValueChange={setSelectedStudentId}
                disabled={loadingAllStudents || availableStudents.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingAllStudents
                        ? 'Cargando lista de estudiantes...'
                        : availableStudents.length === 0
                        ? 'Sin estudiantes en este curso'
                        : 'Seleccionar estudiante'
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {availableStudents.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name} ({s.studentCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Download Buttons for Selected Student */}
          <div className="flex flex-wrap gap-3 pt-2">
            <ReportButton
              label="Excel de Calificaciones"
              icon={<FileSpreadsheet className="h-4 w-4 text-school-success" />}
              disabled={!selectedStudentId}
              onClick={() =>
                reportService.downloadStudentExcel(
                  Number(selectedStudentId),
                  selectedStudent?.studentCode ?? 'est'
                )
              }
            />
            <ReportButton
              label="Boletín de Notas PDF"
              icon={<FileText className="h-4 w-4 text-ink-turquoise" />}
              disabled={!selectedStudentId}
              onClick={() =>
                reportService.downloadStudentBulletinPdf(
                  Number(selectedStudentId),
                  selectedStudent?.studentCode ?? 'est'
                )
              }
            />
            <ReportButton
              label="Historial Académico PDF"
              icon={<FileText className="h-4 w-4 text-brand-violet" />}
              disabled={!selectedStudentId}
              onClick={() =>
                reportService.downloadTranscriptPdf(
                  Number(selectedStudentId),
                  selectedStudent?.studentCode ?? 'est'
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Global */}
      <Card accent="turquoise" className="nk-section">
        <CardHeader className="border-b border-school-border bg-school-bg/50 pb-4">
          <CardTitle className="text-base font-semibold text-school-heading flex items-center gap-2">
            <Download className="h-5 w-5 text-ink-turquoise" />
            Reporte Consolidado del Período
          </CardTitle>
          <CardDescription>
            Exportación completa de todas las notas y registros del ciclo escolar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-school-heading">Período Académico</Label>
            <Input
              className="w-36"
              value={globalPeriod}
              onChange={(e) => setGlobalPeriod(e.target.value)}
              placeholder="2026-I"
              aria-label="Período académico para consolidado"
            />
          </div>
          <div className="pt-2">
            <ReportButton
              label="Descargar Consolidado Global Excel"
              icon={<FileSpreadsheet className="h-4 w-4 text-school-success" />}
              disabled={!globalPeriod}
              onClick={() => reportService.downloadAllGradesExcel(globalPeriod)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
