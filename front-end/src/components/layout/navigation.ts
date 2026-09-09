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
  { to: '/admin', label: 'Inicio', icon: LayoutDashboard },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/cursos', label: 'Cursos', icon: BookOpen },
  { to: '/admin/matriculas', label: 'Matrículas', icon: ClipboardList },
  { to: '/admin/reportes', label: 'Reportes', icon: FileBarChart },
  { to: '/admin/auditoria', label: 'Auditoría', icon: History },
];

const teacherNav: NavItem[] = [
  { to: '/docente', label: 'Inicio', icon: LayoutDashboard },
  { to: '/docente/mis-cursos', label: 'Mis Cursos', icon: BookOpen },
  { to: '/docente/estudiantes', label: 'Estudiantes', icon: UserCheck },
  { to: '/docente/bitacora', label: 'Bitácora', icon: BookMarked },
  { to: '/docente/asistencia', label: 'Asistencia', icon: ClipboardCheck },
  { to: '/docente/actividades', label: 'Actividades', icon: CalendarCheck },
  { to: '/docente/observaciones', label: 'Observaciones', icon: MessageSquare },
  { to: '/docente/comunicados', label: 'Comunicados', icon: Megaphone },
];

const studentNav: NavItem[] = [
  { to: '/estudiante', label: 'Inicio', icon: LayoutDashboard },
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
  { to: '/estudiante/actividades', label: 'Actividades y tareas', icon: CalendarCheck },
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

export function categoryAccent(path: string): 'turquoise' | 'blue' | 'lime' | 'yellow' | 'pink' | 'violet' {
  if (/auditoria|reportes|observaciones/.test(path)) return 'violet';
  if (/asistencia/.test(path)) return 'lime';
  if (/notas|actividades/.test(path)) return 'yellow';
  if (/comunicados/.test(path)) return 'pink';
  if (/cursos|usuarios|estudiantes|matriculas/.test(path)) return 'blue';
  return 'turquoise';
}

export const navigationLinkClass = (_active: boolean, destination = '') => `nk-nav accent-${categoryAccent(destination)}`;
