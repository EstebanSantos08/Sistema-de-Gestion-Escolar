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

const TYPE_CONFIG: Record<ActivityType, { label: string; color: string }> = {
  tarea: { label: 'Tarea', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  examen: { label: 'Examen', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  taller: { label: 'Taller', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  proyecto: { label: 'Proyecto', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  deber: { label: 'Deber', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

const STATUS_CONFIG: Record<ActivityStatus, { label: string; icon: React.ReactNode; color: string }> = {
  programada: { label: 'Programada', icon: <Clock className="h-3 w-3" />, color: 'bg-slate-100 text-slate-600 border-slate-200' },
  en_curso: { label: 'En Curso', icon: <Sparkles className="h-3 w-3" />, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  completada: { label: 'Completada', icon: <CheckCircle2 className="h-3 w-3" />, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

export default function StudentActivitiesPage() {
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const allActivities = teacherModuleService.getActivities();
  const submissions = teacherModuleService.getSubmissions();

  // Get unique courses
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
      // Sort: en_curso first, then programada, then completada
      const order: Record<string, number> = { en_curso: 0, programada: 1, completada: 2 };
      return (order[a.status] ?? 3) - (order[b.status] ?? 3);
    });
  }, [allActivities, courseFilter, statusFilter]);

  // Stats
  const stats = {
    total: allActivities.length,
    enCurso: allActivities.filter((a) => a.status === 'en_curso').length,
    programadas: allActivities.filter((a) => a.status === 'programada').length,
    completadas: allActivities.filter((a) => a.status === 'completada').length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Actividades Programadas"
        description="Deberes, exámenes, talleres y proyectos asignados por tus docentes"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-white/60">
          <CardContent className="p-4 text-center">
            <CalendarCheck className="h-5 w-5 mx-auto text-[#008BC1] mb-1" />
            <p className="text-2xl font-black text-slate-800">{stats.total}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/80 backdrop-blur-md rounded-2xl shadow-lg border border-amber-100">
          <CardContent className="p-4 text-center">
            <Sparkles className="h-5 w-5 mx-auto text-amber-600 mb-1" />
            <p className="text-2xl font-black text-amber-700">{stats.enCurso}</p>
            <p className="text-[10px] font-bold text-amber-500 uppercase">En Curso</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-50/80 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200">
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto text-slate-500 mb-1" />
            <p className="text-2xl font-black text-slate-700">{stats.programadas}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Programadas</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/80 backdrop-blur-md rounded-2xl shadow-lg border border-emerald-100">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
            <p className="text-2xl font-black text-emerald-700">{stats.completadas}</p>
            <p className="text-[10px] font-bold text-emerald-500 uppercase">Completadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-slate-400" />
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-56 rounded-xl border-slate-200 bg-white font-bold text-xs">
            <SelectValue placeholder="Filtrar por curso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los cursos</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 rounded-xl border-slate-200 bg-white font-bold text-xs">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="en_curso">En Curso</SelectItem>
            <SelectItem value="programada">Programada</SelectItem>
            <SelectItem value="completada">Completada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Activities List */}
      {filtered.length === 0 ? (
        <Card className="p-8 text-center bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200">
          <FileCheck className="h-10 w-10 mx-auto text-slate-300 mb-2" />
          <p className="font-extrabold text-slate-600 text-sm">No hay actividades disponibles</p>
          <p className="text-xs text-slate-400 mt-1">No se encontraron actividades con los filtros seleccionados.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((act) => {
            const typeCfg = TYPE_CONFIG[act.type];
            const statusCfg = STATUS_CONFIG[act.status];
            const mySub = submissions.find((s) => s.activityId === act.id);
            const isGraded = mySub?.status === 'calificada' || mySub?.score !== undefined;
            const isSubmitted = !!mySub;

            return (
              <Card key={act.id} className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-white/60 overflow-hidden hover:shadow-xl transition-all">
                <CardContent className="p-5 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-black text-slate-800 text-base leading-snug">{act.title}</h3>
                    <Badge className={`${statusCfg.color} border font-bold text-[10px] gap-1 shrink-0`}>
                      {statusCfg.icon}
                      {statusCfg.label}
                    </Badge>
                  </div>

                  {/* Meta info */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={`${typeCfg.color} border font-bold text-[10px]`}>
                      {typeCfg.label}
                    </Badge>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                      <BookOpen className="h-3 w-3 text-[#008BC1]" />
                      {act.courseName}
                    </span>
                  </div>

                  {/* Due date */}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                    <Calendar className="h-3.5 w-3.5 text-[#E84B5B]" />
                    <span>Fecha límite: {act.dueDate}</span>
                  </div>

                  {/* Description */}
                  {act.description && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                      {act.description}
                    </p>
                  )}

                  {/* Status & Grade Footer */}
                  {isGraded ? (
                    <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-xs flex items-center justify-between">
                      <span className="font-extrabold text-amber-900 flex items-center gap-1">
                        <Award className="h-4 w-4 text-amber-600" />
                        Nota: {mySub.score}/10
                      </span>
                      <Link to={`/estudiante/curso/${act.courseId}`} className="text-[#008BC1] font-bold hover:underline text-[11px]">
                        Ver Retroalimentación →
                      </Link>
                    </div>
                  ) : isSubmitted ? (
                    <div className="bg-teal-50 p-2.5 rounded-xl border border-teal-100 text-xs flex items-center justify-between">
                      <span className="font-bold text-teal-800 flex items-center gap-1">
                        <FileCheck className="h-4 w-4 text-[#31B45A]" />
                        Entregado (En revisión)
                      </span>
                      <Link to={`/estudiante/curso/${act.courseId}`} className="text-[#008BC1] font-bold hover:underline text-[11px]">
                        Ver Detalle →
                      </Link>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-[11px] font-semibold text-slate-400">Sin entregar</span>
                      <Button asChild size="sm" className="bg-[#008BC1] hover:bg-[#0073A0] text-white text-xs font-bold rounded-xl h-8">
                        <Link to={`/estudiante/curso/${act.courseId}`}>Ir a Entregar</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
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
