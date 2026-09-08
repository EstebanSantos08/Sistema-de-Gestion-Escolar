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

export const navColors = [
  { text: 'text-[#41C4BD]', bg: 'bg-[#E3F5F3]', border: 'border-[#41C4BD]/40' },
  { text: 'text-[#D12B75]', bg: 'bg-[#FDF0F6]', border: 'border-[#FF5DA0]/40' },
  { text: 'text-[#B38F00]', bg: 'bg-[#FEF8E7]', border: 'border-[#F2C700]/40' },
  { text: 'text-[#557D07]', bg: 'bg-[#F4FBE8]', border: 'border-[#9DD31B]/40' },
  { text: 'text-[#9731AC]', bg: 'bg-[#F6EDF8]', border: 'border-[#9731AC]/40' },
  { text: 'text-[#D4592B]', bg: 'bg-[#FFF2ED]', border: 'border-[#FF8A5B]/40' },
  { text: 'text-[#1E7BB5]', bg: 'bg-[#EFF7FC]', border: 'border-[#64B6E5]/40' },
];

export const getNavColor = (index: number) => navColors[index % navColors.length];

export const navigationLinkClass = (active: boolean, index: number = 0) => {
  const color = getNavColor(index);
  return `group flex min-h-[44px] items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#41C4BD] ${
    active
      ? `${color.bg} ${color.text} font-bold shadow-xs scale-[1.02] border-2 ${color.border}`
      : `text-[#365451] hover:${color.bg} hover:${color.text} hover:translate-x-1 border-2 border-transparent`
  }`;
};
