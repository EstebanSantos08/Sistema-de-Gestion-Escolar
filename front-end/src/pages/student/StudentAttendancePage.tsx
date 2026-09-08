import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, CheckCircle2, XCircle, Clock, FileText, BarChart3, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useMyGrades } from '@/hooks/useStudents';
import { attendanceService } from '@/services/attendance.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { BackendAttendance } from '@/types';

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const [courseFilter, setCourseFilter] = useState<string>('all');

  const { data: myGradesData, isLoading: loadingCourses } = useMyGrades();
  const courses = useMemo(() => {
    if (!myGradesData?.courses) return [];
    return myGradesData.courses.map((c) => ({
      id: c.courseId,
      name: c.courseName,
    }));
  }, [myGradesData]);

  // Real institutional attendance from /api/attendance
  const { data: studentRecords = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ['attendance', user?.id, 'my-attendance'],
    queryFn: () => attendanceService.list(),
    enabled: !!user,
  });

  const filteredRecords = useMemo(() => {
    let records = studentRecords;
    if (courseFilter !== 'all') {
      records = records.filter((r) => r.courseId === Number(courseFilter));
    }
    return [...records].sort((a, b) => b.date.localeCompare(a.date));
  }, [studentRecords, courseFilter]);

  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const present = filteredRecords.filter((r) => r.status === 'PRESENT').length;
    const absent = filteredRecords.filter((r) => r.status === 'ABSENT').length;
    const late = filteredRecords.filter((r) => r.status === 'LATE').length;
    const excused = filteredRecords.filter((r) => r.status === 'EXCUSED').length;
    const pct = total > 0 ? ((present + excused) / total) * 100 : 100;
    return { total, present, absent, late, excused, pct };
  }, [filteredRecords]);

  const isLoading = loadingCourses || loadingAttendance;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <Badge variant="success">Presente</Badge>;
      case 'ABSENT':
        return <Badge variant="destructive">Ausente</Badge>;
      case 'LATE':
        return <Badge variant="warning">Atraso</Badge>;
      case 'EXCUSED':
        return <Badge variant="secondary">Justificado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
        description="Historial oficial de asistencias, atrasos y justificaciones por materia"
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

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
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

      {/* Records Table */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-school-primary mb-3" />
          <p className="text-school-muted font-medium">Cargando registros oficiales de asistencia...</p>
        </Card>
      ) : filteredRecords.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardCheck className="h-10 w-10 mx-auto text-school-success mb-2" />
          <p className="font-semibold text-school-heading text-base">Asistencia al día</p>
          <p className="text-sm text-school-muted mt-1">
            No se registran inasistencias en el sistema para las materias seleccionadas.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Materia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Observaciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((rec: BackendAttendance) => (
                <TableRow key={rec.id}>
                  <TableCell className="font-medium text-school-heading">{rec.date}</TableCell>
                  <TableCell>{rec.course?.name || `Curso #${rec.courseId}`}</TableCell>
                  <TableCell>{getStatusBadge(rec.status)}</TableCell>
                  <TableCell className="text-school-muted">{rec.remarks || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
