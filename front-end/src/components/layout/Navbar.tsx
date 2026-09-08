import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { navigationForRole, isNavigationActive, navigationLinkClass } from './navigation';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, User, Menu } from 'lucide-react';
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

const roleLabel: Record<string, string> = {
  admin: 'Administrador',
  teacher: 'Docente',
  student: 'Estudiante',
  parent: 'Representante',
};

const roleBadgeClass: Record<string, string> = {};

function getInitials(name?: string): string {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

import { NiceKidsLogo } from '@/components/shared/NiceKidsLogo';

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

  return (
    <header className="flex min-h-16 flex-wrap items-center justify-between gap-2 border-b border-[#D6E5E3] bg-white px-4 py-2 md:px-6">
      <div className="flex items-center gap-3">
        <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
          <DialogTrigger asChild><Button variant="outline" className="h-11 w-11 border-[#718B88] text-[#087F79] md:hidden" aria-label="Abrir menú principal"><Menu aria-hidden="true" className="h-5 w-5" /></Button></DialogTrigger>
          <DialogContent className="course-ui max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl bg-white p-5">
            <DialogTitle>Menú principal</DialogTitle>
            <DialogDescription>Accede a tus cursos y herramientas escolares.</DialogDescription>
            <nav aria-label="Navegación móvil" className="space-y-1">
              {navigationForRole(user.role).map(({ to, label, icon: Icon }) => {
                const active = isNavigationActive(pathname, to);
                return <Link key={to} to={to} aria-current={active ? 'page' : undefined} className={navigationLinkClass(active)} onClick={() => setMenuOpen(false)}><Icon aria-hidden="true" className="h-5 w-5 shrink-0" />{label}</Link>;
              })}
            </nav>
          </DialogContent>
        </Dialog>
        <NiceKidsLogo size="sm" showSubtitle={false} className="md:hidden" />

        <div className="hidden md:flex items-center gap-2 bg-teal-50 px-3 py-1 rounded-full border border-teal-100 shadow-inner">
          <span className="h-2 w-2 rounded-full bg-[#087F79]" />
          <span className="text-xs font-bold text-teal-800">
            Período Académico: <strong className="text-[#087F79]">2026-I</strong>
          </span>
        </div>
      </div>


      <div className="flex items-center gap-2">
        <Badge className={roleBadgeClass[user.role] ?? 'border-[#D6E5E3] bg-[#E3F5F3] text-[#087F79] font-medium'}>
          {roleLabel[user.role]}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-label="Abrir menú de usuario" variant="ghost" className="relative h-11 w-11 rounded-full border border-[#D6E5E3] bg-[#E3F5F3] p-0.5 text-[#087F79]">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-white text-[#087F79] font-black text-sm">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-teal-100 shadow-2xl">
            <DropdownMenuLabel className="px-3 py-2">
              <p className="font-extrabold text-slate-800">{user.name}</p>
              <p className="text-xs text-slate-500 font-medium">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="rounded-xl">
              <User className="mr-2 h-4 w-4 text-[#087F79]" />
              Mi perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-[#B42335] focus:text-[#B42335] focus:bg-red-50 font-bold rounded-xl cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

