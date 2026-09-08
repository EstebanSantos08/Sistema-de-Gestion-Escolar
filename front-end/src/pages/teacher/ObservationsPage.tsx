import { useState } from 'react';
import { Plus, ThumbsUp, AlertTriangle, Info, Trash2, Eye, EyeOff, User, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMyCourses } from '@/hooks/useCourses';
import { useCourseStudents } from '@/hooks/useEnrollments';
import { teacherModuleService } from '@/services/teacherModule.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import type { StudentObservation, ObservationType, ObservationVisibility } from '@/types';

export default function ObservationsPage() {
  const { data: courses } = useMyCourses();
  const [observations, setObservations] = useState<StudentObservation[]>(() => teacherModuleService.getObservations());
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formCourseId, setFormCourseId] = useState<string>('');
  const [formStudentId, setFormStudentId] = useState<string>('');
  const [formType, setFormType] = useState<ObservationType>('positiva');
  const [formTitle, setFormTitle] = useState('');
  const [formDetail, setFormDetail] = useState('');
  const [formVisibility, setFormVisibility] = useState<ObservationVisibility>('ESTUDIANTE_Y_PADRES');

  const courseIdNum = formCourseId ? Number(formCourseId) : null;
  const { data: courseData } = useCourseStudents(courseIdNum);
  const students = courseData?.students ?? [];

  const refreshObservations = () => {
    setObservations(teacherModuleService.getObservations());
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCourseId || !formStudentId || !formTitle || !formDetail) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    const courseObj = courses?.find((c) => c.id === Number(formCourseId));
    const studentObj = students.find((s) => s.studentId === Number(formStudentId));

    teacherModuleService.createObservation({
      courseId: Number(formCourseId),
      courseName: courseObj?.name ?? 'Curso',
      studentId: Number(formStudentId),
      studentName: studentObj?.name ?? 'Estudiante',
      studentCode: studentObj?.studentCode ?? '',
      type: formType,
      title: formTitle,
      detail: formDetail,
      visibility: formVisibility,
    });

    toast.success('Observación registrada con éxito');
    setIsModalOpen(false);
    setFormTitle('');
    setFormDetail('');
    refreshObservations();
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta observación?')) {
      teacherModuleService.deleteObservation(id);
      refreshObservations();
      toast.success('Observación eliminada');
    }
  };

  const filteredObservations = observations.filter((obs) => {
    if (selectedTypeFilter !== 'all' && obs.type !== selectedTypeFilter) return false;
    return true;
  });

  const getObservationBadge = (type: ObservationType) => {
    switch (type) {
      case 'positiva':
        return (
          <Badge variant="success" className="gap-1">
            <ThumbsUp className="h-3 w-3" /> Positiva
          </Badge>
        );
      case 'atencion':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" /> Atención
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <Info className="h-3 w-3" /> Recomendación
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Docente"
        title="Observaciones Pedagógicas"
        description="Bitácora de seguimiento conductual, formativo y reconocimientos individuales"
      >
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Observación
        </Button>
      </PageHeader>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-school-heading shrink-0">Filtrar por tipo:</span>
          <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
            <SelectTrigger className="w-full sm:w-[240px]">
              <SelectValue placeholder="Todas las Observaciones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Observaciones</SelectItem>
              <SelectItem value="positiva">Positivas / Felicitaciones</SelectItem>
              <SelectItem value="recomendacion">Recomendaciones</SelectItem>
              <SelectItem value="atencion">Atención / Conducta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Observations Grid */}
      {filteredObservations.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-school-muted text-sm">
            No se han registrado observaciones con el filtro seleccionado.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filteredObservations.map((obs) => (
            <Card key={obs.id} className="flex flex-col justify-between hover:border-school-accent transition-colors">
              <CardHeader className="pb-3 border-b border-school-border/60">
                <div className="flex items-center justify-between gap-2 mb-2">
                  {getObservationBadge(obs.type)}
                  <span className="text-xs text-school-muted font-medium">{obs.date}</span>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-school-primary shrink-0" />
                  <CardTitle className="text-base font-bold text-school-heading">{obs.studentName}</CardTitle>
                  <span className="text-xs text-school-muted">({obs.studentCode})</span>
                </div>

                <p className="text-xs text-school-muted flex items-center gap-1 mt-1">
                  <BookOpen className="h-3.5 w-3.5 text-school-primary shrink-0" />
                  {obs.courseName}
                </p>
              </CardHeader>

              <CardContent className="space-y-4 pt-4 flex-1 flex flex-col justify-between">
                <div className="rounded-xl bg-school-background p-3.5 border border-school-border/60">
                  <p className="font-semibold text-sm text-school-heading mb-1">{obs.title}</p>
                  <p className="text-sm text-school-body leading-relaxed">{obs.detail}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-school-muted border-t border-school-border/60 pt-3">
                  <div className="flex items-center gap-1.5 font-medium">
                    {obs.visibility === 'ESTUDIANTE_Y_PADRES' ? (
                      <span className="flex items-center gap-1 text-emerald-800">
                        <Eye className="h-3.5 w-3.5 text-school-success" /> Visible: Estudiante y Padres
                      </span>
                    ) : obs.visibility === 'SOLO_ESTUDIANTE' ? (
                      <span className="flex items-center gap-1 text-sky-800">
                        <Eye className="h-3.5 w-3.5 text-school-blue" /> Visible: Solo Estudiante
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-school-muted">
                        <EyeOff className="h-3.5 w-3.5" /> Privado: Docentes
                      </span>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-school-error hover:bg-school-error/10"
                    onClick={() => handleDelete(obs.id)}
                    aria-label="Eliminar observación"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Nueva Observación */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-school-heading">Registrar Observación</DialogTitle>
            <DialogDescription className="text-sm text-school-muted">
              Añade un registro pedagógico o formativo al expediente del alumno
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-school-heading">Materia / Aula *</Label>
              <Select value={formCourseId} onValueChange={(val) => { setFormCourseId(val); setFormStudentId(''); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar Curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-school-heading">Estudiante *</Label>
              <Select value={formStudentId} onValueChange={setFormStudentId} disabled={!formCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder={formCourseId ? 'Seleccionar Estudiante' : 'Primero elige un aula'} />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.studentId} value={String(s.studentId)}>
                      {s.name} ({s.studentCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-school-heading">Tipo de Registro *</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as ObservationType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positiva">Positiva / Felicitación</SelectItem>
                    <SelectItem value="recomendacion">Recomendación</SelectItem>
                    <SelectItem value="atencion">Atención / Conducta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-school-heading">Visibilidad</Label>
                <Select value={formVisibility} onValueChange={(v) => setFormVisibility(v as ObservationVisibility)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ESTUDIANTE_Y_PADRES">Familia y Alumno</SelectItem>
                    <SelectItem value="SOLO_ESTUDIANTE">Solo Alumno</SelectItem>
                    <SelectItem value="SOLO_DOCENTE">Privado Docente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-school-heading">Título o Resumen *</Label>
              <Input
                placeholder="Ej: Excelente participación en clase"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-school-heading">Detalle de la Observación *</Label>
              <Textarea
                placeholder="Describe la situación observada y recomendaciones pedagógicas..."
                value={formDetail}
                onChange={(e) => setFormDetail(e.target.value)}
                rows={3}
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Guardar Observación
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
