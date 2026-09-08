import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, GraduationCap } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 bg-[#F4FAF9] text-center font-sans">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E3F5F3] text-[#087F79]">
          <GraduationCap className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="text-left">
          <span className="text-lg font-bold tracking-tight text-[#183B3A] block leading-tight">
            NICE KIDS
          </span>
          <span className="text-xs font-medium text-[#5E7A77] block">
            Gestión Escolar
          </span>
        </div>
      </div>
      <div className="rounded-3xl border border-[#D6E5E3] bg-white p-8 sm:p-10 shadow-xs max-w-md w-full space-y-3">
        <span className="text-6xl font-bold tracking-tight text-[#087F79]">404</span>
        <h1 className="text-2xl font-semibold text-[#183B3A]">Página no encontrada</h1>
        <p className="text-sm text-[#5E7A77]">
          La dirección que buscas no existe o ha sido reubicada dentro del sistema.
        </p>
        <div className="pt-3">
          <Button asChild className="h-11 px-6 rounded-xl font-medium">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Volver al inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
