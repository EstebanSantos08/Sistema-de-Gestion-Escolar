import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  FileText,
  Search,
  Users,
  X,
  Eye,
  Paperclip,
  AlertTriangle,
  FileCheck,
  Maximize2,
  Download,
  BookOpen,
  Award,
  Star,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCourseStudents } from '@/hooks/useEnrollments';
import { teacherModuleService, type ClassActivity, type SubmissionItem } from '@/services/teacherModule.service';

interface ClassroomSubmissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: ClassActivity | null;
}

const DEFAULT_COURSE_STUDENTS = [
  { studentId: 1, name: 'Juan Pérez', studentCode: 'EST-2026-001' },
  { studentId: 2, name: 'María Rodríguez', studentCode: 'EST-2026-002' },
  { studentId: 3, name: 'Pedro Sánchez', studentCode: 'EST-2026-003' },
  { studentId: 4, name: 'Ana López', studentCode: 'EST-2026-004' },
];

export function ClassroomSubmissionsDialog({
  open,
  onOpenChange,
  activity,
}: ClassroomSubmissionsDialogProps) {
  const courseId = activity?.courseId ?? null;
  const { data: courseData } = useCourseStudents(courseId);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'submitted' | 'pending'>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<number>(1);

  const [submissionsList, setSubmissionsList] = useState<SubmissionItem[]>([]);

  const [gradeScore, setGradeScore] = useState<string>('');
  const [gradeFeedback, setGradeFeedback] = useState<string>('');

  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);
  const [previewMediaTitle, setPreviewMediaTitle] = useState<string>('');
  const [imageLoadError, setImageLoadError] = useState(false);

  useEffect(() => {
    if (activity && open) {
      setSubmissionsList(teacherModuleService.getSubmissions(activity.id));
    }
  }, [activity?.id, open]);

  const enrolledStudents = courseData?.students && courseData.students.length > 0
    ? courseData.students.map((s) => ({
        studentId: s.studentId,
        name: s.name,
        studentCode: s.studentCode,
      }))
    : DEFAULT_COURSE_STUDENTS;

  const submissions = !activity ? [] : submissionsList.length > 0 ? submissionsList : teacherModuleService.getSubmissions(activity.id);

  const allStudentsMap = new Map<number, { studentId: number; name: string; studentCode: string }>();
  enrolledStudents.forEach((st) => allStudentsMap.set(st.studentId, st));
  submissions.forEach((sub) => {
    if (!allStudentsMap.has(sub.studentId)) {
      allStudentsMap.set(sub.studentId, {
        studentId: sub.studentId,
        name: sub.studentName || `Estudiante #${sub.studentId}`,
        studentCode: `EST-2026-00${sub.studentId}`,
      });
    }
  });

  const studentSubmissions = Array.from(allStudentsMap.values()).map((st) => {
    const sub = submissions.find((s) => s.studentId === st.studentId);
    return {
      studentId: st.studentId,
      name: st.name,
      studentCode: st.studentCode,
      hasSubmitted: !!sub,
      submission: sub as SubmissionItem | undefined,
    };
  });

  const submittedCount = studentSubmissions.filter((s) => s.hasSubmitted).length;
  const gradedCount = studentSubmissions.filter((s) => s.submission?.status === 'calificada' || s.submission?.score !== undefined).length;
  const pendingCount = studentSubmissions.length - submittedCount;
  const completionPercentage = Math.round((submittedCount / Math.max(studentSubmissions.length, 1)) * 100);

  const filteredStudents = studentSubmissions.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.studentCode.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'submitted'
        ? item.hasSubmitted
        : !item.hasSubmitted;
    return matchesSearch && matchesStatus;
  });

  const firstSubmittedStudent = studentSubmissions.find((s) => s.hasSubmitted);
  const selectedItem =
    studentSubmissions.find((s) => s.studentId === selectedStudentId) ??
    firstSubmittedStudent ??
    studentSubmissions[0];

  useEffect(() => {
    setImageLoadError(false);
    if (selectedItem?.submission) {
      setGradeScore(selectedItem.submission.score !== undefined ? String(selectedItem.submission.score) : '');
      setGradeFeedback(selectedItem.submission.feedback || '');
    } else {
      setGradeScore('');
      setGradeFeedback('');
    }
  }, [selectedItem?.studentId, selectedItem?.submission?.id, selectedItem?.submission?.score]);

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !activity) return;

    const scoreNum = parseFloat(gradeScore);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 10) {
      toast.error('Por favor ingresa una calificación válida entre 0 y 10.');
      return;
    }

    teacherModuleService.gradeSubmission({
      submissionId: selectedItem.submission?.id,
      activityId: activity.id,
      studentId: selectedItem.studentId,
      studentName: selectedItem.name,
      courseId: activity.courseId,
      score: scoreNum,
      feedback: gradeFeedback,
      maxScore: 10,
    });

    toast.success(`Calificación (${scoreNum}/10) registrada para ${selectedItem.name}`);
    const updatedSubmissions = teacherModuleService.getSubmissions(activity.id);
    setSubmissionsList(updatedSubmissions);
  };

  if (!activity) return null;

  const activityTypeLabel = (activity.type ?? 'deber').toUpperCase();
  const courseNameLabel = activity.courseName ?? 'Curso';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-11/12 p-0 overflow-hidden bg-white border border-school-border rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <DialogHeader className="p-6 bg-school-background border-b border-school-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider bg-school-subtle text-school-primary px-2.5 py-0.5 rounded-md">
                  {courseNameLabel}
                </span>
                <span className="text-xs font-medium text-school-muted">
                  · {activityTypeLabel}
                </span>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-bold text-school-heading flex items-center gap-2 pt-1">
                <BookOpen className="h-5 w-5 text-school-primary shrink-0" />
                {activity.title}
              </DialogTitle>
              {activity.description && (
                <p className="text-sm text-school-muted max-w-3xl leading-relaxed">
                  {activity.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs font-medium text-school-primary bg-white px-3 py-1.5 rounded-xl border border-school-border shrink-0 shadow-xs">
              <Clock className="h-4 w-4 text-school-primary" />
              <span>Límite: {activity.dueDate}</span>
            </div>
          </div>

          {/* Tarjetas de Métricas de Entregas */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-3 rounded-xl border border-school-border flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-school-muted font-medium">Entregadas</p>
                <p className="text-lg font-bold text-school-heading">{submittedCount}</p>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-school-border flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-school-muted font-medium">Calificadas</p>
                <p className="text-lg font-bold text-school-heading">{gradedCount}</p>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-school-border flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-100">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-school-muted font-medium">Sin Entregar</p>
                <p className="text-lg font-bold text-school-heading">{pendingCount}</p>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-school-border flex items-center gap-3">
              <div className="p-2 rounded-lg bg-school-subtle text-school-primary border border-school-border">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-school-muted font-medium">Total Alumnos</p>
                <p className="text-lg font-bold text-school-heading">{studentSubmissions.length}</p>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-school-border flex flex-col justify-center">
              <div className="flex items-center justify-between text-xs font-semibold text-school-heading mb-1.5">
                <span>Cumplimiento</span>
                <span className="text-school-primary">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-school-primary h-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Cuerpo Principal Dividido */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 bg-white">
          {/* Panel Izquierdo: Lista de Estudiantes */}
          <div className="md:col-span-5 lg:col-span-4 border-r border-school-border p-4 space-y-3 flex flex-col overflow-hidden bg-school-background/50">
            {/* Buscador de Estudiantes */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-school-muted" />
              <Input
                placeholder="Buscar por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white text-sm"
              />
            </div>

            {/* Pestañas de Filtro Rápido */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-school-border text-xs font-medium">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`flex-1 py-1.5 rounded-lg transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-school-primary text-white font-semibold shadow-xs'
                    : 'text-school-muted hover:text-school-heading'
                }`}
              >
                Todos ({studentSubmissions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('submitted')}
                className={`flex-1 py-1.5 rounded-lg transition-colors ${
                  filterStatus === 'submitted'
                    ? 'bg-school-primary text-white font-semibold shadow-xs'
                    : 'text-school-muted hover:text-school-heading'
                }`}
              >
                Entregados ({submittedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('pending')}
                className={`flex-1 py-1.5 rounded-lg transition-colors ${
                  filterStatus === 'pending'
                    ? 'bg-school-primary text-white font-semibold shadow-xs'
                    : 'text-school-muted hover:text-school-heading'
                }`}
              >
                Pendientes ({pendingCount})
              </button>
            </div>

            {/* Listado de Estudiantes */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {filteredStudents.length === 0 ? (
                <div className="p-6 text-center text-school-muted text-sm">
                  No se encontraron estudiantes con este criterio.
                </div>
              ) : (
                filteredStudents.map((item) => {
                  const isSelected = selectedItem?.studentId === item.studentId;
                  return (
                    <button
                      key={item.studentId}
                      type="button"
                      onClick={() => setSelectedStudentId(item.studentId)}
                      className={`w-full p-3 rounded-xl border text-left transition-colors flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-school-subtle border-school-primary ring-1 ring-school-primary shadow-xs'
                          : 'bg-white border-school-border hover:bg-school-background'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            item.hasSubmitted
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .substring(0, 2)}
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-school-heading truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-school-muted truncate">
                            {item.studentCode}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {item.submission?.status === 'calificada' || item.submission?.score !== undefined ? (
                          <Badge variant="warning" className="text-xs font-semibold px-2 py-0.5">
                            {item.submission.score}/10
                          </Badge>
                        ) : item.hasSubmitted ? (
                          <Badge variant="success" className="text-xs font-medium px-2 py-0.5">
                            Entregado
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5">
                            Sin Entregar
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Panel Derecho: Detalle de la Entrega y Visor */}
          <div className="md:col-span-7 lg:col-span-8 p-6 flex flex-col overflow-y-auto bg-white">
            {selectedItem ? (
              <div className="space-y-6">
                {/* Cabecera del Estudiante Seleccionado */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-school-border bg-school-background/40">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        selectedItem.hasSubmitted
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {selectedItem.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-school-heading">
                        {selectedItem.name}
                      </h3>
                      <p className="text-xs text-school-muted">
                        Código: {selectedItem.studentCode}
                      </p>
                    </div>
                  </div>

                  <div>
                    {selectedItem.hasSubmitted ? (
                      <Badge variant="success" className="font-semibold gap-1 py-1">
                        <FileCheck className="h-3.5 w-3.5" /> Entrega Recibida
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="font-medium gap-1 py-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> Pendiente de Entrega
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Si el Estudiante Entregó la Evidencia */}
                {selectedItem.hasSubmitted && selectedItem.submission ? (
                  <div className="space-y-4">
                    {/* Detalles del Envío */}
                    <div className="p-4 rounded-xl border border-school-border space-y-2.5">
                      <div className="flex items-center justify-between text-xs border-b border-school-border/70 pb-2">
                        <span className="text-school-muted flex items-center gap-1.5 font-medium">
                          <Clock className="h-3.5 w-3.5 text-school-primary" />
                          Fecha y hora de entrega:
                        </span>
                        <span className="font-semibold text-school-heading">
                          {selectedItem.submission.submittedAt}
                        </span>
                      </div>

                      {selectedItem.submission.notes && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-school-muted uppercase tracking-wider">
                            Comentario del Estudiante:
                          </p>
                          <p className="text-sm text-school-body bg-school-background p-3 rounded-lg border border-school-border/60 leading-relaxed italic">
                            "{selectedItem.submission.notes}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Visor de Evidencia Adjunta */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-school-primary flex items-center gap-1.5">
                          <Paperclip className="h-4 w-4 text-school-primary" />
                          Evidencia Adjunta
                        </h4>
                        {selectedItem.submission.evidenceUrl && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setPreviewMediaUrl(selectedItem.submission!.evidenceUrl!);
                                setPreviewMediaTitle(
                                  `${selectedItem.name} — ${selectedItem.submission!.evidenceName ?? 'Evidencia'}`
                                );
                              }}
                              className="h-8 text-xs font-medium"
                            >
                              <Maximize2 className="h-3.5 w-3.5 mr-1" />
                              Ver Pantalla Completa
                            </Button>
                            <a
                              href={selectedItem.submission.evidenceUrl}
                              download={selectedItem.submission.evidenceName ?? 'evidencia'}
                              className="h-8 px-3 inline-flex items-center justify-center bg-white hover:bg-school-background text-school-heading rounded-lg font-medium text-xs border border-school-border transition-colors"
                            >
                              <Download className="h-3.5 w-3.5 mr-1 text-school-primary" />
                              Descargar
                            </a>
                          </div>
                        )}
                      </div>

                      {selectedItem.submission.evidenceUrl ? (
                        <div className="border border-school-border rounded-xl p-4 bg-school-background/30 flex flex-col items-center justify-center space-y-3">
                          {selectedItem.submission.evidenceType === 'imagen' && !imageLoadError ? (
                            <div
                              onClick={() => {
                                setPreviewMediaUrl(selectedItem.submission!.evidenceUrl!);
                                setPreviewMediaTitle(
                                  `${selectedItem.name} — ${selectedItem.submission!.evidenceName ?? 'Evidencia'}`
                                );
                              }}
                              className="relative group cursor-pointer overflow-hidden rounded-xl border border-school-border bg-white shadow-xs max-h-80 w-full flex items-center justify-center"
                            >
                              <img
                                src={selectedItem.submission.evidenceUrl}
                                alt="Evidencia entregada"
                                onError={() => setImageLoadError(true)}
                                className="max-h-80 object-contain rounded-xl transition-transform duration-200 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="bg-school-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md">
                                  <Eye className="h-4 w-4" /> Ampliar Imagen
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full bg-white p-6 rounded-xl border border-school-border flex flex-col items-center justify-center space-y-3 text-center">
                              <FileText className="h-10 w-10 text-school-primary" />
                              <div>
                                <p className="font-semibold text-sm text-school-heading">
                                  {selectedItem.submission.evidenceName ?? 'Documento Adjunto'}
                                </p>
                                <p className="text-xs text-school-muted mt-0.5">
                                  {imageLoadError
                                    ? 'No se pudo cargar la vista previa directa. Puedes abrirlo en una nueva pestaña o descargarlo.'
                                    : 'Archivo preparado para revisión'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap justify-center">
                                <Button
                                  onClick={() => {
                                    setPreviewMediaUrl(selectedItem.submission!.evidenceUrl!);
                                    setPreviewMediaTitle(
                                      `${selectedItem.name} — ${selectedItem.submission!.evidenceName ?? 'Documento'}`
                                    );
                                  }}
                                  size="sm"
                                >
                                  <Eye className="h-4 w-4 mr-1.5" /> Abrir Visor
                                </Button>
                                <a
                                  href={selectedItem.submission.evidenceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-2 bg-white hover:bg-school-subtle text-school-primary font-medium text-xs rounded-lg border border-school-border inline-flex items-center gap-1.5 transition-colors"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" /> Abrir en Nueva Pestaña
                                </a>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between w-full text-xs text-school-muted font-normal pt-1 border-t border-school-border/60">
                            <span>Archivo: {selectedItem.submission.evidenceName ?? 'Evidencia'}</span>
                            <span className="text-school-success font-medium">✓ Archivo Verificado (Máx 1MB)</span>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-school-border rounded-xl p-6 text-center text-school-muted text-sm bg-school-background/40">
                          Sin archivo adjunto enviado en esta entrega.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Sin entrega */
                  <div className="border border-school-border rounded-xl p-8 text-center space-y-3 my-auto bg-school-background/30">
                    <div className="h-12 w-12 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center mx-auto border border-amber-200">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div className="space-y-1 max-w-md mx-auto">
                      <h4 className="font-bold text-base text-school-heading">
                        Sin Entrega de Evidencia
                      </h4>
                      <p className="text-sm text-school-muted leading-relaxed">
                        {selectedItem.name} aún no ha registrado ninguna evidencia para esta actividad.
                      </p>
                    </div>
                  </div>
                )}

                {/* Formulario de Calificación Docente */}
                <form onSubmit={handleSaveGrade} className="border border-school-border p-5 rounded-xl space-y-4 bg-school-background/30">
                  <div className="flex items-center justify-between border-b border-school-border/70 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
                        <Award className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-school-heading">Calificación y Retroalimentación</h4>
                        <p className="text-xs text-school-muted">
                          Asigna la nota y comentarios pedagógicos
                        </p>
                      </div>
                    </div>

                    {selectedItem.submission?.status === 'calificada' || selectedItem.submission?.score !== undefined ? (
                      <Badge variant="warning" className="font-semibold">
                        ✓ Nota: {selectedItem.submission.score}/10
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="font-medium">
                        Pendiente de Calificar
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1.5 sm:col-span-1">
                      <Label className="text-xs font-semibold text-school-heading flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-school-warning" />
                        Nota (0 - 10) *
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        placeholder="Ej: 9.5"
                        value={gradeScore}
                        onChange={(e) => setGradeScore(e.target.value)}
                        className="bg-white font-bold text-base"
                        required
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-3">
                      <Label className="text-xs font-semibold text-school-heading">
                        Observaciones o Retroalimentación
                      </Label>
                      <Textarea
                        placeholder="Escribe la retroalimentación para el estudiante..."
                        value={gradeFeedback}
                        onChange={(e) => setGradeFeedback(e.target.value)}
                        className="bg-white text-sm"
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-school-border/70">
                    <span className="text-xs text-school-muted">
                      {selectedItem.submission?.gradedAt ? `Calificado el: ${selectedItem.submission.gradedAt}` : 'Sin calificar'}
                    </span>
                    <Button type="submit">
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      {selectedItem.submission?.status === 'calificada' || selectedItem.submission?.score !== undefined
                        ? 'Actualizar Nota'
                        : 'Guardar Calificación'}
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="p-12 text-center text-school-muted text-sm">
                Selecciona un estudiante de la lista de la izquierda para ver el detalle de su entrega.
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Lightbox Modal de Tamaño Completo para Evidencias */}
      {previewMediaUrl && (
        <Dialog open={!!previewMediaUrl} onOpenChange={() => setPreviewMediaUrl(null)}>
          <DialogContent className="max-w-4xl w-11/12 bg-white border border-school-border p-5 rounded-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-school-border">
              <h3 className="font-bold text-base text-school-heading truncate pr-4">
                {previewMediaTitle}
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewMediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-school-background hover:bg-school-subtle text-school-primary rounded-lg font-medium text-xs inline-flex items-center gap-1 border border-school-border transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Abrir en Pestaña
                </a>
              </div>
            </div>

            <div className="py-4 flex items-center justify-center max-h-[70vh] overflow-auto bg-school-background rounded-xl p-2">
              {previewMediaUrl.startsWith('data:application/pdf') || previewMediaTitle.toLowerCase().endsWith('.pdf') ? (
                <object
                  data={previewMediaUrl}
                  type="application/pdf"
                  className="w-full h-[65vh] rounded-lg border border-school-border bg-white"
                >
                  <iframe
                    src={previewMediaUrl}
                    title="PDF Preview"
                    className="w-full h-[65vh] rounded-lg border border-school-border"
                  >
                    <div className="p-8 text-center text-school-muted space-y-3">
                      <FileText className="h-10 w-10 mx-auto text-school-primary" />
                      <p className="font-semibold text-sm text-school-heading">No se pudo visualizar el documento directamente.</p>
                      <a
                        href={previewMediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-school-primary text-white rounded-lg font-medium text-xs inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <ExternalLink className="h-4 w-4" /> Abrir PDF en Nueva Pestaña
                      </a>
                    </div>
                  </iframe>
                </object>
              ) : (
                <img
                  src={previewMediaUrl}
                  alt="Evidencia Full Size"
                  className="max-h-[65vh] object-contain rounded-lg shadow-sm border border-school-border bg-white"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-school-border">
              <Button variant="outline" onClick={() => setPreviewMediaUrl(null)}>
                Cerrar
              </Button>
              <a
                href={previewMediaUrl}
                download="evidencia"
                className="px-4 py-2 bg-school-primary hover:bg-school-primaryHover text-white rounded-lg font-medium text-sm inline-flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Download className="h-4 w-4" /> Descargar Archivo
              </a>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
