import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { NiceKidsLogo } from '@/components/shared/NiceKidsLogo';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 bg-school-bg text-center font-sans">
      <Link to="/" aria-label="NICE KIDS, inicio">
        <NiceKidsLogo size="lg" showSubtitle showBar />
      </Link>

      <div className="rounded-3xl border border-school-border bg-white p-8 sm:p-10 shadow-xs max-w-md w-full space-y-3">
        <span className="text-6xl font-bold tracking-tight text-ink-turquoise">404</span>
        <h1 className="text-2xl font-semibold text-school-heading">Página no encontrada</h1>
        <p className="text-sm text-school-muted-readable">
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
