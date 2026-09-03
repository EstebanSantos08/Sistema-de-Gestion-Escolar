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

  // Load students for selected course in form
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
    teacherModuleService.deleteObservation(id);
    refreshObservations();
    toast.success('Observación eliminada');
  };

  const filteredObservations = observations.filter((obs) => {
    if (selectedTypeFilter !== 'all' && obs.type !== selectedTypeFilter) return false;
    return true;
  });

  const getObservationBadge = (type: ObservationType) => {
    switch (type) {
      case 'positiva':
        return (
          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1">
            <ThumbsUp className="h-3 w-3" /> Positiva
          </Badge>
        );
      case 'atencion':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Llamado de Atención
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1">
            <Info className="h-3 w-3" /> Recomendación
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Observaciones de Estudiantes"
        description="Bitácora de seguimiento conductual, académico y reconocimientos"
      >
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Observación
        </Button>
      </PageHeader>

      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Filtrar por Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las Observaciones</SelectItem>
            <SelectItem value="positiva">Positiva</SelectItem>
            <SelectItem value="recomendacion">Recomendación</SelectItem>
            <SelectItem value="atencion">Atención / Conducta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Observations Grid */}
      {filteredObservations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No se han registrado observaciones con el filtro seleccionado.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredObservations.map((obs) => (
            <Card key={obs.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  {getObservationBadge(obs.type)}
                  <span className="text-xs text-muted-foreground">{obs.date}</span>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base font-bold">{obs.studentName}</CardTitle>
                  <span className="text-xs text-muted-foreground">({obs.studentCode})</span>
                </div>

                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  {obs.courseName}
                </p>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <div className="rounded-md bg-accent/30 p-3">
                  <p className="font-semibold text-sm mb-1">{obs.title}</p>
                  <p className="text-xs text-slate-700 leading-relaxed">{obs.detail}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                  <div className="flex items-center gap-1">
                    {obs.visibility === 'ESTUDIANTE_Y_PADRES' ? (
                      <span className="flex items-center gap-1 text-green-700 font-medium">
                        <Eye className="h-3.5 w-3.5" /> Visible para Estudiante y Padres
                      </span>
                    ) : obs.visibility === 'SOLO_ESTUDIANTE' ? (
                      <span className="flex items-center gap-1 text-blue-700 font-medium">
                        <Eye className="h-3.5 w-3.5" /> Visible solo para Estudiante
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-500 font-medium">
                        <EyeOff className="h-3.5 w-3.5" /> Privado: Docentes / Administrativos
                      </span>
                    )}
                  </div>

                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => handleDelete(obs.id)}>
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
            <DialogTitle>Registrar Observación</DialogTitle>
            <DialogDescription>Añade un registro pedagógico o conductual al expediente del alumno</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Materia / Curso *</label>
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

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Estudiante *</label>
              <Select value={formStudentId} onValueChange={setFormStudentId} disabled={!formCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder={formCourseId ? 'Seleccionar Estudiante' : 'Primero elige un curso'} />
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
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Tipo de Registro *</label>
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

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Visibilidad</label>
                <Select value={formVisibility} onValueChange={(v) => setFormVisibility(v as ObservationVisibility)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ESTUDIANTE_Y_PADRES">Visible solo a este Estudiante y Padres</SelectItem>
                    <SelectItem value="SOLO_ESTUDIANTE">Visible solo a este Estudiante</SelectItem>
                    <SelectItem value="SOLO_DOCENTE">Privado - Solo Docentes / Administrativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Título de la Observación *</label>
              <Input
                placeholder="Ej. Excelente colaboración en clase"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Detalle *</label>
              <Textarea
                placeholder="Escribe la descripción de la observación..."
                value={formDetail}
                onChange={(e) => setFormDetail(e.target.value)}
                rows={3}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar Observación</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
