import { useState } from 'react';
import { Plus, ThumbsUp, AlertTriangle, Info, Trash2, Eye, EyeOff, User, BookOpen, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useMyCourses } from '@/hooks/useCourses';
import { useCourseStudents } from '@/hooks/useEnrollments';
import { useObservations } from '@/hooks/useObservations';
import { observationService } from '@/services/observation.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import type { BackendObservation } from '@/types';

export default function ObservationsPage() {
  const qc = useQueryClient();
  const { data: courses } = useMyCourses();
  const { data: observations = [], isLoading, isError } = useObservations();
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formCourseId, setFormCourseId] = useState<string>('');
  const [formStudentId, setFormStudentId] = useState<string>('');
  const [formType, setFormType] = useState<'ACADEMIC' | 'BEHAVIORAL' | 'GENERAL'>('GENERAL');
  const [formTitle, setFormTitle] = useState('');
  const [formDetail, setFormDetail] = useState('');
  const [formVisibility, setFormVisibility] = useState<'ESTUDIANTE_Y_PADRES' | 'SOLO_ESTUDIANTE' | 'SOLO_DOCENTE'>('ESTUDIANTE_Y_PADRES');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const courseIdNum = formCourseId ? Number(formCourseId) : null;
  const { data: courseData } = useCourseStudents(courseIdNum);
  const students = courseData?.students ?? [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentId || !formTitle || !formDetail) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setIsSubmitting(true);
      await observationService.create({
        studentId: Number(formStudentId),
        title: formTitle.trim(),
        description: formDetail.trim(),
        type: formType,
        visibility: formVisibility,
      });

      toast.success('Observación registrada con éxito en el servidor');
      qc.invalidateQueries({ queryKey: ['observations'] });
      qc.invalidateQueries({ queryKey: ['daily-summary'] });
      setIsModalOpen(false);
      setFormTitle('');
      setFormDetail('');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al registrar observación';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta observación?')) return;
    try {
      await observationService.remove(id);
      qc.invalidateQueries({ queryKey: ['observations'] });
      qc.invalidateQueries({ queryKey: ['daily-summary'] });
      toast.success('Observación eliminada');
    } catch {
      toast.error('Error al eliminar la observación');
    }
  };

  const filteredObservations = observations.filter((obs) => {
    if (selectedTypeFilter !== 'all' && obs.type !== selectedTypeFilter) return false;
    return true;
  });

  const getObservationBadge = (type: string) => {
    switch (type) {
      case 'ACADEMIC':
        return (
          <Badge variant="secondary" className="gap-1">
            <ThumbsUp className="h-3 w-3" /> Académica
          </Badge>
        );
      case 'BEHAVIORAL':
        return (
          <Badge variant="purple" className="gap-1">
            <AlertTriangle className="h-3 w-3" /> Conductual
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <Info className="h-3 w-3" /> General
          </Badge>
        );
    }
  };

  const getVisibilityBadge = (vis: string) => {
    switch (vis) {
      case 'ESTUDIANTE_Y_PADRES':
        return (
          <Badge variant="outline" className="gap-1 text-xs text-school-muted-readable">
            <Eye className="h-3 w-3" /> Visible para Estudiante y Familia
          </Badge>
        );
      case 'SOLO_ESTUDIANTE':
        return (
          <Badge variant="outline" className="gap-1 text-xs text-school-muted-readable">
            <Eye className="h-3 w-3" /> Solo Estudiante
          </Badge>
        );
      case 'SOLO_DOCENTE':
        return (
          <Badge variant="outline" className="gap-1 text-xs text-amber-700 border-amber-300 bg-amber-50">
            <EyeOff className="h-3 w-3" /> Solo Docente / Confidencial
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          eyebrow="Docente"
          title="Bitácora de Observaciones"
          description="Registro oficial de seguimiento pedagógico y conductual de los estudiantes"
        />
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Nueva Observación
        </Button>
      </div>

      {/* Filter bar */}
      <div className="nk-card nk-filter flex flex-wrap items-center gap-4 p-5">
        <span className="text-sm font-medium text-school-heading">Filtrar por tipo:</span>
        <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="ACADEMIC">Académica</SelectItem>
            <SelectItem value="BEHAVIORAL">Conductual</SelectItem>
            <SelectItem value="GENERAL">General</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-ink-turquoise mb-3" />
          <p className="text-school-muted-readable">Cargando observaciones institucionales...</p>
        </div>
      ) : isError ? (
        <div className="py-16 text-center text-red-600">
          <p>No se pudieron cargar las observaciones del servidor.</p>
        </div>
      ) : filteredObservations.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent className="space-y-3">
            <Info className="h-10 w-10 text-school-muted-readable mx-auto" />
            <p className="text-base font-semibold text-school-heading">No hay observaciones registradas</p>
            <p className="text-sm text-school-muted-readable max-w-md mx-auto">
              Utiliza el botón superior para crear la primera observación de seguimiento para tus estudiantes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredObservations.map((obs: BackendObservation) => (
            <Card accent={obs.type === 'ACADEMIC' ? 'blue' : obs.type === 'BEHAVIORAL' ? 'violet' : 'turquoise'} key={obs.id} className="nk-event flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getObservationBadge(obs.type)}
                      {getVisibilityBadge(obs.visibility)}
                    </div>
                    <CardTitle className="text-base font-bold text-school-heading pt-1">{obs.title}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(obs.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 flex flex-col justify-between">
                <p className="text-sm text-school-body bg-school-subtle/40 p-3 rounded-lg border border-school-border/50">
                  {obs.description}
                </p>

                <div className="pt-2 border-t border-school-border/60 text-xs text-school-muted-readable flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 font-medium text-school-heading">
                    <User className="h-3.5 w-3.5 text-ink-turquoise" />
                    <span>{obs.student?.user?.name || `Estudiante #${obs.studentId}`}</span>
                  </div>
                  <span>{new Date(obs.date || obs.createdAt).toLocaleDateString('es-ES')}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Nueva Observación */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Nueva Observación</DialogTitle>
            <DialogDescription>
              Agrega una anotación de seguimiento sobre el desempeño o comportamiento del estudiante.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="course">Curso / Materia *</Label>
                <Select value={formCourseId} onValueChange={setFormCourseId}>
                  <SelectTrigger id="course">
                    <SelectValue placeholder="Selecciona curso" />
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
                <Label htmlFor="student">Estudiante *</Label>
                <Select
                  value={formStudentId}
                  onValueChange={setFormStudentId}
                  disabled={!formCourseId || students.length === 0}
                >
                  <SelectTrigger id="student">
                    <SelectValue placeholder={!formCourseId ? 'Elige curso primero' : students.length === 0 ? 'Sin alumnos' : 'Selecciona estudiante'} />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.studentId} value={String(s.studentId)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="type">Tipo de Observación *</Label>
                <Select
                  value={formType}
                  onValueChange={(val) => setFormType(val as 'ACADEMIC' | 'BEHAVIORAL' | 'GENERAL')}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">General</SelectItem>
                    <SelectItem value="ACADEMIC">Académica</SelectItem>
                    <SelectItem value="BEHAVIORAL">Conductual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="visibility">Visibilidad *</Label>
                <Select
                  value={formVisibility}
                  onValueChange={(val) => setFormVisibility(val as 'ESTUDIANTE_Y_PADRES' | 'SOLO_ESTUDIANTE' | 'SOLO_DOCENTE')}
                >
                  <SelectTrigger id="visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ESTUDIANTE_Y_PADRES">Estudiante y Familia</SelectItem>
                    <SelectItem value="SOLO_ESTUDIANTE">Solo Estudiante</SelectItem>
                    <SelectItem value="SOLO_DOCENTE">Confidencial (Solo Docente)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title">Título o Motivo Breve *</Label>
              <Input
                id="title"
                placeholder="Ej. Excelente participación en clase o Entrega tardía reiterada"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="detail">Descripción detallada *</Label>
              <Textarea
                id="detail"
                rows={3}
                placeholder="Describe la situación observada y acuerdos pedagógicos tomados..."
                value={formDetail}
                onChange={(e) => setFormDetail(e.target.value)}
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
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Guardando...
                  </>
                ) : (
                  'Guardar Observación'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
