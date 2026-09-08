import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, Upload, CheckCircle2, Clock, Sparkles, AlertTriangle, Paperclip, FileCheck, Award, Star, Eye, Download, ExternalLink, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCourse } from '@/hooks/useCourses';
import { useAuth } from '@/hooks/useAuth';
import { teacherModuleService, type ClassActivity, type SubmissionItem } from '@/services/teacherModule.service';
import { PageHeader } from '@/components/shared/PageHeader';
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

export default function StudentCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const id = courseId ? Number(courseId) : null;
  const { user } = useAuth();

  const { data: course } = useCourse(id);

  const defaultNames: Record<number, { name: string; code: string }> = {
    1: { name: 'Matemáticas I', code: 'MAT-101' },
    2: { name: 'Lengua y Literatura', code: 'LEN-101' },
    3: { name: 'Ciencias Naturales', code: 'CIE-101' },
    4: { name: 'Historia Universal', code: 'HIS-101' },
    5: { name: 'Informática Básica', code: 'INF-101' },
  };

  const displayCourse = course ?? {
    id: id ?? 1,
    name: defaultNames[id ?? 1]?.name ?? 'Curso General',
    code: defaultNames[id ?? 1]?.code ?? 'MAT-101',
    period: '2026-I',
  };

  const [activities] = useState<ClassActivity[]>(() =>
    id ? teacherModuleService.getActivities(id) : []
  );

  const [submissions, setSubmissions] = useState<SubmissionItem[]>(() =>
    teacherModuleService.getSubmissions()
  );

  const [selectedActivity, setSelectedActivity] = useState<ClassActivity | null>(null);
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

    if (file.size > 1048576) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      const errMsg = `El archivo "${file.name}" (${sizeMb} MB) supera el tamaño máximo permitido de 1 MB.`;
      setFileError(errMsg);
      toast.error('El archivo excede el tamaño máximo permitido de 1 MB.');
      setSelectedFile(null);
      e.target.value = '';
      return;
    }

    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|bmp|heic|svg)$/i.test(file.name);
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
      const fileDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const isImage = selectedFile.type.startsWith('image/');
      const studentId = user?.id ?? 1;
      const studentName = user?.name ?? 'Estudiante Actual';

      teacherModuleService.submitEvidence({
        activityId: selectedActivity.id,
        studentId,
        studentName,
        courseId: id,
        notes: notes.trim(),
        evidenceUrl: fileDataUrl,
        evidenceName: selectedFile.name,
        evidenceType: isImage ? 'imagen' : 'documento',
      });

      toast.success('¡Deber entregado exitosamente!');
      setSubmissions(teacherModuleService.getSubmissions());
      setSelectedActivity(null);
      setSelectedFile(null);
      setNotes('');
    } catch {
      toast.error('Error al procesar el archivo. Por favor inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const studentId = user?.id ?? 1;

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
              {displayCourse.code}
            </span>
            <span className="text-xs text-white/80">· Período {displayCourse.period}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">{displayCourse.name}</h1>
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

      {activities.length === 0 ? (
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
            const mySubmission = submissions.find(
              (s) => s.activityId === act.id && (s.studentId === studentId || s.studentId === 1)
            );
            const isSubmitted = !!mySubmission;
            const isGraded = mySubmission?.status === 'calificada' || mySubmission?.score !== undefined;

            return (
              <Card key={act.id} className="flex flex-col justify-between hover:border-school-accent transition-colors">
                <CardContent className="p-5 space-y-4 flex flex-col justify-between flex-1">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-school-heading text-base leading-snug">{act.title}</h4>
                      {isGraded ? (
                        <Badge variant="warning" className="shrink-0 flex items-center gap-1">
                          <Award className="h-3.5 w-3.5" />
                          Calificado: {mySubmission?.score}/10
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
                      <span>Fecha límite: {act.dueDate}</span>
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
                          Nota Final: <strong className="text-sm text-school-primary">{mySubmission.score} / 10</strong>
                        </span>
                        {mySubmission.gradedAt && (
                          <span className="text-xs text-school-muted">
                            {mySubmission.gradedAt}
                          </span>
                        )}
                      </div>

                      {mySubmission.feedback && (
                        <div className="space-y-1 bg-white p-3 rounded-lg border border-school-border">
                          <p className="text-xs font-semibold text-school-muted uppercase tracking-wider">
                            Comentarios del Docente:
                          </p>
                          <p className="text-sm text-school-body italic leading-relaxed">
                            "{mySubmission.feedback}"
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-school-muted pt-1 border-t border-school-border/60">
                        <span>Entregado: {mySubmission.submittedAt}</span>
                        {mySubmission.evidenceName && mySubmission.evidenceUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewMediaUrl(mySubmission.evidenceUrl!);
                              setPreviewMediaTitle(`Mi Evidencia — ${mySubmission.evidenceName ?? 'Deber'}`);
                            }}
                            className="text-school-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" /> 📎 {mySubmission.evidenceName}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : isSubmitted ? (
                    <div className="bg-school-subtle/40 p-3.5 rounded-xl border border-school-border text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-emerald-800 flex items-center gap-1.5">
                          <FileCheck className="h-4 w-4 text-school-success" />
                          Entregado el {mySubmission.submittedAt}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          En revisión
                        </Badge>
                      </div>
                      {mySubmission.evidenceName && (
                        <div className="flex items-center justify-between pt-1 border-t border-school-border/60">
                          <span className="text-school-muted truncate text-xs">
                            📎 {mySubmission.evidenceName}
                          </span>
                          {mySubmission.evidenceUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setPreviewMediaUrl(mySubmission.evidenceUrl!);
                                setPreviewMediaTitle(`Mi Evidencia — ${mySubmission.evidenceName ?? 'Deber'}`);
                              }}
                              className="h-7 text-xs font-medium px-2"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      onClick={() => { setSelectedActivity(act); setFileError(null); setSelectedFile(null); setNotes(''); }}
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
