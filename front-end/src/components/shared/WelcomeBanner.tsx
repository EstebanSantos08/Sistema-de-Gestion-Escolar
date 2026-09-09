import { CloudDivider, SparkleStar } from '@/components/ui/CloudDecoration';
import { CalendarDays, HeartHandshake } from 'lucide-react';

interface WelcomeBannerProps {
  userName?: string;
  roleLabel?: string;
  period?: string;
  description?: string;
  variant?: 'turquoise' | 'violet' | 'pink' | 'lime';
}

export function WelcomeBanner({ userName = 'Usuario', roleLabel = 'Portal Escolar', period = '2026-I', description = 'Resumen de actividades y gestión educativa institucional', variant = 'turquoise' }: WelcomeBannerProps) {
  return (
    <section className={`nk-welcome accent-${variant}`} data-variant={variant} aria-label="Bienvenida">
      <div className="nk-welcome-art" aria-hidden="true" />
      <SparkleStar color="currentColor" size={28} className="pointer-events-none absolute right-8 top-7 text-ink-turquoise opacity-30" />
      <div className="relative z-10 px-6 pb-4 pt-6 sm:px-8 sm:pt-8">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-2 rounded-lg border border-white bg-white/80 px-3 py-1.5 font-semibold text-school-heading"><HeartHandshake aria-hidden="true" className="h-4 w-4" />{roleLabel}</span>
          <span className="inline-flex items-center gap-2 rounded-lg bg-white/65 px-3 py-1.5 text-school-body"><CalendarDays aria-hidden="true" className="h-4 w-4" />Período: {period}</span>
        </div>
        <h1 className="w-full max-w-5xl text-3xl font-bold tracking-tight text-school-heading sm:text-4xl">¡Hola, {userName.split(' ')[0]}!</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-school-body sm:pr-20">{description}</p>
      </div>
      <CloudDivider className="relative z-10 -mb-px opacity-60" fillColor="white" />
    </section>
  );
}
