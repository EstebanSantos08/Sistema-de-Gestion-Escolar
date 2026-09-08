import { useState } from 'react';
import { Megaphone, Plus, Bell, AlertOctagon, Calendar, BookOpen, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useMyCourses } from '@/hooks/useCourses';
import { announcementService } from '@/services/announcement.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import type { BackendAnnouncement, AnnouncementTargetRole } from '@/types';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: courses } = useMyCourses();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCourseId, setFormCourseId] = useState<string>('all');
  const [formTargetRole, setFormTargetRole] = useState<AnnouncementTargetRole>('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Query real announcements from /api/announcements
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements', user?.id, user?.role],
    queryFn: () => announcementService.list(),
    enabled: !!user,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      toast.error('Por favor completa el título y el contenido del comunicado');
      return;
    }

    const selectedCId = formCourseId !== 'all' ? Number(formCourseId) : null;
    if (user?.role === 'teacher' && !selectedCId) {
      toast.error('Como docente, debes seleccionar un curso específico para el comunicado');
      return;
    }

    try {
      setIsSubmitting(true);
      await announcementService.create({
        title: formTitle.trim(),
        content: formContent.trim(),
        targetRole: formTargetRole,
        courseId: selectedCId,
      });

      toast.success('Comunicado publicado exitosamente');
      qc.invalidateQueries({ queryKey: ['announcements'] });
      qc.invalidateQueries({ queryKey: ['daily-summary'] });
      setIsModalOpen(false);
      setFormTitle('');
      setFormContent('');
      setFormCourseId('all');
      setFormTargetRole('ALL');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al publicar el comunicado';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTargetBadge = (role: string) => {
    switch (role) {
      case 'ALL':
        return <Badge variant="secondary">Comunidad Escolar</Badge>;
      case 'STUDENT':
        return <Badge variant="outline">Solo Estudiantes</Badge>;
      case 'PARENT':
        return <Badge variant="outline">Solo Representantes</Badge>;
      case 'TEACHER':
        return <Badge variant="outline">Docentes</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Docente"
        title="Comunicados y Circulares"
        description="Publicación oficial de avisos institucionales para estudiantes y padres de familia"
      >
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Publicar Comunicado
        </Button>
      </PageHeader>

      {/* Announcements List */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-school-primary mb-3" />
          <p className="text-school-muted font-medium">Cargando circulares y avisos del servidor...</p>
        </Card>
      ) : announcements.length === 0 ? (
        <Card className="p-12 text-center">
          <Megaphone className="h-10 w-10 mx-auto text-school-muted mb-2" />
          <p className="font-semibold text-school-heading text-base">No hay comunicados publicados</p>
          <p className="text-sm text-school-muted mt-1">
            Los comunicados emitidos institucionalmente aparecerán listados aquí.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {announcements.map((ann: BackendAnnouncement) => (
            <Card key={ann.id} className="hover:border-school-accent transition-colors flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getTargetBadge(ann.targetRole)}
                      {ann.course && (
                        <Badge variant="outline" className="text-xs">
                          {ann.course.name}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base font-bold text-school-heading pt-1">
                      {ann.title}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                <p className="text-sm text-school-body bg-school-background p-3.5 rounded-xl border border-school-border/60 leading-relaxed">
                  {ann.content}
                </p>

                <div className="flex items-center justify-between text-xs text-school-muted font-medium pt-2 border-t border-school-border/60">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-school-primary" />
                    {new Date(ann.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="text-school-heading font-medium">
                    Autor: {ann.author?.name || 'Docente'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Publicar Comunicado */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Publicar Nuevo Comunicado</DialogTitle>
            <DialogDescription>
              El aviso será visible para los estudiantes y representantes autorizados del curso.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="ann-title">Título del Comunicado *</Label>
              <Input
                id="ann-title"
                placeholder="Ej. Recordatorio de entrega de proyecto o Salida pedagógica"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ann-course">Curso Destinatario *</Label>
                <Select value={formCourseId} onValueChange={setFormCourseId}>
                  <SelectTrigger id="ann-course">
                    <SelectValue placeholder="Selecciona un curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {user?.role === 'admin' && <SelectItem value="all">Institucional (Global)</SelectItem>}
                    {courses?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ann-target">Destinatarios *</Label>
                <Select
                  value={formTargetRole}
                  onValueChange={(val) => setFormTargetRole(val as AnnouncementTargetRole)}
                >
                  <SelectTrigger id="ann-target">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Estudiantes y Padres</SelectItem>
                    <SelectItem value="STUDENT">Solo Estudiantes</SelectItem>
                    <SelectItem value="PARENT">Solo Representantes</SelectItem>
                    {user?.role === 'admin' && <SelectItem value="TEACHER">Docentes</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ann-content">Contenido del Mensaje *</Label>
              <Textarea
                id="ann-content"
                rows={4}
                placeholder="Escribe el mensaje claro y detallado para la comunidad escolar..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Publicando...
                  </>
                ) : (
                  'Publicar Comunicado'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
