import { useQuery } from '@tanstack/react-query';
import { Users, BookOpen, GraduationCap, ClipboardList } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/axios';
import type { ApiResponse, PaginatedResponse, Enrollment } from '@/types';
import { formatDate } from '@/lib/utils';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  activeCourses: number;
  activeEnrollments: number;
  courseEnrollments: { name: string; matriculados: number }[];
  recentEnrollments: (Enrollment & {
    student?: { user?: { name: string }; studentCode: string };
    course?: { name: string; period: string };
  })[];
}

function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const period = import.meta.env.VITE_ACTIVE_PERIOD ?? '2026-I';
      const [studentsRes, teachersRes, coursesRes, enrollmentsRes] = await Promise.all([
        api.get<ApiResponse<{ users: unknown[]; total: number }>>('/users?role=student&active=true&limit=1'),
        api.get<ApiResponse<{ users: unknown[]; total: number }>>('/users?role=teacher&active=true&limit=1'),
        api.get<ApiResponse<PaginatedResponse<{ id: number; name: string; enrollmentsCount?: number }>>>(
          `/courses?period=${period}&limit=100`
        ),
        api.get<ApiResponse<PaginatedResponse<Enrollment & {
          student?: { user?: { name: string }; studentCode: string };
          course?: { name: string; period: string };
        }>>>(`/enrollments?period=${period}&limit=5&status=active`),
      ]);

      const courses = coursesRes.data.data?.data ?? [];
      return {
        totalStudents: studentsRes.data.data?.total ?? 0,
        totalTeachers: teachersRes.data.data?.total ?? 0,
        activeCourses: coursesRes.data.data?.total ?? 0,
        activeEnrollments: enrollmentsRes.data.data?.total ?? 0,
        courseEnrollments: courses.map((c) => ({
          name: c.name.length > 20 ? c.name.substring(0, 18) + '…' : c.name,
          matriculados: c.enrollmentsCount ?? 0,
        })),
        recentEnrollments: enrollmentsRes.data.data?.data ?? [],
      };
    },
  });
}

const statusLabel: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Activa', variant: 'default' },
  withdrawn: { label: 'Retirada', variant: 'destructive' },
  completed: { label: 'Completada', variant: 'secondary' },
};

export default function AdminDashboard() {
  const { data, isLoading } = useDashboardStats();

  return (
    <div className="space-y-6">
      <PageHeader title="Panel de Administración" description="Resumen general del período activo" />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Estudiantes activos"
          value={isLoading ? '—' : data?.totalStudents ?? 0}
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatCard
          title="Docentes"
          value={isLoading ? '—' : data?.totalTeachers ?? 0}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Cursos activos"
          value={isLoading ? '—' : data?.activeCourses ?? 0}
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatCard
          title="Matrículas activas"
          value={isLoading ? '—' : data?.activeEnrollments ?? 0}
          icon={<ClipboardList className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Matriculados por curso</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-48 items-center justify-center text-muted-foreground">
                Cargando...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.courseEnrollments ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="matriculados" fill="hsl(221.2 83.2% 53.3%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent enrollments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimas matrículas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Cargando...</p>
            ) : (data?.recentEnrollments ?? []).length === 0 ? (
              <p className="text-muted-foreground text-sm">Sin matrículas registradas.</p>
            ) : (
              <ul className="space-y-3">
                {data!.recentEnrollments.map((e) => {
                  const s = statusLabel[e.status] ?? statusLabel.active;
                  return (
                    <li key={e.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">
                          {e.student?.user?.name ?? 'Estudiante'}{' '}
                          <span className="text-muted-foreground font-normal">
                            ({e.student?.studentCode})
                          </span>
                        </p>
                        <p className="text-muted-foreground">
                          {e.course?.name} · {formatDate(e.enrolledAt)}
                        </p>
                      </div>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
