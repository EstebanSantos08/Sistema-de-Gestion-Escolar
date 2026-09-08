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

export interface NavItem {
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

const parentNav: NavItem[] = [
  { to: '/estudiante', label: 'Resumen Escolar', icon: LayoutDashboard },
  { to: '/estudiante/mis-cursos', label: 'Cursos del Estudiante', icon: GraduationCap },
  { to: '/estudiante/mis-notas', label: 'Calificaciones', icon: Star },
  { to: '/estudiante/asistencia', label: 'Registro de Asistencia', icon: ClipboardCheck },
  { to: '/estudiante/actividades', label: 'Tareas y Tareas', icon: CalendarCheck },
  { to: '/estudiante/observaciones', label: 'Observaciones', icon: MessageSquare },
  { to: '/estudiante/comunicados', label: 'Comunicados Oficiales', icon: Megaphone },
];

export function navigationForRole(role?: string) {
  if (role === 'admin') return adminNav;
  if (role === 'teacher') return teacherNav;
  if (role === 'parent') return parentNav;
  return studentNav;
}

export function isNavigationActive(pathname: string, destination: string) {
  if (pathname === destination) return true;
  if (destination.endsWith('/mis-cursos')) {
    return pathname.startsWith(destination.replace('/mis-cursos', '/cursos/'));
  }
  return destination.split('/').length > 2 && pathname.startsWith(`${destination}/`);
}

export const navigationLinkClass = (active: boolean) =>
  `group flex min-h-[44px] items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F79] focus-visible:ring-offset-1 ${
    active
      ? 'bg-[#E3F5F3] text-[#087F79] font-semibold shadow-2xs border-l-4 border-[#087F79] pl-2.5'
      : 'text-[#365451] hover:bg-[#F4FAF9] hover:text-[#183B3A] border-l-4 border-transparent'
  }`;
