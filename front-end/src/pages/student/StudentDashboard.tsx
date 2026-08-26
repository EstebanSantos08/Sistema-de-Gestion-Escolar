import { BookOpen, Star, Award } from 'lucide-react';
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

const GRADE_PASS = 7;

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
        title={`Hola, ${user?.name?.split(' ')[0] ?? 'estudiante'}`}
        description={`Período ${data?.period ?? '2026-I'} · Resumen de tu rendimiento`}
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Promedios por materia</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-48 items-center justify-center text-muted-foreground">
                Cargando...
              </div>
            ) : chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Aún no tienes calificaciones registradas.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" />
                  <YAxis domain={[0, 10]} allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [v.toFixed(2), 'Promedio']} />
                  <Bar dataKey="promedio" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.passed ? 'hsl(142 76% 36%)' : 'hsl(0 84% 60%)'}
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
          <CardHeader>
            <CardTitle className="text-base">Mis materias</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : courses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tienes materias matriculadas.</p>
            ) : (
              <ul className="space-y-3">
                {courses.map((c) => (
                  <li key={c.courseId} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{c.courseName}</p>
                      <p className="text-xs text-muted-foreground">{c.teacherName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.grades.length > 0 ? (
                        <>
                          <span className={`font-semibold ${c.passed ? 'text-green-700' : 'text-red-600'}`}>
                            {c.weightedAverage.toFixed(2)}
                          </span>
                          <GradeBadge passed={c.passed} />
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin notas</span>
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
        <Button asChild variant="outline">
          <Link to="/estudiante/mis-notas">Ver calificaciones detalladas</Link>
        </Button>
      </div>
    </div>
  );
}
