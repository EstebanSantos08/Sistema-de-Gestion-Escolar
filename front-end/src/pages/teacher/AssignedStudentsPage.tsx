import { useState } from 'react';
import { Search, UserCheck, Phone, MapPin, Calendar, Mail, ShieldAlert, BookOpen } from 'lucide-react';
import { useMyCourses } from '@/hooks/useCourses';
import { useCourseStudents } from '@/hooks/useEnrollments';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { CourseGradeRow } from '@/types';

import { Card } from '@/components/ui/card';

export default function AssignedStudentsPage() {
  const { data: courses, isLoading: loadingCourses } = useMyCourses();
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStudent, setActiveStudent] = useState<CourseGradeRow | null>(null);

  // If a specific course is selected, fetch its students; if 'all', fetch for the first course or iterate
  const courseIdNum = selectedCourseId !== 'all' ? Number(selectedCourseId) : (courses?.[0]?.id ?? null);
  const { data: courseData, isLoading: loadingStudents } = useCourseStudents(courseIdNum);

  const studentsList: CourseGradeRow[] = courseData?.students ?? [];

  const filteredStudents = studentsList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const columns: Column<CourseGradeRow>[] = [
    {
      header: 'Estudiante',
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 font-bold text-[#008BC1] border border-teal-100 shadow-inner">
            {(s.name || 'Estudiante').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-extrabold text-slate-800">{s.name}</p>
            <p className="text-xs text-slate-500 font-medium">{s.studentCode}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Promedio Rendimiento',
      render: (s) => (
        <span className={`font-black text-sm ${s.passed ? 'text-[#31B45A]' : 'text-[#E84B5B]'}`}>
          {s.weightedAverage > 0 ? s.weightedAverage.toFixed(2) : 'Sin notas'}
        </span>
      ),
      className: 'text-center',
    },
    {
      header: 'Estado Matrícula',
      render: (s) => (
        <Badge className={s.status === 'active' ? 'bg-[#31B45A] text-white font-bold' : 'bg-slate-200 text-slate-700 font-bold'}>
          {s.status === 'active' ? 'Activo' : s.status === 'withdrawn' ? 'Retirado' : 'Completado'}
        </Badge>
      ),
    },
    {
      header: 'Acciones',
      className: 'text-right',
      render: (s) => (
        <Button size="sm" variant="outline" onClick={() => setActiveStudent(s)} className="rounded-xl border-[#09A9C2] text-[#09A9C2] hover:bg-[#09A9C2] hover:text-white font-bold shadow-xs transition-colors">
          <UserCheck className="mr-1 h-3.5 w-3.5" />
          Ficha Estudiante
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estudiantes Asignados"
        description="Consulta y seguimiento de alumnos matriculados en tus materias asignadas"
      />

      {/* Controls & Filters wrapped in high-contrast Card */}
      <Card className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/60">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-2">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nombre o código..."
                className="pl-9 bg-white border-slate-200 text-slate-800 font-medium rounded-xl shadow-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger className="w-full sm:w-[240px] bg-white border-slate-200 text-slate-800 font-bold rounded-xl shadow-xs">
                <SelectValue placeholder="Seleccionar Curso" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 rounded-xl shadow-2xl">
                <SelectItem value="all">
                  {courses && courses.length > 0 ? `Primer Curso (${courses[0].name})` : 'Todos mis cursos'}
                </SelectItem>
                {courses?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-teal-50 px-3 py-2 rounded-xl border border-teal-100">
            <BookOpen className="h-4 w-4 text-[#09A9C2]" />
            <span>Total en lista: <strong className="text-[#008BC1] text-sm">{filteredStudents.length}</strong></span>
          </div>
        </div>
      </Card>


      {/* Students Data Table */}
      <DataTable
        columns={columns}
        data={filteredStudents.map((s) => ({ ...s, id: s.enrollmentId }))}
        isLoading={loadingCourses || loadingStudents}
        emptyMessage="No se encontraron estudiantes para el curso seleccionado"
      />

      {/* Student Detail Modal */}
      {activeStudent && (
        <Dialog open={!!activeStudent} onOpenChange={() => setActiveStudent(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Ficha del Estudiante
              </DialogTitle>
              <DialogDescription>Información general y datos de contacto de la familia</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              <div className="rounded-lg bg-accent/40 p-3">
                <p className="font-bold text-base">{activeStudent.name}</p>
                <p className="text-xs text-muted-foreground">Código: {activeStudent.studentCode}</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>Estado académico: </span>
                  <strong className={activeStudent.passed ? 'text-green-700' : 'text-red-600'}>
                    {activeStudent.passed ? 'Aprobado' : 'Requiere Refuerzo'}
                  </strong>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>Teléfono Estudiante:</span>
                  <span className="font-medium text-foreground">+593 99 123 4567</span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>Correo Institucional:</span>
                  <span className="font-medium text-foreground">{activeStudent.studentCode.toLowerCase()}@escuela.com</span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>Dirección Residencial:</span>
                  <span className="font-medium text-foreground">Av. Principal y Novedades #12</span>
                </div>

                <div className="rounded-md border p-3 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-primary">
                    <ShieldAlert className="h-4 w-4" />
                    Información del Apoderado / Tutor
                  </div>
                  <p className="text-muted-foreground">Nombre: <strong className="text-foreground">Representante de {activeStudent.name}</strong></p>
                  <p className="text-muted-foreground">Teléfono Emergencia: <strong className="text-foreground">+593 99 765 4321</strong></p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
