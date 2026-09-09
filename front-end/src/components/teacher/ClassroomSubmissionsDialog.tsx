import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  FileText,
  Search,
  Users,
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCourseStudents } from '@/hooks/useEnrollments';
import { activityService } from '@/services/activity.service';
import { submissionService } from '@/services/submission.service';
import type { SubmissionRecord, EvidenceRecord } from '@/types';

export interface ClassroomActivityProp {
  id: number | string;
  courseId: number;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  type?: string;
  maxScore?: number;
  courseName?: string;
}

interface ClassroomSubmissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: ClassroomActivityProp | null;
}

export function ClassroomSubmissionsDialog({
  open,
  onOpenChange,
  activity,
}: ClassroomSubmissionsDialogProps) {
  const qc = useQueryClient();
  const courseId = activity?.courseId ?? null;
  const activityIdNum = activity ? Number(activity.id) : null;

  const { data: courseData, isLoading: loadingStudents } = useCourseStudents(courseId);

  const { data: rawSubmissions, isLoading: loadingSubmissions } = useQuery({
    queryKey: ['submissions', activityIdNum],
    queryFn: async () => {
      if (!activityIdNum) return [];
      const res = await activityService.getSubmissions(activityIdNum);
      return Array.isArray(res) ? res : res ? [res] : [];
    },
    enabled: !!activityIdNum && open,
  });

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'submitted' | 'pending'>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const [gradeScore, setGradeScore] = useState<string>('');
  const [gradeFeedback, setGradeFeedback] = useState<string>('');

  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);
  const [previewMediaTitle, setPreviewMediaTitle] = useState<string>('');
  const [imageLoadError, setImageLoadError] = useState(false);

  const enrolledStudents = (courseData?.students ?? []).map((s) => ({
    studentId: s.studentId,
    name: s.name,
    studentCode: s.studentCode,
  }));

  const submissionsList: SubmissionRecord[] = Array.isArray(rawSubmissions) ? rawSubmissions : [];

  // Active submission for selected student (if any)
  const allStudentsMap = new Map<number, { studentId: number; name: string; studentCode: string }>();
  enrolledStudents.forEach((st) => allStudentsMap.set(st.studentId, st));
  submissionsList.forEach((sub) => {
    if (!allStudentsMap.has(sub.studentId)) {
      const sName = sub.student?.user?.name || `Estudiante #${sub.studentId}`;
      const sCode = sub.student?.studentCode || `EST-${sub.studentId}`;
      allStudentsMap.set(sub.studentId, {
        studentId: sub.studentId,
        name: sName,
        studentCode: sCode,
      });
    }
  });

  const studentSubmissions = Array.from(allStudentsMap.values()).map((st) => {
    const sub = submissionsList.find((s) => s.studentId === st.studentId);
    return {
      studentId: st.studentId,
      name: st.name,
      studentCode: st.studentCode,
      hasSubmitted: !!sub,
      submission: sub,
    };
  });

  const submittedCount = studentSubmissions.filter((s) => s.hasSubmitted).length;
  const gradedCount = studentSubmissions.filter(
    (s) => s.submission?.status === 'completada' || s.submission?.score !== null && s.submission?.score !== undefined
  ).length;
  const pendingCount = studentSubmissions.length - submittedCount;
  const completionPercentage = Math.round(
    (submittedCount / Math.max(studentSubmissions.length, 1)) * 100
  );

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

  // Fetch full submission with evidences when a student submission is selected
  const selectedSubmissionId = selectedItem?.submission?.id ?? null;
  const { data: fullSubmission } = useQuery({
    queryKey: ['submission', selectedSubmissionId],
    queryFn: () => submissionService.get(selectedSubmissionId!),
    enabled: !!selectedSubmissionId,
  });

  const activeSubmission = fullSubmission ?? selectedItem?.submission ?? null;
  const activeEvidences: EvidenceRecord[] = activeSubmission?.evidences ?? [];
  const primaryEvidence = activeEvidences.length > 0 ? activeEvidences[0] : null;

  useEffect(() => {
    setImageLoadError(false);
    if (activeSubmission) {
      setGradeScore(
        activeSubmission.score !== null && activeSubmission.score !== undefined
          ? String(activeSubmission.score)
          : ''
      );
      setGradeFeedback(activeSubmission.teacherFeedback || '');
    } else {
      setGradeScore('');
      setGradeFeedback('');
    }
  }, [activeSubmission?.id, activeSubmission?.score, selectedItem?.studentId]);

  const gradeMutation = useMutation({
    mutationFn: async ({ submissionId, score, feedback }: { submissionId: number; score: number; feedback?: string }) => {
      return submissionService.grade(submissionId, {
        score,
        teacherFeedback: feedback,
      });
    },
    onSuccess: (_, variables) => {
      toast.success(`Calificación guardada (${variables.score}/10)`);
      qc.invalidateQueries({ queryKey: ['submissions', activityIdNum] });
      qc.invalidateQueries({ queryKey: ['submission', variables.submissionId] });
      if (activity?.courseId) {
        qc.invalidateQueries({ queryKey: ['activities', activity.courseId] });
      }
      qc.invalidateQueries({ queryKey: ['daily-summary'] });
      qc.invalidateQueries({ queryKey: ['audit-logs'] });
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.error || err.response?.data?.message;
        toast.error(msg || 'Error al calificar la entrega');
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Error al guardar la calificación');
      }
    },
  });

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !activity) return;

    if (!activeSubmission) {
      toast.error('El estudiante no ha realizado una entrega para calificar.');
      return;
    }

    const scoreNum = parseFloat(gradeScore);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 10) {
      toast.error('Por favor ingresa una calificación válida entre 0 y 10.');
      return;
    }

    gradeMutation.mutate({
      submissionId: activeSubmission.id,
      score: scoreNum,
      feedback: gradeFeedback.trim() || undefined,
    });
  };

  const handleDownloadEvidenceFile = (ev: EvidenceRecord) => {
    if (!activeSubmission) return;
    submissionService.downloadEvidence(activeSubmission.id, ev.id, ev.fileName).catch(() => {
      toast.error('No se pudo descargar la evidencia');
    });
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
                <span className="text-xs font-semibold uppercase tracking-wider bg-school-subtle text-ink-turquoise px-2.5 py-0.5 rounded-md">
                  {courseNameLabel}
                </span>
                <span className="text-xs font-medium text-school-muted-readable">
                  · {activityTypeLabel}
                </span>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-bold text-school-heading flex items-center gap-2 pt-1">
                <BookOpen className="h-5 w-5 text-ink-turquoise shrink-0" />
                {activity.title}
              </DialogTitle>
              {activity.description && (
                <p className="text-sm text-school-muted-readable max-w-3xl leading-relaxed">
                  {activity.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs font-medium text-ink-turquoise bg-white px-3 py-1.5 rounded-xl border border-school-border shrink-0 shadow-xs">
              <Clock className="h-4 w-4 text-ink-turquoise" />
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
                <p className="text-xs text-school-muted-readable font-medium">Entregadas</p>
                <p className="text-lg font-bold text-school-heading">{submittedCount}</p>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-school-border flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-school-muted-readable font-medium">Calificadas</p>
                <p className="text-lg font-bold text-school-heading">{gradedCount}</p>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-school-border flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-100">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-school-muted-readable font-medium">Sin Entregar</p>
                <p className="text-lg font-bold text-school-heading">{pendingCount}</p>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-school-border flex items-center gap-3">
              <div className="p-2 rounded-lg bg-school-subtle text-ink-turquoise border border-school-border">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-school-muted-readable font-medium">Total Alumnos</p>
                <p className="text-lg font-bold text-school-heading">{studentSubmissions.length}</p>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-school-border flex flex-col justify-center">
              <div className="flex items-center justify-between text-xs font-semibold text-school-heading mb-1.5">
                <span>Cumplimiento</span>
                <span className="text-ink-turquoise">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-school-primary h-full transition-[color,background-color,border-color,box-shadow,transform] duration-300"
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
              <Search className="absolute left-3 top-3 h-4 w-4 text-school-muted-readable" />
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
                    : 'text-school-muted-readable hover:text-school-heading'
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
                    : 'text-school-muted-readable hover:text-school-heading'
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
                    : 'text-school-muted-readable hover:text-school-heading'
                }`}
              >
                Pendientes ({pendingCount})
              </button>
            </div>

            {/* Listado de Estudiantes */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {filteredStudents.length === 0 ? (
                <div className="p-6 text-center text-school-muted-readable text-sm">
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
                          <p className="text-xs text-school-muted-readable truncate">
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
                      <p className="text-xs text-school-muted-readable">
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
                        <span className="text-school-muted-readable flex items-center gap-1.5 font-medium">
                          <Clock className="h-3.5 w-3.5 text-ink-turquoise" />
                          Fecha y hora de entrega:
                        </span>
                        <span className="font-semibold text-school-heading">
                          {selectedItem.submission.submittedAt}
                        </span>
                      </div>

                      {selectedItem.submission.notes && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-school-muted-readable uppercase tracking-wider">
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
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-turquoise flex items-center gap-1.5">
                          <Paperclip className="h-4 w-4 text-ink-turquoise" />
                          Evidencia Adjunta {activeEvidences.length > 0 && `(${activeEvidences.length})`}
                        </h4>
                        {primaryEvidence && activeSubmission && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const evUrl = submissionService.getEvidenceDownloadUrl(activeSubmission.id, primaryEvidence.id);
                                setPreviewMediaUrl(evUrl);
                                setPreviewMediaTitle(
                                  `${selectedItem.name} — ${primaryEvidence.fileName}`
                                );
                              }}
                              className="h-8 text-xs font-medium"
                            >
                              <Maximize2 className="h-3.5 w-3.5 mr-1" />
                              Ver Pantalla Completa
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadEvidenceFile(primaryEvidence)}
                              className="h-8 text-xs font-medium"
                            >
                              <Download className="h-3.5 w-3.5 mr-1 text-ink-turquoise" />
                              Descargar
                            </Button>
                          </div>
                        )}
                      </div>

                      {primaryEvidence && activeSubmission ? (
                        <div className="border border-school-border rounded-xl p-4 bg-school-background/30 flex flex-col items-center justify-center space-y-3">
                          {(primaryEvidence.type === 'imagen' || primaryEvidence.mimeType?.startsWith('image/')) && !imageLoadError ? (
                            <div
                              onClick={() => {
                                const evUrl = submissionService.getEvidenceDownloadUrl(activeSubmission.id, primaryEvidence.id);
                                setPreviewMediaUrl(evUrl);
                                setPreviewMediaTitle(
                                  `${selectedItem.name} — ${primaryEvidence.fileName}`
                                );
                              }}
                              className="relative group cursor-pointer overflow-hidden rounded-xl border border-school-border bg-white shadow-xs max-h-80 w-full flex items-center justify-center"
                            >
                              <img
                                src={submissionService.getEvidenceDownloadUrl(activeSubmission.id, primaryEvidence.id)}
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
                              <FileText className="h-10 w-10 text-ink-turquoise" />
                              <div>
                                <p className="font-semibold text-sm text-school-heading">
                                  {primaryEvidence.fileName}
                                </p>
                                <p className="text-xs text-school-muted-readable mt-0.5">
                                  {imageLoadError
                                    ? 'No se pudo cargar la vista previa directa. Puedes abrirlo en una nueva pestaña o descargarlo.'
                                    : `Archivo ${primaryEvidence.mimeType || 'adjunto'} (${primaryEvidence.fileSize ? (primaryEvidence.fileSize / 1024).toFixed(1) + ' KB' : 'verificado'})`}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap justify-center">
                                <Button
                                  onClick={() => {
                                    const evUrl = submissionService.getEvidenceDownloadUrl(activeSubmission.id, primaryEvidence.id);
                                    setPreviewMediaUrl(evUrl);
                                    setPreviewMediaTitle(
                                      `${selectedItem.name} — ${primaryEvidence.fileName}`
                                    );
                                  }}
                                  size="sm"
                                >
                                  <Eye className="h-4 w-4 mr-1.5" /> Abrir Visor
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadEvidenceFile(primaryEvidence)}
                                  className="h-8 text-xs font-medium"
                                >
                                  <Download className="h-3.5 w-3.5 mr-1.5 text-ink-turquoise" /> Descargar
                                </Button>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between w-full text-xs text-school-muted-readable font-normal pt-1 border-t border-school-border/60">
                            <span>Archivo: {primaryEvidence.fileName}</span>
                            <span className="text-school-success font-medium">✓ Evidencia Registrada en Servidor</span>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-school-border rounded-xl p-6 text-center text-school-muted-readable text-sm bg-school-background/40">
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
                      <p className="text-sm text-school-muted-readable leading-relaxed">
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
                        <p className="text-xs text-school-muted-readable">
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
                    <span className="text-xs text-school-muted-readable">
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
              <div className="p-12 text-center text-school-muted-readable text-sm">
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
                  className="px-3 py-1.5 bg-school-background hover:bg-school-subtle text-ink-turquoise rounded-lg font-medium text-xs inline-flex items-center gap-1 border border-school-border transition-colors"
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
                    <div className="p-8 text-center text-school-muted-readable space-y-3">
                      <FileText className="h-10 w-10 mx-auto text-ink-turquoise" />
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
