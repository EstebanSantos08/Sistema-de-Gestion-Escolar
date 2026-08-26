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
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

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
];

const teacherNav: NavItem[] = [
  { to: '/docente', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: '/docente/mis-cursos', label: 'Mis Cursos', icon: <BookOpen className="h-4 w-4" /> },
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

  return (
    <aside className="hidden w-60 shrink-0 border-r bg-white md:flex md:flex-col">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <BookMarked className="h-6 w-6 text-primary" />
        <span className="font-bold text-lg leading-tight">
          {import.meta.env.VITE_APP_NAME ?? 'Sistema Escolar'}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to.split('/').length <= 2}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
