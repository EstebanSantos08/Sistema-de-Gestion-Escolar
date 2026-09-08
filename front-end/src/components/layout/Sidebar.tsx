import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  navigationForRole,
  isNavigationActive,
  navigationLinkClass,
  getNavColor,
} from './navigation';

const roleMeta: Record<string, { label: string; badgeClass: string }> = {
  admin: { label: 'Administrador', badgeClass: 'bg-[#F6EDF8] text-[#9731AC] border-[#E6CAED]' },
  teacher: { label: 'Docente', badgeClass: 'bg-[#EFF7FC] text-[#64B6E5] border-[#C7E5F6]' },
  student: { label: 'Estudiante', badgeClass: 'bg-[#F4FBE8] text-[#9DD31B] border-[#D6F09F]' },
  parent: { label: 'Representante', badgeClass: 'bg-[#FDF0F6] text-[#FF5DA0] border-[#FCC8DF]' },
};

export function Sidebar() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const roleInfo = roleMeta[user?.role || 'student'] || roleMeta.student;

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-[#D6E5E3] bg-white md:flex">
      {/* Identidad institucional festiva */}
      <div className="flex flex-col items-center border-b border-[#D6E5E3] px-4 py-5 bg-gradient-to-b from-[#E3F5F3]/40 to-white text-center relative overflow-hidden">
        <div className="flex items-center justify-center gap-1 mb-1">
          <span className="text-xl font-black tracking-wider drop-shadow-2xs">
            <span className="text-[#41C4BD]">N</span>
            <span className="text-[#F2C700]">I</span>
            <span className="text-[#FF5DA0]">C</span>
            <span className="text-[#9DD31B]">E</span>
            <span className="text-[#183B3A] ml-1.5">KIDS</span>
          </span>
        </div>
        <span className="text-[10px] font-bold text-[#183B3A] uppercase tracking-widest bg-white/90 px-3 py-0.5 rounded-full border border-[#BBE5E1] shadow-2xs">
          Centro Infantil
        </span>
      </div>

      {/* Navegación por rol */}
      <nav aria-label="Navegación principal" className="flex-1 space-y-1.5 overflow-y-auto p-3.5">
        {navigationForRole(user?.role).map(({ to, label, icon: Icon }, index) => {
          const active = isNavigationActive(pathname, to);
          const color = getNavColor(index);
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? 'page' : undefined}
              className={navigationLinkClass(active, index)}
            >
              <Icon
                aria-hidden="true"
                className={`h-5 w-5 shrink-0 transition-colors ${
                  active ? color.text : `text-[#5E7A77] group-hover:${color.text}`
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
