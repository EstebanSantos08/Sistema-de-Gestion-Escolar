import { useState } from 'react';
import { Plus, BookOpen, Trash2, Clock, FileText, Filter, Pencil, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMyCourses } from '@/hooks/useCourses';
import { teacherModuleService } from '@/services/teacherModule.service';
import { ClassroomSubmissionsDialog } from '@/components/teacher/ClassroomSubmissionsDialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import type { ClassActivity, ActivityType, ActivityStatus } from '@/types';

// Helper para fecha y hora mínima (momento actual)
const getMinDateTimeStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatDateTimeDisplay = (dtStr: string) => {
  if (!dtStr) return '—';
  if (dtStr.includes('T')) {
    const [date, time] = dtStr.split('T');
    return `${date} a las ${time}`;
  }
  return dtStr;
};

export default function ActivitiesPage() {
  const { data: courses } = useMyCourses();
  const [activities, setActivities] = useState<ClassActivity[]>(() => teacherModuleService.getActivities());
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // State para creación y edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ClassActivity | null>(null);
  const [selectedActivityForSubmissions, setSelectedActivityForSubmissions] = useState<ClassActivity | null>(null);

  const [formCourseId, setFormCourseId] = useState<string>('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formType, setFormType] = useState<ActivityType>('tarea');

  const refreshActivities = () => {
    setActivities(teacherModuleService.getActivities());
  };

  const handleOpenCreateModal = () => {
    setEditingActivity(null);
    setFormCourseId(courses && courses.length > 0 ? String(courses[0].id) : '');
    setFormTitle('');
    setFormDescription('');
    setFormDueDate(getMinDateTimeStr());
    setFormType('tarea');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (act: ClassActivity) => {
    setEditingActivity(act);
    setFormCourseId(String(act.courseId));
    setFormTitle(act.title);
    setFormDescription(act.description || '');
    setFormDueDate(act.dueDate.includes('T') ? act.dueDate : `${act.dueDate}T23:59`);
    setFormType(act.type || 'tarea');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCourseId || !formTitle || !formDueDate) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    const currentMin = getMinDateTimeStr();
    if (formDueDate < currentMin) {
      toast.error('La fecha y hora límite de entrega no puede ser anterior a este momento.');
      return;
    }

    const courseObj = courses?.find((c) => c.id === Number(formCourseId));

    if (editingActivity) {
      teacherModuleService.updateActivity(editingActivity.id, {
        courseId: Number(formCourseId),
        courseName: courseObj?.name ?? 'Curso',
        title: formTitle,
        description: formDescription,
        dueDate: formDueDate,
        type: formType,
      });
      toast.success('Actividad actualizada correctamente');
    } else {
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
    }

    setIsModalOpen(false);
    refreshActivities();
  };

  const handleStatusChange = (id: string, newStatus: ActivityStatus) => {
    teacherModuleService.updateActivityStatus(id, newStatus);
    toast.success(`Estado actualizado a: ${newStatus}`);
    refreshActivities();
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar esta actividad?')) {
      teacherModuleService.deleteActivity(id);
      toast.success('Actividad eliminada');
      refreshActivities();
    }
  };

  const filteredActivities = activities.filter((act) => {
    if (selectedCourseFilter !== 'all' && String(act.courseId) !== selectedCourseFilter) return false;
    if (selectedStatusFilter !== 'all' && act.status !== selectedStatusFilter) return false;
    return true;
  });

  const minDateTimeAllowed = getMinDateTimeStr();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Deberes y Actividades"
        description="Publica tareas, asigna plazos de fecha/hora y monitorea el estado de entregas"
      >
        <Button onClick={handleOpenCreateModal} className="bg-[#008BC1] hover:bg-[#0073A0] text-white font-extrabold shadow-md rounded-xl">
          <Plus className="mr-2 h-4 w-4" /> Nueva Actividad
        </Button>
      </PageHeader>

      {/* Filtros */}
      <Card className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 flex-1">
            <Filter className="h-4 w-4 text-[#008BC1]" />
            <span className="text-xs font-bold text-slate-700">Filtrar por Aula:</span>
            <Select value={selectedCourseFilter} onValueChange={setSelectedCourseFilter}>
              <SelectTrigger className="w-full sm:w-60 rounded-xl bg-white border-slate-200 text-xs font-bold">
                <SelectValue placeholder="Todas las aulas" />
              </SelectTrigger>
              <SelectContent className="bg-white rounded-xl">
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
            <span className="text-xs font-bold text-slate-700">Estado:</span>
            <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
              <SelectTrigger className="w-40 rounded-xl bg-white border-slate-200 text-xs font-bold">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="bg-white rounded-xl">
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="programada">Programadas</SelectItem>
                <SelectItem value="en_curso">En curso</SelectItem>
                <SelectItem value="finalizada">Finalizadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Listado de Actividades */}
      {filteredActivities.length === 0 ? (
        <Card className="p-8 text-center bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200">
          <FileText className="h-10 w-10 mx-auto text-slate-300 mb-2" />
          <p className="font-extrabold text-slate-700 text-sm">No hay actividades registradas con estos filtros</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredActivities.map((act) => (
            <Card key={act.id} className="bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-slate-100 space-y-4 hover:shadow-xl transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black text-[#008BC1] uppercase tracking-wider bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                      {act.courseName}
                    </span>
                    <h4 className="font-black text-slate-800 text-base mt-1">{act.title}</h4>
                  </div>
                  <Badge className={act.status === 'programada' ? 'bg-amber-500 text-white font-bold' : act.status === 'en_curso' ? 'bg-[#008BC1] text-white font-bold' : 'bg-emerald-500 text-white font-bold'}>
                    {act.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <Clock className="h-3.5 w-3.5 text-[#008BC1]" />
                  <span>Entrega: {formatDateTimeDisplay(act.dueDate)}</span>
                </div>

                {act.description && (
                  <p className="text-xs text-slate-600 line-clamp-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                    {act.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <Select value={act.status} onValueChange={(val) => handleStatusChange(act.id, val as ActivityStatus)}>
                  <SelectTrigger className="h-8 text-xs font-bold w-32 rounded-lg border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-xl text-xs font-bold">
                    <SelectItem value="programada">Programada</SelectItem>
                    <SelectItem value="en_curso">En curso</SelectItem>
                    <SelectItem value="finalizada">Finalizada</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" onClick={() => setSelectedActivityForSubmissions(act)} className="h-8 text-xs font-extrabold text-[#008BC1] border-sky-200 hover:bg-sky-50 rounded-lg">
                    <Eye className="h-3.5 w-3.5 mr-1" /> Evidencias
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleOpenEditModal(act)} className="h-8 text-xs text-amber-700 border-amber-200 hover:bg-amber-50 rounded-lg">
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(act.id)} className="h-8 text-xs text-rose-600 hover:bg-rose-50 rounded-lg">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Creación / Edición */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#008BC1]" />
              {editingActivity ? 'Editar Actividad / Deber' : 'Nueva Actividad / Deber'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Define la materia, título y la fecha/hora límite máxima de entrega
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Aula / Curso *</label>
              <Select value={formCourseId} onValueChange={setFormCourseId}>
                <SelectTrigger className="rounded-xl border-slate-200 font-bold">
                  <SelectValue placeholder="Selecciona un aula" />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-xl">
                  {courses?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Título de la Actividad *</label>
              <Input
                placeholder="Ej: Proyecto de Expresión Artística"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="rounded-xl border-slate-200"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Instrucciones o Descripción</label>
              <Textarea
                placeholder="Detalla las instrucciones para los estudiantes o representantes..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="rounded-xl border-slate-200 text-xs"
                rows={3}
              />
            </div>

            <div className="space-y-1 bg-sky-50 p-3 rounded-xl border border-sky-100">
              <label className="text-xs font-extrabold text-[#008BC1] flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> Fecha y Hora Límite *
              </label>
              <Input
                type="datetime-local"
                min={minDateTimeAllowed}
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                className="rounded-xl border-slate-300 font-bold bg-white text-slate-900"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl font-bold">
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#008BC1] hover:bg-[#0073A0] text-white font-bold rounded-xl shadow-md">
                {editingActivity ? 'Guardar Cambios' : 'Crear Actividad'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Estilo Google Classroom de Entregas y Evidencias */}
      <ClassroomSubmissionsDialog
        open={!!selectedActivityForSubmissions}
        onOpenChange={(v) => !v && setSelectedActivityForSubmissions(null)}
        activity={selectedActivityForSubmissions}
      />
    </div>
  );
}
