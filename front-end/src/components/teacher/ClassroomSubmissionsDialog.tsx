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
import { useCourseStudents } from '@/hooks/useEnrollments';
import { teacherModuleService, type ClassActivity, type SubmissionItem } from '@/services/teacherModule.service';

interface ClassroomSubmissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: ClassActivity | null;
}

// Estudiantes por defecto si no están cargados aún por la API
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

  // Estados locales para filtros y selección en panel estilo Google Classroom
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'submitted' | 'pending'>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<number>(1);

  // Estado local para entregas sincronizadas
  const [submissionsList, setSubmissionsList] = useState<SubmissionItem[]>([]);

  // Estados para formulario de calificación
  const [gradeScore, setGradeScore] = useState<string>('');
  const [gradeFeedback, setGradeFeedback] = useState<string>('');

  // Estado para el modal de vista previa en tamaño completo de la evidencia (Lightbox)
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);
  const [previewMediaTitle, setPreviewMediaTitle] = useState<string>('');
  const [imageLoadError, setImageLoadError] = useState(false);

  useEffect(() => {
    if (activity && open) {
      setSubmissionsList(teacherModuleService.getSubmissions(activity.id));
    }
  }, [activity?.id, open]);

  if (!activity) return null;
  const enrolledStudents = courseData?.students && courseData.students.length > 0
    ? courseData.students.map((s) => ({
        studentId: s.studentId,
        name: s.name,
        studentCode: s.studentCode,
      }))
    : DEFAULT_COURSE_STUDENTS;

  // Obtener todas las entregas para esta actividad
  const submissions = submissionsList.length > 0 ? submissionsList : teacherModuleService.getSubmissions(activity.id);

  // Combinar estudiantes matriculados y cualquier estudiante con entregas registradas
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

  // Mapear cada estudiante con su entrega (si la realizó)
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

    toast.success(`¡Calificación (${scoreNum}/10) guardada para ${selectedItem.name}!`);
    const updatedSubmissions = teacherModuleService.getSubmissions(activity.id);
    setSubmissionsList(updatedSubmissions);
  };

  const activityTypeLabel = (activity.type ?? 'deber').toUpperCase();
  const courseNameLabel = activity.courseName ?? 'Curso';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-11/12 p-0 overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Banner de Cabecera Estilo Google Classroom */}
        <DialogHeader className="p-6 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border-b border-slate-800 space-y-3 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-widest bg-sky-500/20 text-sky-400 border border-sky-500/30 px-3 py-1 rounded-full">
                  {courseNameLabel}
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full">
                  {activityTypeLabel}
                </span>
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5 pt-1">
                <BookOpen className="h-6 w-6 text-sky-400" />
                {activity.title}
              </DialogTitle>
              {activity.description && (
                <p className="text-xs text-slate-300 max-w-3xl leading-relaxed pt-1">
                  {activity.description}
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300 bg-sky-950/80 px-3 py-1.5 rounded-xl border border-sky-800/60 shadow-inner">
                <Clock className="h-4 w-4 text-sky-400" />
                <span>Fecha Límite: {activity.dueDate}</span>
              </div>
            </div>
          </div>

          {/* Tarjetas de Métricas Google Classroom */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div className="bg-slate-800/80 backdrop-blur-md p-3 rounded-2xl border border-slate-700/60 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Entregadas</p>
                <p className="text-lg font-black text-white">{submittedCount}</p>
              </div>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-md p-3 rounded-2xl border border-slate-700/60 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Calificadas</p>
                <p className="text-lg font-black text-amber-400">{gradedCount}</p>
              </div>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-md p-3 rounded-2xl border border-slate-700/60 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sin Entregar</p>
                <p className="text-lg font-black text-white">{pendingCount}</p>
              </div>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-md p-3 rounded-2xl border border-slate-700/60 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Alumnos</p>
                <p className="text-lg font-black text-white">{studentSubmissions.length}</p>
              </div>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-md p-3 rounded-2xl border border-slate-700/60 flex flex-col justify-center">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-300 mb-1">
                <span>Cumplimiento</span>
                <span className="text-sky-400">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-400 to-emerald-400 h-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Cuerpo Principal Dividido (Estilo Panel de Tareas de Classroom) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 bg-slate-950">
          {/* Panel Izquierdo: Lista de Estudiantes (4/12 en desktop) */}
          <div className="md:col-span-5 lg:col-span-4 border-r border-slate-800 p-4 space-y-3 flex flex-col overflow-hidden bg-slate-900/60">
            {/* Buscador de Estudiantes */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar estudiante..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-800 border-slate-700 text-xs font-semibold text-slate-100 placeholder:text-slate-500 rounded-xl"
              />
            </div>

            {/* Pestañas de Filtro Rápido */}
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/50 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  filterStatus === 'all'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos ({studentSubmissions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('submitted')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  filterStatus === 'submitted'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Entregados ({submittedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('pending')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  filterStatus === 'pending'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sin Entregar ({pendingCount})
              </button>
            </div>

            {/* Listado de Estudiantes */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-semibold">
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
                      className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-sky-950/70 border-sky-500 shadow-md ring-1 ring-sky-500'
                          : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            item.hasSubmitted
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {item.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .substring(0, 2)}
                        </div>

                        <div className="min-w-0">
                          <p className="font-extrabold text-xs text-white truncate">
                            {item.name}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-400 truncate">
                            {item.studentCode}
                          </p>
                        </div>
                      </div>

                      <div>
                        {item.submission?.status === 'calificada' || item.submission?.score !== undefined ? (
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] font-extrabold px-2 py-0.5 flex items-center gap-1">
                            <Award className="h-3 w-3 text-amber-400" />
                            {item.submission.score}/10
                          </Badge>
                        ) : item.hasSubmitted ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] font-extrabold px-2 py-0.5">
                            Entregado
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] font-extrabold px-2 py-0.5">
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

          {/* Panel Derecho: Detalle de la Entrega y Visor de Evidencia (8/12 en desktop) */}
          <div className="md:col-span-7 lg:col-span-8 p-6 flex flex-col overflow-y-auto bg-slate-950">
            {selectedItem ? (
              <div className="space-y-6">
                {/* Cabecera del Estudiante Seleccionado */}
                <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-11 w-11 rounded-2xl flex items-center justify-center font-black text-sm ${
                        selectedItem.hasSubmitted
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {selectedItem.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-black text-base text-white">
                        {selectedItem.name}
                      </h3>
                      <p className="text-xs font-semibold text-slate-400">
                        Código de Estudiante: {selectedItem.studentCode}
                      </p>
                    </div>
                  </div>

                  <div>
                    {selectedItem.hasSubmitted ? (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black text-xs px-3.5 py-1.5 rounded-xl">
                        <FileCheck className="h-4 w-4" />
                        ENTREGA COMPLETADA
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 font-black text-xs px-3.5 py-1.5 rounded-xl">
                        <AlertTriangle className="h-4 w-4" />
                        PENDIENTE DE ENTREGA
                      </span>
                    )}
                  </div>
                </div>

                {/* Si el Estudiante Entregó la Evidencia */}
                {selectedItem.hasSubmitted && selectedItem.submission ? (
                  <div className="space-y-5">
                    {/* Detalles de la Entrega */}
                    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                        <span className="font-bold text-slate-400 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-sky-400" />
                          Fecha y hora de envío:
                        </span>
                        <span className="font-extrabold text-white">
                          {selectedItem.submission.submittedAt}
                        </span>
                      </div>

                      {selectedItem.submission.notes && (
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Comentario del Estudiante / Representante:
                          </p>
                          <p className="text-xs text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed font-medium">
                            "{selectedItem.submission.notes}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Visor de Evidencia Adjunta */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                          <Paperclip className="h-4 w-4 text-emerald-400" />
                          Archivo de Evidencia Adjunto
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
                              className="h-8 bg-sky-950 text-sky-300 border-sky-800 hover:bg-sky-900 rounded-xl font-bold text-xs"
                            >
                              <Maximize2 className="h-3.5 w-3.5 mr-1" />
                              Ver en Tamaño Completo
                            </Button>
                            <a
                              href={selectedItem.submission.evidenceUrl}
                              download={selectedItem.submission.evidenceName ?? 'evidencia'}
                              className="h-8 px-3 inline-flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs border border-slate-700 transition-all"
                            >
                              <Download className="h-3.5 w-3.5 mr-1" />
                              Descargar
                            </a>
                          </div>
                        )}
                      </div>

                      {selectedItem.submission.evidenceUrl ? (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center space-y-3">
                          {selectedItem.submission.evidenceType === 'imagen' && !imageLoadError ? (
                            <div
                              onClick={() => {
                                setPreviewMediaUrl(selectedItem.submission!.evidenceUrl!);
                                setPreviewMediaTitle(
                                  `${selectedItem.name} — ${selectedItem.submission!.evidenceName ?? 'Evidencia'}`
                                );
                              }}
                              className="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-lg max-h-80 w-full flex items-center justify-center"
                            >
                              <img
                                src={selectedItem.submission.evidenceUrl}
                                alt="Evidencia entregada"
                                onError={() => setImageLoadError(true)}
                                className="max-h-80 object-contain rounded-xl transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <span className="bg-sky-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-lg">
                                  <Eye className="h-4 w-4" /> Ampliar Evidencia
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center space-y-3 text-center">
                              <FileText className="h-12 w-12 text-rose-400 animate-pulse" />
                              <div>
                                <p className="font-extrabold text-sm text-white">
                                  {selectedItem.submission.evidenceName ?? 'Documento / Archivo Adjunto'}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {imageLoadError
                                    ? 'No se pudo cargar la vista previa directa. Puedes abrirlo en una nueva pestaña o descargarlo.'
                                    : 'Documento preparado para revisión docente'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap justify-center">
                                <Button
                                  onClick={() => {
                                    setPreviewMediaUrl(selectedItem.submission!.evidenceUrl!);
                                    setPreviewMediaTitle(
                                      `${selectedItem.name} — ${selectedItem.submission!.evidenceName ?? 'Documento PDF'}`
                                    );
                                  }}
                                  className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow-md"
                                >
                                  <Eye className="h-4 w-4 mr-1.5" /> Abrir en Visor
                                </Button>
                                <a
                                  href={selectedItem.submission.evidenceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-xs rounded-xl border border-slate-700 inline-flex items-center gap-1.5"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" /> Abrir en Nueva Pestaña
                                </a>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between w-full text-[11px] text-slate-400 font-semibold pt-1 border-t border-slate-800/80">
                            <span>Archivo: {selectedItem.submission.evidenceName ?? 'Evidencia'}</span>
                            <span className="text-emerald-400 font-bold">✓ Formato Verificado (Máx 1MB)</span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs font-semibold">
                          Sin archivo adjunto enviado en esta entrega.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Si el Estudiante NO ha entregado */
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 my-auto">
                    <div className="h-16 w-16 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20">
                      <AlertTriangle className="h-8 w-8" />
                    </div>
                    <div className="space-y-1 max-w-md mx-auto">
                      <h4 className="font-black text-lg text-white">
                        Sin Entrega de Evidencia
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {selectedItem.name} no ha subido ninguna solución o comprobante para esta actividad.
                      </p>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left text-xs space-y-1 max-w-md mx-auto">
                      <p className="text-slate-300">
                        <strong className="text-slate-200">Estado:</strong> Pendiente de entrega por el representante/estudiante.
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        Puedes revisar si la fecha límite ({activity.dueDate}) aún sigue vigente.
                      </p>
                    </div>
                  </div>
                )}

                {/* Formulario de Calificación Docente */}
                <form onSubmit={handleSaveGrade} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Award className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">Calificación y Retroalimentación</h4>
                        <p className="text-[11px] font-semibold text-slate-400">
                          Asigna la nota final y comentarios para el estudiante/representante
                        </p>
                      </div>
                    </div>

                    {selectedItem.submission?.status === 'calificada' || selectedItem.submission?.score !== undefined ? (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-black text-xs px-3 py-1 flex items-center gap-1">
                        <Award className="h-3.5 w-3.5 text-amber-400" />
                        ✓ Nota: {selectedItem.submission.score}/10
                      </Badge>
                    ) : (
                      <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/30 font-extrabold text-xs px-2.5 py-1">
                        Pendiente de Calificar
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-amber-400" />
                        Nota (0 - 10) *
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        placeholder="Ej: 9.5"
                        value={gradeScore}
                        onChange={(e) => setGradeScore(e.target.value)}
                        className="bg-slate-950 border-slate-700 text-white font-black text-base rounded-xl focus:border-sky-500"
                        required
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-3">
                      <label className="text-xs font-bold text-slate-300">
                        Observaciones o Retroalimentación
                      </label>
                      <Textarea
                        placeholder="Escribe la retroalimentación para el estudiante..."
                        value={gradeFeedback}
                        onChange={(e) => setGradeFeedback(e.target.value)}
                        className="bg-slate-950 border-slate-700 text-slate-200 text-xs rounded-xl"
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span className="text-[11px] font-semibold text-slate-400">
                      {selectedItem.submission?.gradedAt ? `Calificado el: ${selectedItem.submission.gradedAt}` : 'Aún no calificado'}
                    </span>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-lg px-5"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      {selectedItem.submission?.status === 'calificada' || selectedItem.submission?.score !== undefined
                        ? 'Actualizar Nota'
                        : 'Guardar Calificación'}
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs font-semibold">
                Selecciona un estudiante de la lista de la izquierda para ver el detalle de su entrega.
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Lightbox Modal de Tamaño Completo para Evidencias (Imágenes / PDF Preview) */}
      {previewMediaUrl && (
        <Dialog open={!!previewMediaUrl} onOpenChange={() => setPreviewMediaUrl(null)}>
          <DialogContent className="max-w-4xl w-11/12 bg-slate-950 border border-slate-800 p-4 rounded-3xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-black text-sm text-sky-400 truncate pr-4">
                {previewMediaTitle}
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewMediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-xl font-bold text-xs inline-flex items-center gap-1 border border-slate-700 transition-all"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Abrir en Pestaña
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewMediaUrl(null)}
                  className="text-slate-400 hover:text-white rounded-xl h-8 w-8 p-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="py-4 flex items-center justify-center max-h-[75vh] overflow-auto">
              {previewMediaUrl.startsWith('data:application/pdf') || previewMediaTitle.toLowerCase().endsWith('.pdf') ? (
                <object
                  data={previewMediaUrl}
                  type="application/pdf"
                  className="w-full h-[70vh] rounded-2xl border border-slate-800 bg-slate-900"
                >
                  <iframe
                    src={previewMediaUrl}
                    title="PDF Preview"
                    className="w-full h-[70vh] rounded-2xl border border-slate-800"
                  >
                    <div className="p-8 text-center text-slate-300 space-y-3">
                      <FileText className="h-12 w-12 mx-auto text-rose-400" />
                      <p className="font-bold text-sm">No se pudo visualizar el documento directamente.</p>
                      <a
                        href={previewMediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-sky-500 text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5"
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
                  className="max-h-[70vh] object-contain rounded-2xl shadow-2xl border border-slate-800"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <a
                href={previewMediaUrl}
                download="evidencia"
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5 shadow-md"
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
