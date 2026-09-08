import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { NiceKidsLogo } from '@/components/shared/NiceKidsLogo';
import { navigationForRole, isNavigationActive, navigationLinkClass } from './navigation';

export function Sidebar() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-[#D6E5E3] bg-white md:flex">
      <div className="flex justify-center border-b border-[#D6E5E3] px-4 py-6">
        <NiceKidsLogo size="md" showSubtitle />
      </div>
      <nav aria-label="Navegación principal" className="flex-1 space-y-1 overflow-y-auto p-3">
        {navigationForRole(user?.role).map(({ to, label, icon: Icon }) => {
          const active = isNavigationActive(pathname, to);
          return <Link key={to} to={to} aria-current={active ? 'page' : undefined} className={navigationLinkClass(active)}>
            <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />{label}
          </Link>;
        })}
      </nav>
      <p className="border-t border-[#D6E5E3] p-4 text-sm text-[#365451]">Gestión escolar · NICE KIDS</p>
    </aside>
  );
}
