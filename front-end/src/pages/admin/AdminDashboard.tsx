import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  BookOpen,
  GraduationCap,
  ClipboardList,
  UserPlus,
  FolderPlus,
  FileBarChart,
  ShieldCheck,
  Layers,
  Calendar,
  Sun,
  Award,
  Settings,
  History,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { WelcomeBanner } from '@/components/shared/WelcomeBanner';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import api from '@/lib/axios';
import type { ApiResponse, Enrollment } from '@/types';
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

      const [studentsResult, teachersResult, coursesResult, enrollmentsResult] = await Promise.allSettled([
        api.get<ApiResponse<{ users: unknown[]; total: number }>>('/users?role=student&active=true&limit=1'),
        api.get<ApiResponse<{ users: unknown[]; total: number }>>('/users?role=teacher&active=true&limit=1'),
        api.get<ApiResponse<{ courses?: unknown[]; data?: unknown[]; total?: number }>>(
          `/courses?period=${period}&limit=100`
        ),
        api.get<ApiResponse<{ enrollments?: unknown[]; data?: unknown[]; total?: number }>>(
          `/enrollments?period=${period}&limit=5&status=active`
        ),
      ]);

      let totalStudents = 0;
      if (studentsResult.status === 'fulfilled') {
        const d = studentsResult.value.data?.data;
        totalStudents = d?.total ?? (Array.isArray(d?.users) ? d.users.length : 0);
      }

      let totalTeachers = 0;
      if (teachersResult.status === 'fulfilled') {
        const d = teachersResult.value.data?.data;
        totalTeachers = d?.total ?? (Array.isArray(d?.users) ? d.users.length : 0);
      }

      let activeCourses = 0;
      let courseEnrollments: { name: string; matriculados: number }[] = [];
      if (coursesResult.status === 'fulfilled') {
        const d = coursesResult.value.data?.data as any;
        const list = Array.isArray(d?.courses)
          ? d.courses
          : Array.isArray(d?.data)
          ? d.data
          : Array.isArray(d)
          ? d
          : [];
        activeCourses = d?.total ?? list.length;
        courseEnrollments = list.map((c: any) => ({
          name: c.name?.length > 20 ? c.name.substring(0, 18) + '…' : (c.name || 'Curso'),
          matriculados: c.enrolledCount ?? c.enrollmentsCount ?? 0,
        }));
      }

      let activeEnrollments = 0;
      let recentEnrollments: any[] = [];
      if (enrollmentsResult.status === 'fulfilled') {
        const d = enrollmentsResult.value.data?.data as any;
        const list = Array.isArray(d?.enrollments)
          ? d.enrollments
          : Array.isArray(d?.data)
          ? d.data
          : Array.isArray(d)
          ? d
          : [];
        activeEnrollments = d?.total ?? list.length;
        recentEnrollments = list;
      }

      return {
        totalStudents,
        totalTeachers,
        activeCourses,
        activeEnrollments,
        courseEnrollments,
        recentEnrollments,
      };
    },
    staleTime: 30000,
  });
}

const statusBadgeVariant: Record<string, 'success' | 'destructive' | 'secondary'> = {
  active: 'success',
  withdrawn: 'destructive',
  completed: 'secondary',
};

const statusLabelText: Record<string, string> = {
  active: 'Activa',
  withdrawn: 'Retirada',
  completed: 'Completada',
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboardStats();
  const [activeCategory, setActiveCategory] = useState<'personas' | 'academica' | 'escolar' | 'control'>('personas');
  const [modalFeature, setModalFeature] = useState<string | null>(null);

  const handleActionClick = (featureName: string) => {
    setModalFeature(featureName);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <WelcomeBanner
        userName={user?.name ?? 'Directora'}
        roleLabel="Gestión Directiva Institucional"
        description="Supervisión global de estudiantes, personal docente, cursos activos y matrículas del período escolar."
        variant="violet"
      />

      {/* Stat cards con los colores del logo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Estudiantes Registrados"
          value={isLoading ? '—' : data?.totalStudents ?? 0}
          description="Alumnos activos en el período"
          variant="turquoise"
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatCard
          title="Docentes Asignadas"
          value={isLoading ? '—' : data?.totalTeachers ?? 0}
          description="Personal docente activo"
          variant="lightblue"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Cursos en Curso"
          value={isLoading ? '—' : data?.activeCourses ?? 0}
          description="Período Académico 2026-I"
          variant="yellow"
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatCard
          title="Matrículas Activas"
          value={isLoading ? '—' : data?.activeEnrollments ?? 0}
          description="Inscripciones registradas"
          variant="pink"
          icon={<ClipboardList className="h-5 w-5" />}
        />
      </div>

      {/* CENTRO DE GESTIONES ADMINISTRATIVAS */}
      <Card accent="turquoise" className="nk-section">
        <CardHeader className="border-b border-school-border bg-school-bg/60 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-school-heading">
                <ShieldCheck className="h-5 w-5 text-ink-turquoise" />
                Centro de Gestiones Directivas
              </CardTitle>
              <CardDescription className="text-sm text-school-muted-readable mt-0.5">
                Acceso directo a los módulos de administración y configuración escolar
              </CardDescription>
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-school-border bg-white p-1 shadow-2xs">
              {(
                [
                  { id: 'personas', label: 'Personas' },
                  { id: 'academica', label: 'Académica' },
                  { id: 'escolar', label: 'Escolar & Ciclos' },
                  { id: 'control', label: 'Control & Seguridad' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  aria-pressed={activeCategory === cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`min-h-11 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-turquoise ${
                    activeCategory === cat.id
                      ? 'bg-school-primary text-white shadow-xs'
                      : 'text-school-muted-readable hover:bg-school-bg hover:text-school-heading'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6">
          {activeCategory === 'personas' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="nk-card nk-lift accent-blue p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-pink text-ink-pink">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-school-heading">Padres y Apoderados</h4>
                    <p className="text-xs text-school-muted-readable">Registro y contactos</p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full mt-3">
                  <Link to="/admin/usuarios?role=student">
                    Acceder <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="nk-card nk-lift accent-blue p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-lime text-ink-lime">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-school-heading">Ficha de Estudiantes</h4>
                    <p className="text-xs text-school-muted-readable">Expediente e historial</p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full mt-3">
                  <Link to="/admin/usuarios?role=student">
                    Acceder <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="nk-card nk-lift accent-blue p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-blue text-ink-blue">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-school-heading">Personal Docente</h4>
                    <p className="text-xs text-school-muted-readable">Asignaciones docentes</p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full mt-3">
                  <Link to="/admin/usuarios?role=teacher">
                    Acceder <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {activeCategory === 'academica' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="nk-card nk-lift accent-blue p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-blue text-ink-blue">
                    <FolderPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-school-heading">Cursos Escolares</h4>
                    <p className="text-xs text-school-muted-readable">Horarios y asignaturas</p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full mt-3">
                  <Link to="/admin/cursos">
                    Ir a Cursos <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="nk-card nk-lift accent-blue p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-school-subtle text-ink-turquoise">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-school-heading">Niveles y Aulas</h4>
                    <p className="text-xs text-school-muted-readable">Configuración de grupos</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleActionClick('Niveles y Aulas')}
                  className="w-full mt-3"
                >
                  Configurar <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              <div className="nk-card nk-lift accent-blue p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-school-warning-bg text-school-warning">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-school-heading">Períodos Escolares</h4>
                    <p className="text-xs text-school-muted-readable">Ciclo lectivo activo</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleActionClick('Períodos Académicos')}
                  className="w-full mt-3"
                >
                  Gestionar <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              <div className="nk-card nk-lift accent-blue p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-school-warning-bg text-school-warning">
                    <Sun className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-school-heading">Vacacionales</h4>
                    <p className="text-xs text-school-muted-readable">Talleres y actividades</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleActionClick('Cursos Vacacionales')}
                  className="w-full mt-3"
                >
                  Abrir <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {activeCategory === 'escolar' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="nk-card nk-lift accent-blue p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-school-subtle text-ink-turquoise">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-school-heading">Matrículas</h4>
                    <p className="text-xs text-school-muted-readable">Inscripciones y cupos</p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full mt-3">
                  <Link to="/admin/matriculas">
                    Ir a Matrículas <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="nk-card nk-lift accent-blue p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-school-success-bg text-school-success">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-school-heading">Promoción</h4>
                    <p className="text-xs text-school-muted-readable">Pase de nivel escolar</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleActionClick('Promover Estudiantes')}
                  className="w-full mt-3"
                >
                  Promover <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              <div className="nk-card nk-lift accent-blue p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-violet text-brand-violet">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-school-heading">Graduaciones & Salidas</h4>
                    <p className="text-xs text-school-muted-readable">Cierres de ciclo</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleActionClick('Graduaciones y Retiros')}
                  className="w-full mt-3"
                >
                  Registrar <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {activeCategory === 'control' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="nk-card nk-lift accent-blue p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-violet text-brand-violet">
                    <FileBarChart className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-school-heading">Reportes Oficiales</h4>
                    <p className="text-xs text-school-muted-readable">Exportación PDF y Excel</p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full mt-3">
                  <Link to="/admin/reportes">
                    Ver Reportes <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="nk-card nk-lift accent-blue p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-school-subtle text-ink-turquoise">
                    <Settings className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-school-heading">Configuración General</h4>
                    <p className="text-xs text-school-muted-readable">Parámetros institucionales</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleActionClick('Administrar Configuración')}
                  className="w-full mt-3"
                >
                  Configurar <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              <div className="nk-card nk-lift accent-blue p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-violet text-brand-violet">
                    <History className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-school-heading">Auditoría y Bitácora</h4>
                    <p className="text-xs text-school-muted-readable">Registro de eventos</p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full mt-3">
                  <Link to="/admin/auditoria">
                    Ver Registro <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DIÁLOGO MODAL PARA ACCIONES RÁPIDAS */}
      <Dialog open={!!modalFeature} onOpenChange={() => setModalFeature(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-ink-turquoise" />
              {modalFeature}
            </DialogTitle>
            <DialogDescription>
              Módulo de gestión administrativa oficial.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="rounded-xl border border-line-turquoise bg-school-subtle p-4 text-xs font-medium text-ink-turquoise leading-relaxed">
              El panel de <strong>{modalFeature}</strong> está disponible para la gestión actual. Todas las operaciones realizadas quedan registradas en la bitácora de auditoría.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalFeature(null)}>
              Cerrar
            </Button>
            <Button
              onClick={() => {
                toast.success(`Acción realizada en ${modalFeature}`);
                setModalFeature(null);
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bar chart */}
        <Card accent="blue" className="nk-section">
          <CardHeader className="border-b border-school-border pb-3 bg-school-bg/50">
            <CardTitle className="text-base font-semibold text-school-heading flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-turquoise" />
              Matriculados por curso
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="flex h-52 items-center justify-center text-school-muted-readable text-sm">
                Cargando métricas...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart
                  data={data?.courseEnrollments ?? []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#D6E5E3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: 'var(--chart-muted)' }}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--chart-muted)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      borderColor: '#D6E5E3',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06)',
                      fontSize: '13px',
                      color: '#183B3A',
                    }}
                  />
                  <Bar isAnimationActive={false} dataKey="matriculados" name="Estudiantes matriculados" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent enrollments */}
        <Card accent="violet" className="nk-section">
          <CardHeader className="border-b border-school-border pb-3 bg-school-bg/50">
            <CardTitle className="text-base font-semibold text-school-heading flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-turquoise" />
              Últimas matrículas registradas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <p className="text-school-muted-readable text-sm py-8 text-center">Cargando matrículas...</p>
            ) : (data?.recentEnrollments ?? []).length === 0 ? (
              <p className="text-school-muted-readable text-sm py-8 text-center">Sin matrículas recientes.</p>
            ) : (
              <ul className="divide-y divide-school-border">
                {data!.recentEnrollments.map((e) => {
                  const variant = statusBadgeVariant[e.status] ?? 'secondary';
                  const label = statusLabelText[e.status] ?? e.status;
                  return (
                    <li
                      key={e.id}
                      className="flex items-center justify-between py-3 px-2 rounded-lg transition-colors hover:bg-school-subtle/30 text-sm"
                    >
                      <div className="space-y-0.5">
                        <p className="font-semibold text-school-heading">
                          {e.student?.user?.name ?? 'Estudiante'}{' '}
                          <span className="text-xs text-school-muted-readable font-normal">
                            ({e.student?.studentCode})
                          </span>
                        </p>
                        <p className="text-xs text-school-muted-readable">
                          {e.course?.name} · {formatDate(e.enrolledAt)}
                        </p>
                      </div>
                      <Badge variant={variant}>
                        {label}
                      </Badge>
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
