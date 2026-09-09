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
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { CourseGradeRow } from '@/types';

export default function AssignedStudentsPage() {
  const { data: courses, isLoading: loadingCourses } = useMyCourses();
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStudent, setActiveStudent] = useState<CourseGradeRow | null>(null);

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
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-school-subtle font-bold text-ink-turquoise border border-school-border text-sm">
            {(s.name || 'Estudiante').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-school-heading text-sm">{s.name}</p>
            <p className="text-xs text-school-muted-readable">{s.studentCode}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Promedio Rendimiento',
      render: (s) => (
        <span className={`font-bold text-sm ${s.passed ? 'text-school-success' : 'text-school-error'}`}>
          {s.weightedAverage > 0 ? s.weightedAverage.toFixed(2) : 'Sin notas'}
        </span>
      ),
      className: 'text-center',
    },
    {
      header: 'Estado Matrícula',
      render: (s) => (
        <Badge variant={s.status === 'active' ? 'success' : 'secondary'}>
          {s.status === 'active' ? 'Activo' : s.status === 'withdrawn' ? 'Retirado' : 'Completado'}
        </Badge>
      ),
    },
    {
      header: 'Acciones',
      className: 'text-right',
      render: (s) => (
        <Button size="sm" variant="outline" onClick={() => setActiveStudent(s)}>
          <UserCheck className="mr-1.5 h-3.5 w-3.5 text-ink-turquoise" />
          Ficha del Estudiante
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Docente"
        title="Estudiantes Asignados"
        description="Consulta y seguimiento de alumnos matriculados en tus materias asignadas"
      />

      {/* Controls & Filters */}
      <Card className="nk-filter p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-school-muted-readable" />
              <Input
                placeholder="Buscar por nombre o código..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger className="w-full sm:w-[260px]">
                <SelectValue placeholder="Seleccionar Curso" />
              </SelectTrigger>
              <SelectContent>
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

          <div className="flex items-center gap-2 text-xs font-medium text-school-muted-readable bg-school-subtle/70 px-3.5 py-2 rounded-xl border border-school-border">
            <BookOpen className="h-4 w-4 text-ink-turquoise" />
            <span>Total en lista: <strong className="text-school-heading text-sm">{filteredStudents.length}</strong></span>
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
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-school-heading">
                <UserCheck className="h-5 w-5 text-ink-turquoise" />
                Ficha del Estudiante
              </DialogTitle>
              <DialogDescription className="text-sm text-school-muted-readable">
                Información general y datos de contacto del representante
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              <div className="rounded-xl bg-school-subtle p-4 border border-school-border">
                <p className="font-bold text-base text-school-heading">{activeStudent.name}</p>
                <p className="text-xs text-school-muted-readable mt-0.5">Código: {activeStudent.studentCode}</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-2 text-school-body text-sm">
                  <Calendar className="h-4 w-4 text-ink-turquoise shrink-0" />
                  <span>Estado académico: </span>
                  <strong className={activeStudent.passed ? 'text-school-success' : 'text-school-error'}>
                    {activeStudent.passed ? 'Aprobado' : 'Requiere Refuerzo'}
                  </strong>
                </div>

                <div className="flex items-center gap-2 text-school-body text-sm">
                  <Phone className="h-4 w-4 text-ink-turquoise shrink-0" />
                  <span className="text-school-muted-readable">Teléfono Estudiante:</span>
                  <span className="font-medium text-school-heading">+593 99 123 4567</span>
                </div>

                <div className="flex items-center gap-2 text-school-body text-sm">
                  <Mail className="h-4 w-4 text-ink-turquoise shrink-0" />
                  <span className="text-school-muted-readable">Correo Institucional:</span>
                  <span className="font-medium text-school-heading">{activeStudent.studentCode.toLowerCase()}@escuela.com</span>
                </div>

                <div className="flex items-center gap-2 text-school-body text-sm">
                  <MapPin className="h-4 w-4 text-ink-turquoise shrink-0" />
                  <span className="text-school-muted-readable">Dirección:</span>
                  <span className="font-medium text-school-heading">Av. Principal y Novedades #12</span>
                </div>

                <div className="rounded-xl border border-school-border p-4 space-y-1.5 bg-school-background/50">
                  <div className="flex items-center gap-1.5 font-semibold text-ink-turquoise text-xs uppercase tracking-wider">
                    <ShieldAlert className="h-4 w-4" />
                    Contacto del Representante Legal
                  </div>
                  <p className="text-sm text-school-body">Nombre: <strong className="text-school-heading">Representante de {activeStudent.name}</strong></p>
                  <p className="text-sm text-school-body">Teléfono de Emergencia: <strong className="text-school-heading">+593 99 765 4321</strong></p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
