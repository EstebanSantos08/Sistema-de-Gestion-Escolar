import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { navigationForRole, isNavigationActive, navigationLinkClass } from './navigation';
import { NiceKidsLogo } from '@/components/shared/NiceKidsLogo';

const roles = {
  admin: { label: 'Administrador', variant: 'purple' },
  teacher: { label: 'Docente', variant: 'secondary' },
  student: { label: 'Estudiante', variant: 'lime' },
  parent: { label: 'Representante', variant: 'pink' },
} as const;

export function Sidebar() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const role = roles[user?.role ?? 'student'];
  return (
    <aside className="nk-sidebar sticky top-0 z-20 hidden h-dvh w-64 shrink-0 flex-col md:flex">
      <div className="nk-brand relative px-6 pb-5 pt-7">
        <Link to="/" className="inline-block" aria-label="NICE KIDS, inicio">
          <NiceKidsLogo size="md" showSubtitle showBar />
        </Link>
      </div>
      <nav aria-label="Navegación principal" className="flex-1 space-y-1 overflow-y-auto p-3">
        {navigationForRole(user?.role).map(({ to, label, icon: Icon }, index) => (
          <div key={to}>
            {(index === 0 || index === 3) && <p className="px-3 pb-2 pt-4 text-xs font-semibold text-school-muted-readable">{index === 0 ? 'Tu espacio' : 'Seguimiento escolar'}</p>}
            <Link to={to} aria-current={isNavigationActive(pathname, to) ? 'page' : undefined} className={navigationLinkClass(isNavigationActive(pathname, to), to)}>
              <span className="nk-icon"><Icon aria-hidden="true" className="h-4 w-4" /></span>
              <span className="min-w-0 leading-snug">{label}</span>
            </Link>
          </div>
        ))}
      </nav>
      <div className="m-3 rounded-2xl border border-line-turquoise bg-surface-turquoise p-4">
        <p className="mb-2 truncate text-sm font-semibold text-school-heading">{user?.name || 'Usuario'}</p>
        <Badge variant={role.variant}>{role.label}</Badge>
      </div>
    </aside>
  );
}
