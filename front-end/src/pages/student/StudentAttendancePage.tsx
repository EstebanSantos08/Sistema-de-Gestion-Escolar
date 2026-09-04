import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, CheckCircle2, XCircle, Clock, FileText, CalendarDays, Filter, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { teacherModuleService } from '@/services/teacherModule.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AttendanceStatus } from '@/types';

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  present: { label: 'Presente', icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  absent: { label: 'Ausente', icon: <XCircle className="h-3.5 w-3.5" />, color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
  late: { label: 'Atraso', icon: <Clock className="h-3.5 w-3.5" />, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  excused: { label: 'Justificado', icon: <FileText className="h-3.5 w-3.5" />, color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200' },
};

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const [courseFilter, setCourseFilter] = useState<string>('all');

  // Get all attendance records and filter by the logged-in student
  const allRecords = teacherModuleService.getAttendance();
  // The studentId in attendance matches user.id for seed data (student users 4,5,6 → studentIds 1,2,3)
  // We filter by studentName matching user.name or by studentId matching some heuristic
  const studentRecords = useMemo(() => {
    return allRecords.filter((r) => {
      const nameMatch = user?.name && r.studentName.toLowerCase().includes(user.name.split(' ')[0].toLowerCase());
      return nameMatch || r.studentId === (user?.id ?? 0);
    });
  }, [allRecords, user]);

  // Unique courses from the student's records
  const courses = useMemo(() => {
    const map = new Map<number, string>();
    studentRecords.forEach((r) => {
      if (r.courseName) map.set(r.courseId, r.courseName);
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [studentRecords]);

  const filteredRecords = useMemo(() => {
    let records = studentRecords;
    if (courseFilter !== 'all') {
      records = records.filter((r) => r.courseId === Number(courseFilter));
    }
    return records.sort((a, b) => b.date.localeCompare(a.date));
  }, [studentRecords, courseFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const present = filteredRecords.filter((r) => r.status === 'present').length;
    const absent = filteredRecords.filter((r) => r.status === 'absent').length;
    const late = filteredRecords.filter((r) => r.status === 'late').length;
    const excused = filteredRecords.filter((r) => r.status === 'excused').length;
    const pct = total > 0 ? ((present + excused) / total * 100) : 0;
    return { total, present, absent, late, excused, pct };
  }, [filteredRecords]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mi Asistencia"
        description="Consulta tu historial de asistencia en cada materia"
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-white/60 overflow-hidden">
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-5 w-5 mx-auto text-[#008BC1] mb-1" />
            <p className="text-2xl font-black text-slate-800">{stats.pct.toFixed(0)}%</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Asistencia</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/80 backdrop-blur-md rounded-2xl shadow-lg border border-emerald-100 overflow-hidden">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
            <p className="text-2xl font-black text-emerald-700">{stats.present}</p>
            <p className="text-[10px] font-bold text-emerald-500 uppercase">Presentes</p>
          </CardContent>
        </Card>
        <Card className="bg-rose-50/80 backdrop-blur-md rounded-2xl shadow-lg border border-rose-100 overflow-hidden">
          <CardContent className="p-4 text-center">
            <XCircle className="h-5 w-5 mx-auto text-rose-600 mb-1" />
            <p className="text-2xl font-black text-rose-700">{stats.absent}</p>
            <p className="text-[10px] font-bold text-rose-500 uppercase">Ausentes</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/80 backdrop-blur-md rounded-2xl shadow-lg border border-amber-100 overflow-hidden">
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto text-amber-600 mb-1" />
            <p className="text-2xl font-black text-amber-700">{stats.late}</p>
            <p className="text-[10px] font-bold text-amber-500 uppercase">Atrasos</p>
          </CardContent>
        </Card>
        <Card className="bg-sky-50/80 backdrop-blur-md rounded-2xl shadow-lg border border-sky-100 overflow-hidden">
          <CardContent className="p-4 text-center">
            <FileText className="h-5 w-5 mx-auto text-sky-600 mb-1" />
            <p className="text-2xl font-black text-sky-700">{stats.excused}</p>
            <p className="text-[10px] font-bold text-sky-500 uppercase">Justificados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-slate-400" />
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-60 rounded-xl border-slate-200 bg-white font-bold text-xs">
            <SelectValue placeholder="Filtrar por curso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los cursos</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Attendance Table */}
      {filteredRecords.length === 0 ? (
        <Card className="p-8 text-center bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200">
          <ClipboardCheck className="h-10 w-10 mx-auto text-slate-300 mb-2" />
          <p className="font-extrabold text-slate-600 text-sm">No hay registros de asistencia disponibles</p>
          <p className="text-xs text-slate-400 mt-1">Tu docente aún no ha registrado asistencia o no tienes registros con este filtro.</p>
        </Card>
      ) : (
        <Card className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3">
            <CardTitle className="text-sm font-black text-slate-800 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#008BC1]" />
              Historial de Asistencia ({filteredRecords.length} registros)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-3 font-black text-slate-500 uppercase tracking-wider">Fecha</th>
                    <th className="text-left px-4 py-3 font-black text-slate-500 uppercase tracking-wider">Curso</th>
                    <th className="text-left px-4 py-3 font-black text-slate-500 uppercase tracking-wider">Estado</th>
                    <th className="text-left px-4 py-3 font-black text-slate-500 uppercase tracking-wider">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredRecords.map((record) => {
                    const cfg = STATUS_CONFIG[record.status];
                    return (
                      <tr key={record.id} className="hover:bg-sky-50/30 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-700">{record.date}</td>
                        <td className="px-4 py-3 font-semibold text-slate-600">{record.courseName ?? `Curso ${record.courseId}`}</td>
                        <td className="px-4 py-3">
                          <Badge className={`${cfg.bg} ${cfg.color} border font-bold text-[10px] gap-1`}>
                            {cfg.icon}
                            {cfg.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-medium max-w-[200px] truncate">
                          {record.notes || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-start">
        <Button asChild variant="ghost" size="sm" className="text-slate-600 font-bold hover:bg-slate-100 rounded-xl">
          <Link to="/estudiante">
            <ArrowLeft className="h-4 w-4 mr-1.5 text-[#008BC1]" /> Volver al Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
