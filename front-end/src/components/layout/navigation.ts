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
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/cursos', label: 'Cursos', icon: BookOpen },
  { to: '/admin/matriculas', label: 'Matrículas', icon: ClipboardList },
  { to: '/admin/reportes', label: 'Reportes', icon: FileBarChart },
  { to: '/admin/auditoria', label: 'Auditoría', icon: History },
];

const teacherNav: NavItem[] = [
  { to: '/docente', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/docente/mis-cursos', label: 'Mis Cursos', icon: BookOpen },
  { to: '/docente/estudiantes', label: 'Estudiantes', icon: UserCheck },
  { to: '/docente/bitacora', label: 'Bitácora', icon: BookMarked },
  { to: '/docente/asistencia', label: 'Asistencia', icon: ClipboardCheck },
  { to: '/docente/actividades', label: 'Actividades', icon: CalendarCheck },
  { to: '/docente/observaciones', label: 'Observaciones', icon: MessageSquare },
  { to: '/docente/comunicados', label: 'Comunicados', icon: Megaphone },
];

const studentNav: NavItem[] = [
  { to: '/estudiante', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/estudiante/mis-cursos', label: 'Mis Cursos', icon: GraduationCap },
  { to: '/estudiante/mis-notas', label: 'Mis Notas', icon: Star },
  { to: '/estudiante/asistencia', label: 'Asistencia', icon: ClipboardCheck },
  { to: '/estudiante/actividades', label: 'Actividades', icon: CalendarCheck },
  { to: '/estudiante/observaciones', label: 'Observaciones', icon: MessageSquare },
  { to: '/estudiante/comunicados', label: 'Comunicados', icon: Megaphone },
  { to: '/estudiante/historial', label: 'Historial', icon: ScrollText },
];

export function navigationForRole(role?: string) {
  return role === 'admin' ? adminNav : role === 'teacher' ? teacherNav : studentNav;
}

export function isNavigationActive(pathname: string, destination: string) {
  if (pathname === destination) return true;
  if (destination.endsWith('/mis-cursos')) {
    return pathname.startsWith(destination.replace('/mis-cursos', '/cursos/'));
  }
  return destination.split('/').length > 2 && pathname.startsWith(`${destination}/`);
}

export const navigationLinkClass = (active: boolean) =>
  `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087F79] ${active ? 'bg-[#E3F5F3] text-[#087F79] font-semibold' : 'text-[#365451] hover:bg-[#F4FAF9]'}`;
