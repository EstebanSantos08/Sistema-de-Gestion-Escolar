import { useState, useEffect } from 'react';
import { ClipboardCheck, CheckCircle2, XCircle, Clock, AlertCircle, Save, Calendar as CalendarIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMyCourses } from '@/hooks/useCourses';
import { useCourseStudents } from '@/hooks/useEnrollments';
import { teacherModuleService } from '@/services/teacherModule.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AttendanceStatus, AttendanceRecord } from '@/types';

export default function AttendancePage() {
  const { data: courses, isLoading: loadingCourses } = useMyCourses();
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Set default course when loaded
  useEffect(() => {
    if (courses && courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(String(courses[0].id));
    }
  }, [courses, selectedCourseId]);

  const courseIdNum = selectedCourseId ? Number(selectedCourseId) : null;
  const { data: courseData, isLoading: loadingStudents } = useCourseStudents(courseIdNum);

  const activeCourse = courses?.find((c) => c.id === courseIdNum);
  const students = courseData?.students ?? [];

  // Local state for current attendance sheet
  const [attendanceState, setAttendanceState] = useState<Record<number, { status: AttendanceStatus; notes: string }>>({});

  // Load existing records from service whenever course or date changes
  useEffect(() => {
    if (!courseIdNum || !date) return;
    const existing = teacherModuleService.getAttendance(courseIdNum, date);
    const stateMap: Record<number, { status: AttendanceStatus; notes: string }> = {};

    students.forEach((s) => {
      const match = existing.find((r) => r.studentId === s.studentId);
      stateMap[s.studentId] = {
        status: match ? match.status : 'present', // Default to present
        notes: match?.notes ?? '',
      };
    });
    setAttendanceState(stateMap);
  }, [courseIdNum, date, students]);

  const setStatus = (studentId: number, status: AttendanceStatus) => {
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

  const handleSave = () => {
    if (!courseIdNum || students.length === 0) return;

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
    toast.success(`Asistencia guardada exitosamente (${students.length} estudiantes)`);
  };

  // Metrics calculations
  const total = students.length;
  const counts = Object.values(attendanceState).reduce(
    (acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    },
    { present: 0, absent: 0, late: 0, excused: 0 } as Record<AttendanceStatus, number>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registro de Asistencia"
        description="Toma de asistencia diaria por materia y registro de observaciones"
      >
        <Button onClick={handleSave} disabled={loadingStudents || total === 0} className="shadow-sm">
          <Save className="mr-2 h-4 w-4" />
          Guardar Asistencia
        </Button>
      </PageHeader>

      {/* Selectors Bar wrapped in high-contrast Card */}
      <Card className="bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-white/60">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Materia / Curso
            </label>
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger className="bg-white border-slate-200 text-slate-800 font-bold rounded-xl shadow-xs">
                <SelectValue placeholder="Seleccionar Curso" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 rounded-xl shadow-2xl">
                {courses?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Fecha de Registro
            </label>
            <div className="relative">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="pr-8 bg-white border-slate-200 text-slate-800 font-bold rounded-xl shadow-xs" />
              <CalendarIcon className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Attendance Summary Pill */}
          <div className="flex items-center justify-end pt-5 sm:pt-0">
            <div className="flex items-center gap-3 rounded-xl border border-teal-100 bg-teal-50/60 p-3 shadow-inner">

            <div className="flex items-center gap-1 text-xs text-green-700 font-semibold">
              <CheckCircle2 className="h-4 w-4" /> {counts.present} Pres.
            </div>
            <div className="flex items-center gap-1 text-xs text-red-600 font-semibold">
              <XCircle className="h-4 w-4" /> {counts.absent} Aus.
            </div>
            <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
              <Clock className="h-4 w-4" /> {counts.late} Atras.
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-600 font-semibold">
              <AlertCircle className="h-4 w-4" /> {counts.excused} Just.
            </div>
          </div>
          </div>
        </div>
      </Card>

      {/* Attendance Table */}

      <Card>
        <CardContent className="p-0">
          {loadingCourses || loadingStudents ? (
            <div className="p-8 text-center text-muted-foreground">Cargando lista de estudiantes...</div>
          ) : total === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No hay estudiantes en este curso.</div>
          ) : (
            <div className="divide-y">
              {students.map((s, idx) => {
                const currentStatus = attendanceState[s.studentId]?.status ?? 'present';
                const currentNotes = attendanceState[s.studentId]?.notes ?? '';

                return (
                  <div
                    key={s.studentId}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-accent/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <span className="text-xs text-muted-foreground font-medium w-5">{idx + 1}.</span>
                      <div>
                        <p className="font-semibold text-sm">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.studentCode}</p>
                      </div>
                    </div>

                    {/* Status Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Button
                        type="button"
                        size="sm"
                        variant={currentStatus === 'present' ? 'default' : 'outline'}
                        className={currentStatus === 'present' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                        onClick={() => setStatus(s.studentId, 'present')}
                      >
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Presente
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant={currentStatus === 'absent' ? 'default' : 'outline'}
                        className={currentStatus === 'absent' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                        onClick={() => setStatus(s.studentId, 'absent')}
                      >
                        <XCircle className="mr-1 h-3.5 w-3.5" /> Ausente
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant={currentStatus === 'late' ? 'default' : 'outline'}
                        className={currentStatus === 'late' ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}
                        onClick={() => setStatus(s.studentId, 'late')}
                      >
                        <Clock className="mr-1 h-3.5 w-3.5" /> Atraso
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant={currentStatus === 'excused' ? 'default' : 'outline'}
                        className={currentStatus === 'excused' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
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
