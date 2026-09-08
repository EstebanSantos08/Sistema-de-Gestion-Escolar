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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AttendanceStatus } from '@/types';

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const [courseFilter, setCourseFilter] = useState<string>('all');

  const allRecords = teacherModuleService.getAttendance();

  const studentRecords = useMemo(() => {
    return allRecords.filter((r) => {
      const nameMatch = user?.name && r.studentName.toLowerCase().includes(user.name.split(' ')[0].toLowerCase());
      return nameMatch || r.studentId === (user?.id ?? 0);
    });
  }, [allRecords, user]);

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
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="text-school-body font-medium hover:bg-school-subtle">
          <Link to="/estudiante">
            <ArrowLeft className="h-4 w-4 mr-1.5 text-school-primary" /> Volver al Dashboard
          </Link>
        </Button>
      </div>

      <PageHeader
        eyebrow="Estudiante"
        title="Registro de Asistencia"
        description="Historial detallado de asistencias, ausencias y justificaciones por materia"
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card className="p-4 text-center">
          <BarChart3 className="h-5 w-5 mx-auto text-school-primary mb-1" />
          <p className="text-2xl font-bold text-school-heading">{stats.pct.toFixed(0)}%</p>
          <p className="text-xs text-school-muted uppercase font-medium tracking-wider">Asistencia</p>
        </Card>
        <Card className="p-4 text-center">
          <CheckCircle2 className="h-5 w-5 mx-auto text-school-success mb-1" />
          <p className="text-2xl font-bold text-school-success">{stats.present}</p>
          <p className="text-xs text-school-muted uppercase font-medium tracking-wider">Presentes</p>
        </Card>
        <Card className="p-4 text-center">
          <XCircle className="h-5 w-5 mx-auto text-school-error mb-1" />
          <p className="text-2xl font-bold text-school-error">{stats.absent}</p>
          <p className="text-xs text-school-muted uppercase font-medium tracking-wider">Ausentes</p>
        </Card>
        <Card className="p-4 text-center">
          <Clock className="h-5 w-5 mx-auto text-school-warning mb-1" />
          <p className="text-2xl font-bold text-school-warning">{stats.late}</p>
          <p className="text-xs text-school-muted uppercase font-medium tracking-wider">Atrasos</p>
        </Card>
        <Card className="p-4 text-center">
          <FileText className="h-5 w-5 mx-auto text-school-blue mb-1" />
          <p className="text-2xl font-bold text-school-blue">{stats.excused}</p>
          <p className="text-xs text-school-muted uppercase font-medium tracking-wider">Justificados</p>
        </Card>
      </div>

      {/* Filter */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-school-muted shrink-0" />
          <span className="text-sm font-medium text-school-heading shrink-0">Filtrar por materia:</span>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Todas las materias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las materias</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Attendance Table */}
      {filteredRecords.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardCheck className="h-10 w-10 mx-auto text-school-muted mb-2" />
          <p className="font-semibold text-school-heading text-base">No hay registros de asistencia disponibles</p>
          <p className="text-sm text-school-muted mt-1">Tu docente registrará aquí las asistencias del período lectivo.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-school-border/70 pb-3">
            <CardTitle className="text-base font-semibold text-school-heading flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-school-primary" />
              Historial de Asistencia ({filteredRecords.length} registros)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-school-background">
                  <TableRow>
                    <TableHead className="font-semibold text-school-heading">Fecha</TableHead>
                    <TableHead className="font-semibold text-school-heading">Materia</TableHead>
                    <TableHead className="font-semibold text-school-heading">Estado</TableHead>
                    <TableHead className="font-semibold text-school-heading">Observaciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-school-border">
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-school-background/40">
                      <td className="px-5 py-3 font-semibold text-school-heading text-sm">{record.date}</td>
                      <td className="px-5 py-3 text-school-body text-sm">{record.courseName ?? `Curso ${record.courseId}`}</td>
                      <td className="px-5 py-3">
                        <Badge
                          variant={
                            record.status === 'present' ? 'success' :
                            record.status === 'absent' ? 'destructive' :
                            record.status === 'late' ? 'warning' : 'secondary'
                          }
                        >
                          {record.status === 'present' ? 'Presente' :
                           record.status === 'absent' ? 'Ausente' :
                           record.status === 'late' ? 'Atraso' : 'Justificado'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-school-muted text-sm max-w-[240px] truncate">
                        {record.notes || '—'}
                      </td>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
