import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, Upload, CheckCircle2, Clock, Sparkles, AlertTriangle, Paperclip, FileCheck, Award, Star } from 'lucide-react';
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

  const fallbackCourse = defaultNames[id ?? 1] ?? { name: 'Aula Virtual del Curso', code: 'CURSO-2026' };

  const displayCourse = course ?? {
    id: id ?? 1,
    name: fallbackCourse.name,
    code: fallbackCourse.code,
    period: '2026-I',
  };

  const allActivities = id ? teacherModuleService.getActivities(id) : teacherModuleService.getActivities();
  const activities = allActivities.length > 0 ? allActivities : teacherModuleService.getActivities();

  const [submissions, setSubmissions] = useState<SubmissionItem[]>(() =>
    teacherModuleService.getSubmissions()
  );

  const [selectedActivity, setSelectedActivity] = useState<ClassActivity | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Validación estricta de 1 MB (1,048,576 bytes)
    if (file.size > 1048576) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      const errMsg = `El archivo "${file.name}" (${sizeMb} MB) supera el tamaño máximo permitido de 1 MB. Por favor comprima o elija una foto/PDF más liviano.`;
      setFileError(errMsg);
      toast.error('El archivo excede el tamaño máximo permitido de 1 MB.');
      setSelectedFile(null);
      e.target.value = '';
      return;
    }

    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|bmp|heic|svg)$/i.test(file.name);
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

    if (!isImage && !isPdf) {
      const errMsg = 'Formato no permitido. Se aceptan todos los tipos de imágenes/fotos (JPG, PNG, WEBP, HEIC, GIF) y documentos PDF.';
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
      toast.error('Por favor adjunta una imagen o PDF como evidencia');
      return;
    }

    try {
      setIsSubmitting(true);
      const parsedFile = await teacherModuleService.validateAndReadEvidenceFile(selectedFile);

      const newSubmission = teacherModuleService.createSubmission({
        activityId: selectedActivity.id,
        studentId: user?.id ?? 1,
        studentName: user?.name ?? 'Estudiante Representado',
        courseId: id,
        status: 'entregada',
        notes: notes,
        evidenceUrl: parsedFile.fileUrl,
        evidenceName: parsedFile.fileName,
        evidenceType: parsedFile.fileType,
      });

      setSubmissions(teacherModuleService.getSubmissions());
      toast.success('¡Deber entregado exitosamente!');
      setSelectedActivity(null);
      setNotes('');
      setSelectedFile(null);
      setFileError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al subir la entrega';
      toast.error(msg);
      setFileError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Botón de Retorno */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="text-slate-600 font-bold hover:bg-slate-100 rounded-xl">
          <Link to="/estudiante/mis-cursos">
            <ArrowLeft className="h-4 w-4 mr-1.5 text-[#008BC1]" /> Volver a Mis Cursos
          </Link>
        </Button>
      </div>

      {/* Encabezado del Aula Virtual para Estudiante/Padre */}
      <div className="bg-gradient-to-r from-[#008BC1] via-[#0073A0] to-[#09A9C2] rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#F4B51B]" />
          <span className="text-xs font-black uppercase tracking-wider text-sky-100">{displayCourse.code}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">{displayCourse.name}</h1>
        <p className="text-sm font-bold text-sky-100">
          Período Lectivo {displayCourse.period} · Aula Virtual de Representado
        </p>
      </div>

      {/* Título de la Sección de Deberes */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#008BC1]" />
          Deberes Asignados del Curso ({activities.length})
        </h2>
      </div>

      {/* Lista de Deberes */}
      {activities.length === 0 ? (
        <Card className="p-8 text-center bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200">
          <FileCheck className="h-10 w-10 mx-auto text-emerald-400 mb-2" />
          <p className="font-extrabold text-slate-700 text-sm">No hay deberes pendientes para este curso</p>
          <p className="text-xs text-slate-400 mt-1">Tu docente guía no ha publicado nuevas tareas por el momento.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {activities.map((act) => {
            const mySubmission = submissions.find((s) => s.activityId === act.id);
            const isSubmitted = !!mySubmission;
            const isGraded = mySubmission?.status === 'calificada' || mySubmission?.score !== undefined;

            return (
              <Card key={act.id} className="bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-slate-100 space-y-4 hover:shadow-xl transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-black text-slate-800 text-base">{act.title}</h4>
                    {isGraded ? (
                      <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shrink-0 flex items-center gap-1 shadow-sm px-2.5 py-1">
                        <Award className="h-3.5 w-3.5" />
                        Calificado: {mySubmission?.score}/10
                      </Badge>
                    ) : isSubmitted ? (
                      <Badge className="bg-[#31B45A] text-white font-bold shrink-0">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Entregado
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500 text-white font-bold shrink-0">
                        <Clock className="h-3 w-3 mr-1" /> Pendiente
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <Calendar className="h-3.5 w-3.5 text-[#008BC1]" />
                    <span>Fecha Límite: {act.dueDate}</span>
                  </div>

                  {act.description && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                      {act.description}
                    </p>
                  )}
                </div>

                {/* Sección de Estado de Entrega / Calificación o Botón para Subir */}
                {isGraded ? (
                  <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50/60 p-4 rounded-2xl border border-amber-200/80 text-xs space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-amber-900 flex items-center gap-1.5 text-xs">
                        <Award className="h-4 w-4 text-amber-600" />
                        Nota Final: <span className="text-sm text-amber-700 font-black">{mySubmission.score} / 10</span>
                      </span>
                      {mySubmission.gradedAt && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-200">
                          {mySubmission.gradedAt}
                        </span>
                      )}
                    </div>

                    {mySubmission.feedback && (
                      <div className="space-y-1 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                        <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                          Retroalimentación del Docente:
                        </p>
                        <p className="text-xs text-slate-700 italic font-medium leading-relaxed">
                          "{mySubmission.feedback}"
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold pt-1 border-t border-amber-200/60">
                      <span>Entregado: {mySubmission.submittedAt}</span>
                      {mySubmission.evidenceName && (
                        <span className="truncate max-w-[150px]">📎 {mySubmission.evidenceName}</span>
                      )}
                    </div>
                  </div>
                ) : isSubmitted ? (
                  <div className="bg-teal-50/70 p-3.5 rounded-2xl border border-teal-100 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="font-black text-teal-800 flex items-center gap-1.5">
                        <FileCheck className="h-4 w-4 text-[#31B45A]" />
                        Deber entregado el {mySubmission.submittedAt}
                      </p>
                      <Badge className="bg-sky-100 text-sky-700 border-sky-200 text-[10px] font-bold">
                        En revisión por docente
                      </Badge>
                    </div>
                    {mySubmission.evidenceName && (
                      <p className="text-slate-600 font-medium truncate pt-0.5">
                        📎 Archivo adjunto: <strong>{mySubmission.evidenceName}</strong>
                      </p>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={() => { setSelectedActivity(act); setFileError(null); setSelectedFile(null); setNotes(''); }}
                    className="w-full bg-[#008BC1] hover:bg-[#0073A0] text-white font-extrabold shadow-md rounded-xl"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Subir Deber / Entregar Evidencia
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal para Subir Entrega de Deber (Con Restricción Estricta de 1MB) */}
      <Dialog open={!!selectedActivity} onOpenChange={(v) => !v && setSelectedActivity(null)}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Upload className="h-5 w-5 text-[#008BC1]" />
              Entregar Deber: {selectedActivity?.title}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitEvidence} className="space-y-4">
            {/* Aviso de restricción de archivo */}
            <div className="bg-sky-50 p-3 rounded-xl border border-sky-100 text-xs space-y-1 text-sky-800 font-medium">
              <p className="font-bold flex items-center gap-1.5">
                <Paperclip className="h-4 w-4 text-[#008BC1]" />
                Formatos Aceptados: Fotografías / Imágenes (JPG, PNG, WEBP, HEIC, GIF) y PDF.
              </p>
              <p className="text-amber-800 font-extrabold">
                ⚠️ Límite máximo permitido: 1 MB (1,024 KB).
              </p>
            </div>

            {/* Selector de Archivo */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Seleccionar Fotografía o Documento PDF (Máx 1MB)</Label>
              <Input
                type="file"
                accept="image/*,.pdf,.jpg,.jpeg,.png,.webp,.gif,.heic"
                onChange={handleFileChange}
                className="rounded-xl border-slate-200 text-xs file:bg-sky-50 file:text-[#008BC1] file:font-bold file:border-0 file:rounded-lg file:mr-2 cursor-pointer"
                required
              />
            </div>

            {/* Alerta de Error de Tamaño o Formato */}
            {fileError && (
              <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-xs text-rose-700 font-bold flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{fileError}</span>
              </div>
            )}

            {/* Previsualización de Archivo Seleccionado Exitosamente */}
            {selectedFile && !fileError && (
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center justify-between">
                <span className="truncate">✓ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                <Badge className="bg-[#31B45A] text-white">Válido &lt; 1MB</Badge>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Comentarios del Representante (Opcional)</Label>
              <Textarea
                placeholder="Escribe algún mensaje para la docente guía..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-xl border-slate-200 text-xs"
                rows={2}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setSelectedActivity(null)} className="rounded-xl font-bold">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !!fileError || !selectedFile}
                className="bg-[#31B45A] hover:bg-[#28964B] text-white font-extrabold rounded-xl shadow-md"
              >
                {isSubmitting ? 'Subiendo...' : 'Confirmar Entrega'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
