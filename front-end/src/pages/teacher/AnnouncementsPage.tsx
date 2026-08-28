import { useState } from 'react';
import { Megaphone, Plus, Bell, AlertOctagon, Trash2, Calendar, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useMyCourses } from '@/hooks/useCourses';
import { teacherModuleService } from '@/services/teacherModule.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import type { Announcement, AnnouncementPriority } from '@/types';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const { data: courses } = useMyCourses();
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => teacherModuleService.getAnnouncements());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCourseId, setFormCourseId] = useState<string>('all');
  const [formPriority, setFormPriority] = useState<AnnouncementPriority>('normal');

  const refreshAnnouncements = () => {
    setAnnouncements(teacherModuleService.getAnnouncements());
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formContent) {
      toast.error('Por favor completa el título y el contenido del comunicado');
      return;
    }

    const cId = formCourseId !== 'all' ? Number(formCourseId) : null;
    const courseObj = courses?.find((c) => c.id === cId);

    teacherModuleService.createAnnouncement({
      title: formTitle,
      content: formContent,
      courseId: cId,
      courseName: cId ? courseObj?.name : 'Todos los cursos',
      priority: formPriority,
      authorName: user?.name ?? 'Docente',
    });

    toast.success('Comunicado publicado exitosamente');
    setIsModalOpen(false);
    setFormTitle('');
    setFormContent('');
    refreshAnnouncements();
  };

  const handleDelete = (id: string) => {
    teacherModuleService.deleteAnnouncement(id);
    refreshAnnouncements();
    toast.success('Comunicado eliminado');
  };

  const getPriorityBadge = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'urgente':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertOctagon className="h-3 w-3" /> Urgente
          </Badge>
        );
      case 'importante':
        return (
          <Badge className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1">
            <Bell className="h-3 w-3" /> Importante
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Megaphone className="h-3 w-3" /> Informativo
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comunicados y Avisos"
        description="Publicación de avisos institucionales para estudiantes y padres de familia"
      >
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Publicar Comunicado
        </Button>
      </PageHeader>

      {/* List of Announcements */}
      {announcements.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No se han publicado comunicados aún.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <Card key={ann.id} className="hover:shadow-sm transition-shadow border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(ann.priority)}
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                      <BookOpen className="h-3 w-3" /> {ann.courseName ?? 'Todos los Cursos'}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Publicado: {ann.publishDate}
                  </span>
                </div>

                <CardTitle className="text-lg font-bold mt-2">{ann.title}</CardTitle>
                <p className="text-xs text-muted-foreground">Por: {ann.authorName}</p>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{ann.content}</p>

                <div className="flex justify-end border-t pt-2">
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(ann.id)}>
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Nuevo Comunicado */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Publicar Comunicado</DialogTitle>
            <DialogDescription>Emite un aviso oficial visible para alumnos y representantes</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Destinatarios / Curso *</label>
              <Select value={formCourseId} onValueChange={setFormCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar Audiencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Cursos</SelectItem>
                  {courses?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Nivel de Prioridad *</label>
              <Select value={formPriority} onValueChange={(v) => setFormPriority(v as AnnouncementPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal (Informativo)</SelectItem>
                  <SelectItem value="importante">Importante</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Título del Comunicado *</label>
              <Input
                placeholder="Ej. Suspensión de actividades por feriado"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Contenido de la Circular *</label>
              <Textarea
                placeholder="Escribe el mensaje completo..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={4}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Publicar Ahora</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
