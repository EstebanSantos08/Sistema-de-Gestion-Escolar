import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
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
};

const roleBadgeClass: Record<string, string> = {
  admin: 'bg-[#7D5AA6] text-white hover:bg-[#7D5AA6]/90 shadow-sm font-bold',
  teacher: 'bg-[#008BC1] text-white hover:bg-[#008BC1]/90 shadow-sm font-bold',
  student: 'bg-[#31B45A] text-white hover:bg-[#31B45A]/90 shadow-sm font-bold',
};

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

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (!user) return null;

  return (
    <header className="flex h-16 items-center justify-between bg-white/90 backdrop-blur-md px-6 shadow-xl rounded-2xl border border-white/50 mx-3 mt-3 z-10">
      <div className="flex items-center gap-3">
        <NiceKidsLogo size="sm" showSubtitle={false} className="md:hidden" />

        <div className="hidden md:flex items-center gap-2 bg-teal-50 px-3 py-1 rounded-full border border-teal-100 shadow-inner">
          <span className="h-2 w-2 rounded-full bg-[#31B45A] animate-pulse" />
          <span className="text-xs font-bold text-teal-800">
            Período Académico: <strong className="text-[#008BC1]">2026-I</strong>
          </span>
        </div>
      </div>


      <div className="flex items-center gap-4">
        <Badge className={roleBadgeClass[user.role] ?? 'bg-[#008BC1] text-white font-bold'}>
          {roleLabel[user.role]}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0.5 bg-gradient-to-r from-[#E84B5B] via-[#F4B51B] to-[#31B45A] hover:scale-105 transition-transform shadow-md">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-white text-[#008BC1] font-black text-sm">
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
              <User className="mr-2 h-4 w-4 text-[#008BC1]" />
              Mi perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-[#E84B5B] focus:text-[#E84B5B] focus:bg-red-50 font-bold rounded-xl cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

