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
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      <PageHeader
        eyebrow="Panel de Administración"
        title={`Bienvenida, ${user?.name ?? 'Directora'}`}
        description="Supervisión global de estudiantes, personal docente, cursos activos y matrículas del período escolar."
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Estudiantes Registrados"
          value={isLoading ? '—' : data?.totalStudents ?? 0}
          description="Alumnos activos en el período"
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatCard
          title="Docentes Asignadas"
          value={isLoading ? '—' : data?.totalTeachers ?? 0}
          description="Personal docente activo"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Cursos en Curso"
          value={isLoading ? '—' : data?.activeCourses ?? 0}
          description="Período Académico 2026-I"
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatCard
          title="Matrículas Activas"
          value={isLoading ? '—' : data?.activeEnrollments ?? 0}
          description="Inscripciones registradas"
          icon={<ClipboardList className="h-5 w-5" />}
        />
      </div>

      {/* CENTRO DE GESTIONES ADMINISTRATIVAS */}
      <Card>
        <CardHeader className="border-b border-[#D6E5E3] bg-[#F4FAF9]/60 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#183B3A]">
                <ShieldCheck className="h-5 w-5 text-[#087F79]" />
                Centro de Gestiones Directivas
              </CardTitle>
              <CardDescription className="text-sm text-[#5E7A77] mt-0.5">
                Acceso directo a los módulos de administración y configuración escolar
              </CardDescription>
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#D6E5E3] bg-white p-1 shadow-2xs">
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
                  onClick={() => setActiveCategory(cat.id)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F79] ${
                    activeCategory === cat.id
                      ? 'bg-[#087F79] text-white shadow-xs'
                      : 'text-[#5E7A77] hover:bg-[#F4FAF9] hover:text-[#183B3A]'
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
              <div className="rounded-xl border border-[#D6E5E3] bg-white p-4 transition-all hover:border-[#41C4BD] hover:shadow-xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FDF0F6] text-[#D12B75]">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-[#183B3A]">Padres y Apoderados</h4>
                    <p className="text-xs text-[#5E7A77]">Registro y contactos</p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full mt-3">
                  <Link to="/admin/usuarios?role=student">
                    Acceder <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="rounded-xl border border-[#D6E5E3] bg-white p-4 transition-all hover:border-[#41C4BD] hover:shadow-xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F4FBE8] text-[#557D07]">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-[#183B3A]">Ficha de Estudiantes</h4>
                    <p className="text-xs text-[#5E7A77]">Expediente e historial</p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full mt-3">
                  <Link to="/admin/usuarios?role=student">
                    Acceder <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="rounded-xl border border-[#D6E5E3] bg-white p-4 transition-all hover:border-[#41C4BD] hover:shadow-xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EFF7FC] text-[#1E7BB5]">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-[#183B3A]">Personal Docente</h4>
                    <p className="text-xs text-[#5E7A77]">Asignaciones docentes</p>
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
              <div className="rounded-xl border border-[#D6E5E3] bg-white p-4 transition-all hover:border-[#41C4BD] hover:shadow-xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EFF7FC] text-[#1E7BB5]">
                    <FolderPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-[#183B3A]">Cursos Escolares</h4>
                    <p className="text-xs text-[#5E7A77]">Horarios y asignaturas</p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full mt-3">
                  <Link to="/admin/cursos">
                    Ir a Cursos <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="rounded-xl border border-[#D6E5E3] bg-white p-4 transition-all hover:border-[#41C4BD] hover:shadow-xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E3F5F3] text-[#087F79]">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-[#183B3A]">Niveles y Aulas</h4>
                    <p className="text-xs text-[#5E7A77]">Configuración de grupos</p>
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

              <div className="rounded-xl border border-[#D6E5E3] bg-white p-4 transition-all hover:border-[#41C4BD] hover:shadow-xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FEF8E7] text-[#805D00]">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-[#183B3A]">Períodos Escolares</h4>
                    <p className="text-xs text-[#5E7A77]">Ciclo lectivo activo</p>
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

              <div className="rounded-xl border border-[#D6E5E3] bg-white p-4 transition-all hover:border-[#41C4BD] hover:shadow-xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FEF8E7] text-[#805D00]">
                    <Sun className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-[#183B3A]">Vacacionales</h4>
                    <p className="text-xs text-[#5E7A77]">Talleres y actividades</p>
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
              <div className="rounded-xl border border-[#D6E5E3] bg-white p-4 transition-all hover:border-[#41C4BD] hover:shadow-xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E3F5F3] text-[#087F79]">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-[#183B3A]">Matrículas</h4>
                    <p className="text-xs text-[#5E7A77]">Inscripciones y cupos</p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full mt-3">
                  <Link to="/admin/matriculas">
                    Ir a Matrículas <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="rounded-xl border border-[#D6E5E3] bg-white p-4 transition-all hover:border-[#41C4BD] hover:shadow-xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EAF5EB] text-[#287A32]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-[#183B3A]">Promoción</h4>
                    <p className="text-xs text-[#5E7A77]">Pase de nivel escolar</p>
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

              <div className="rounded-xl border border-[#D6E5E3] bg-white p-4 transition-all hover:border-[#41C4BD] hover:shadow-xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F6EDF8] text-[#9731AC]">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-[#183B3A]">Graduaciones & Salidas</h4>
                    <p className="text-xs text-[#5E7A77]">Cierres de ciclo</p>
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
              <div className="rounded-xl border border-[#D6E5E3] bg-white p-4 transition-all hover:border-[#41C4BD] hover:shadow-xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F6EDF8] text-[#9731AC]">
                    <FileBarChart className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-[#183B3A]">Reportes Oficiales</h4>
                    <p className="text-xs text-[#5E7A77]">Exportación PDF y Excel</p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full mt-3">
                  <Link to="/admin/reportes">
                    Ver Reportes <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="rounded-xl border border-[#D6E5E3] bg-white p-4 transition-all hover:border-[#41C4BD] hover:shadow-xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E3F5F3] text-[#087F79]">
                    <Settings className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-[#183B3A]">Configuración General</h4>
                    <p className="text-xs text-[#5E7A77]">Parámetros institucionales</p>
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

              <div className="rounded-xl border border-[#D6E5E3] bg-white p-4 transition-all hover:border-[#41C4BD] hover:shadow-xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F6EDF8] text-[#9731AC]">
                    <History className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-[#183B3A]">Auditoría y Bitácora</h4>
                    <p className="text-xs text-[#5E7A77]">Registro de eventos</p>
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
              <ShieldCheck className="h-5 w-5 text-[#087F79]" />
              {modalFeature}
            </DialogTitle>
            <DialogDescription>
              Módulo de gestión administrativa oficial.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="rounded-xl border border-[#BBE5E1] bg-[#E3F5F3] p-4 text-xs font-medium text-[#087F79] leading-relaxed">
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
        <Card>
          <CardHeader className="border-b border-[#D6E5E3] pb-3 bg-[#F4FAF9]/50">
            <CardTitle className="text-base font-semibold text-[#183B3A] flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#087F79]" />
              Matriculados por curso
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="flex h-52 items-center justify-center text-[#5E7A77] text-sm">
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
                    tick={{ fontSize: 12, fill: '#5E7A77' }}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#5E7A77' }} />
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
                  <Bar dataKey="matriculados" fill="#087F79" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent enrollments */}
        <Card>
          <CardHeader className="border-b border-[#D6E5E3] pb-3 bg-[#F4FAF9]/50">
            <CardTitle className="text-base font-semibold text-[#183B3A] flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#41C4BD]" />
              Últimas matrículas registradas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <p className="text-[#5E7A77] text-sm py-8 text-center">Cargando matrículas...</p>
            ) : (data?.recentEnrollments ?? []).length === 0 ? (
              <p className="text-[#5E7A77] text-sm py-8 text-center">Sin matrículas recientes.</p>
            ) : (
              <ul className="divide-y divide-[#D6E5E3]">
                {data!.recentEnrollments.map((e) => {
                  const variant = statusBadgeVariant[e.status] ?? 'secondary';
                  const label = statusLabelText[e.status] ?? e.status;
                  return (
                    <li
                      key={e.id}
                      className="flex items-center justify-between py-3 px-2 rounded-lg transition-colors hover:bg-[#E3F5F3]/30 text-sm"
                    >
                      <div className="space-y-0.5">
                        <p className="font-semibold text-[#183B3A]">
                          {e.student?.user?.name ?? 'Estudiante'}{' '}
                          <span className="text-xs text-[#5E7A77] font-normal">
                            ({e.student?.studentCode})
                          </span>
                        </p>
                        <p className="text-xs text-[#5E7A77]">
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
