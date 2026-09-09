import { DatePicker } from '@/components/ui/date-picker';
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
  const todayStr = useMemo(() => getTodayStr(), []);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [date, setDate] = useState<string>(todayStr);
  const [isSaving, setIsSaving] = useState(false);

  // Derive initial or selected course ID directly so queries start on the very first render pass
  const effectiveCourseId = selectedCourseId || (courses && courses.length > 0 ? String(courses[0].id) : '');

  useEffect(() => {
    if (courses && courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(String(courses[0].id));
    }
  }, [courses, selectedCourseId]);

  const courseIdNum = effectiveCourseId ? Number(effectiveCourseId) : null;
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

  const isToday = date === todayStr;
  const isPast = date < todayStr;
  const isReadOnly = !isToday;

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
    if (isReadOnly) {
      toast.error('Modo consulta: Solo se puede modificar y registrar asistencia en la fecha de hoy.');
      return;
    }
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const setNotes = (studentId: number, notes: string) => {
    if (isReadOnly) {
      toast.error('Modo consulta: Solo se pueden ingresar notas en la fecha de hoy.');
      return;
    }
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

    if (!isToday) {
      toast.error('Acción restringida: La asistencia solo puede guardarse en la fecha actual.');
      return;
    }

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
        <Button
          onClick={handleSave}
          disabled={isSaving || isLoading || students.length === 0 || isReadOnly}
          className="gap-2"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? 'Guardando...' : isReadOnly ? 'Modo Consulta' : 'Guardar Asistencia'}
        </Button>
      </PageHeader>

      {/* Banner de Modo Consulta Histórica si regresa al pasado */}
      {isPast && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <span>
              <strong>Modo de Consulta Histórica:</strong> Estás visualizando la asistencia del día <strong>{date}</strong> en modo solo lectura. Las ediciones solo se permiten para el día de hoy.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDate(todayStr)}
            className="border-amber-300 text-amber-900 hover:bg-amber-100 shrink-0 font-semibold"
          >
            Volver al Día de Hoy
          </Button>
        </div>
      )}

      {/* Selectors */}
      <Card className="nk-filter p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="space-y-1.5 flex-1">
            <Label htmlFor="course-select">Curso / Materia *</Label>
            <Select value={effectiveCourseId} onValueChange={setSelectedCourseId}>
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
              <CalendarIcon className="h-3.5 w-3.5 text-ink-turquoise" /> Fecha *
            </Label>
            <DatePicker
              id="attendance-date"
              type="date"
              value={date}
              max={todayStr}
              onValueChange={(value) => {
                if (value > todayStr) {
                  toast.error('No es posible seleccionar fechas futuras para la asistencia.');
                  setDate(todayStr);
                } else {
                  setDate(value);
                }
              }}
              className="bg-white font-medium"
            />
          </div>
        </div>
      </Card>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card accent="lime" className="nk-metric p-5 text-center">
          <CheckCircle2 className="h-5 w-5 mx-auto text-school-success mb-1" />
          <p className="text-2xl font-bold text-school-heading">{counts.present}</p>
          <p className="text-sm text-school-body font-medium">Presentes</p>
        </Card>
        <Card accent="pink" className="nk-metric p-5 text-center">
          <XCircle className="h-5 w-5 mx-auto text-school-error mb-1" />
          <p className="text-2xl font-bold text-school-error">{counts.absent}</p>
          <p className="text-sm text-school-body font-medium">Ausentes</p>
        </Card>
        <Card accent="yellow" className="nk-metric p-5 text-center">
          <Clock className="h-5 w-5 mx-auto text-school-warning mb-1" />
          <p className="text-2xl font-bold text-school-warning">{counts.late}</p>
          <p className="text-sm text-school-body font-medium">Atrasos</p>
        </Card>
        <Card accent="blue" className="nk-metric p-5 text-center">
          <AlertCircle className="h-5 w-5 mx-auto text-school-blue mb-1" />
          <p className="text-2xl font-bold text-school-blue">{counts.excused}</p>
          <p className="text-sm text-school-body font-medium">Justificados</p>
        </Card>
      </div>

      {/* Student List */}
      <Card className="shadow-xs overflow-hidden">
        <div className="p-4 border-b border-school-border/70 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-school-heading">
              {activeCourse ? activeCourse.name : 'Listado de Alumnos'}
            </h3>
            <p className="text-xs text-school-muted-readable">
              {students.length} estudiantes matriculados en este curso
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-ink-turquoise mb-3" />
            <p className="text-school-muted-readable text-sm font-medium">Cargando lista de estudiantes y asistencias del servidor...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-school-muted-readable">
            <ClipboardCheck className="h-10 w-10 mx-auto text-school-muted-readable mb-2" />
            <p className="font-semibold text-school-heading text-base">No hay alumnos en este curso</p>
            <p className="text-xs text-school-muted-readable mt-1">Selecciona otro curso para gestionar la asistencia.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="nk-table nk-attendance-table w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-school-border bg-school-background text-school-muted-readable uppercase text-xs tracking-wider">
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
                        <span className="flex items-center gap-3"><span aria-hidden="true" className="nk-icon accent-blue font-bold">{st.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('')}</span>{st.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-school-muted-readable">
                        {st.studentCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <Button
                            type="button"
                            size="sm"
                            disabled={isReadOnly}
                            variant={state.status === 'PRESENT' ? 'default' : 'outline'}
                            aria-pressed={state.status === 'PRESENT'}
                            aria-label={`Presente: ${st.name}`}
                            onClick={() => setStatus(st.studentId, 'PRESENT')}
                            className="nk-attendance-status accent-lime min-h-11 text-sm disabled:opacity-60"
                          >
                            Presente
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={isReadOnly}
                            variant={state.status === 'ABSENT' ? 'destructive' : 'outline'}
                            aria-pressed={state.status === 'ABSENT'}
                            aria-label={`Ausente: ${st.name}`}
                            onClick={() => setStatus(st.studentId, 'ABSENT')}
                            className="nk-attendance-status accent-pink min-h-11 text-sm disabled:opacity-60"
                          >
                            Ausente
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={isReadOnly}
                            variant={state.status === 'LATE' ? 'secondary' : 'outline'}
                            aria-pressed={state.status === 'LATE'}
                            aria-label={`Atraso: ${st.name}`}
                            onClick={() => setStatus(st.studentId, 'LATE')}
                            className="nk-attendance-status accent-yellow min-h-11 text-sm disabled:opacity-60"
                          >
                            Atraso
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={isReadOnly}
                            variant={state.status === 'EXCUSED' ? 'secondary' : 'outline'}
                            aria-pressed={state.status === 'EXCUSED'}
                            aria-label={`Justificado: ${st.name}`}
                            onClick={() => setStatus(st.studentId, 'EXCUSED')}
                            className="nk-attendance-status accent-blue min-h-11 text-sm disabled:opacity-60"
                          >
                            Justificado
                          </Button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Input
                          placeholder={isReadOnly ? 'Sin observaciones' : 'Nota o motivo...'}
                          value={state.notes}
                          disabled={isReadOnly}
                          onChange={(e) => setNotes(st.studentId, e.target.value)}
                          className="min-w-40 text-sm disabled:bg-school-subtle/50 disabled:cursor-not-allowed" aria-label={`Observación para ${st.name}`}
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
