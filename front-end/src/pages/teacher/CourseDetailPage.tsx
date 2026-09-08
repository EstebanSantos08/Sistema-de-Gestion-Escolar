import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, FileText, Users, Sparkles, CheckCircle2, Clock, Eye, Pencil, Trash2, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCourse } from '@/hooks/useCourses';
import { useCourseStudents } from '@/hooks/useEnrollments';
import { teacherModuleService, type ClassActivity, type SubmissionItem } from '@/services/teacherModule.service';
import { ClassroomSubmissionsDialog } from '@/components/teacher/ClassroomSubmissionsDialog';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { CourseGradeRow } from '@/types';

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

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const id = courseId ? Number(courseId) : null;

  const { data: course, isLoading: loadingCourse } = useCourse(id);
  const { data: courseData, isLoading: loadingStudents } = useCourseStudents(id);

  const [activeTab, setActiveTab] = useState<'tasks' | 'students'>('tasks');

  // Modals & forms
  const [modalOpen, setModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ClassActivity | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [selectedActivityForSubmissions, setSelectedActivityForSubmissions] = useState<ClassActivity | null>(null);

  const [activities, setActivities] = useState<ClassActivity[]>(() =>
    id ? teacherModuleService.getActivities(id) : []
  );

  const [submissions, setSubmissions] = useState<SubmissionItem[]>(() =>
    teacherModuleService.getSubmissions()
  );

  const refreshActivities = () => {
    if (id) {
      setActivities(teacherModuleService.getActivities(id));
    }
    setSubmissions(teacherModuleService.getSubmissions());
  };

  const handleOpenCreateModal = () => {
    setEditingActivity(null);
    setTitle('');
    setDescription('');
    setDueDate(getMinDateTimeStr());
    setModalOpen(true);
  };

  const handleOpenEditModal = (act: ClassActivity) => {
    setEditingActivity(act);
    setTitle(act.title);
    setDescription(act.description || '');
    setDueDate(act.dueDate.includes('T') ? act.dueDate : `${act.dueDate}T23:59`);
    setModalOpen(true);
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate || !id) {
      toast.error('Por favor completa el título y la fecha/hora límite');
      return;
    }

    const currentMin = getMinDateTimeStr();
    if (dueDate < currentMin) {
      toast.error('La fecha y hora límite de entrega no puede ser anterior a este momento.');
      return;
    }

    if (editingActivity) {
      teacherModuleService.updateActivity(editingActivity.id, {
        title,
        description,
        dueDate,
      });
      toast.success('Deber actualizado correctamente');
    } else {
      teacherModuleService.createActivity({
        title,
        description,
        dueDate,
        type: 'deber',
        courseId: id,
        courseName: course?.name ?? 'Curso',
        status: 'en_curso',
      });
      toast.success('Deber asignado correctamente');
    }

    setModalOpen(false);
    refreshActivities();
  };

  const handleDeleteActivity = (actId: string) => {
    if (confirm('¿Estás seguro de eliminar este deber?')) {
      teacherModuleService.deleteActivity(actId);
      toast.success('Deber eliminado');
      refreshActivities();
    }
  };

  const studentColumns: Column<CourseGradeRow>[] = [
    {
      header: 'Estudiante',
      render: (s) => (
        <div className="flex items-center gap-3 py-1">
          <div className="h-9 w-9 rounded-full bg-school-subtle text-school-primary font-bold flex items-center justify-center text-sm border border-school-border">
            {s.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-school-heading text-sm">{s.name}</p>
            <p className="text-xs text-school-muted">{s.studentCode}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Estado de Matrícula',
      render: (s) => (
        <Badge variant={s.status === 'active' ? 'success' : 'secondary'}>
          {s.status === 'active' ? 'Matriculado Activo' : 'Retirado'}
        </Badge>
      ),
    },
  ];

  if (loadingCourse) {
    return (
      <div className="flex justify-center py-20">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-school-primary border-t-transparent" />
      </div>
    );
  }

  if (!course) {
    return <p className="text-school-muted font-medium p-8">Curso no encontrado.</p>;
  }

  const minDateTimeAllowed = getMinDateTimeStr();

  return (
    <div className="space-y-6">
      {/* Botón de Retorno */}
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="text-school-body font-medium hover:bg-school-subtle">
          <Link to="/docente/mis-cursos">
            <ArrowLeft className="h-4 w-4 mr-1.5 text-school-primary" /> Volver a Mis Cursos
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to={`/docente/cursos/${course.id}/notas`}>
            Ir a Calificaciones
          </Link>
        </Button>
      </div>

      {/* Encabezado del Aula Virtual */}
      <div className="bg-school-primary rounded-2xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-school-subtle bg-white/10 px-2.5 py-0.5 rounded-md">
              {course.code}
            </span>
            <span className="text-xs text-white/80">· Período {course.period}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">{course.name}</h1>
          <p className="text-sm text-white/90">
            {course.credits} Créditos · Docente a cargo
          </p>
        </div>
      </div>

      {/* Barra de Pestañas y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-school-border pb-3">
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'tasks' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('tasks')}
            className={activeTab === 'tasks' ? 'font-semibold' : 'text-school-body font-medium'}
          >
            <FileText className="mr-2 h-4 w-4" />
            Deberes y Actividades ({activities.length})
          </Button>

          <Button
            variant={activeTab === 'students' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('students')}
            className={activeTab === 'students' ? 'font-semibold' : 'text-school-body font-medium'}
          >
            <Users className="mr-2 h-4 w-4" />
            Lista de Estudiantes ({courseData?.students?.length ?? 0})
          </Button>
        </div>

        {activeTab === 'tasks' && (
          <Button onClick={handleOpenCreateModal}>
            <Plus className="mr-1.5 h-4 w-4" /> Asignar Nuevo Deber
          </Button>
        )}
      </div>

      {/* Pestaña 1: Deberes y Tareas */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {activities.length === 0 ? (
            <Card className="p-10 text-center">
              <FileText className="h-10 w-10 mx-auto text-school-muted mb-2" />
              <p className="font-semibold text-school-heading text-base">No hay deberes asignados en este curso</p>
              <p className="text-sm text-school-muted mt-1 max-w-md mx-auto">
                Haz clic en "Asignar Nuevo Deber" para publicar la primera tarea con su fecha y hora límite de entrega.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {activities.map((act) => {
                const submissionsForAct = submissions.filter((s) => s.activityId === act.id);
                const gradedForAct = submissionsForAct.filter((s) => s.status === 'calificada' || s.score !== undefined).length;
                return (
                  <Card key={act.id} className="flex flex-col justify-between hover:border-school-accent transition-colors">
                    <CardContent className="p-5 space-y-4 flex flex-col justify-between flex-1">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-school-heading text-base leading-snug">{act.title}</h4>
                          <Badge variant={act.status === 'programada' ? 'warning' : 'success'} className="shrink-0">
                            {act.status === 'programada' ? 'Programada' : 'En Curso'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-medium text-school-primary bg-school-subtle px-2.5 py-1.5 rounded-lg border border-school-border/50">
                          <Clock className="h-3.5 w-3.5 text-school-primary" />
                          <span>Límite: {formatDateTimeDisplay(act.dueDate)}</span>
                        </div>

                        {act.description && (
                          <p className="text-sm text-school-body bg-school-background p-3 rounded-xl border border-school-border/60 leading-relaxed">
                            {act.description}
                          </p>
                        )}
                      </div>

                      {/* Footer: Acciones del Docente */}
                      <div className="pt-3 border-t border-school-border/60 flex items-center justify-between gap-2 text-xs">
                        <div className="flex flex-col text-xs font-medium text-school-body">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-school-success" />
                            {submissionsForAct.length} Entregas
                          </span>
                          {gradedForAct > 0 && (
                            <span className="flex items-center gap-1 text-school-warning font-semibold">
                              <Award className="h-3.5 w-3.5" />
                              {gradedForAct} Calificadas
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedActivityForSubmissions(act)}
                            className="h-8 text-xs font-medium border-school-border text-school-heading hover:bg-school-subtle hover:text-school-primary"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1 text-school-primary" /> Evidencias ({submissionsForAct.length})
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditModal(act)}
                            className="h-8 text-xs font-medium text-school-warning border-school-border hover:bg-school-subtle"
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" /> Plazo
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteActivity(act.id)}
                            className="h-8 text-xs text-school-error hover:bg-school-error/10"
                            aria-label="Eliminar deber"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pestaña 2: Lista de Estudiantes */}
      {activeTab === 'students' && (
        <DataTable
          columns={studentColumns}
          data={courseData?.students ?? []}
          getRowId={(s) => s.enrollmentId}
          isLoading={loadingStudents}
          emptyMessage="No hay estudiantes matriculados en este curso"
        />
      )}

      {/* Modal para Crear / Editar Deber y Ajustar Fecha y Hora Límite */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-school-heading flex items-center gap-2">
              <FileText className="h-5 w-5 text-school-primary" />
              {editingActivity ? 'Editar Deber y Plazo' : 'Asignar Nuevo Deber'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveActivity} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-school-heading">Título del Deber *</Label>
              <Input
                placeholder="Ej: Taller de Colores y Formas"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-school-heading">Instrucciones o Descripción</Label>
              <Textarea
                placeholder="Describe las actividades a realizar y las fotos/PDFs de evidencia a subir (Máx 1MB)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Captura de Fecha y Hora Límite */}
            <div className="space-y-1.5 bg-school-subtle/60 p-3.5 rounded-xl border border-school-border">
              <Label className="text-xs font-semibold text-school-primary flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> Fecha y Hora Límite de Entrega *
              </Label>
              <Input
                type="datetime-local"
                min={minDateTimeAllowed}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-white font-medium text-school-heading"
                required
              />
              <p className="text-xs text-school-muted mt-1">
                Solo se permiten fechas presentes o futuras. Puedes ajustar el plazo posteriormente.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingActivity ? 'Guardar Cambios' : 'Publicar Deber'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal / Vista de Entregas y Evidencias */}
      <ClassroomSubmissionsDialog
        open={!!selectedActivityForSubmissions}
        onOpenChange={(v) => {
          if (!v) {
            setSelectedActivityForSubmissions(null);
            refreshActivities();
          }
        }}
        activity={selectedActivityForSubmissions}
      />
    </div>
  );
}
