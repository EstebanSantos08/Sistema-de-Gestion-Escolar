import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileSpreadsheet, FileText, Search, Download } from 'lucide-react';
import toast from 'react-hot-toast';

import { courseService } from '@/services/course.service';
import { studentService } from '@/services/student.service';
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
      className="flex items-center gap-2"
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [globalPeriod, setGlobalPeriod] = useState('2026-I');

  const { data: coursesData } = useQuery({
    queryKey: ['courses-report', coursePeriod],
    queryFn: () => courseService.list({ period: coursePeriod, limit: 100 }),
    enabled: !!coursePeriod,
  });

  const { data: studentsData } = useQuery({
    queryKey: ['students-report', studentSearch],
    queryFn: () => studentService.list({ search: studentSearch, limit: 20 }),
    enabled: studentSearch.length >= 2,
  });

  const courses = coursesData?.data ?? [];
  const students = studentsData?.data ?? [];

  const selectedCourse = courses.find((c) => String(c.id) === selectedCourseId);
  const selectedStudent = students.find((s) => String(s.id) === selectedStudentId);

  return (
    <div className="space-y-6">
      <PageHeader title="Reportes" description="Generación y descarga de reportes del sistema" />

      {/* Section 1: By course */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            Reportes por curso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1">
              <Label>Período</Label>
              <Input
                className="w-32"
                value={coursePeriod}
                onChange={(e) => setCoursePeriod(e.target.value)}
                placeholder="2026-I"
              />
            </div>
            <div className="space-y-1 min-w-[220px]">
              <Label>Curso</Label>
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
          <div className="flex flex-wrap gap-2">
            <ReportButton
              label="Descargar Excel"
              icon={<FileSpreadsheet className="h-4 w-4" />}
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
              icon={<FileText className="h-4 w-4" />}
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Reportes por estudiante
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1 w-64">
              <Label>Buscar estudiante</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Nombre o código..."
                  value={studentSearch}
                  onChange={(e) => { setStudentSearch(e.target.value); setSelectedStudentId(''); }}
                />
              </div>
            </div>
            {students.length > 0 && (
              <div className="space-y-1 min-w-[220px]">
                <Label>Estudiante</Label>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name} ({s.studentProfile?.studentCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <ReportButton
              label="Excel de notas"
              icon={<FileSpreadsheet className="h-4 w-4" />}
              disabled={!selectedStudentId}
              onClick={() =>
                reportService.downloadStudentExcel(
                  Number(selectedStudentId),
                  selectedStudent?.studentProfile?.studentCode ?? 'est'
                )
              }
            />
            <ReportButton
              label="Boletín PDF"
              icon={<FileText className="h-4 w-4" />}
              disabled={!selectedStudentId}
              onClick={() =>
                reportService.downloadStudentBulletinPdf(
                  Number(selectedStudentId),
                  selectedStudent?.studentProfile?.studentCode ?? 'est'
                )
              }
            />
            <ReportButton
              label="Historial PDF"
              icon={<FileText className="h-4 w-4" />}
              disabled={!selectedStudentId}
              onClick={() =>
                reportService.downloadTranscriptPdf(
                  Number(selectedStudentId),
                  selectedStudent?.studentProfile?.studentCode ?? 'est'
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Global */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            Reporte global
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Período</Label>
            <Input
              className="w-32"
              value={globalPeriod}
              onChange={(e) => setGlobalPeriod(e.target.value)}
              placeholder="2026-I"
            />
          </div>
          <ReportButton
            label="Descargar Excel global"
            icon={<FileSpreadsheet className="h-4 w-4" />}
            disabled={!globalPeriod}
            onClick={() => reportService.downloadAllGradesExcel(globalPeriod)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
