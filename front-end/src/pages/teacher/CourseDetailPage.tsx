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
import { Card } from '@/components/ui/card';
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

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const id = courseId ? Number(courseId) : null;

  const { data: course, isLoading: loadingCourse } = useCourse(id);
  const { data: courseData, isLoading: loadingStudents } = useCourseStudents(id);

  const [activeTab, setActiveTab] = useState<'tasks' | 'students'>('tasks');

  // Modales y formularios
  const [modalOpen, setModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ClassActivity | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [selectedActivityForSubmissions, setSelectedActivityForSubmissions] = useState<ClassActivity | null>(null);

  // Lista de actividades y entregas locales
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
      toast.success('Deber actualizado correctamente (fecha/hora ampliadas o modificadas)');
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
          <div className="h-9 w-9 rounded-full bg-[#008BC1]/10 text-[#008BC1] font-black flex items-center justify-center text-sm">
            {s.name.charAt(0)}
          </div>
          <div>
            <p className="font-extrabold text-slate-800 text-sm">{s.name}</p>
            <p className="text-xs font-semibold text-slate-400">{s.studentCode}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Estado de Matrícula',
      render: (s) => (
        <Badge className={s.status === 'active' ? 'bg-[#31B45A] text-white font-bold' : 'bg-slate-200 text-slate-700'}>
          {s.status === 'active' ? 'Matriculado Activo' : 'Retirado'}
        </Badge>
      ),
    },
  ];

  if (loadingCourse) {
    return (
      <div className="flex justify-center py-20">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-[#008BC1] border-t-transparent" />
      </div>
    );
  }

  if (!course) {
    return <p className="text-slate-500 font-bold p-8">Curso no encontrado.</p>;
  }

  const allSubmissions = teacherModuleService.getSubmissions();
  const minDateTimeAllowed = getMinDateTimeStr();

  return (
    <div className="space-y-6">
      {/* Botón de Retorno */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="text-slate-600 font-bold hover:bg-slate-100 rounded-xl">
          <Link to="/docente/mis-cursos">
            <ArrowLeft className="h-4 w-4 mr-1.5 text-[#008BC1]" /> Volver a Mis Cursos
          </Link>
        </Button>
      </div>

      {/* Encabezado del Aula Virtual */}
      <div className="bg-gradient-to-r from-[#008BC1] via-[#0073A0] to-[#09A9C2] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#F4B51B]" />
            <span className="text-xs font-black uppercase tracking-wider text-sky-100">{course.code}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">{course.name}</h1>
          <p className="text-sm font-bold text-sky-100">
            Período Lectivo {course.period} · {course.credits} Créditos · Docente Guía
          </p>
        </div>
      </div>

      {/* Barra de Pestañas */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'tasks' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('tasks')}
            className={activeTab === 'tasks' ? 'bg-[#008BC1] text-white font-extrabold rounded-xl shadow-md' : 'text-slate-600 font-bold'}
          >
            <FileText className="mr-2 h-4 w-4" />
            Deberes y Actividades ({activities.length})
          </Button>

          <Button
            variant={activeTab === 'students' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('students')}
            className={activeTab === 'students' ? 'bg-[#008BC1] text-white font-extrabold rounded-xl shadow-md' : 'text-slate-600 font-bold'}
          >
            <Users className="mr-2 h-4 w-4" />
            Lista de Estudiantes ({courseData?.students?.length ?? 0})
          </Button>
        </div>

        {activeTab === 'tasks' && (
          <Button onClick={handleOpenCreateModal} className="bg-[#31B45A] hover:bg-[#28964B] text-white font-extrabold rounded-xl shadow-md">
            <Plus className="mr-1.5 h-4 w-4" /> Asignar Nuevo Deber
          </Button>
        )}
      </div>

      {/* Pestaña 1: Deberes y Tareas */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {activities.length === 0 ? (
            <Card className="p-8 text-center bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200">
              <FileText className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <p className="font-extrabold text-slate-700 text-sm">No hay deberes asignados en este curso</p>
              <p className="text-xs text-slate-400 mt-1">Haz clic en "Asignar Nuevo Deber" para publicar la primera tarea con su fecha y hora límite.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {activities.map((act) => {
                const submissionsForAct = submissions.filter((s) => s.activityId === act.id);
                const gradedForAct = submissionsForAct.filter((s) => s.status === 'calificada' || s.score !== undefined).length;
                return (
                  <Card key={act.id} className="bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-slate-100 space-y-3 hover:shadow-xl transition-all flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-black text-slate-800 text-base">{act.title}</h4>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100 mt-1">
                            <Clock className="h-3.5 w-3.5 text-[#008BC1]" />
                            <span>Fecha/Hora Límite: {formatDateTimeDisplay(act.dueDate)}</span>
                          </div>
                        </div>
                        <Badge className={act.status === 'programada' ? 'bg-amber-500 text-white font-bold' : 'bg-emerald-500 text-white font-bold'}>
                          {act.status.toUpperCase()}
                        </Badge>
                      </div>

                      {act.description && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                          {act.description}
                        </p>
                      )}
                    </div>

                    {/* Acciones del Docente: Editar Plazo / Ver Evidencias / Eliminar */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                      <div className="flex flex-col text-[11px] font-extrabold text-slate-700">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#31B45A]" />
                          {submissionsForAct.length} Entregas
                        </span>
                        {gradedForAct > 0 && (
                          <span className="flex items-center gap-1 text-amber-700">
                            <Award className="h-3.5 w-3.5 text-amber-500" />
                            {gradedForAct} Calificadas
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedActivityForSubmissions(act)}
                          className="h-8 text-xs font-extrabold text-[#008BC1] border-sky-200 hover:bg-sky-50 rounded-lg px-2.5 shadow-sm"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> Evidencias ({submissionsForAct.length})
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEditModal(act)}
                          className="h-8 text-xs font-extrabold text-amber-700 border-amber-200 hover:bg-amber-50 rounded-lg px-2"
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1 text-amber-600" /> Editar Plazo
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteActivity(act.id)}
                          className="h-8 text-xs text-rose-600 hover:bg-rose-50 rounded-lg px-2"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pestaña 2: Lista de Estudiantes */}
      {activeTab === 'students' && (
        <Card className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-slate-100">
          <DataTable
            columns={studentColumns}
            data={courseData?.students ?? []}
            getRowId={(s) => s.enrollmentId}
            isLoading={loadingStudents}
            emptyMessage="No hay estudiantes matriculados en este curso"
          />
        </Card>
      )}

      {/* Modal para Crear / Editar Deber y Ajustar Fecha y Hora Límite */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#008BC1]" />
              {editingActivity ? 'Editar Deber y Ajustar Fecha/Hora' : 'Asignar Nuevo Deber / Tarea'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveActivity} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Título del Deber</Label>
              <Input
                placeholder="Ej: Taller de Colores y Trazos"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-xl border-slate-200"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Instrucciones o Descripción</Label>
              <Textarea
                placeholder="Describe las actividades a realizar y las fotos/PDFs de evidencia a subir (Máx 1MB)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl border-slate-200 text-xs"
                rows={3}
              />
            </div>

            {/* Captura de Fecha y Hora Límite con Restricción Mínima del Presente */}
            <div className="space-y-1 bg-sky-50 p-3 rounded-xl border border-sky-100">
              <Label className="text-xs font-extrabold text-[#008BC1] flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> Fecha y Hora Límite Máxima de Entrega *
              </Label>
              <Input
                type="datetime-local"
                min={minDateTimeAllowed}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="rounded-xl border-slate-300 font-bold bg-white text-slate-900"
                required
              />
              <p className="text-[11px] font-semibold text-slate-500 mt-1">
                ⚠️ Solo se permiten fechas y horas presentes o futuras. Puedes ampliar o reducir el plazo al editar.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="rounded-xl font-bold">
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#008BC1] hover:bg-[#0073A0] text-white font-bold rounded-xl shadow-md">
                {editingActivity ? 'Guardar Cambios' : 'Publicar Deber'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal / Vista de Entregas y Evidencias Estilo Google Classroom */}
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
