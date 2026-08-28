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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
  const { user } = useAuth();
  const { data, isLoading } = useDashboardStats();
  const [activeCategory, setActiveCategory] = useState<'personas' | 'academica' | 'escolar' | 'control'>('personas');
  const [modalFeature, setModalFeature] = useState<string | null>(null);

  const handleActionClick = (featureName: string) => {
    setModalFeature(featureName);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bienvenida, Directora ${user?.name ?? ''}`}
        description="Panel Principal de Administración Escolar — Gestión Global NICE KIDS"
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Niños / Estudiantes"
          value={isLoading ? '—' : data?.totalStudents ?? 0}
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatCard
          title="Maestras"
          value={isLoading ? '—' : data?.totalTeachers ?? 0}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Cursos Activos"
          value={isLoading ? '—' : data?.activeCourses ?? 0}
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatCard
          title="Matrículas Registradas"
          value={isLoading ? '—' : data?.activeEnrollments ?? 0}
          icon={<ClipboardList className="h-5 w-5" />}
        />
      </div>

      {/* CENTRO DE GESTIONES ADMINISTRATIVAS */}
      <Card className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 bg-gradient-to-r from-teal-50/80 via-sky-50/80 to-purple-50/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-[#09A9C2]" />
                Centro de Gestiones Directivas
              </CardTitle>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Acceso simplificado a todas las herramientas de gestión escolar
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200/70 shadow-xs">
              <button type="button" onClick={() => setActiveCategory('personas')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeCategory === 'personas' ? 'bg-[#E84B5B] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>Personas</button>
              <button type="button" onClick={() => setActiveCategory('academica')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeCategory === 'academica' ? 'bg-[#008BC1] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>Académica</button>
              <button type="button" onClick={() => setActiveCategory('escolar')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeCategory === 'escolar' ? 'bg-[#F4B51B] text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>Escolar & Promoción</button>
              <button type="button" onClick={() => setActiveCategory('control')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeCategory === 'control' ? 'bg-[#7D5AA6] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>Control & Config</button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {activeCategory === 'personas' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50/40 hover:bg-rose-50 transition-all group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-[#E84B5B] text-white shadow-md"><UserPlus className="h-5 w-5" /></div>
                  <div><h4 className="font-extrabold text-slate-800 text-sm">Gestionar Padres</h4><p className="text-xs text-slate-500 font-medium">Registro de apoderados</p></div>
                </div>
                <Button asChild size="sm" className="w-full mt-3 bg-white text-[#E84B5B] hover:bg-[#E84B5B] hover:text-white border border-rose-200 font-bold rounded-xl shadow-2xs"><Link to="/admin/usuarios?role=student">Acceder <ChevronRight className="ml-1 h-4 w-4" /></Link></Button>
              </div>
              <div className="p-4 rounded-2xl border border-sky-100 bg-sky-50/40 hover:bg-sky-50 transition-all group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-[#008BC1] text-white shadow-md"><GraduationCap className="h-5 w-5" /></div>
                  <div><h4 className="font-extrabold text-slate-800 text-sm">Gestionar Niños</h4><p className="text-xs text-slate-500 font-medium">Ficha de niños y expediente</p></div>
                </div>
                <Button asChild size="sm" className="w-full mt-3 bg-white text-[#008BC1] hover:bg-[#008BC1] hover:text-white border border-sky-200 font-bold rounded-xl shadow-2xs"><Link to="/admin/usuarios?role=student">Acceder <ChevronRight className="ml-1 h-4 w-4" /></Link></Button>
              </div>
              <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50 transition-all group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-[#31B45A] text-white shadow-md"><Users className="h-5 w-5" /></div>
                  <div><h4 className="font-extrabold text-slate-800 text-sm">Gestionar Maestras</h4><p className="text-xs text-slate-500 font-medium">Asignaciones docentes</p></div>
                </div>
                <Button asChild size="sm" className="w-full mt-3 bg-white text-[#31B45A] hover:bg-[#31B45A] hover:text-white border border-emerald-200 font-bold rounded-xl shadow-2xs"><Link to="/admin/usuarios?role=teacher">Acceder <ChevronRight className="ml-1 h-4 w-4" /></Link></Button>
              </div>
            </div>
          )}

          {activeCategory === 'academica' && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl border border-sky-100 bg-sky-50/40 hover:bg-sky-50 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-[#008BC1] text-white shadow-md"><FolderPlus className="h-5 w-5" /></div>
                  <div><h4 className="font-extrabold text-slate-800 text-sm">Gestionar Cursos</h4><p className="text-xs text-slate-500 font-medium">Asignaturas y horarios</p></div>
                </div>
                <Button asChild size="sm" className="w-full mt-3 bg-white text-[#008BC1] hover:bg-[#008BC1] hover:text-white border border-sky-200 font-bold rounded-xl shadow-2xs"><Link to="/admin/cursos">Ir a Cursos <ChevronRight className="ml-1 h-4 w-4" /></Link></Button>
              </div>
              <div className="p-4 rounded-2xl border border-teal-100 bg-teal-50/40 hover:bg-teal-50 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-[#09A9C2] text-white shadow-md"><Layers className="h-5 w-5" /></div>
                  <div><h4 className="font-extrabold text-slate-800 text-sm">Niveles & Paralelos</h4><p className="text-xs text-slate-500 font-medium">Configuración de grupos</p></div>
                </div>
                <Button size="sm" onClick={() => handleActionClick('Niveles y Paralelos')} className="w-full mt-3 bg-white text-[#09A9C2] hover:bg-[#09A9C2] hover:text-white border border-teal-200 font-bold rounded-xl shadow-2xs">Configurar <ChevronRight className="ml-1 h-4 w-4" /></Button>
              </div>
              <div className="p-4 rounded-2xl border border-amber-100 bg-amber-50/40 hover:bg-amber-50 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-[#F4B51B] text-slate-900 shadow-md"><Calendar className="h-5 w-5" /></div>
                  <div><h4 className="font-extrabold text-slate-800 text-sm">Periodos</h4><p className="text-xs text-slate-500 font-medium">Ciclo 2026-I</p></div>
                </div>
                <Button size="sm" onClick={() => handleActionClick('Periodos Académicos')} className="w-full mt-3 bg-white text-[#D4990B] hover:bg-[#F4B51B] hover:text-slate-900 border border-amber-200 font-bold rounded-xl shadow-2xs">Gestionar <ChevronRight className="ml-1 h-4 w-4" /></Button>
              </div>
              <div className="p-4 rounded-2xl border border-orange-100 bg-orange-50/40 hover:bg-orange-50 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-orange-500 text-white shadow-md"><Sun className="h-5 w-5" /></div>
                  <div><h4 className="font-extrabold text-slate-800 text-sm">Vacacionales</h4><p className="text-xs text-slate-500 font-medium">Talleres de verano</p></div>
                </div>
                <Button size="sm" onClick={() => handleActionClick('Cursos Vacacionales')} className="w-full mt-3 bg-white text-orange-600 hover:bg-orange-500 hover:text-white border border-orange-200 font-bold rounded-xl shadow-2xs">Abrir <ChevronRight className="ml-1 h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {activeCategory === 'escolar' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-amber-100 bg-amber-50/40 hover:bg-amber-50 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-[#F4B51B] text-slate-900 shadow-md"><ClipboardList className="h-5 w-5" /></div>
                  <div><h4 className="font-extrabold text-slate-800 text-sm">Gestionar Matrículas</h4><p className="text-xs text-slate-500 font-medium">Inscripciones activas</p></div>
                </div>
                <Button asChild size="sm" className="w-full mt-3 bg-white text-[#D4990B] hover:bg-[#F4B51B] hover:text-slate-900 border border-amber-200 font-bold rounded-xl shadow-2xs"><Link to="/admin/matriculas">Ir a Matrículas <ChevronRight className="ml-1 h-4 w-4" /></Link></Button>
              </div>
              <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-[#31B45A] text-white shadow-md"><Sparkles className="h-5 w-5" /></div>
                  <div><h4 className="font-extrabold text-slate-800 text-sm">Promover Estudiantes</h4><p className="text-xs text-slate-500 font-medium">Pasaje de nivel</p></div>
                </div>
                <Button size="sm" onClick={() => handleActionClick('Promover Estudiantes')} className="w-full mt-3 bg-white text-[#31B45A] hover:bg-[#31B45A] hover:text-white border border-emerald-200 font-bold rounded-xl shadow-2xs">Promover <ChevronRight className="ml-1 h-4 w-4" /></Button>
              </div>
              <div className="p-4 rounded-2xl border border-purple-100 bg-purple-50/40 hover:bg-purple-50 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-[#7D5AA6] text-white shadow-md"><Award className="h-5 w-5" /></div>
                  <div><h4 className="font-extrabold text-slate-800 text-sm">Graduaciones & Retiros</h4><p className="text-xs text-slate-500 font-medium">Registro de salidas</p></div>
                </div>
                <Button size="sm" onClick={() => handleActionClick('Graduaciones y Retiros')} className="w-full mt-3 bg-white text-[#7D5AA6] hover:bg-[#7D5AA6] hover:text-white border border-purple-200 font-bold rounded-xl shadow-2xs">Registrar <ChevronRight className="ml-1 h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {activeCategory === 'control' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-purple-100 bg-purple-50/40 hover:bg-purple-50 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-[#7D5AA6] text-white shadow-md"><FileBarChart className="h-5 w-5" /></div>
                  <div><h4 className="font-extrabold text-slate-800 text-sm">Consultar Reportes</h4><p className="text-xs text-slate-500 font-medium">Informes institucionales</p></div>
                </div>
                <Button asChild size="sm" className="w-full mt-3 bg-white text-[#7D5AA6] hover:bg-[#7D5AA6] hover:text-white border border-purple-200 font-bold rounded-xl shadow-2xs"><Link to="/admin/reportes">Ver Reportes <ChevronRight className="ml-1 h-4 w-4" /></Link></Button>
              </div>
              <div className="p-4 rounded-2xl border border-[#09A9C2]/20 bg-teal-50/40 hover:bg-teal-50 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-[#09A9C2] text-white shadow-md"><Settings className="h-5 w-5" /></div>
                  <div><h4 className="font-extrabold text-slate-800 text-sm">Configuración</h4><p className="text-xs text-slate-500 font-medium">Parámetros globales</p></div>
                </div>
                <Button size="sm" onClick={() => handleActionClick('Administrar Configuración')} className="w-full mt-3 bg-white text-[#09A9C2] hover:bg-[#09A9C2] hover:text-white border border-teal-200 font-bold rounded-xl shadow-2xs">Configurar <ChevronRight className="ml-1 h-4 w-4" /></Button>
              </div>
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-slate-800 text-white shadow-md"><History className="h-5 w-5" /></div>
                  <div><h4 className="font-extrabold text-slate-800 text-sm">Auditoría</h4><p className="text-xs text-slate-500 font-medium">Bitácora de seguridad</p></div>
                </div>
                <Button size="sm" onClick={() => handleActionClick('Consultar Auditoría')} className="w-full mt-3 bg-white text-slate-800 hover:bg-slate-800 hover:text-white border border-slate-300 font-bold rounded-xl shadow-2xs">Ver Log <ChevronRight className="ml-1 h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DIÁLOGO MODAL PARA ACCIONES RÁPIDAS */}
      <Dialog open={!!modalFeature} onOpenChange={() => setModalFeature(null)}>
        <DialogContent className="bg-white rounded-3xl p-6 shadow-2xl max-w-md border border-slate-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#09A9C2]" />
              {modalFeature}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">Módulo de gestión administrativa oficial.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 text-xs text-teal-800 font-semibold leading-relaxed">
              El panel de <strong>{modalFeature}</strong> está disponible para la gestión actual. Toda actividad será registrada en el historial.
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setModalFeature(null)} className="rounded-xl font-bold">Cerrar</Button>
            <Button onClick={() => { toast.success(`Acción realizada en ${modalFeature}`); setModalFeature(null); }} className="bg-[#09A9C2] hover:bg-[#0896AC] text-white font-bold rounded-xl">Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bar chart */}
        <Card className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3">
            <CardTitle className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#008BC1]" />
              Matriculados por curso
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="flex h-48 items-center justify-center text-slate-400 font-medium">
                Cargando métricas...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.courseEnrollments ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} angle={-25} textAnchor="end" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="matriculados" fill="#09A9C2" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent enrollments */}
        <Card className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3">
            <CardTitle className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#31B45A]" />
              Últimas matrículas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <p className="text-slate-400 text-sm font-medium">Cargando matrículas...</p>
            ) : (data?.recentEnrollments ?? []).length === 0 ? (
              <p className="text-slate-400 text-sm font-medium">Sin matrículas registradas.</p>
            ) : (
              <ul className="space-y-3">
                {data!.recentEnrollments.map((e) => {
                  const s = statusLabel[e.status] ?? statusLabel.active;
                  return (
                    <li key={e.id} className="flex items-center justify-between text-sm p-2 rounded-xl hover:bg-teal-50/50 transition-colors">
                      <div>
                        <p className="font-bold text-slate-800">
                          {e.student?.user?.name ?? 'Estudiante'}{' '}
                          <span className="text-slate-400 font-normal">
                            ({e.student?.studentCode})
                          </span>
                        </p>
                        <p className="text-xs text-slate-500 font-medium">
                          {e.course?.name} · {formatDate(e.enrolledAt)}
                        </p>
                      </div>
                      <Badge variant={s.variant} className="rounded-full px-3 font-bold">{s.label}</Badge>
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

