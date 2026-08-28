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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      className="flex items-center gap-2 bg-white border-slate-200 text-slate-800 font-bold rounded-xl shadow-xs hover:bg-teal-50 hover:border-teal-300 transition-all"
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
      ) : (
        icon
      )}
      {label}
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
    <div className="space-y-6">
      <PageHeader title="Reportes Institucionales" description="Generación y descarga de libretas, actas y boletines escolares" />

      {/* Section 1: By course */}
      <Card className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3">
          <CardTitle className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-[#008BC1]" />
            Reportes por Curso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Período</Label>
              <Input
                className="w-32 bg-white border-slate-200 text-slate-800 font-bold rounded-xl shadow-xs"
                value={coursePeriod}
                onChange={(e) => setCoursePeriod(e.target.value)}
                placeholder="2026-I"
              />
            </div>
            <div className="space-y-1 min-w-[240px]">
              <Label className="text-xs font-bold text-slate-700">Curso</Label>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger className="bg-white border-slate-200 text-slate-800 font-bold rounded-xl shadow-xs">
                  <SelectValue placeholder="Seleccionar curso" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 rounded-xl shadow-2xl">
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <ReportButton
              label="Descargar Excel de Curso"
              icon={<FileSpreadsheet className="h-4 w-4 text-[#31B45A]" />}
              disabled={!selectedCourseId}
              onClick={() =>
                reportService.downloadCourseExcel(
                  Number(selectedCourseId),
                  selectedCourse?.code ?? 'curso'
                )
              }
            />
            <ReportButton
              label="Descargar Acta PDF"
              icon={<FileText className="h-4 w-4 text-[#E84B5B]" />}
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

      {/* Section 2: By student with Comboboxes */}
      <Card className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3">
          <CardTitle className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-[#31B45A]" />
            Reportes por Estudiante
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-wrap gap-4">
            {/* Combobox 1: Curso */}
            <div className="space-y-1 min-w-[240px]">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-[#008BC1]" />
                Filtrar por Curso
              </Label>
              <Select
                value={studentCourseFilter}
                onValueChange={(val) => {
                  setStudentCourseFilter(val);
                  setSelectedStudentId(''); // Reset selected student when course filter changes
                }}
              >
                <SelectTrigger className="bg-white border-slate-200 text-slate-800 font-bold rounded-xl shadow-xs">
                  <SelectValue placeholder="Todos los Cursos" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 rounded-xl shadow-2xl">
                  <SelectItem value="all">Todos los Cursos</SelectItem>
                  {allCoursesList.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Combobox 2: Estudiante */}
            <div className="space-y-1 min-w-[280px] flex-1">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5 text-[#31B45A]" />
                Seleccionar Estudiante
              </Label>
              <Select
                value={selectedStudentId}
                onValueChange={setSelectedStudentId}
                disabled={loadingAllStudents || availableStudents.length === 0}
              >
                <SelectTrigger className="bg-white border-slate-200 text-slate-800 font-bold rounded-xl shadow-xs">
                  <SelectValue
                    placeholder={
                      loadingAllStudents
                        ? 'Cargando lista de estudiantes...'
                        : availableStudents.length === 0
                        ? 'Sin estudiantes en este curso'
                        : 'Seleccionar Estudiante'
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 rounded-xl shadow-2xl max-h-60">
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
          <div className="flex flex-wrap gap-2 pt-2">
            <ReportButton
              label="Excel de Calificaciones"
              icon={<FileSpreadsheet className="h-4 w-4 text-[#31B45A]" />}
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
              icon={<FileText className="h-4 w-4 text-[#008BC1]" />}
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
              icon={<FileText className="h-4 w-4 text-[#7D5AA6]" />}
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
      <Card className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3">
          <CardTitle className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <Download className="h-4 w-4 text-[#7D5AA6]" />
            Reporte Global del Período
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-700">Período Académico</Label>
            <Input
              className="w-32 bg-white border-slate-200 text-slate-800 font-bold rounded-xl shadow-xs"
              value={globalPeriod}
              onChange={(e) => setGlobalPeriod(e.target.value)}
              placeholder="2026-I"
            />
          </div>
          <div className="pt-2">
            <ReportButton
              label="Descargar Consolidado Global Excel"
              icon={<FileSpreadsheet className="h-4 w-4 text-[#09A9C2]" />}
              disabled={!globalPeriod}
              onClick={() => reportService.downloadAllGradesExcel(globalPeriod)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

