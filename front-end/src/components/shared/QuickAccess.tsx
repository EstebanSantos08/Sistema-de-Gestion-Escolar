import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { categoryAccent } from '@/components/layout/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuickAccessProps {
  title: string;
  items: { to: string; label: string; icon: LucideIcon }[];
  family?: boolean;
}
export function QuickAccess({ title, items, family = false }: QuickAccessProps) {
  return (
    <Card accent={family ? 'lilac' : 'blue'} className="nk-section">
      <CardHeader><CardTitle>{title}</CardTitle><p className="text-sm text-school-body">Lo que necesitas para acompañar cada día.</p></CardHeader>
      <CardContent className="pt-5">
        <div className="grid grid-flow-dense grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {items.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={`nk-quick accent-${categoryAccent(to)}`}>
              <span className="nk-icon"><Icon aria-hidden="true" className="h-5 w-5" /></span>
              <span className="leading-snug">{label}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
