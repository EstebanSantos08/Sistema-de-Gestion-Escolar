import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 bg-[#F4FAF9] text-center font-sans">
      <div className="flex flex-col items-center text-center">
        <span className="text-2xl font-black tracking-tight text-[#183B3A]">NICE KIDS</span>
        <span className="text-[10px] font-bold text-[#087F79] uppercase tracking-widest mt-1 bg-[#E3F5F3] px-3 py-0.5 rounded-full">
          Centro de Desarrollo Infantil
        </span>
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
