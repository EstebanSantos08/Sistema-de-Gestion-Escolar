import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { navigationForRole, isNavigationActive, navigationLinkClass } from './navigation';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const roleMeta: Record<string, { label: string; badgeVariant: 'purple' | 'secondary' | 'lime' | 'pink' }> = {
  admin: { label: 'Administrador', badgeVariant: 'purple' },
  teacher: { label: 'Docente', badgeVariant: 'secondary' },
  student: { label: 'Estudiante', badgeVariant: 'lime' },
  parent: { label: 'Representante', badgeVariant: 'pink' },
};

function getInitials(name?: string): string {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (!user) return null;

  const currentRole = roleMeta[user.role] || roleMeta.student;

  return (
    <header className="flex min-h-[64px] items-center justify-between gap-3 border-b border-[#D6E5E3] bg-white px-4 py-2.5 sm:px-6">
      <div className="flex items-center gap-3.5">
        {/* Mobile menu trigger */}
        <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 border-[#D6E5E3] text-[#087F79] hover:bg-[#E3F5F3] md:hidden"
              aria-label="Abrir menú de navegación"
            >
              <Menu aria-hidden="true" className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl bg-white p-5 border-[#D6E5E3]">
            <DialogTitle className="text-xl font-semibold text-[#183B3A]">
              Menú principal
            </DialogTitle>
            <DialogDescription className="text-sm text-[#5E7A77]">
              Accede a tus cursos, calificaciones y herramientas escolares.
            </DialogDescription>
            <nav aria-label="Navegación móvil" className="mt-4 space-y-1.5">
              {navigationForRole(user.role).map(({ to, label, icon: Icon }) => {
                const active = isNavigationActive(pathname, to);
                return (
                  <Link
                    key={to}
                    to={to}
                    aria-current={active ? 'page' : undefined}
                    className={navigationLinkClass(active)}
                    onClick={() => setMenuOpen(false)}
                  >
                    <Icon
                      aria-hidden="true"
                      className={`h-5 w-5 shrink-0 ${
                        active ? 'text-[#087F79]' : 'text-[#5E7A77]'
                      }`}
                    />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>
          </DialogContent>
        </Dialog>

        <div className="md:hidden flex items-center gap-1.5">
          <span className="text-base font-black tracking-tight text-[#183B3A]">NICE KIDS</span>
        </div>

        {/* Period pill */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-[#BBE5E1] bg-[#E3F5F3] px-3.5 py-1 text-xs font-medium text-[#087F79]">
          <span className="h-2 w-2 rounded-full bg-[#087F79]" />
          <span>
            Período Académico: <strong className="font-semibold text-[#183B3A]">2026-I</strong>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Role badge */}
        <Badge variant={currentRole.badgeVariant} className="hidden xs:inline-flex text-xs font-medium">
          {currentRole.label}
        </Badge>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="Abrir menú de usuario"
              variant="ghost"
              className="relative h-11 w-11 rounded-full border border-[#D6E5E3] bg-[#E3F5F3] p-0.5 text-[#087F79] hover:bg-[#D4EFEA] focus-visible:ring-2 focus-visible:ring-[#087F79]"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-white text-[#087F79] font-bold text-sm">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-60 rounded-2xl p-2 border-[#D6E5E3] bg-white shadow-xl">
            <DropdownMenuLabel className="px-3 py-2">
              <p className="font-semibold text-[#183B3A] text-sm truncate">{user.name}</p>
              <p className="text-xs text-[#5E7A77] truncate mt-0.5">{user.email}</p>
              <div className="mt-2">
                <Badge variant={currentRole.badgeVariant} className="text-[11px] font-medium">
                  {currentRole.label}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#D6E5E3]" />
            <DropdownMenuItem disabled className="rounded-lg text-sm text-[#5E7A77]">
              <UserIcon className="mr-2 h-4 w-4 text-[#087F79]" />
              Mi perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#D6E5E3]" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="rounded-lg text-[#B42335] focus:bg-[#FDF0F1] focus:text-[#B42335] font-semibold cursor-pointer text-sm"
            >
              <LogOut className="mr-2 h-4 w-4 text-[#B42335]" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
