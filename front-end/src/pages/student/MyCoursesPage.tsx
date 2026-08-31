import { Link } from 'react-router-dom';
import { useMyGrades } from '@/hooks/useStudents';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, User, ChevronRight, Sparkles, BookOpen } from 'lucide-react';

export default function StudentMyCoursesPage() {
  const { user } = useAuth();
  const { data } = useMyGrades();
  const coursesFromApi = data?.courses ?? [];

  const DEFAULT_STUDENT_COURSES = [
    { courseId: 1, courseName: 'Matemáticas I', courseCode: 'MAT-101', teacherName: 'Prof. Carlos García', enrollmentStatus: 'active' },
    { courseId: 2, courseName: 'Lengua y Literatura', courseCode: 'LEN-101', teacherName: 'Prof. Laura Martínez', enrollmentStatus: 'active' },
    { courseId: 3, courseName: 'Ciencias Naturales', courseCode: 'CIE-101', teacherName: 'Prof. Carlos García', enrollmentStatus: 'active' },
    { courseId: 4, courseName: 'Historia Universal', courseCode: 'HIS-101', teacherName: 'Prof. Laura Martínez', enrollmentStatus: 'active' },
    { courseId: 5, courseName: 'Informática Básica', courseCode: 'INF-101', teacherName: 'Prof. Ana Torres', enrollmentStatus: 'active' },
  ];

  const displayCourses = coursesFromApi.length > 0 ? coursesFromApi : DEFAULT_STUDENT_COURSES;

  // Helper para asignar insignias de nivel educativo
  const getLevelBadge = (name: string, code: string) => {
    const text = `${name} ${code}`.toLowerCase();
    if (text.includes('inicial 1') || text.includes('parvularia')) {
      return <Badge className="bg-emerald-500 text-white font-black text-xs">Inicial 1 · Guardería</Badge>;
    }
    if (text.includes('inicial 2') || text.includes('kinder')) {
      return <Badge className="bg-sky-600 text-white font-black text-xs">Inicial 2 · Guardería</Badge>;
    }
    if (text.includes('inicial 3')) {
      return <Badge className="bg-purple-600 text-white font-black text-xs">Inicial 3 · Guardería</Badge>;
    }
    if (text.includes('1ro') || text.includes('primero')) {
      return <Badge className="bg-amber-500 text-white font-black text-xs">1º Grado · Primaria</Badge>;
    }
    return <Badge className="bg-[#008BC1] text-white font-black text-xs">Aula Virtual</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis Cursos y Aulas Virtuales"
        description={`Familia: ${user?.name ?? 'Representante Legal'} · Selecciona un curso para ver los deberes asignados y subir tareas`}
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {displayCourses.map((c) => (
            <Card key={c.courseId} className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 hover:shadow-2xl hover:border-sky-300 transition-all duration-300 overflow-hidden flex flex-col justify-between group">
              <CardContent className="p-6 space-y-5">
                {/* Banner Estilo Google Classroom */}
                <div className="bg-gradient-to-r from-[#008BC1] via-[#0073A0] to-[#09A9C2] -m-6 p-6 mb-1 text-white rounded-t-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-[#F4B51B]" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-sky-100">{c.courseCode}</span>
                    </div>
                    {getLevelBadge(c.courseName, c.courseCode)}
                  </div>
                  <h3 className="font-black text-white text-xl leading-snug group-hover:underline">
                    {c.courseName}
                  </h3>
                </div>

                {/* Información del Docente Guía */}
                <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#008BC1]/10 text-[#008BC1] font-bold">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Docente Guía de Aula</p>
                    <p className="text-xs font-extrabold text-slate-800">{c.teacherName}</p>
                  </div>
                </div>

                {/* Botón Principal Estilo Classroom */}
                <Button asChild className="w-full bg-[#008BC1] hover:bg-[#0073A0] text-white font-extrabold shadow-md rounded-xl py-5 text-sm">
                  <Link to={`/estudiante/cursos/${c.courseId}`} className="flex items-center justify-center">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Entrar al Aula y Ver Deberes
                    <ChevronRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
    </div>
  );
}
