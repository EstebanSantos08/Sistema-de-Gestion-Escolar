import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Megaphone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { activityService } from '@/services/activity.service';
import { announcementService } from '@/services/announcement.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function StudentAgenda({ courseIds }: { courseIds: number[] }) {
  const { user } = useAuth();
  const [openedAt] = useState(Date.now);
  const activities = useQuery({
    queryKey: ['dashboard-activities', user?.id, courseIds],
    queryFn: async () => (await Promise.all(courseIds.map(courseId => activityService.list({ courseId })))).flat(),
    enabled: !!user && courseIds.length > 0,
  });
  const announcements = useQuery({
    queryKey: ['announcements', user?.id, 'student-announcements'],
    queryFn: () => announcementService.list(),
    enabled: !!user,
  });
  const upcoming = (activities.data ?? []).filter(activity => activity.dueDate && new Date(activity.dueDate).getTime() >= openedAt && activity.status !== 'completada').sort((a, b) => a.dueDate!.localeCompare(b.dueDate!)).slice(0, 3);
  let hidden: number[] = [];
  try { const saved: unknown = JSON.parse(localStorage.getItem('student_hidden_announcements') ?? '[]'); if (Array.isArray(saved)) hidden = saved.filter((id): id is number => typeof id === 'number'); } catch { /* Local visibility preferences are optional. */ }
  const recent = [...(announcements.data ?? [])].filter(item => !hidden.includes(item.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card accent="yellow" className="nk-section">
        <CardHeader><CardTitle className="flex items-center gap-3"><span className="nk-icon"><CalendarDays aria-hidden="true" className="h-5 w-5" /></span>Próximas actividades</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-5">
          {activities.isFetching ? <p role="status" className="text-sm">Cargando actividades…</p> : activities.isError ? <div role="alert"><p className="text-sm">No se pudieron cargar las actividades.</p><Button variant="ghost" onClick={() => activities.refetch()}>Reintentar</Button></div> : upcoming.length === 0 ? <p className="py-3 text-sm text-school-body">No hay próximas entregas registradas.</p> : upcoming.map(activity => (
            <Link key={activity.id} to="/estudiante/actividades" className="nk-event block rounded-xl p-4">
              <p className="font-semibold text-school-heading">{activity.title}</p>
              <p className="mt-1 text-sm text-ink-yellow">{new Date(activity.dueDate!).toLocaleDateString('es-EC', { day: 'numeric', month: 'long' })}</p>
            </Link>
          ))}
          <Button asChild variant="ghost"><Link to="/estudiante/actividades">Ver actividades <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></Button>
        </CardContent>
      </Card>
      <Card accent="pink" className="nk-section">
        <CardHeader><CardTitle className="flex items-center gap-3"><span className="nk-icon"><Megaphone aria-hidden="true" className="h-5 w-5" /></span>Comunicados</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-5">
          {announcements.isLoading ? <p role="status" className="text-sm">Cargando comunicados…</p> : announcements.isError ? <div role="alert"><p className="text-sm">No se pudieron cargar los comunicados.</p><Button variant="ghost" onClick={() => announcements.refetch()}>Reintentar</Button></div> : recent.length === 0 ? <p className="py-3 text-sm text-school-body">Los nuevos avisos de la comunidad aparecerán aquí.</p> : recent.map(item => (
            <Link key={item.id} to="/estudiante/comunicados" className="nk-event block rounded-xl p-4">
              <p className="font-semibold text-school-heading">{item.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-school-body">{item.content}</p>
              <p className="mt-2 text-sm text-ink-pink">{new Date(item.createdAt).toLocaleDateString('es-EC')}</p>
            </Link>
          ))}
          <Button asChild variant="ghost"><Link to="/estudiante/comunicados">Ver comunicados <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
