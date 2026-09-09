import { StudentAgenda } from '@/components/shared/StudentAgenda';
import { QuickAccess } from '@/components/shared/QuickAccess';
import { BookOpen, Star, Award, GraduationCap, FileText, ScrollText, ClipboardCheck, Megaphone, MessageSquare, ArrowRight } from 'lucide-react';
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
import { WelcomeBanner } from '@/components/shared/WelcomeBanner';
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
    fullName: c.courseName,
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
        period={data?.period ?? '2026-I'}
      />

      <div className="grid grid-flow-dense grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Materias activas"
          value={isLoading ? '—' : activeCourses}
          description="en curso este período"
          variant="lightblue"
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatCard
          title="Promedio general"
          value={isLoading ? '—' : generalAverage > 0 ? generalAverage.toFixed(2) : '—'}
          description="calificación ponderada actual"
          variant={isParent ? 'lilac' : 'yellow'}
          icon={<Star className="h-5 w-5" />}
        />
        <StatCard
          title="Materias aprobadas"
          value={isLoading ? '—' : courses.filter((c) => c.passed && c.grades.length > 0).length}
          description="de las materias evaluadas"
          variant={isParent ? 'pink' : 'lime'}
          icon={<Award className="h-5 w-5" />}
        />
      </div>

      {/* Quick Action Buttons */}
      <QuickAccess title={isParent ? 'Acompaña su aprendizaje' : 'Accesos y herramientas'} family={isParent} items={[
        { to: '/estudiante/mis-cursos', label: isParent ? 'Cursos del estudiante' : 'Mis cursos', icon: GraduationCap },
        { to: '/estudiante/asistencia', label: 'Asistencia', icon: ClipboardCheck },
        { to: '/estudiante/actividades', label: 'Actividades', icon: FileText },
        { to: '/estudiante/comunicados', label: 'Comunicados', icon: Megaphone },
        { to: '/estudiante/observaciones', label: 'Observaciones', icon: MessageSquare },
        { to: '/estudiante/historial', label: 'Historial', icon: ScrollText },
      ]} />

      <div className="grid grid-flow-dense grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bar chart */}
        <Card accent={isParent ? 'lilac' : 'yellow'} className="nk-section">
          <CardHeader className="border-b border-school-border/70 pb-3">
            <CardTitle className="text-base font-semibold text-school-heading flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-school-primary" />
              Promedios por Materia
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="flex h-56 items-center justify-center text-school-muted-readable text-sm">
                Cargando rendimiento...
              </div>
            ) : chartData.length === 0 ? (
              <p className="text-sm text-school-muted-readable py-12 text-center">
                Aún no tienes calificaciones registradas en este período.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D6E5E3" opacity={0.6} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#365451' }} angle={-20} textAnchor="end" />
                  <YAxis domain={[0, 10]} allowDecimals={false} tick={{ fontSize: 12, fill: '#365451' }} />
                  <Tooltip
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
                    formatter={(v: number) => [v.toFixed(2), 'Promedio']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #D6E5E3', backgroundColor: '#FFFFFF', fontSize: '13px' }}
                  />
                  <Bar isAnimationActive={false} dataKey="promedio" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.passed ? `var(--chart-${index % 6 + 1})` : 'var(--chart-error)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Course list */}
        <Card accent="blue" className="nk-section">
          <CardHeader className="border-b border-school-border/70 pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-school-heading flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-school-primary" />
              Mis Materias
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-ink-turquoise font-medium hover:bg-school-subtle text-xs">
              <Link to="/estudiante/mis-cursos">Ver todas <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <p className="text-sm text-school-muted-readable py-4">Cargando materias...</p>
            ) : courses.length === 0 ? (
              <p className="text-sm text-school-muted-readable py-8 text-center">No tienes materias matriculadas.</p>
            ) : (
              <ul className="space-y-2.5">
                {courses.map((c) => (
                  <li key={c.courseId} className="nk-course flex flex-wrap items-center justify-between gap-3 rounded-xl p-4 text-sm">
                    <div>
                      <p className="font-semibold text-school-heading">{c.courseName}</p>
                      <p className="text-xs text-school-muted-readable">{c.teacherName || 'Docente asignado'}</p>
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
                        <span className="text-xs text-school-muted-readable">Sin notas</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <StudentAgenda courseIds={courses.map(course => course.courseId)} />

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
