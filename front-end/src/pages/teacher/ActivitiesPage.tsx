import { DatePicker } from '@/components/ui/date-picker';
import { useState } from 'react';
import { Plus, BookOpen, Clock, FileText, Filter, Pencil, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { useMyCourses } from '@/hooks/useCourses';
import { activityService } from '@/services/activity.service';
import { useCreateActivity, useUpdateActivity } from '@/hooks/useActivities';
import { ClassroomSubmissionsDialog } from '@/components/teacher/ClassroomSubmissionsDialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import type { ApiActivity, ActivityType, ActivityStatus } from '@/types';

const getMinDateTimeStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatDateTimeDisplay = (dtStr: string | null) => {
  if (!dtStr) return '—';
  if (dtStr.includes('T')) {
    const [date, time] = dtStr.split('T');
    return `${date} a las ${time}`;
  }
  return dtStr;
};

export default function ActivitiesPage() {
  const { data: courses = [] } = useMyCourses();
  const courseIds = courses.map((c) => c.id);

  const { data: rawActivities = [], isLoading: loadingActivities } = useQuery({
    queryKey: ['activities', 'teacher', courseIds],
    queryFn: async () => {
      if (courseIds.length === 0) return [];
      const results = await Promise.all(
        courseIds.map((cId) => activityService.list({ courseId: cId }))
      );
      return results.flat();
    },
    enabled: courseIds.length > 0,
  });

  const createActivityMutation = useCreateActivity();
  const updateActivityMutation = useUpdateActivity();

  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ApiActivity | null>(null);
  const [selectedActivityForSubmissions, setSelectedActivityForSubmissions] = useState<ApiActivity | null>(null);

  const [formCourseId, setFormCourseId] = useState<string>('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formType, setFormType] = useState<ActivityType>('tarea');

  const handleOpenCreateModal = () => {
    setEditingActivity(null);
    setFormCourseId(courses && courses.length > 0 ? String(courses[0].id) : '');
    setFormTitle('');
    setFormDescription('');
    setFormDueDate(getMinDateTimeStr());
    setFormType('tarea');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (act: ApiActivity) => {
    setEditingActivity(act);
    setFormCourseId(String(act.courseId));
    setFormTitle(act.title);
    setFormDescription(act.description || '');
    const formattedDue = act.dueDate
      ? act.dueDate.includes('T')
        ? act.dueDate
        : `${act.dueDate}T23:59`
      : getMinDateTimeStr();
    setFormDueDate(formattedDue);
    setFormType(act.type || 'tarea');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCourseId || !formTitle.trim() || !formDueDate) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    const currentMin = getMinDateTimeStr();
    if (formDueDate < currentMin) {
      toast.error('La fecha y hora límite de entrega no puede ser anterior a este momento.');
      return;
    }

    try {
      if (editingActivity) {
        await updateActivityMutation.mutateAsync({
          id: editingActivity.id,
          payload: {
            title: formTitle.trim(),
            description: formDescription.trim() || undefined,
            dueDate: formDueDate,
            type: formType,
          },
        });
        toast.success('Actividad actualizada');
      } else {
        await createActivityMutation.mutateAsync({
          courseId: Number(formCourseId),
          title: formTitle.trim(),
          description: formDescription.trim() || undefined,
          dueDate: formDueDate,
          type: formType,
          status: 'en_curso',
          maxScore: 10,
        });
        toast.success('Actividad creada exitosamente');
      }
      setIsModalOpen(false);
    } catch {
      toast.error('Error al guardar la actividad');
    }
  };

  const handleStatusChange = async (act: ApiActivity, newStatus: ActivityStatus) => {
    try {
      await updateActivityMutation.mutateAsync({
        id: act.id,
        payload: { status: newStatus },
      });
      toast.success('Estado de actividad actualizado');
    } catch {
      toast.error('Error al actualizar el estado');
    }
  };

  const activities = rawActivities.map((act) => {
    const courseObj = courses.find((c) => c.id === act.courseId);
    return {
      ...act,
      courseName: courseObj?.name ?? `Curso #${act.courseId}`,
    };
  });

  const filteredActivities = activities.filter((act) => {
    if (selectedCourseFilter !== 'all' && act.courseId !== Number(selectedCourseFilter)) {
      return false;
    }
    if (selectedStatusFilter !== 'all' && act.status !== selectedStatusFilter) {
      return false;
    }
    return true;
  });

  const minDateTimeAllowed = getMinDateTimeStr();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Docente"
        title="Gestión de Actividades"
        description="Planificación, plazos de entrega y recepción de tareas por materia"
      >
        <Button onClick={handleOpenCreateModal}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Actividad
        </Button>
      </PageHeader>

      {/* Filtros */}
      <Card className="nk-filter p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 flex-1">
            <Filter className="h-4 w-4 text-school-muted-readable shrink-0" />
            <span className="text-sm font-medium text-school-heading shrink-0">Filtrar por Aula:</span>
            <Select value={selectedCourseFilter} onValueChange={setSelectedCourseFilter}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Todas las aulas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las aulas</SelectItem>
                {courses?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-school-heading shrink-0">Estado:</span>
            <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="programada">Programadas</SelectItem>
                <SelectItem value="en_curso">En curso</SelectItem>
                <SelectItem value="completada">Completadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Listado de Actividades */}
      {filteredActivities.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-10 w-10 mx-auto text-school-muted-readable mb-2" />
          <p className="font-semibold text-school-heading text-base">No hay actividades registradas con estos filtros</p>
          <p className="text-sm text-school-muted-readable mt-1">Crea una nueva actividad o modifica los criterios de búsqueda.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredActivities.map((act) => (
            <Card key={act.id} className="flex flex-col justify-between hover:border-school-accent transition-colors">
              <CardContent className="p-5 space-y-4 flex flex-col justify-between flex-1">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-ink-turquoise uppercase tracking-wider bg-school-subtle px-2 py-0.5 rounded-md">
                        {act.courseName}
                      </span>
                      <h4 className="font-bold text-school-heading text-base mt-2 leading-snug">{act.title}</h4>
                    </div>
                    <Badge variant={act.status === 'programada' ? 'warning' : act.status === 'completada' ? 'secondary' : 'success'} className="shrink-0">
                      {act.status === 'programada' ? 'Programada' : act.status === 'completada' ? 'Completada' : 'En Curso'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-medium text-ink-turquoise bg-school-subtle px-2.5 py-1.5 rounded-lg border border-school-border/50">
                    <Clock className="h-3.5 w-3.5 text-ink-turquoise shrink-0" />
                    <span>Límite: {formatDateTimeDisplay(act.dueDate)}</span>
                  </div>

                  {act.description && (
                    <p className="text-sm text-school-body line-clamp-3 bg-school-background p-3 rounded-xl border border-school-border/60 leading-relaxed">
                      {act.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-school-border/60 flex items-center justify-between gap-2">
                  <Select value={act.status} onValueChange={(val) => handleStatusChange(act, val as ActivityStatus)}>
                    <SelectTrigger className="h-9 text-xs font-medium w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="programada">Programada</SelectItem>
                      <SelectItem value="en_curso">En curso</SelectItem>
                      <SelectItem value="completada">Completada</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" onClick={() => setSelectedActivityForSubmissions(act)} className="h-9 text-xs font-medium">
                      <Eye className="h-3.5 w-3.5 mr-1 text-ink-turquoise" /> Evidencias
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleOpenEditModal(act)} className="h-9 text-xs font-medium text-school-warning" aria-label="Editar actividad">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Creación / Edición */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="accent-yellow sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-school-heading flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-ink-turquoise" />
              {editingActivity ? 'Editar Actividad' : 'Nueva Actividad'}
            </DialogTitle>
            <DialogDescription className="text-sm text-school-muted-readable">
              Define la materia, título y fecha/hora límite de entrega
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-5 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="activity-course" className="text-sm font-semibold text-ink-blue">Aula / Curso *</Label>
              <Select value={formCourseId} onValueChange={setFormCourseId}>
                <SelectTrigger id="activity-course" className="border-line-blue bg-surface-blue">
                  <SelectValue placeholder="Selecciona un aula" />
                </SelectTrigger>
                <SelectContent>
                  {courses?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="activity-title" className="text-sm font-semibold text-ink-turquoise">Título de la Actividad *</Label>
              <Input
                id="activity-title"
                placeholder="Ej: Taller de Expresión Artística"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="activity-description" className="text-sm font-medium text-school-heading">Instrucciones o Descripción</Label>
              <Textarea
                id="activity-description"
                placeholder="Detalla las instrucciones para los estudiantes..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2 bg-surface-yellow p-4 rounded-xl border border-line-yellow">
              <Label htmlFor="activity-deadline" className="text-sm font-semibold text-ink-yellow flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> Fecha y Hora Límite *
              </Label>
              <DatePicker
                id="activity-deadline"
                type="datetime-local"
                min={minDateTimeAllowed}
                value={formDueDate}
                onValueChange={(value) => setFormDueDate(value)}
                className="bg-white font-medium"
                required
              />
            </div>

            <DialogFooter className="border-t border-line-yellow pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createActivityMutation.isPending || updateActivityMutation.isPending}>
                {editingActivity ? 'Guardar Cambios' : 'Crear Actividad'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Entregas y Evidencias */}
      <ClassroomSubmissionsDialog
        open={!!selectedActivityForSubmissions}
        onOpenChange={(v) => !v && setSelectedActivityForSubmissions(null)}
        activity={selectedActivityForSubmissions}
      />
    </div>
  );
}
