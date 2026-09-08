import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Award } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axios from 'axios';

import { enrollmentService } from '@/services/enrollment.service';
import { gradeService } from '@/services/grade.service';
import { useCourse } from '@/hooks/useCourses';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import type { GradeType, Grade } from '@/types';
import { cn } from '@/lib/utils';

const GRADE_MIN = 0;
const GRADE_MAX = 10;
const GRADE_PASS = 7;

const gradeTypeOptions: { value: GradeType; label: string; defaultWeight: number }[] = [
  { value: 'parcial1', label: 'Parcial 1', defaultWeight: 0.3 },
  { value: 'parcial2', label: 'Parcial 2', defaultWeight: 0.3 },
  { value: 'examen_final', label: 'Examen Final', defaultWeight: 0.4 },
  { value: 'tarea', label: 'Tarea', defaultWeight: 0.1 },
  { value: 'proyecto', label: 'Proyecto', defaultWeight: 0.2 },
];

interface StudentRow {
  enrollmentId: number;
  studentId: number;
  studentCode: string;
  name: string;
  score: string;
  comments: string;
  existingGradeId?: number;
}

export default function GradeEntryPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const id = courseId ? Number(courseId) : null;
  const qc = useQueryClient();

  const [gradeType, setGradeType] = useState<GradeType>('parcial1');
  const [weight, setWeight] = useState('0.30');
  const [rows, setRows] = useState<StudentRow[]>([]);

  const { data: course } = useCourse(id);

  const { data: courseData, isLoading: loadingStudents } = useQuery({
    queryKey: ['enrollments', 'course', id],
    queryFn: () => enrollmentService.getCourseEnrollments(id!),
    enabled: !!id,
  });

  const students = courseData?.students ?? [];

  useEffect(() => {
    const opt = gradeTypeOptions.find((o) => o.value === gradeType);
    if (opt) setWeight(opt.defaultWeight.toFixed(2));
  }, [gradeType]);

  useEffect(() => {
    if (students.length === 0) return;
    const initialRows: StudentRow[] = students.map((s) => {
      const match = s.grades.find((g) => g.gradeType === gradeType);
      return {
        enrollmentId: s.enrollmentId,
        studentId: s.studentId,
        studentCode: s.studentCode,
        name: s.name,
        score: match !== undefined ? String(match.score) : '',
        comments: match?.comments ?? '',
        existingGradeId: match?.id,
      };
    });
    setRows(initialRows);
  }, [students, gradeType]);

  const updateRow = (index: number, field: 'score' | 'comments', value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const batchMutation = useMutation({
    mutationFn: async () => {
      const parsedWeight = parseFloat(weight);
      const toSave = rows.filter((r) => r.score !== '');
      const promises = toSave.map((r) => {
        const payload = {
          enrollmentId: r.enrollmentId,
          gradeType,
          score: parseFloat(r.score),
          weight: isNaN(parsedWeight) ? 0.3 : parsedWeight,
          comments: r.comments || undefined,
        };
        if (r.existingGradeId) {
          return gradeService.updateGrade(r.existingGradeId, payload);
        }
        return gradeService.createGrade(payload);
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast.success('Calificaciones guardadas exitosamente');
      qc.invalidateQueries({ queryKey: ['enrollments', 'course', id] });
    },
    onError: (err) => {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message || 'Error al guardar las notas';
        toast.error(msg);
      } else {
        toast.error('Error al guardar las calificaciones');
      }
    },
  });

  const getScoreColor = (score: string) => {
    const n = parseFloat(score);
    if (isNaN(n)) return '';
    return n >= GRADE_PASS
      ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold'
      : 'bg-rose-50 text-rose-900 border-rose-300 font-semibold';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="text-school-body font-medium hover:bg-school-subtle">
          <Link to={`/docente/cursos/${courseId}`}>
            <ArrowLeft className="h-4 w-4 mr-1 text-school-primary" /> Volver al curso
          </Link>
        </Button>
      </div>

      <PageHeader
        eyebrow="Evaluación Continua"
        title="Ingreso de Calificaciones"
        description={course ? `${course.name} (${course.code}) · Período ${course.period}` : 'Registro de notas por componente evaluativo'}
      />

      {/* Controls */}
      <Card>
        <CardContent className="p-5 flex flex-wrap gap-5 items-end">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-school-heading">Tipo de Evaluación</Label>
            <Select value={gradeType} onValueChange={(v) => setGradeType(v as GradeType)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {gradeTypeOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-school-heading">Peso ponderado (0–1)</Label>
            <Input
              className="w-32 font-medium"
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>

          <Button
            onClick={() => batchMutation.mutate()}
            disabled={batchMutation.isPending || rows.every((r) => r.score === '')}
            className="h-10"
          >
            {batchMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Guardando...
              </span>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Calificaciones
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Grade table */}
      {loadingStudents ? (
        <Card className="p-10 text-center">
          <div className="flex items-center justify-center gap-3 text-school-muted">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-school-primary border-t-transparent" />
            <span className="text-sm">Cargando lista de estudiantes...</span>
          </div>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-school-muted text-sm">No hay estudiantes matriculados en este curso.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-school-border bg-school-background">
                <tr>
                  <th className="px-5 py-3.5 text-left font-semibold text-school-heading">Código</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-school-heading">Estudiante</th>
                  <th className="px-5 py-3.5 text-center font-semibold text-school-heading w-36">
                    Nota (0–{GRADE_MAX})
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-school-heading">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-school-border">
                {rows.map((row, i) => (
                  <tr key={row.enrollmentId} className="hover:bg-school-background/50 transition-colors">
                    <td className="px-5 py-3 text-school-muted text-xs font-mono">{row.studentCode}</td>
                    <td className="px-5 py-3 font-medium text-school-heading">{row.name}</td>
                    <td className="px-5 py-3">
                      <Input
                        type="number"
                        min={GRADE_MIN}
                        max={GRADE_MAX}
                        step={0.01}
                        value={row.score}
                        onChange={(e) => updateRow(i, 'score', e.target.value)}
                        className={cn('text-center font-bold text-sm', getScoreColor(row.score))}
                        placeholder="—"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <Input
                        value={row.comments}
                        onChange={(e) => updateRow(i, 'comments', e.target.value)}
                        placeholder="Observación opcional..."
                        className="text-xs"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
