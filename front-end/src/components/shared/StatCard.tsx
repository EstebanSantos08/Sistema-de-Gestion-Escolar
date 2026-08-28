import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  accentColor?: string;
  className?: string;
}

export function StatCard({ title, value, description, icon, accentColor, className }: StatCardProps) {
  const defaultColors = [
    'border-t-[#E84B5B] text-[#E84B5B] bg-red-50',
    'border-t-[#008BC1] text-[#008BC1] bg-sky-50',
    'border-t-[#F4B51B] text-amber-600 bg-amber-50',
    'border-t-[#31B45A] text-[#31B45A] bg-emerald-50',
  ];

  return (
    <Card className={cn('bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl relative', className)}>
      <div className={cn("h-1.5 w-full bg-gradient-to-r from-[#E84B5B] via-[#008BC1] via-[#F4B51B] to-[#31B45A]", accentColor)} />
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
            <p className="text-3xl font-black text-slate-800 mt-1">{value}</p>
            {description && (
              <p className="text-xs font-semibold text-slate-400 mt-1">{description}</p>
            )}
          </div>
          {icon && (
            <div className="rounded-2xl bg-teal-50 p-3 text-[#09A9C2] shadow-inner border border-teal-100/50">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

