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
import { LogOut, User as UserIcon, Menu, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { NiceKidsLogo } from '@/components/shared/NiceKidsLogo';
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

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      const defaultPath = user.role === 'admin' ? '/admin' : user.role === 'teacher' ? '/docente' : '/estudiante';
      navigate(defaultPath);
    }
  };

  return (
    <header className="flex min-h-[64px] items-center justify-between gap-3 border-b border-line-turquoise bg-school-bg/95 px-4 py-2.5 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-3.5">
        {/* Back navigation button */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleBack}
          className="h-10 w-10 sm:h-10 sm:w-10 border-school-border text-ink-turquoise hover:bg-school-subtle rounded-xl shadow-2xs cursor-pointer"
          title="Regresar a la página anterior"
          aria-label="Regresar a la página anterior"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {/* Mobile menu trigger */}
        <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 border-school-border text-ink-turquoise hover:bg-school-subtle md:hidden"
              aria-label="Abrir menú de navegación"
            >
              <Menu aria-hidden="true" className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl bg-white p-5 border-school-border">
            <DialogTitle className="text-xl font-semibold text-school-heading">
              Menú principal
            </DialogTitle>
            <DialogDescription className="text-sm text-school-muted-readable">
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
                    className={navigationLinkClass(active, to)}
                    onClick={() => setMenuOpen(false)}
                  >
                    <Icon
                      aria-hidden="true"
                      className="h-5 w-5 shrink-0 text-current"
                    />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>
          </DialogContent>
        </Dialog>

        <div className="md:hidden flex items-center">
          <Link to="/" aria-label="NICE KIDS, inicio">
            <NiceKidsLogo size="sm" showSubtitle={false} showBar={false} />
          </Link>
        </div>

        {/* Period pill */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-line-turquoise bg-school-subtle px-3.5 py-1 text-xs font-medium text-ink-turquoise">
          <span className="h-2 w-2 rounded-full bg-brand-turquoise" />
          <span>
            Período Académico: <strong className="font-semibold text-school-heading">2026-I</strong>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Role badge */}
        <Badge variant={currentRole.badgeVariant} className="hidden sm:inline-flex text-xs font-medium">
          {currentRole.label}
        </Badge>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="Abrir menú de usuario"
              variant="ghost"
              className="relative h-11 w-11 rounded-full border border-school-border bg-school-subtle p-0.5 text-ink-turquoise hover:bg-school-subtle focus-visible:ring-2 focus-visible:ring-brand-turquoise"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-white text-ink-turquoise font-bold text-sm">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-60 rounded-2xl p-2 border-school-border bg-white shadow-xl">
            <DropdownMenuLabel className="px-3 py-2">
              <p className="font-semibold text-school-heading text-sm truncate">{user.name}</p>
              <p className="text-xs text-school-muted-readable truncate mt-0.5">{user.email}</p>
              <div className="mt-2">
                <Badge variant={currentRole.badgeVariant} className="text-[11px] font-medium">
                  {currentRole.label}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-school-border" />
            <DropdownMenuItem disabled className="rounded-lg text-sm text-school-muted-readable">
              <UserIcon className="mr-2 h-4 w-4 text-ink-turquoise" />
              Mi perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-school-border" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="rounded-lg text-school-error focus:bg-school-error-bg focus:text-school-error font-semibold cursor-pointer text-sm"
            >
              <LogOut className="mr-2 h-4 w-4 text-school-error" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
