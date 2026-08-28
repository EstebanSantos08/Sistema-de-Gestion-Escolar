interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-white/60 relative overflow-hidden">
      {/* Barra superior de acento arcoíris */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#E84B5B] via-[#008BC1] via-[#F4B51B] via-[#31B45A] to-[#7D5AA6]" />

      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-800">{title}</h1>
        {description && <p className="text-sm font-semibold text-slate-500 mt-0.5">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

