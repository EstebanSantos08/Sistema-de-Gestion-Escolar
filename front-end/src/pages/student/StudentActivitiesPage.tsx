import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CalendarCheck, Calendar, BookOpen, Filter, FileCheck, Clock, CheckCircle2, Sparkles, Award } from 'lucide-react';
import { teacherModuleService } from '@/services/teacherModule.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActivityStatus, ActivityType } from '@/types';

const TYPE_CONFIG: Record<ActivityType, { label: string; variant: 'secondary' | 'outline' | 'purple' | 'pink' | 'warning' }> = {
  tarea: { label: 'Tarea', variant: 'outline' },
  examen: { label: 'Examen', variant: 'pink' },
  taller: { label: 'Taller', variant: 'warning' },
  proyecto: { label: 'Proyecto', variant: 'purple' },
  deber: { label: 'Deber', variant: 'secondary' },
};

export default function StudentActivitiesPage() {
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const allActivities = teacherModuleService.getActivities();
  const submissions = teacherModuleService.getSubmissions();

  const courses = useMemo(() => {
    const map = new Map<number, string>();
    allActivities.forEach((a) => map.set(a.courseId, a.courseName));
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [allActivities]);

  const filtered = useMemo(() => {
    let list = allActivities;
    if (courseFilter !== 'all') {
      list = list.filter((a) => a.courseId === Number(courseFilter));
    }
    if (statusFilter !== 'all') {
      list = list.filter((a) => a.status === statusFilter);
    }
    return list.sort((a, b) => {
      const order: Record<string, number> = { en_curso: 0, programada: 1, completada: 2 };
      return (order[a.status] ?? 3) - (order[b.status] ?? 3);
    });
  }, [allActivities, courseFilter, statusFilter]);

  const stats = {
    total: allActivities.length,
    enCurso: allActivities.filter((a) => a.status === 'en_curso').length,
    programadas: allActivities.filter((a) => a.status === 'programada').length,
    completadas: allActivities.filter((a) => a.status === 'finalizada' || a.status === 'completada').length,
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
        title="Actividades y Tareas"
        description="Deberes, talleres, proyectos y evaluaciones asignados por tus docentes"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4 text-center">
          <CalendarCheck className="h-5 w-5 mx-auto text-school-primary mb-1" />
          <p className="text-2xl font-bold text-school-heading">{stats.total}</p>
          <p className="text-xs text-school-muted uppercase font-medium tracking-wider">Total</p>
        </Card>
        <Card className="p-4 text-center">
          <Sparkles className="h-5 w-5 mx-auto text-school-warning mb-1" />
          <p className="text-2xl font-bold text-school-warning">{stats.enCurso}</p>
          <p className="text-xs text-school-muted uppercase font-medium tracking-wider">En Curso</p>
        </Card>
        <Card className="p-4 text-center">
          <Clock className="h-5 w-5 mx-auto text-school-blue mb-1" />
          <p className="text-2xl font-bold text-school-blue">{stats.programadas}</p>
          <p className="text-xs text-school-muted uppercase font-medium tracking-wider">Programadas</p>
        </Card>
        <Card className="p-4 text-center">
          <CheckCircle2 className="h-5 w-5 mx-auto text-school-success mb-1" />
          <p className="text-2xl font-bold text-school-success">{stats.completadas}</p>
          <p className="text-xs text-school-muted uppercase font-medium tracking-wider">Completadas</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 flex-1">
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

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-school-heading shrink-0">Estado:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="en_curso">En Curso</SelectItem>
                <SelectItem value="programada">Programadas</SelectItem>
                <SelectItem value="finalizada">Finalizadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Activities List */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <FileCheck className="h-10 w-10 mx-auto text-school-muted mb-2" />
          <p className="font-semibold text-school-heading text-base">No hay actividades disponibles</p>
          <p className="text-sm text-school-muted mt-1">No se encontraron actividades con los filtros seleccionados.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {filtered.map((act) => {
            const typeCfg = TYPE_CONFIG[act.type] ?? { label: 'Actividad', variant: 'secondary' };
            const mySub = submissions.find((s) => s.activityId === act.id);
            const isGraded = mySub?.status === 'calificada' || mySub?.score !== undefined;
            const isSubmitted = !!mySub;

            return (
              <Card key={act.id} className="flex flex-col justify-between hover:border-school-accent transition-colors">
                <CardContent className="p-6 space-y-4 flex flex-col justify-between flex-1">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-school-heading text-base leading-snug">{act.title}</h3>
                      <Badge variant={act.status === 'programada' ? 'warning' : act.status === 'finalizada' ? 'secondary' : 'success'} className="shrink-0">
                        {act.status === 'programada' ? 'Programada' : act.status === 'finalizada' ? 'Finalizada' : 'En Curso'}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={typeCfg.variant}>
                        {typeCfg.label}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs font-medium text-school-muted">
                        <BookOpen className="h-3.5 w-3.5 text-school-primary" />
                        {act.courseName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-medium text-school-muted">
                      <Calendar className="h-3.5 w-3.5 text-school-primary" />
                      <span>Fecha límite: {act.dueDate}</span>
                    </div>

                    {act.description && (
                      <p className="text-sm text-school-body bg-school-background p-3 rounded-xl border border-school-border/60 leading-relaxed">
                        {act.description}
                      </p>
                    )}
                  </div>

                  {/* Status & Grade Footer */}
                  <div className="pt-3 border-t border-school-border/60">
                    {isGraded ? (
                      <div className="bg-school-subtle/60 p-3 rounded-xl border border-school-border text-xs flex items-center justify-between">
                        <span className="font-semibold text-school-heading flex items-center gap-1.5">
                          <Award className="h-4 w-4 text-school-warning" />
                          Nota: <strong className="text-school-primary">{mySub.score}/10</strong>
                        </span>
                        <Link to={`/estudiante/cursos/${act.courseId}`} className="text-school-primary font-semibold hover:underline text-xs">
                          Ver Retroalimentación →
                        </Link>
                      </div>
                    ) : isSubmitted ? (
                      <div className="bg-school-subtle/40 p-3 rounded-xl border border-school-border text-xs flex items-center justify-between">
                        <span className="font-medium text-emerald-800 flex items-center gap-1.5">
                          <FileCheck className="h-4 w-4 text-school-success" />
                          Entregado (En revisión)
                        </span>
                        <Link to={`/estudiante/cursos/${act.courseId}`} className="text-school-primary font-semibold hover:underline text-xs">
                          Ver Detalle →
                        </Link>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-school-muted font-medium">Pendiente de entrega</span>
                        <Button asChild size="sm">
                          <Link to={`/estudiante/cursos/${act.courseId}`}>Ir a Entregar</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
