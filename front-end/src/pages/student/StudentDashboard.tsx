import { BookOpen, Star, Award, GraduationCap, FileText, ScrollText, Sparkles, ClipboardCheck, Megaphone, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useMyGrades } from '@/hooks/useStudents';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { GradeBadge } from '@/components/shared/GradeBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useMyGrades();

  const courses = data?.courses ?? [];
  const generalAverage = data?.generalAverage ?? 0;
  const activeCourses = courses.filter((c) => c.enrollmentStatus === 'active').length;

  const chartData = courses.map((c) => ({
    name: c.courseName.length > 14 ? c.courseName.substring(0, 12) + '…' : c.courseName,
    promedio: c.weightedAverage,
    passed: c.passed,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`¡Hola, ${user?.name?.split(' ')[0] ?? 'Estudiante'}!`}
        description={`Período ${data?.period ?? '2026-I'} · Resumen de tu rendimiento académico`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Materias activas"
          value={isLoading ? '—' : activeCourses}
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatCard
          title="Promedio general"
          value={isLoading ? '—' : generalAverage > 0 ? generalAverage.toFixed(2) : '—'}
          icon={<Star className="h-5 w-5" />}
        />
        <StatCard
          title="Materias aprobadas"
          value={isLoading ? '—' : courses.filter((c) => c.passed && c.grades.length > 0).length}
          icon={<Award className="h-5 w-5" />}
        />
      </div>

      {/* Quick Action Buttons for Padre / Estudiante */}
      <Card className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-black uppercase tracking-wider text-[#09A9C2] flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#F4B51B]" />
            Consultas de Padre & Representado
          </CardTitle>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            Acceso Privado & Seguro
          </span>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Button asChild variant="outline" className="w-full justify-start bg-white hover:bg-sky-50 hover:border-sky-300 shadow-sm rounded-xl font-bold transition-all text-xs">
              <Link to="/estudiante/mis-cursos">
                <GraduationCap className="mr-1.5 h-4 w-4 text-[#008BC1]" />
                Mis Hijos / Curso
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start bg-white hover:bg-emerald-50 hover:border-emerald-300 shadow-sm rounded-xl font-bold transition-all text-xs">
              <Link to="/estudiante/mis-cursos">
                <ClipboardCheck className="mr-1.5 h-4 w-4 text-[#31B45A]" />
                Asistencia
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start bg-white hover:bg-rose-50 hover:border-rose-300 shadow-sm rounded-xl font-bold transition-all text-xs">
              <Link to="/estudiante/mis-notas">
                <FileText className="mr-1.5 h-4 w-4 text-[#E84B5B]" />
                Actividades & Notas
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start bg-white hover:bg-amber-50 hover:border-amber-300 shadow-sm rounded-xl font-bold transition-all text-xs">
              <Link to="/estudiante">
                <Megaphone className="mr-1.5 h-4 w-4 text-[#F4B51B]" />
                Comunicados
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start bg-white hover:bg-purple-50 hover:border-purple-300 shadow-sm rounded-xl font-bold transition-all text-xs">
              <Link to="/estudiante/historial">
                <MessageSquare className="mr-1.5 h-4 w-4 text-[#7D5AA6]" />
                Observaciones
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start bg-white hover:bg-teal-50 hover:border-teal-300 shadow-sm rounded-xl font-bold transition-all text-xs">
              <Link to="/estudiante/historial">
                <ScrollText className="mr-1.5 h-4 w-4 text-[#09A9C2]" />
                Historial & Docs
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>



      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bar chart */}
        <Card className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3">
            <CardTitle className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#008BC1]" />
              Promedios por materia
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="flex h-48 items-center justify-center text-slate-400 font-medium">
                Cargando...
              </div>
            ) : chartData.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium py-8 text-center">
                Aún no tienes calificaciones registradas.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} angle={-25} textAnchor="end" />
                  <YAxis domain={[0, 10]} allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip formatter={(v: number) => [v.toFixed(2), 'Promedio']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="promedio" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.passed ? '#31B45A' : '#E84B5B'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Course list */}
        <Card className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3">
            <CardTitle className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#31B45A]" />
              Mis materias
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <p className="text-sm text-slate-400 font-medium">Cargando...</p>
            ) : courses.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium">No tienes materias matriculadas.</p>
            ) : (
              <ul className="space-y-3">
                {courses.map((c) => (
                  <li key={c.courseId} className="flex items-center justify-between text-sm p-2 rounded-xl hover:bg-teal-50/50 transition-colors">
                    <div>
                      <p className="font-bold text-slate-800">{c.courseName}</p>
                      <p className="text-xs text-slate-500 font-medium">{c.teacherName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.grades.length > 0 ? (
                        <>
                          <span className={`font-black ${c.passed ? 'text-[#31B45A]' : 'text-[#E84B5B]'}`}>
                            {c.weightedAverage.toFixed(2)}
                          </span>
                          <GradeBadge passed={c.passed} />
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Sin notas</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button asChild variant="outline" className="bg-white/90 shadow-md rounded-xl border-[#09A9C2] text-[#09A9C2] hover:bg-[#09A9C2] hover:text-white font-bold">
          <Link to="/estudiante/mis-notas">Ver calificaciones detalladas</Link>
        </Button>
      </div>
    </div>
  );
}

