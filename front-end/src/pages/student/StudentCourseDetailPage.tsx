import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, Upload, CheckCircle2, Clock, AlertTriangle, Paperclip, FileCheck, Award, Eye, Download, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useCourse } from '@/hooks/useCourses';
import { useAuth } from '@/hooks/useAuth';
import { activityService } from '@/services/activity.service';
import { submissionService, MAX_FILE_SIZE } from '@/services/submission.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { ApiActivity, SubmissionRecord, EvidenceRecord } from '@/types';

export default function StudentCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const id = courseId ? Number(courseId) : null;
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: course, isLoading: loadingCourse } = useCourse(id);

  const { data: activities = [], isLoading: loadingActivities } = useQuery({
    queryKey: ['activities', id, user?.id],
    queryFn: () => (id ? activityService.list({ courseId: id }) : Promise.resolve([])),
    enabled: !!id,
  });

  const activityIds = activities.map((a) => a.id);

  // Fetch student's own submission for each course activity
  const { data: submissionsMap = {}, isLoading: loadingSubmissions } = useQuery({
    queryKey: ['student-course-submissions', id, user?.id, activityIds],
    queryFn: async () => {
      if (activities.length === 0) return {};
      const map: Record<number, SubmissionRecord> = {};
      await Promise.all(
        activities.map(async (act) => {
          try {
            const raw = await activityService.getSubmissions(act.id);
            const sub = Array.isArray(raw) ? raw[0] : raw;
            if (sub && sub.id) {
              const full = await submissionService.get(sub.id);
              map[act.id] = full;
            }
          } catch {
            // No submission or error for this activity
          }
        })
      );
      return map;
    },
    enabled: activities.length > 0 && !!user,
  });

  const [selectedActivity, setSelectedActivity] = useState<ApiActivity | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);
  const [previewMediaTitle, setPreviewMediaTitle] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      const errMsg = `El archivo "${file.name}" (${sizeMb} MB) supera el tamaño máximo permitido de 1 MB.`;
      setFileError(errMsg);
      toast.error('El archivo excede el tamaño máximo permitido de 1 MB.');
      setSelectedFile(null);
      e.target.value = '';
      return;
    }

    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name);
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

    if (!isImage && !isPdf) {
      const errMsg = 'Formato no permitido. Se aceptan fotografías (JPG, PNG, WEBP) y documentos PDF.';
      setFileError(errMsg);
      toast.error(errMsg);
      setSelectedFile(null);
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity || !id) return;

    if (!selectedFile) {
      toast.error('Por favor selecciona un archivo de evidencia (imagen o PDF de hasta 1MB).');
      return;
    }

    setIsSubmitting(true);

    try {
      const existingSub = submissionsMap[selectedActivity.id];

      if (!existingSub) {
        // 1. Create submission first
        const newSub = await submissionService.create({
          activityId: selectedActivity.id,
          studentNotes: notes.trim() || undefined,
        });

        // 2. Upload evidence to newly created submission
        await submissionService.uploadEvidence(newSub.id, selectedFile, notes.trim() || undefined);
        toast.success('¡Deber y evidencia entregados exitosamente!');
      } else {
        // Existing submission: replace evidence if exists, otherwise upload
        const existingEv = existingSub.evidences && existingSub.evidences.length > 0
          ? existingSub.evidences[0]
          : null;

        if (existingEv) {
          await submissionService.replaceEvidence(
            existingSub.id,
            existingEv.id,
            selectedFile,
            notes.trim() || undefined
          );
          toast.success('¡Evidencia actualizada y reemplazada con éxito!');
        } else {
          await submissionService.uploadEvidence(
            existingSub.id,
            selectedFile,
            notes.trim() || undefined
          );
          toast.success('¡Evidencia adjuntada con éxito!');
        }
      }

      qc.invalidateQueries({ queryKey: ['student-course-submissions'] });
      qc.invalidateQueries({ queryKey: ['submissions'] });
      qc.invalidateQueries({ queryKey: ['submission'] });
      qc.invalidateQueries({ queryKey: ['activities', id] });

      setSelectedActivity(null);
      setSelectedFile(null);
      setNotes('');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.error || err.response?.data?.message;
        toast.error(msg || 'Error al enviar la evidencia al servidor.');
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Error al subir la evidencia. Por favor inténtalo de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="text-school-body font-medium hover:bg-school-subtle">
          <Link to="/estudiante/mis-cursos">
            <ArrowLeft className="h-4 w-4 mr-1.5 text-school-primary" /> Volver a Mis Cursos
          </Link>
        </Button>
      </div>

      {/* Encabezado del Aula Virtual */}
      <div className="bg-school-primary rounded-2xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-school-subtle bg-white/10 px-2.5 py-0.5 rounded-md">
              {course?.code ?? 'AULA'}
            </span>
            <span className="text-xs text-white/80">· Período {course?.period ?? '2026-I'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">{course?.name ?? 'Aula Virtual'}</h1>
          <p className="text-sm text-white/90">
            Aula virtual de aprendizaje y entrega de actividades
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-school-border pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-school-primary" />
          <h2 className="text-lg font-bold text-school-heading">
            Actividades y Deberes Asignados ({activities.length})
          </h2>
        </div>
      </div>

      {loadingActivities ? (
        <div className="flex justify-center py-12">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-school-primary border-t-transparent" />
        </div>
      ) : activities.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-10 w-10 mx-auto text-school-muted mb-2" />
          <p className="font-semibold text-school-heading text-base">No hay actividades asignadas aún</p>
          <p className="text-sm text-school-muted mt-1">
            Tu docente publicará aquí los deberes y tareas correspondientes a esta materia.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {activities.map((act) => {
            const mySubmission = submissionsMap[act.id];
            const isSubmitted = !!mySubmission;
            const isGraded = mySubmission?.score !== null && mySubmission?.score !== undefined;
            const primaryEvidence = mySubmission?.evidences && mySubmission.evidences.length > 0
              ? mySubmission.evidences[0]
              : null;

            return (
              <Card key={act.id} className="flex flex-col justify-between hover:border-school-accent transition-colors">
                <CardContent className="p-5 space-y-4 flex flex-col justify-between flex-1">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-school-heading text-base leading-snug">{act.title}</h4>
                      {isGraded ? (
                        <Badge variant="warning" className="shrink-0 flex items-center gap-1">
                          <Award className="h-3.5 w-3.5" />
                          Calificado: {mySubmission.score}/10
                        </Badge>
                      ) : isSubmitted ? (
                        <Badge variant="success" className="shrink-0">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Entregado
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="shrink-0">
                          <Clock className="h-3 w-3 mr-1" /> Pendiente
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-medium text-school-muted">
                      <Calendar className="h-3.5 w-3.5 text-school-primary shrink-0" />
                      <span>Fecha límite: {act.dueDate || 'Sin fecha límite'}</span>
                    </div>

                    {act.description && (
                      <p className="text-sm text-school-body bg-school-background p-3 rounded-xl border border-school-border/60 leading-relaxed">
                        {act.description}
                      </p>
                    )}
                  </div>

                  {/* Estado de Entrega o Calificación */}
                  {isGraded ? (
                    <div className="bg-school-subtle/50 p-4 rounded-xl border border-school-border text-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-school-heading flex items-center gap-1.5">
                          <Award className="h-4 w-4 text-school-warning" />
                          Nota de Tarea: <strong className="text-sm text-school-primary">{mySubmission.score} / 10</strong>
                        </span>
                      </div>

                      {mySubmission.teacherFeedback && (
                        <div className="space-y-1 bg-white p-3 rounded-lg border border-school-border">
                          <p className="text-xs font-semibold text-school-muted uppercase tracking-wider">
                            Comentarios del Docente:
                          </p>
                          <p className="text-sm text-school-body italic leading-relaxed">
                            "{mySubmission.teacherFeedback}"
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-school-muted pt-1 border-t border-school-border/60">
                        <span>Estado: Completada</span>
                        {primaryEvidence && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const evUrl = submissionService.getEvidenceDownloadUrl(mySubmission.id, primaryEvidence.id);
                                setPreviewMediaUrl(evUrl);
                                setPreviewMediaTitle(`Mi Evidencia — ${primaryEvidence.fileName}`);
                              }}
                              className="text-school-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" /> Ver Evidencia
                            </button>
                            <button
                              type="button"
                              onClick={() => submissionService.downloadEvidence(mySubmission.id, primaryEvidence.id, primaryEvidence.fileName)}
                              className="text-school-heading hover:text-school-primary font-medium flex items-center gap-1 cursor-pointer"
                            >
                              <Download className="h-3.5 w-3.5" /> Descargar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : isSubmitted ? (
                    <div className="bg-school-subtle/40 p-3.5 rounded-xl border border-school-border text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-emerald-800 flex items-center gap-1.5">
                          <FileCheck className="h-4 w-4 text-school-success" />
                          Entregado (en revisión)
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          En revisión
                        </Badge>
                      </div>

                      {primaryEvidence && (
                        <div className="flex items-center justify-between pt-1 border-t border-school-border/60">
                          <span className="text-school-muted truncate text-xs">
                            📎 {primaryEvidence.fileName}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const evUrl = submissionService.getEvidenceDownloadUrl(mySubmission.id, primaryEvidence.id);
                                setPreviewMediaUrl(evUrl);
                                setPreviewMediaTitle(`Mi Evidencia — ${primaryEvidence.fileName}`);
                              }}
                              className="h-7 text-xs font-medium px-2"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => submissionService.downloadEvidence(mySubmission.id, primaryEvidence.id, primaryEvidence.fileName)}
                              className="h-7 text-xs font-medium px-2"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="pt-2 border-t border-school-border/60">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedActivity(act);
                            setFileError(null);
                            setSelectedFile(null);
                            setNotes(mySubmission.studentNotes || '');
                          }}
                          className="w-full h-8 text-xs"
                        >
                          <Upload className="mr-1.5 h-3.5 w-3.5" /> Reemplazar Evidencia
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        setSelectedActivity(act);
                        setFileError(null);
                        setSelectedFile(null);
                        setNotes('');
                      }}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Subir Deber / Entregar Evidencia
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal para Subir Entrega de Deber */}
      <Dialog open={!!selectedActivity} onOpenChange={(v) => !v && setSelectedActivity(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-school-heading flex items-center gap-2">
              <Upload className="h-5 w-5 text-school-primary" />
              Entregar Deber: {selectedActivity?.title}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitEvidence} className="space-y-4 pt-2">
            <div className="bg-school-subtle/60 p-3 rounded-xl border border-school-border text-xs space-y-1 text-school-body">
              <p className="font-semibold flex items-center gap-1.5 text-school-primary">
                <Paperclip className="h-4 w-4 text-school-primary" />
                Formatos Aceptados: Imágenes (JPG, PNG, WEBP) y documentos PDF.
              </p>
              <p className="text-school-warning font-medium">
                ⚠️ Límite máximo de peso: 1 MB (1,024 KB).
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-school-heading">Seleccionar Archivo (Máx 1MB) *</Label>
              <Input
                type="file"
                accept="image/*,.pdf,.jpg,.jpeg,.png,.webp,.gif,.heic"
                onChange={handleFileChange}
                className="cursor-pointer file:mr-2 file:rounded-md file:border-0 file:bg-school-subtle file:text-school-primary file:font-semibold"
                required
              />
            </div>

            {fileError && (
              <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-xs text-rose-800 font-medium flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-school-error mt-0.5" />
                <span>{fileError}</span>
              </div>
            )}

            {selectedFile && !fileError && (
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center justify-between">
                <span className="truncate">✓ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                <Badge variant="success">Válido &lt; 1MB</Badge>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-school-heading">Comentarios o Mensaje (Opcional)</Label>
              <Textarea
                placeholder="Escribe alguna aclaración para tu docente..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setSelectedActivity(null)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !!fileError || !selectedFile}
              >
                {isSubmitting ? 'Subiendo...' : 'Confirmar Entrega'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lightbox para el Estudiante */}
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
                  alt="Evidencia entregada"
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
                download="mi_evidencia"
                className="px-4 py-2 bg-school-primary hover:bg-school-primaryHover text-white rounded-lg font-medium text-sm inline-flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Download className="h-4 w-4" /> Descargar Archivo
              </a>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
