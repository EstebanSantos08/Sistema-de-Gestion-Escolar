import { BookOpen, Star, Award, GraduationCap, FileText, ScrollText, Sparkles, ClipboardCheck, Megaphone, MessageSquare, ArrowRight } from 'lucide-react';
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
import { WelcomeBanner } from '@/components/shared/WelcomeBanner';
import { StatCard } from '@/components/shared/StatCard';
import { GradeBadge } from '@/components/shared/GradeBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

  const isParent = user?.role === 'parent';

  return (
    <div className="space-y-6">
      <WelcomeBanner
        userName={user?.name ?? 'Estudiante'}
        roleLabel={isParent ? 'Portal de Familias' : 'Portal del Estudiante'}
        description={`Resumen escolar del período ${data?.period ?? '2026-I'} — Notas, actividades y avisos`}
        variant={isParent ? 'pink' : 'lime'}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Materias activas"
          value={isLoading ? '—' : activeCourses}
          description="en curso este período"
          variant="turquoise"
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatCard
          title="Promedio general"
          value={isLoading ? '—' : generalAverage > 0 ? generalAverage.toFixed(2) : '—'}
          description="calificación ponderada actual"
          variant="yellow"
          icon={<Star className="h-5 w-5" />}
        />
        <StatCard
          title="Materias aprobadas"
          value={isLoading ? '—' : courses.filter((c) => c.passed && c.grades.length > 0).length}
          description="de las materias evaluadas"
          variant="lime"
          icon={<Award className="h-5 w-5" />}
        />
      </div>

      {/* Quick Action Buttons */}
      <Card>
        <CardHeader className="pb-3 border-b border-school-border/70 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold text-school-heading">
            {isParent ? 'Consultas del Representado' : 'Accesos y Herramientas'}
          </CardTitle>
          <Badge variant="outline" className="text-xs font-normal text-school-muted">
            Acceso Académico
          </Badge>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Button asChild variant="outline" className="h-12 w-full justify-start rounded-xl font-medium text-sm text-school-heading hover:bg-school-subtle hover:text-school-primary hover:border-school-accent transition-colors">
              <Link to="/estudiante/mis-cursos">
                <GraduationCap className="mr-2 h-4 w-4 text-school-primary shrink-0" />
                {isParent ? 'Mis Hijos / Cursos' : 'Mis Cursos'}
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-12 w-full justify-start rounded-xl font-medium text-sm text-school-heading hover:bg-school-subtle hover:text-school-primary hover:border-school-accent transition-colors">
              <Link to="/estudiante/asistencia">
                <ClipboardCheck className="mr-2 h-4 w-4 text-school-success shrink-0" />
                Asistencia
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-12 w-full justify-start rounded-xl font-medium text-sm text-school-heading hover:bg-school-subtle hover:text-school-primary hover:border-school-accent transition-colors">
              <Link to="/estudiante/actividades">
                <FileText className="mr-2 h-4 w-4 text-school-pink shrink-0" />
                Actividades
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-12 w-full justify-start rounded-xl font-medium text-sm text-school-heading hover:bg-school-subtle hover:text-school-primary hover:border-school-accent transition-colors">
              <Link to="/estudiante/comunicados">
                <Megaphone className="mr-2 h-4 w-4 text-school-warning shrink-0" />
                Comunicados
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-12 w-full justify-start rounded-xl font-medium text-sm text-school-heading hover:bg-school-subtle hover:text-school-primary hover:border-school-accent transition-colors">
              <Link to="/estudiante/observaciones">
                <MessageSquare className="mr-2 h-4 w-4 text-school-violet shrink-0" />
                Observaciones
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-12 w-full justify-start rounded-xl font-medium text-sm text-school-heading hover:bg-school-subtle hover:text-school-primary hover:border-school-accent transition-colors">
              <Link to="/estudiante/historial">
                <ScrollText className="mr-2 h-4 w-4 text-school-blue shrink-0" />
                Historial
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bar chart */}
        <Card>
          <CardHeader className="border-b border-school-border/70 pb-3">
            <CardTitle className="text-base font-semibold text-school-heading flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-school-primary" />
              Promedios por Materia
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="flex h-56 items-center justify-center text-school-muted text-sm">
                Cargando rendimiento...
              </div>
            ) : chartData.length === 0 ? (
              <p className="text-sm text-school-muted py-12 text-center">
                Aún no tienes calificaciones registradas en este período.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D6E5E3" opacity={0.6} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#365451' }} angle={-20} textAnchor="end" />
                  <YAxis domain={[0, 10]} allowDecimals={false} tick={{ fontSize: 12, fill: '#365451' }} />
                  <Tooltip
                    formatter={(v: number) => [v.toFixed(2), 'Promedio']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #D6E5E3', backgroundColor: '#FFFFFF', fontSize: '13px' }}
                  />
                  <Bar dataKey="promedio" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.passed ? '#287A32' : '#B42335'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Course list */}
        <Card>
          <CardHeader className="border-b border-school-border/70 pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-school-heading flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-school-primary" />
              Mis Materias
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-school-primary font-medium hover:bg-school-subtle text-xs">
              <Link to="/estudiante/mis-cursos">Ver todas <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <p className="text-sm text-school-muted py-4">Cargando materias...</p>
            ) : courses.length === 0 ? (
              <p className="text-sm text-school-muted py-8 text-center">No tienes materias matriculadas.</p>
            ) : (
              <ul className="space-y-2.5">
                {courses.map((c) => (
                  <li key={c.courseId} className="flex items-center justify-between text-sm p-3 rounded-xl border border-school-border/70 hover:border-school-accent hover:bg-school-subtle/40 transition-colors">
                    <div>
                      <p className="font-semibold text-school-heading">{c.courseName}</p>
                      <p className="text-xs text-school-muted">{c.teacherName || 'Docente asignado'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.grades.length > 0 ? (
                        <>
                          <span className={`font-bold ${c.passed ? 'text-school-success' : 'text-school-error'}`}>
                            {c.weightedAverage.toFixed(2)}
                          </span>
                          <GradeBadge passed={c.passed} />
                        </>
                      ) : (
                        <span className="text-xs text-school-muted">Sin notas</span>
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
        <Button asChild>
          <Link to="/estudiante/mis-notas">
            Ver Calificaciones Detalladas <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
