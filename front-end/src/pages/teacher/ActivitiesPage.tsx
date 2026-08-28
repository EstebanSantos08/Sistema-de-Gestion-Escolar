import { useState } from 'react';
import { Plus, BookOpen, Calendar, Trash2, CheckCircle2, Clock, FileText, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
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
import type { ClassActivity, ActivityType, ActivityStatus } from '@/types';

export default function ActivitiesPage() {
  const { data: courses } = useMyCourses();
  const [activities, setActivities] = useState<ClassActivity[]>(() => teacherModuleService.getActivities());
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Modal creation state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formCourseId, setFormCourseId] = useState<string>('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formType, setFormType] = useState<ActivityType>('tarea');

  const refreshActivities = () => {
    setActivities(teacherModuleService.getActivities());
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCourseId || !formTitle || !formDueDate) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    const courseObj = courses?.find((c) => c.id === Number(formCourseId));
    teacherModuleService.createActivity({
      courseId: Number(formCourseId),
      courseName: courseObj?.name ?? 'Curso',
      title: formTitle,
      description: formDescription,
      dueDate: formDueDate,
      type: formType,
      status: 'programada',
    });

    toast.success('Actividad creada exitosamente');
    setIsCreateOpen(false);
    setFormTitle('');
    setFormDescription('');
    setFormDueDate('');
    refreshActivities();
  };

  const handleStatusChange = (id: string, newStatus: ActivityStatus) => {
    teacherModuleService.updateActivityStatus(id, newStatus);
    refreshActivities();
    toast.success('Estado de la actividad actualizado');
  };

  const handleDelete = (id: string) => {
    teacherModuleService.deleteActivity(id);
    refreshActivities();
    toast.success('Actividad eliminada');
  };

  // Filtered list
  const filteredActivities = activities.filter((a) => {
    if (selectedCourseFilter !== 'all' && a.courseId !== Number(selectedCourseFilter)) return false;
    if (selectedStatusFilter !== 'all' && a.status !== selectedStatusFilter) return false;
    return true;
  });

  const getTypeBadge = (type: ActivityType) => {
    switch (type) {
      case 'examen':
        return <Badge variant="destructive">Examen</Badge>;
      case 'proyecto':
        return <Badge className="bg-purple-600 hover:bg-purple-700 text-white">Proyecto</Badge>;
      case 'taller':
        return <Badge className="bg-blue-600 hover:bg-blue-700 text-white">Taller</Badge>;
      default:
        return <Badge variant="secondary">Tarea</Badge>;
    }
  };

  const getStatusBadge = (status: ActivityStatus) => {
    switch (status) {
      case 'completada':
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Completada</Badge>;
      case 'en_curso':
        return <Badge variant="outline" className="text-amber-600 border-amber-600">En Curso</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-600">Programada</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Actividades Académicas"
        description="Gestión de tareas, evaluaciones, talleres y proyectos para tus cursos"
      >
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Actividad
        </Button>
      </PageHeader>

      {/* Filters wrapped in high-contrast Card */}
      <Card className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/60">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <Select value={selectedCourseFilter} onValueChange={setSelectedCourseFilter}>
              <SelectTrigger className="w-full sm:w-[220px] bg-white border-slate-200 text-slate-800 font-bold rounded-xl shadow-xs">
                <SelectValue placeholder="Filtrar por Curso" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 rounded-xl shadow-2xl">
                <SelectItem value="all">Todos los Cursos</SelectItem>
                {courses?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px] bg-white border-slate-200 text-slate-800 font-bold rounded-xl shadow-xs">
                <SelectValue placeholder="Filtrar por Estado" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 rounded-xl shadow-2xl">
                <SelectItem value="all">Todos los Estados</SelectItem>
                <SelectItem value="programada">Programada</SelectItem>
                <SelectItem value="en_curso">En Curso</SelectItem>
                <SelectItem value="completada">Completada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-xs font-bold text-slate-600 bg-teal-50 px-3 py-2 rounded-xl border border-teal-100 flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-[#09A9C2]" />
            Total actividades: <strong className="text-[#008BC1] text-sm">{filteredActivities.length}</strong>
          </div>
        </div>
      </Card>


      {/* Activities Grid */}
      {filteredActivities.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No hay actividades registradas con los filtros seleccionados.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredActivities.map((act) => (
            <Card key={act.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">{getTypeBadge(act.type)}</div>
                  {getStatusBadge(act.status)}
                </div>
                <CardTitle className="text-base font-bold leading-snug">{act.title}</CardTitle>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                  {act.courseName}
                </p>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                <p className="text-sm text-slate-600 line-clamp-3">{act.description || 'Sin descripción adicional.'}</p>

                <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Entrega: <strong>{act.dueDate}</strong>
                  </span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => handleDelete(act.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Status action toggle */}
                <div className="flex items-center gap-1 pt-1">
                  <Select value={act.status} onValueChange={(val) => handleStatusChange(act.id, val as ActivityStatus)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Cambiar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="programada">Programada</SelectItem>
                      <SelectItem value="en_curso">En Curso</SelectItem>
                      <SelectItem value="completada">Completada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Nueva Actividad */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Actividad Académica</DialogTitle>
            <DialogDescription>Crea un nuevo trabajo o evaluación para tus estudiantes</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Materia / Curso *</label>
              <Select value={formCourseId} onValueChange={setFormCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar Curso" />
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

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Título de la Actividad *</label>
              <Input
                placeholder="Ej. Examen Parcial n.º 1"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Tipo *</label>
                <Select value={formType} onValueChange={(v) => setFormType(v as ActivityType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tarea">Tarea</SelectItem>
                    <SelectItem value="taller">Taller</SelectItem>
                    <SelectItem value="examen">Examen</SelectItem>
                    <SelectItem value="proyecto">Proyecto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Fecha Límite *</label>
                <Input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Descripción u Instrucciones</label>
              <Textarea
                placeholder="Detalla las instrucciones para los alumnos..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar Actividad</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
