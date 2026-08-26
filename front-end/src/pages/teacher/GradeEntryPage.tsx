import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
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
    queryFn: () => enrollmentService.getByCourse(id!),
    enabled: id !== null,
  });

  const { data: existingGrades } = useQuery({
    queryKey: ['grades', 'course', id, gradeType],
    queryFn: () => gradeService.getByCourse(id!, undefined),
    enabled: id !== null,
  });

  // Build row list when students or grade type changes
  useEffect(() => {
    const students = courseData?.students ?? [];
    const gradesMap = new Map<number, Grade>();
    if (existingGrades) {
      existingGrades.forEach((g) => {
        if (g.gradeType === gradeType) gradesMap.set(g.enrollmentId, g);
      });
    }
    setRows(
      students.map((s) => {
        const existing = gradesMap.get(s.enrollmentId);
        return {
          enrollmentId: s.enrollmentId,
          studentId: s.studentId,
          studentCode: s.studentCode,
          name: s.name,
          score: existing ? String(existing.score) : '',
          comments: existing?.comments ?? '',
          existingGradeId: existing?.id,
        };
      })
    );
    // Also set default weight
    const opt = gradeTypeOptions.find((o) => o.value === gradeType);
    if (opt) setWeight(String(opt.defaultWeight));
  }, [courseData, existingGrades, gradeType]);

  const batchMutation = useMutation({
    mutationFn: () =>
      gradeService.batchCreate({
        courseId: id!,
        gradeType,
        weight: parseFloat(weight),
        grades: rows
          .filter((r) => r.score !== '')
          .map((r) => ({
            enrollmentId: r.enrollmentId,
            score: parseFloat(r.score),
            comments: r.comments,
          })),
      }),
    onSuccess: () => {
      toast.success('Calificaciones guardadas');
      void qc.invalidateQueries({ queryKey: ['grades'] });
    },
    onError: (err: unknown) => {
      let msg = 'Error al guardar calificaciones';
      if (axios.isAxiosError(err)) msg = (err.response?.data as { error?: string })?.error ?? msg;
      toast.error(msg);
    },
  });

  const updateRow = (index: number, field: 'score' | 'comments', value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const getScoreColor = (score: string) => {
    const n = parseFloat(score);
    if (isNaN(n)) return '';
    return n >= GRADE_PASS ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to={`/docente/cursos/${courseId}`}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver al curso
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Ingreso de Calificaciones"
        description={course ? `${course.name} (${course.code}) · ${course.period}` : ''}
      />

      {/* Controls */}
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <Label>Tipo de nota</Label>
            <Select value={gradeType} onValueChange={(v) => setGradeType(v as GradeType)}>
              <SelectTrigger className="w-44">
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
          <div className="space-y-1">
            <Label>Peso ponderado (0–1)</Label>
            <Input
              className="w-28"
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
          >
            {batchMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Guardando...
              </span>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar todas las notas
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Grade table */}
      {loadingStudents ? (
        <div className="flex justify-center py-10">
          <span className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground">No hay estudiantes matriculados.</p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Código</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estudiante</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground w-32">
                  Calificación (0–{GRADE_MAX})
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.enrollmentId} className="border-b last:border-0">
                  <td className="px-4 py-2 text-muted-foreground">{row.studentCode}</td>
                  <td className="px-4 py-2 font-medium">{row.name}</td>
                  <td className="px-4 py-2">
                    <Input
                      type="number"
                      min={GRADE_MIN}
                      max={GRADE_MAX}
                      step={0.01}
                      value={row.score}
                      onChange={(e) => updateRow(i, 'score', e.target.value)}
                      className={cn('text-center', getScoreColor(row.score))}
                      placeholder="—"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={row.comments}
                      onChange={(e) => updateRow(i, 'comments', e.target.value)}
                      placeholder="Observación opcional"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
