interface PageHeaderProps {
  title: string;
  variant?: 'default' | 'course';
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children, variant = 'default' }: PageHeaderProps) {
  return (
    <div className={variant === 'course' ? 'flex flex-col justify-between gap-4 sm:flex-row sm:items-start' : 'flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-white/60 relative overflow-hidden'}>
      {/* Barra superior de acento arcoíris */}
      {variant === 'default' && <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#E84B5B] via-[#008BC1] via-[#F4B51B] via-[#31B45A] to-[#7D5AA6]" />}

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-inherit">{title}</h1>
        {description && <p className="text-sm font-semibold text-slate-500 mt-0.5">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

