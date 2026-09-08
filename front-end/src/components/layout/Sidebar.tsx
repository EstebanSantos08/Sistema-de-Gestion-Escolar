import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { GraduationCap } from 'lucide-react';
import { navigationForRole, isNavigationActive, navigationLinkClass } from './navigation';

const roleMeta: Record<string, { label: string; badgeClass: string }> = {
  admin: { label: 'Administrador', badgeClass: 'bg-[#F6EDF8] text-[#9731AC] border-[#E6CAED]' },
  teacher: { label: 'Docente', badgeClass: 'bg-[#EFF7FC] text-[#1E7BB5] border-[#C7E5F6]' },
  student: { label: 'Estudiante', badgeClass: 'bg-[#F4FBE8] text-[#557D07] border-[#D6F09F]' },
  parent: { label: 'Representante', badgeClass: 'bg-[#FDF0F6] text-[#D12B75] border-[#FCC8DF]' },
};

export function Sidebar() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const roleInfo = roleMeta[user?.role || 'student'] || roleMeta.student;

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-[#D6E5E3] bg-white md:flex">
      {/* Identidad institucional neutral */}
      <div className="flex items-center gap-3 border-b border-[#D6E5E3] px-5 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E3F5F3] text-[#087F79]">
          <GraduationCap className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold tracking-tight text-[#183B3A] leading-tight truncate">
            NICE KIDS
          </h2>
          <p className="text-xs font-medium text-[#5E7A77] truncate">
            Gestión Escolar
          </p>
        </div>
      </div>

      {/* Navegación por rol */}
      <nav aria-label="Navegación principal" className="flex-1 space-y-1.5 overflow-y-auto p-3.5">
        {navigationForRole(user?.role).map(({ to, label, icon: Icon }) => {
          const active = isNavigationActive(pathname, to);
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? 'page' : undefined}
              className={navigationLinkClass(active)}
            >
              <Icon
                aria-hidden="true"
                className={`h-5 w-5 shrink-0 transition-colors ${
                  active ? 'text-[#087F79]' : 'text-[#5E7A77] group-hover:text-[#183B3A]'
                }`}
              />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Pie de navegación con rol y branding */}
      <div className="border-t border-[#D6E5E3] p-4 bg-[#F4FAF9]/50">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-[#183B3A]">
              {user?.name || 'Usuario'}
            </p>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold mt-1 ${roleInfo.badgeClass}`}
            >
              {roleInfo.label}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
