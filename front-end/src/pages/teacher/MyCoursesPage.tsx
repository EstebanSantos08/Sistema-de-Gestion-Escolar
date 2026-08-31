import { Link } from 'react-router-dom';
import { BookOpen, Users, Sparkles, ChevronRight, GraduationCap } from 'lucide-react';
import { useMyCourses } from '@/hooks/useCourses';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function TeacherMyCoursesPage() {
  const { data: courses, isLoading } = useMyCourses();

  // Helper para asignar insignias de nivel educativo (Guardería / 1ro Primaria)
  const getLevelBadge = (name: string, code: string) => {
    const text = `${name} ${code}`.toLowerCase();
    if (text.includes('inicial 1') || text.includes('parvularia')) {
      return <Badge className="bg-emerald-500 text-white font-black text-xs shadow-xs">Inicial 1 · Guardería</Badge>;
    }
    if (text.includes('inicial 2') || text.includes('kinder')) {
      return <Badge className="bg-sky-600 text-white font-black text-xs shadow-xs">Inicial 2 · Guardería</Badge>;
    }
    if (text.includes('inicial 3')) {
      return <Badge className="bg-purple-600 text-white font-black text-xs shadow-xs">Inicial 3 · Guardería</Badge>;
    }
    if (text.includes('1ro') || text.includes('primero')) {
      return <Badge className="bg-amber-500 text-white font-black text-xs shadow-xs">1º Grado · Primaria</Badge>;
    }
    return <Badge className="bg-[#008BC1] text-white font-black text-xs shadow-xs">Aula Virtual</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis Cursos Guiados"
        description="Selecciona un aula para gestionar deberes, publicar tareas y consultar la lista de estudiantes"
      />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-[#008BC1] border-t-transparent mb-2" />
          <p className="text-xs font-bold">Cargando aulas virtuales...</p>
        </div>
      ) : (courses ?? []).length === 0 ? (
        <Card className="p-8 text-center bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-slate-200">
          <GraduationCap className="h-10 w-10 mx-auto text-slate-300 mb-2" />
          <p className="font-extrabold text-slate-700 text-sm">No tienes cursos asignados</p>
          <p className="text-xs text-slate-400 mt-1">Contacta a la dirección institucional para asignarte a un grupo de aula.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses!.map((course) => (
            <Card key={course.id} className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 hover:shadow-2xl hover:border-sky-300 transition-all duration-300 overflow-hidden flex flex-col justify-between group">
              <CardContent className="p-6 space-y-5">
                {/* Banner Estilo Google Classroom */}
                <div className="bg-gradient-to-r from-[#008BC1] to-[#09A9C2] -m-6 p-6 mb-1 text-white rounded-t-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-[#F4B51B]" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-sky-100">{course.code}</span>
                    </div>
                    {getLevelBadge(course.name, course.code)}
                  </div>
                  <h3 className="font-black text-white text-xl leading-snug group-hover:underline">
                    {course.name}
                  </h3>
                  <p className="text-xs text-sky-100 font-bold">Período Lectivo {course.period}</p>
                </div>

                {/* Métricas e Información de Alumnos */}
                <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100/70 text-[#31B45A] font-bold">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Lista de Alumnos</p>
                      <p className="font-black text-slate-800 text-sm">{course.enrolledCount ?? course.enrollmentsCount ?? 0} Estudiantes</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-slate-200 text-slate-700 font-bold">
                    <BookOpen className="h-3 w-3 mr-1 text-[#008BC1]" /> {course.credits} Créditos
                  </Badge>
                </div>

                {course.description && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    {course.description}
                  </p>
                )}

                {/* Botón Principal Estilo Classroom para Entrar al Curso */}
                <Button asChild className="w-full bg-[#008BC1] hover:bg-[#0073A0] text-white font-extrabold shadow-md rounded-xl py-5 text-sm">
                  <Link to={`/docente/cursos/${course.id}`} className="flex items-center justify-center">
                    Entrar al Aula del Curso
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
