import { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Printer,
  FileDown,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  Megaphone,
  CheckSquare,
  User,
  BookOpen,
  Filter,
  Loader2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useMyCourses } from '@/hooks/useCourses';
import { useCourseStudents } from '@/hooks/useEnrollments';
import { dailySummaryService } from '@/services/dailySummary.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TeacherDailySummary } from '@/types';

function getTodayStr(): string {
  const d = new Date();
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${day}`;
}

export default function BitacoraPage() {
  const { user } = useAuth();
  const teacherName = user?.name ?? 'Profesor(a)';
  const todayStr = useMemo(() => getTodayStr(), []);

  // Filter states
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');

  // Load teacher's authorized courses
  const { data: courses = [] } = useMyCourses();

  // Load students for selected course if filtered
  const courseIdNum = selectedCourseId !== 'all' ? Number(selectedCourseId) : null;
  const { data: courseStudentsData } = useCourseStudents(courseIdNum);
  const students = courseStudentsData?.students ?? [];

  // Query canonical backend daily summary
  const {
    data: dailySummary,
    isLoading,
    isError,
    refetch,
  } = useQuery<TeacherDailySummary>({
    queryKey: ['daily-summary', user?.id, selectedDate, selectedCourseId, selectedStudentId],
    queryFn: () =>
      dailySummaryService.getTeacherDailySummary({
        date: selectedDate,
        courseId: selectedCourseId !== 'all' ? Number(selectedCourseId) : undefined,
        studentId: selectedStudentId !== 'all' ? Number(selectedStudentId) : undefined,
      }),
    enabled: !!user,
  });

  const handlePrint = () => {
    window.print();
  };

  const attendanceList = dailySummary?.attendance ?? [];
  const activitiesList = dailySummary?.activities ?? [];
  const observationsList = dailySummary?.observations ?? [];
  const announcementsList = dailySummary?.announcements ?? [];
  const summaryStats = dailySummary?.summary;

  const totalRecords =
    attendanceList.length +
    activitiesList.length +
    observationsList.length +
    announcementsList.length;

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-pdf-report, #printable-pdf-report * {
            visibility: visible;
          }
          #printable-pdf-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            padding: 20px;
          }
        }
      `}</style>

      <PageHeader
        eyebrow="Docente"
        title="Bitácora Pedagógica Diaria"
        description="Seguimiento cronológico unificado: asistencias, actividades, observaciones y comunicados registrados en el sistema"
      >
        <Button onClick={handlePrint} variant="outline" className="gap-2">
          <Printer className="h-4 w-4 text-school-primary" />
          Exportar PDF Bitácora
        </Button>
      </PageHeader>

      {/* Barra de Filtros Reales */}
      <Card className="p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          {/* Fecha */}
          <div className="space-y-1.5">
            <Label htmlFor="bitacora-date" className="text-xs font-semibold text-school-heading flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5 text-school-primary" />
              Fecha de la bitácora:
            </Label>
            <Input
              id="bitacora-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white"
            />
          </div>

          {/* Curso */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-school-heading flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-school-primary" />
              Curso / Materia:
            </Label>
            <Select
              value={selectedCourseId}
              onValueChange={(val) => {
                setSelectedCourseId(val);
                setSelectedStudentId('all'); // reset student filter
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos mis cursos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos mis cursos</SelectItem>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estudiante */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-school-heading flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-school-primary" />
              Estudiante:
            </Label>
            <Select
              value={selectedStudentId}
              onValueChange={setSelectedStudentId}
              disabled={selectedCourseId === 'all' || students.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    selectedCourseId === 'all'
                      ? 'Filtra por curso primero'
                      : students.length === 0
                      ? 'Sin estudiantes matriculados'
                      : 'Todos los estudiantes'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estudiantes del curso</SelectItem>
                {students.map((s) => (
                  <SelectItem key={s.studentId} value={String(s.studentId)}>
                    {s.name} ({s.studentCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Resumen numérico */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4 text-center">
          <ClipboardCheck className="h-5 w-5 mx-auto text-school-success mb-1" />
          <p className="text-2xl font-bold text-school-heading">
            {summaryStats ? summaryStats.presentToday : attendanceList.length}
          </p>
          <p className="text-xs text-school-muted uppercase font-medium tracking-wider">Presentes Hoy</p>
        </Card>
        <Card className="p-4 text-center">
          <CheckSquare className="h-5 w-5 mx-auto text-school-primary mb-1" />
          <p className="text-2xl font-bold text-school-primary">{activitiesList.length}</p>
          <p className="text-xs text-school-muted uppercase font-medium tracking-wider">Actividades</p>
        </Card>
        <Card className="p-4 text-center">
          <MessageSquare className="h-5 w-5 mx-auto text-school-violet mb-1" />
          <p className="text-2xl font-bold text-school-violet">{observationsList.length}</p>
          <p className="text-xs text-school-muted uppercase font-medium tracking-wider">Observaciones</p>
        </Card>
        <Card className="p-4 text-center">
          <Megaphone className="h-5 w-5 mx-auto text-school-warning mb-1" />
          <p className="text-2xl font-bold text-school-warning">{announcementsList.length}</p>
          <p className="text-xs text-school-muted uppercase font-medium tracking-wider">Comunicados</p>
        </Card>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-school-primary mb-3" />
          <p className="text-school-muted font-medium">Cargando registros canónicos de bitácora...</p>
        </Card>
      ) : isError ? (
        <Card className="p-12 text-center text-red-600">
          <AlertCircle className="h-10 w-10 mx-auto text-red-500 mb-2" />
          <p className="font-semibold text-base">Error al cargar la bitácora</p>
          <p className="text-sm text-school-muted mt-1">Verifica tu conexión y permisos docentes.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
            Reintentar
          </Button>
        </Card>
      ) : totalRecords === 0 ? (
        <Card className="p-12 text-center">
          <CalendarIcon className="h-10 w-10 mx-auto text-school-muted mb-2" />
          <p className="font-semibold text-school-heading text-base">
            No se encontraron registros para el {selectedDate}
          </p>
          <p className="text-sm text-school-muted mt-1 max-w-md mx-auto">
            Las asistencias, actividades, observaciones y comunicados registrados en el sistema para esta fecha aparecerán aquí automáticamente.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* 1. Asistencias */}
          {attendanceList.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 border-b border-school-border pb-3 mb-4">
                <ClipboardCheck className="h-5 w-5 text-school-success" />
                <h3 className="font-bold text-school-heading text-base">
                  Asistencias Registradas ({attendanceList.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {attendanceList.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-xl border border-school-border bg-school-background/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-school-heading">
                        {rec.student?.user?.name || `Estudiante #${rec.studentId}`}
                      </p>
                      <p className="text-school-muted">Curso #{rec.courseId}</p>
                    </div>
                    <Badge
                      variant={
                        rec.status === 'present'
                          ? 'success'
                          : rec.status === 'absent'
                          ? 'destructive'
                          : 'warning'
                      }
                    >
                      {rec.status === 'present'
                        ? 'Presente'
                        : rec.status === 'absent'
                        ? 'Ausente'
                        : rec.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 2. Actividades */}
          {activitiesList.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 border-b border-school-border pb-3 mb-4">
                <CheckSquare className="h-5 w-5 text-school-primary" />
                <h3 className="font-bold text-school-heading text-base">
                  Actividades ({activitiesList.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activitiesList.map((act) => (
                  <div
                    key={act.id}
                    className="p-4 rounded-xl border border-school-border bg-school-background/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{act.type}</Badge>
                      <span className="text-xs text-school-muted">Curso #{act.courseId}</span>
                    </div>
                    <p className="font-semibold text-school-heading text-sm">{act.title}</p>
                    <p className="text-xs text-school-muted">
                      Fecha límite: {new Date(act.dueDate).toLocaleDateString('es-ES')}
                    </p>
                    <div className="text-xs text-school-primary font-medium">
                      Entregas registradas: {act.submissionsCount ?? act.submissions?.length ?? 0}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 3. Observaciones */}
          {observationsList.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 border-b border-school-border pb-3 mb-4">
                <MessageSquare className="h-5 w-5 text-school-violet" />
                <h3 className="font-bold text-school-heading text-base">
                  Observaciones Registradas ({observationsList.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {observationsList.map((obs) => (
                  <div
                    key={obs.id}
                    className="p-4 rounded-xl border border-school-border bg-school-background/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-school-heading text-sm">
                        {obs.student?.user?.name || `Estudiante #${obs.studentId}`}
                      </p>
                      <Badge
                        variant={
                          obs.type === 'ACADEMIC'
                            ? 'success'
                            : obs.type === 'BEHAVIORAL'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {obs.type}
                      </Badge>
                    </div>
                    <p className="font-medium text-xs text-school-heading">{obs.title}</p>
                    <p className="text-xs text-school-muted bg-white p-2.5 rounded-lg border border-school-border/50">
                      {obs.description}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 4. Comunicados */}
          {announcementsList.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 border-b border-school-border pb-3 mb-4">
                <Megaphone className="h-5 w-5 text-school-warning" />
                <h3 className="font-bold text-school-heading text-base">
                  Comunicados Publicados ({announcementsList.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {announcementsList.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-4 rounded-xl border border-school-border bg-school-background/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-school-heading text-sm">{ann.title}</p>
                      <Badge variant="outline">{ann.priority || 'Normal'}</Badge>
                    </div>
                    <p className="text-xs text-school-muted">{ann.content}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Reporte Imprimible Idéntico al Dataset Filtrado */}
      <div id="printable-pdf-report" className="hidden">
        <div className="border-b-2 border-slate-800 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-slate-900 uppercase">
            Bitácora Pedagógica Diaria - Reporte Oficial
          </h1>
          <p className="text-sm font-semibold text-slate-600">Docente: {teacherName}</p>
          <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
            <span>Fecha del Reporte: <strong>{selectedDate}</strong></span>
            <span>Sistema Institucional San Andrés / NICE KIDS</span>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-800 border-b pb-1 mb-2">Resumen Ejecutivo</h2>
            <ul className="text-xs space-y-1 text-slate-700">
              <li>• Asistencias Registradas: <strong>{attendanceList.length}</strong></li>
              <li>• Actividades: <strong>{activitiesList.length}</strong></li>
              <li>• Observaciones: <strong>{observationsList.length}</strong></li>
              <li>• Comunicados: <strong>{announcementsList.length}</strong></li>
            </ul>
          </div>

          {attendanceList.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-slate-800 border-b pb-1 mb-2">Detalle de Asistencias</h2>
              <table className="w-full text-xs text-left border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border p-2 font-bold">Estudiante</th>
                    <th className="border p-2 font-bold">Curso</th>
                    <th className="border p-2 font-bold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceList.map((a) => (
                    <tr key={a.id}>
                      <td className="border p-2">{a.student?.user?.name || `Estudiante #${a.studentId}`}</td>
                      <td className="border p-2">Curso #{a.courseId}</td>
                      <td className="border p-2 uppercase font-bold">{a.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activitiesList.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-slate-800 border-b pb-1 mb-2">Actividades Pedagógicas</h2>
              <ul className="text-xs space-y-1.5 text-slate-700">
                {activitiesList.map((act) => (
                  <li key={act.id} className="border-b border-slate-200 pb-1">
                    <strong>{act.title}</strong> ({act.type}) - Límite: {new Date(act.dueDate).toLocaleDateString('es-ES')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {observationsList.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-slate-800 border-b pb-1 mb-2">Observaciones Registradas</h2>
              <ul className="text-xs space-y-1.5 text-slate-700">
                {observationsList.map((obs) => (
                  <li key={obs.id} className="border-b border-slate-200 pb-1">
                    <strong>{obs.title}</strong> ({obs.type}) - Estudiante: {obs.student?.user?.name || obs.studentId}
                    <p className="text-slate-600 italic">{obs.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-12 text-center text-xs text-slate-400">
            ________________________________________<br />
            Firma del Docente: {teacherName}
          </div>
        </div>
      </div>
    </div>
  );
}
