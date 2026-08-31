import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  FileBarChart,
  GraduationCap,
  BookMarked,
  Star,
  ScrollText,
  UserCheck,
  ClipboardCheck,
  CalendarCheck,
  MessageSquare,
  Megaphone,
  History,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { NiceKidsLogo } from '@/components/shared/NiceKidsLogo';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: '/admin/usuarios', label: 'Usuarios', icon: <Users className="h-4 w-4" /> },
  { to: '/admin/cursos', label: 'Cursos', icon: <BookOpen className="h-4 w-4" /> },
  { to: '/admin/matriculas', label: 'Matrículas', icon: <ClipboardList className="h-4 w-4" /> },
  { to: '/admin/reportes', label: 'Reportes', icon: <FileBarChart className="h-4 w-4" /> },
  { to: '/admin/auditoria', label: 'Auditoría', icon: <History className="h-4 w-4" /> },
];

const teacherNav: NavItem[] = [
  { to: '/docente', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: '/docente/mis-cursos', label: 'Mis Cursos', icon: <BookOpen className="h-4 w-4" /> },
  { to: '/docente/estudiantes', label: 'Estudiantes', icon: <UserCheck className="h-4 w-4" /> },
  { to: '/docente/bitacora', label: 'Bitácora', icon: <BookMarked className="h-4 w-4" /> },
  { to: '/docente/asistencia', label: 'Asistencia', icon: <ClipboardCheck className="h-4 w-4" /> },
  { to: '/docente/actividades', label: 'Actividades', icon: <CalendarCheck className="h-4 w-4" /> },
  { to: '/docente/observaciones', label: 'Observaciones', icon: <MessageSquare className="h-4 w-4" /> },
  { to: '/docente/comunicados', label: 'Comunicados', icon: <Megaphone className="h-4 w-4" /> },
];

const studentNav: NavItem[] = [
  { to: '/estudiante', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: '/estudiante/mis-cursos', label: 'Mis Cursos', icon: <GraduationCap className="h-4 w-4" /> },
  { to: '/estudiante/mis-notas', label: 'Mis Notas', icon: <Star className="h-4 w-4" /> },
  { to: '/estudiante/historial', label: 'Historial', icon: <ScrollText className="h-4 w-4" /> },
];

export function Sidebar() {
  const { user } = useAuth();

  const navItems =
    user?.role === 'admin'
      ? adminNav
      : user?.role === 'teacher'
        ? teacherNav
        : studentNav;

  // Colores del arcoíris asignados secuencialmente a los ítems del menú
  const rainbowHoverStyles = [
    { active: 'bg-[#E84B5B] text-white shadow-md shadow-[#E84B5B]/30', hover: 'hover:bg-[#E84B5B]/15 hover:text-[#E84B5B]' },
    { active: 'bg-[#008BC1] text-white shadow-md shadow-[#008BC1]/30', hover: 'hover:bg-[#008BC1]/15 hover:text-[#008BC1]' },
    { active: 'bg-[#F4B51B] text-slate-900 shadow-md shadow-[#F4B51B]/30 font-bold', hover: 'hover:bg-[#F4B51B]/20 hover:text-amber-800' },
    { active: 'bg-[#31B45A] text-white shadow-md shadow-[#31B45A]/30', hover: 'hover:bg-[#31B45A]/15 hover:text-[#31B45A]' },
    { active: 'bg-[#7D5AA6] text-white shadow-md shadow-[#7D5AA6]/30', hover: 'hover:bg-[#7D5AA6]/15 hover:text-[#7D5AA6]' },
    { active: 'bg-[#E8798A] text-white shadow-md shadow-[#E8798A]/30', hover: 'hover:bg-[#E8798A]/15 hover:text-[#E8798A]' },
    { active: 'bg-[#09A9C2] text-white shadow-md shadow-[#09A9C2]/30', hover: 'hover:bg-[#09A9C2]/15 hover:text-[#09A9C2]' },
  ];

  return (
    <aside className="hidden w-64 shrink-0 bg-white/95 backdrop-blur-md text-slate-800 md:flex md:flex-col shadow-2xl z-20 my-3 ml-3 rounded-3xl border border-white/40 overflow-hidden">
      {/* Brand Header con logo oficial NICE KIDS 3D (Fredoka ExtraBold + borde grueso + 2da sombra) */}
      <div className="flex flex-col items-center justify-center pt-5 pb-4 px-3 border-b border-teal-100/60 bg-gradient-to-b from-teal-50/70 to-white relative">
        {/* Puntos flotantes superiores del letrero original */}
        <div className="absolute top-2 right-4 flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#31B45A] shadow-sm animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="h-2 w-2 rounded-full bg-[#008BC1] shadow-sm animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="h-2 w-2 rounded-full bg-[#09A9C2] shadow-sm animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>

        <NiceKidsLogo size="md" showSubtitle={true} />
      </div>


      {/* Nav List con colores dinámicos arcoíris */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
          Menú Principal
        </p>
        <ul className="space-y-1.5">
          {navItems.map((item, index) => {
            const style = rainbowHoverStyles[index % rainbowHoverStyles.length];
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to.split('/').length <= 2}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200',
                      isActive
                        ? `${style.active} translate-x-1`
                        : `text-slate-600 ${style.hover} hover:translate-x-0.5`
                    )
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer / Badge */}
      <div className="border-t border-slate-100 p-3 bg-slate-50/50 text-xs text-slate-500 text-center font-medium">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#31B45A] mr-1.5 animate-pulse shadow-sm" />
        Sistema NICE KIDS Activo
      </div>
    </aside>
  );
}

