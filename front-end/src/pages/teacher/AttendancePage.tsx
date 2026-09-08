import { useState, useEffect, useMemo } from 'react';
import { ClipboardCheck, CheckCircle2, XCircle, Clock, AlertCircle, Save, Calendar as CalendarIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMyCourses } from '@/hooks/useCourses';
import { useCourseStudents } from '@/hooks/useEnrollments';
import { teacherModuleService, getTodayStr } from '@/services/teacherModule.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AttendanceStatus, AttendanceRecord } from '@/types';

export default function AttendancePage() {
  const { data: courses, isLoading: loadingCourses } = useMyCourses();
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const todayStr = useMemo(() => getTodayStr(), []);
  const [date, setDate] = useState<string>(todayStr);

  useEffect(() => {
    if (courses && courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(String(courses[0].id));
    }
  }, [courses, selectedCourseId]);

  const courseIdNum = selectedCourseId ? Number(selectedCourseId) : null;
  const { data: courseData, isLoading: loadingStudents } = useCourseStudents(courseIdNum);

  const activeCourse = courses?.find((c) => c.id === courseIdNum);
  const students = useMemo(() => courseData?.students ?? [], [courseData?.students]);

  const [attendanceState, setAttendanceState] = useState<Record<number, { status: AttendanceStatus; notes: string }>>({});

  useEffect(() => {
    if (!courseIdNum || !date || students.length === 0) return;
    const existing = teacherModuleService.getAttendance(courseIdNum, date);
    const stateMap: Record<number, { status: AttendanceStatus; notes: string }> = {};

    students.forEach((s) => {
      const match = existing.find((r) => r.studentId === s.studentId);
      stateMap[s.studentId] = {
        status: match ? match.status : 'present',
        notes: match?.notes ?? '',
      };
    });
    setAttendanceState(stateMap);
  }, [courseIdNum, date, students]);

  const setStatus = (studentId: number, status: AttendanceStatus) => {
    if (date !== todayStr) {
      toast.error('Acción restringida: Solo se puede tomar asistencia en la fecha de hoy.');
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
    if (date !== todayStr) {
      toast.error('Acción restringida: Solo se pueden ingresar notas en la fecha de hoy.');
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

  const handleSave = () => {
    if (!courseIdNum || students.length === 0) return;

    if (date !== todayStr) {
      toast.error('Solo se puede guardar la asistencia en el día de hoy.');
      return;
    }

    const payload: Omit<AttendanceRecord, 'id'>[] = students.map((s) => ({
      courseId: courseIdNum,
      courseName: activeCourse?.name,
      studentId: s.studentId,
      studentName: s.name,
      studentCode: s.studentCode,
      date,
      status: attendanceState[s.studentId]?.status ?? 'present',
      notes: attendanceState[s.studentId]?.notes ?? '',
    }));

    teacherModuleService.saveAttendanceBatch(payload);
    toast.success('Asistencia guardada exitosamente');
  };

  const total = students.length;
  const counts = Object.values(attendanceState).reduce(
    (acc, cur) => {
      acc[cur.status] = (acc[cur.status] || 0) + 1;
      return acc;
    },
    { present: 0, absent: 0, late: 0, excused: 0 } as Record<AttendanceStatus, number>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Docente"
        title="Control de Asistencia"
        description="Toma de asistencia diaria por aula y registro de justificaciones pedagógicas"
      >
        <Button
          onClick={handleSave}
          disabled={loadingStudents || total === 0 || date !== todayStr}
        >
          <Save className="mr-2 h-4 w-4" />
          {date !== todayStr ? 'Solo Lectura (Histórico)' : 'Guardar Asistencia'}
        </Button>
      </PageHeader>

      {/* Banner Informativo si la fecha no es HOY */}
      {date !== todayStr && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-700 shrink-0" />
            <span>
              <strong>Modo de Consulta Histórica:</strong> La fecha seleccionada ({date}) difiere de hoy ({todayStr}). Únicamente se puede registrar y guardar asistencia en el día actual.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDate(todayStr)}
            className="border-amber-300 text-amber-900 hover:bg-amber-100 shrink-0"
          >
            Volver al Día de Hoy
          </Button>
        </div>
      )}

      {/* Selectors Bar */}
      <Card className="p-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 items-end">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-school-heading">Materia / Aula</Label>
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar Curso" />
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

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-school-heading">Fecha de Registro</Label>
            <div className="relative">
              <Input
                type="date"
                value={date}
                max={todayStr}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val > todayStr) {
                    toast.error('No es posible seleccionar fechas futuras.');
                    setDate(todayStr);
                  } else {
                    setDate(val);
                  }
                }}
                className="pr-9"
              />
              <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-school-muted pointer-events-none" />
            </div>
          </div>

          {/* Attendance Summary Pill */}
          <div className="flex items-center sm:justify-end">
            <div className="flex items-center gap-3 rounded-xl border border-school-border bg-school-subtle/50 px-4 py-2.5 text-xs font-medium w-full sm:w-auto justify-between sm:justify-start">
              <span className="flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-school-success" /> {counts.present} Pres.
              </span>
              <span className="flex items-center gap-1.5 text-rose-800">
                <XCircle className="h-4 w-4 text-school-error" /> {counts.absent} Aus.
              </span>
              <span className="flex items-center gap-1.5 text-amber-800">
                <Clock className="h-4 w-4 text-school-warning" /> {counts.late} Atras.
              </span>
              <span className="flex items-center gap-1.5 text-sky-800">
                <AlertCircle className="h-4 w-4 text-school-blue" /> {counts.excused} Just.
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Attendance Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {loadingCourses || loadingStudents ? (
            <div className="p-10 text-center text-school-muted text-sm">Cargando lista de estudiantes...</div>
          ) : total === 0 ? (
            <div className="p-10 text-center text-school-muted text-sm">No hay estudiantes en este curso.</div>
          ) : (
            <div className="divide-y divide-school-border">
              {students.map((s, idx) => {
                const currentStatus = attendanceState[s.studentId]?.status ?? 'present';
                const currentNotes = attendanceState[s.studentId]?.notes ?? '';

                return (
                  <div
                    key={s.studentId}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-school-background/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <span className="text-xs text-school-muted font-medium w-5">{idx + 1}.</span>
                      <div>
                        <p className="font-semibold text-sm text-school-heading">{s.name}</p>
                        <p className="text-xs text-school-muted">{s.studentCode}</p>
                      </div>
                    </div>

                    {/* Status Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Button
                        type="button"
                        size="sm"
                        variant={currentStatus === 'present' ? 'default' : 'outline'}
                        className={currentStatus === 'present' ? 'bg-school-success hover:bg-emerald-700 text-white font-medium' : 'text-school-heading hover:bg-school-subtle'}
                        onClick={() => setStatus(s.studentId, 'present')}
                      >
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Presente
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant={currentStatus === 'absent' ? 'default' : 'outline'}
                        className={currentStatus === 'absent' ? 'bg-school-error hover:bg-rose-700 text-white font-medium' : 'text-school-heading hover:bg-school-subtle'}
                        onClick={() => setStatus(s.studentId, 'absent')}
                      >
                        <XCircle className="mr-1 h-3.5 w-3.5" /> Ausente
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant={currentStatus === 'late' ? 'default' : 'outline'}
                        className={currentStatus === 'late' ? 'bg-school-warning hover:bg-amber-600 text-white font-medium' : 'text-school-heading hover:bg-school-subtle'}
                        onClick={() => setStatus(s.studentId, 'late')}
                      >
                        <Clock className="mr-1 h-3.5 w-3.5" /> Atraso
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant={currentStatus === 'excused' ? 'default' : 'outline'}
                        className={currentStatus === 'excused' ? 'bg-school-blue hover:bg-sky-700 text-white font-medium' : 'text-school-heading hover:bg-school-subtle'}
                        onClick={() => setStatus(s.studentId, 'excused')}
                      >
                        <AlertCircle className="mr-1 h-3.5 w-3.5" /> Justificado
                      </Button>
                    </div>

                    {/* Notes Input */}
                    <div className="w-full sm:w-64">
                      <Input
                        placeholder="Observación opcional..."
                        value={currentNotes}
                        onChange={(e) => setNotes(s.studentId, e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
