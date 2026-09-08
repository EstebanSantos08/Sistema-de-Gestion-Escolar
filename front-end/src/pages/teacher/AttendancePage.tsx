import { useState, useEffect, useMemo } from 'react';
import { ClipboardCheck, CheckCircle2, XCircle, Clock, AlertCircle, Save, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useMyCourses } from '@/hooks/useCourses';
import { useCourseStudents } from '@/hooks/useEnrollments';
import { attendanceService, type AttendanceBatchItem } from '@/services/attendance.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BackendAttendanceStatus } from '@/types';

function getTodayStr(): string {
  const d = new Date();
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${day}`;
}

export default function AttendancePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: courses, isLoading: loadingCourses } = useMyCourses();
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const todayStr = useMemo(() => getTodayStr(), []);
  const [date, setDate] = useState<string>(todayStr);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (courses && courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(String(courses[0].id));
    }
  }, [courses, selectedCourseId]);

  const courseIdNum = selectedCourseId ? Number(selectedCourseId) : null;
  const { data: courseData, isLoading: loadingStudents } = useCourseStudents(courseIdNum);

  const activeCourse = courses?.find((c) => c.id === courseIdNum);
  const students = useMemo(() => courseData?.students ?? [], [courseData?.students]);

  // Read real attendance from /api/attendance
  const { data: existingAttendance = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ['attendance', user?.id, courseIdNum, date],
    queryFn: () =>
      courseIdNum
        ? attendanceService.list({
            courseId: courseIdNum,
            date,
          })
        : Promise.resolve([]),
    enabled: !!user && !!courseIdNum,
  });

  const [attendanceState, setAttendanceState] = useState<Record<number, { status: BackendAttendanceStatus; notes: string }>>({});

  useEffect(() => {
    if (!courseIdNum || !date || students.length === 0) return;
    const stateMap: Record<number, { status: BackendAttendanceStatus; notes: string }> = {};

    students.forEach((s) => {
      const match = existingAttendance.find((r) => r.studentId === s.studentId);
      stateMap[s.studentId] = {
        status: match?.status ?? 'PRESENT',
        notes: match?.remarks ?? '',
      };
    });
    setAttendanceState(stateMap);
  }, [courseIdNum, date, students, existingAttendance]);

  const setStatus = (studentId: number, status: BackendAttendanceStatus) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const setNotes = (studentId: number, notes: string) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes,
      },
    }));
  };

  const handleSave = async () => {
    if (!courseIdNum || students.length === 0) return;

    try {
      setIsSaving(true);
      const batch: AttendanceBatchItem[] = students.map((s) => ({
        studentId: s.studentId,
        status: attendanceState[s.studentId]?.status ?? 'PRESENT',
        remarks: attendanceState[s.studentId]?.notes || null,
      }));

      await attendanceService.saveBatch({
        courseId: courseIdNum,
        date,
        attendance: batch,
      });

      toast.success('Asistencia guardada exitosamente en el servidor');
      qc.invalidateQueries({ queryKey: ['attendance', user?.id, courseIdNum, date] });
      qc.invalidateQueries({ queryKey: ['daily-summary'] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar la asistencia';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const counts = useMemo(() => {
    const list = Object.values(attendanceState);
    return {
      present: list.filter((a) => a.status === 'PRESENT').length,
      absent: list.filter((a) => a.status === 'ABSENT').length,
      late: list.filter((a) => a.status === 'LATE').length,
      excused: list.filter((a) => a.status === 'EXCUSED').length,
    };
  }, [attendanceState]);

  const isLoading = loadingCourses || loadingStudents || loadingAttendance;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Docente"
        title="Control de Asistencia"
        description="Pase de lista oficial por curso y jornada académica — Datos canónicos del servidor"
      >
        <Button onClick={handleSave} disabled={isSaving || isLoading || students.length === 0} className="gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? 'Guardando...' : 'Guardar Asistencia'}
        </Button>
      </PageHeader>

      {/* Selectors */}
      <Card className="p-4 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="space-y-1.5 flex-1">
            <Label htmlFor="course-select">Curso / Materia *</Label>
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger id="course-select">
                <SelectValue placeholder="Selecciona un curso" />
              </SelectTrigger>
              <SelectContent>
                {courses?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 w-full sm:w-60">
            <Label htmlFor="attendance-date" className="flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5 text-school-primary" /> Fecha *
            </Label>
            <Input
              id="attendance-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-white"
            />
          </div>
        </div>
      </Card>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4 text-center">
          <CheckCircle2 className="h-5 w-5 mx-auto text-school-success mb-1" />
          <p className="text-2xl font-bold text-school-heading">{counts.present}</p>
          <p className="text-xs text-school-muted uppercase font-medium tracking-wider">Presentes</p>
        </Card>
        <Card className="p-4 text-center">
          <XCircle className="h-5 w-5 mx-auto text-school-error mb-1" />
          <p className="text-2xl font-bold text-school-error">{counts.absent}</p>
          <p className="text-xs text-school-muted uppercase font-medium tracking-wider">Ausentes</p>
        </Card>
        <Card className="p-4 text-center">
          <Clock className="h-5 w-5 mx-auto text-school-warning mb-1" />
          <p className="text-2xl font-bold text-school-warning">{counts.late}</p>
          <p className="text-xs text-school-muted uppercase font-medium tracking-wider">Atrasos</p>
        </Card>
        <Card className="p-4 text-center">
          <AlertCircle className="h-5 w-5 mx-auto text-school-blue mb-1" />
          <p className="text-2xl font-bold text-school-blue">{counts.excused}</p>
          <p className="text-xs text-school-muted uppercase font-medium tracking-wider">Justificados</p>
        </Card>
      </div>

      {/* Student List */}
      <Card className="shadow-xs overflow-hidden">
        <div className="p-4 border-b border-school-border/70 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-school-heading">
              {activeCourse ? activeCourse.name : 'Listado de Alumnos'}
            </h3>
            <p className="text-xs text-school-muted">
              {students.length} estudiantes matriculados en este curso
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-school-primary mb-3" />
            <p className="text-school-muted text-sm font-medium">Cargando lista de estudiantes y asistencias del servidor...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-school-muted">
            <ClipboardCheck className="h-10 w-10 mx-auto text-school-muted mb-2" />
            <p className="font-semibold text-school-heading text-base">No hay alumnos en este curso</p>
            <p className="text-xs text-school-muted mt-1">Selecciona otro curso para gestionar la asistencia.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-school-border bg-school-background text-school-muted uppercase text-xs tracking-wider">
                  <th className="py-3 px-4">Estudiante</th>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4 text-center">Estado de Asistencia</th>
                  <th className="py-3 px-4">Observación / Justificación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-school-border/60">
                {students.map((st) => {
                  const state = attendanceState[st.studentId] ?? { status: 'PRESENT', notes: '' };

                  return (
                    <tr key={st.studentId} className="hover:bg-school-subtle/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-school-heading">
                        {st.name}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-school-muted">
                        {st.studentCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <Button
                            type="button"
                            size="sm"
                            variant={state.status === 'PRESENT' ? 'default' : 'outline'}
                            onClick={() => setStatus(st.studentId, 'PRESENT')}
                            className={`h-8 text-xs ${
                              state.status === 'PRESENT' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                            }`}
                          >
                            Presente
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={state.status === 'ABSENT' ? 'destructive' : 'outline'}
                            onClick={() => setStatus(st.studentId, 'ABSENT')}
                            className="h-8 text-xs"
                          >
                            Ausente
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={state.status === 'LATE' ? 'secondary' : 'outline'}
                            onClick={() => setStatus(st.studentId, 'LATE')}
                            className={`h-8 text-xs ${
                              state.status === 'LATE' ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''
                            }`}
                          >
                            Atraso
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={state.status === 'EXCUSED' ? 'secondary' : 'outline'}
                            onClick={() => setStatus(st.studentId, 'EXCUSED')}
                            className={`h-8 text-xs ${
                              state.status === 'EXCUSED' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''
                            }`}
                          >
                            Justificado
                          </Button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Input
                          placeholder="Nota o motivo..."
                          value={state.notes}
                          onChange={(e) => setNotes(st.studentId, e.target.value)}
                          className="h-8 text-xs bg-white"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
