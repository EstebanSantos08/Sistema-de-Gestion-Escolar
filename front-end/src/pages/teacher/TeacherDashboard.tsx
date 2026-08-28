import { BookOpen, Users, ClipboardCheck, Megaphone, PlusCircle, CheckSquare, MessageSquare, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMyCourses } from '@/hooks/useCourses';
import { teacherModuleService } from '@/services/teacherModule.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { data: courses, isLoading } = useMyCourses();

  const totalStudents = courses?.reduce((s, c) => s + (c.enrollmentsCount ?? 0), 0) ?? 0;
  const activities = teacherModuleService.getActivities();
  const announcements = teacherModuleService.getAnnouncements();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bienvenido, ${user?.name ?? 'docente'}`}
        description="Panel de control del docente — período activo 2026-I"
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Cursos Asignados"
          value={isLoading ? '—' : courses?.length ?? 0}
          description="materias activas"
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatCard
          title="Estudiantes a cargo"
          value={isLoading ? '—' : totalStudents}
          description="matriculados en tus cursos"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Actividades"
          value={activities.length}
          description="registradas en el sistema"
          icon={<CheckSquare className="h-5 w-5" />}
        />
        <StatCard
          title="Comunicados"
          value={announcements.length}
          description="publicados a familias"
          icon={<Megaphone className="h-5 w-5" />}
        />
      </div>

      {/* Quick Action Buttons para Maestra */}
      <Card className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-xs font-black uppercase tracking-wider text-[#09A9C2]">
            Funciones y Accesos Rápidos de Maestra
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Button asChild variant="outline" className="w-full justify-start bg-white hover:bg-sky-50 hover:border-sky-300 shadow-sm rounded-xl font-bold transition-all text-xs">
              <Link to="/docente/mis-cursos">
                <BookOpen className="mr-1.5 h-4 w-4 text-[#008BC1]" />
                Mis Cursos
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start bg-white hover:bg-[#09A9C2]/10 hover:border-[#09A9C2] shadow-sm rounded-xl font-bold transition-all text-xs">
              <Link to="/docente/estudiantes">
                <Users className="mr-1.5 h-4 w-4 text-[#09A9C2]" />
                Estudiantes
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start bg-white hover:bg-emerald-50 hover:border-emerald-300 shadow-sm rounded-xl font-bold transition-all text-xs">
              <Link to="/docente/asistencia">
                <ClipboardCheck className="mr-1.5 h-4 w-4 text-[#31B45A]" />
                Asistencia
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start bg-white hover:bg-rose-50 hover:border-rose-300 shadow-sm rounded-xl font-bold transition-all text-xs">
              <Link to="/docente/actividades">
                <PlusCircle className="mr-1.5 h-4 w-4 text-[#E84B5B]" />
                Actividades
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start bg-white hover:bg-purple-50 hover:border-purple-300 shadow-sm rounded-xl font-bold transition-all text-xs">
              <Link to="/docente/observaciones">
                <MessageSquare className="mr-1.5 h-4 w-4 text-[#7D5AA6]" />
                Observaciones
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start bg-white hover:bg-amber-50 hover:border-amber-300 shadow-sm rounded-xl font-bold transition-all text-xs">
              <Link to="/docente/comunicados">
                <Megaphone className="mr-1.5 h-4 w-4 text-[#F4B51B]" />
                Comunicados
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>



      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Mis Cursos (2 cols) */}
        <Card className="lg:col-span-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 pb-3">
            <CardTitle className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#008BC1]" />
              Mis Cursos — 2026-I
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-[#09A9C2] font-bold">
              <Link to="/docente/mis-cursos">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <p className="text-slate-400 text-sm font-medium">Cargando cursos...</p>
            ) : (courses ?? []).length === 0 ? (
              <p className="text-slate-400 text-sm font-medium">No tienes cursos asignados este período.</p>
            ) : (
              <div className="space-y-3">
                {courses!.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between rounded-xl border border-teal-100/80 p-4 hover:border-[#09A9C2] hover:bg-teal-50/40 transition-all shadow-sm"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{course.name}</p>
                      <p className="text-xs text-slate-500 font-medium">
                        {course.code} · {course.enrollmentsCount ?? 0} estudiantes
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200 font-bold">{course.period}</Badge>
                      <Button asChild size="sm" variant="outline" className="rounded-xl border-[#09A9C2] text-[#09A9C2] hover:bg-[#09A9C2] hover:text-white font-bold">
                        <Link to={`/docente/cursos/${course.id}`}>Gestión</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dynamic Widget column (1 col) */}
        <div className="space-y-6">
          {/* Recent Announcements */}
          <Card className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <Megaphone className="h-4 w-4 text-[#F4B51B]" />
                Comunicados Recientes
              </CardTitle>
              <Button asChild variant="link" size="sm" className="px-0 h-auto text-xs text-[#09A9C2] font-bold">
                <Link to="/docente/comunicados">Ver más</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {announcements.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium">Sin comunicados aún.</p>
              ) : (
                announcements.slice(0, 3).map((a) => (
                  <div key={a.id} className="border-b border-slate-100 last:border-b-0 pb-2.5 last:pb-0">
                    <p className="text-xs font-bold text-slate-800">{a.title}</p>
                    <p className="text-xs text-slate-500 line-clamp-2">{a.content}</p>
                    <span className="text-[10px] text-teal-700 font-bold mt-1 block">{a.publishDate}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Upcoming Activities */}
          <Card className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-[#E84B5B]" />
                Próximas Entregas
              </CardTitle>
              <Button asChild variant="link" size="sm" className="px-0 h-auto text-xs text-[#09A9C2] font-bold">
                <Link to="/docente/actividades">Ir a actividades</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {activities.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium">Sin entregas pendientes.</p>
              ) : (
                activities.slice(0, 3).map((act) => (
                  <div key={act.id} className="flex items-center justify-between border-b border-slate-100 last:border-b-0 pb-2 last:pb-0 text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{act.title}</p>
                      <p className="text-slate-500 font-medium">{act.courseName}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-amber-300 bg-amber-50 text-amber-800 font-bold">
                      {act.dueDate}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

