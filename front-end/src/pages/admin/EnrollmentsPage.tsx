import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Trash2, Users, BookOpen, ClipboardList, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

import { enrollmentService } from '@/services/enrollment.service';
import { studentService } from '@/services/student.service';
import { courseService } from '@/services/course.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { StatCard } from '@/components/shared/StatCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Enrollment } from '@/types';
import { formatDate } from '@/lib/utils';

// ─── Status helpers ────────────────────────────────────────────────────────────

const STATUS_META: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' }
> = {
  active:    { label: 'Activa',      variant: 'default' },
  withdrawn: { label: 'Retirada',    variant: 'destructive' },
  completed: { label: 'Completada',  variant: 'secondary' },
};

// ─── Debounce hook ─────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── New enrollment form ───────────────────────────────────────────────────────

const schema = z.object({
  studentId: z.coerce.number().min(1, 'Selecciona un estudiante'),
  courseId:  z.coerce.number().min(1, 'Selecciona un curso'),
  period:    z.string().min(1, 'Selecciona un período'),
});
type FormValues = z.infer<typeof schema>;

interface EnrollFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}

function EnrollFormModal({ open, onOpenChange, onSaved }: EnrollFormProps) {
  const [period, setPeriod] = useState('2026-I');

  const { data: studentsData, isLoading: loadingStudents } = useQuery({
    queryKey: ['students-modal-list', open],
    queryFn: () => studentService.list({ limit: 100 }),
    enabled: open,
  });

  const { data: coursesData, isLoading: loadingCourses } = useQuery({
    queryKey: ['courses-modal', period, open],
    queryFn: () => courseService.list({ period, limit: 100 }),
    enabled: open,
  });

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { period: '2026-I' },
  });

  const selectedPeriod = watch('period') ?? '2026-I';
  const selectedStudentId = watch('studentId');
  const selectedCourseId = watch('courseId');

  useEffect(() => {
    setValue('period', period);
  }, [period, setValue]);

  const handleClose = () => {
    reset({ period: '2026-I' });
    onOpenChange(false);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await enrollmentService.create(values);
      toast.success('Matrícula registrada correctamente');
      reset({ period: '2026-I' });
      onSaved();
      onOpenChange(false);
    } catch (err: unknown) {
      let msg = 'Error al registrar la matrícula';
      if (axios.isAxiosError(err)) {
        msg = (err.response?.data as { error?: string })?.error ?? msg;
      }
      toast.error(msg);
    }
  };

  const students = studentsData?.data ?? [];
  const courses = coursesData?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-lg bg-white rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-slate-800">Nueva matrícula</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Período Académico (Combobox) */}
          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-700">Período académico *</Label>
            <Select
              value={selectedPeriod}
              onValueChange={(val) => {
                setPeriod(val);
                setValue('period', val);
              }}
            >
              <SelectTrigger className="rounded-xl border-slate-200 font-bold bg-white">
                <SelectValue placeholder="Seleccionar período" />
              </SelectTrigger>
              <SelectContent className="bg-white rounded-xl">
                <SelectItem value="2026-I">2026-I (Primer Semestre)</SelectItem>
                <SelectItem value="2026-II">2026-II (Segundo Semestre)</SelectItem>
              </SelectContent>
            </Select>
            {errors.period && (
              <p className="text-xs text-destructive font-bold">{errors.period.message}</p>
            )}
          </div>

          {/* Estudiante (Combobox con listado completo de estudiantes) */}
          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-700">Estudiante *</Label>
            <Select
              value={selectedStudentId ? String(selectedStudentId) : undefined}
              onValueChange={(v) => setValue('studentId', Number(v))}
            >
              <SelectTrigger className="rounded-xl border-slate-200 font-bold bg-white">
                <SelectValue placeholder={loadingStudents ? 'Cargando estudiantes...' : 'Seleccionar estudiante...'} />
              </SelectTrigger>
              <SelectContent className="bg-white rounded-xl max-h-60">
                {students.length === 0 ? (
                  <div className="p-3 text-xs text-slate-400 font-bold text-center">No hay estudiantes activos registrados</div>
                ) : (
                  students.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      <span className="font-bold text-slate-800">{s.name}</span>
                      <span className="ml-2 text-slate-400 font-semibold text-xs">
                        ({s.studentProfile?.studentCode || 'EST-2026'})
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.studentId && (
              <p className="text-xs text-destructive font-bold">{errors.studentId.message}</p>
            )}
          </div>

          {/* Curso (Combobox) */}
          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-700">Curso *</Label>
            <Select
              value={selectedCourseId ? String(selectedCourseId) : undefined}
              onValueChange={(v) => setValue('courseId', Number(v))}
            >
              <SelectTrigger className="rounded-xl border-slate-200 font-bold bg-white">
                <SelectValue placeholder={loadingCourses ? 'Cargando cursos...' : 'Seleccionar curso...'} />
              </SelectTrigger>
              <SelectContent className="bg-white rounded-xl max-h-60">
                {courses.length === 0 ? (
                  <div className="p-3 text-xs text-slate-400 font-bold text-center">No hay cursos disponibles para {selectedPeriod}</div>
                ) : (
                  courses.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      <span className="font-bold text-slate-800">{c.name}</span>
                      <span className="ml-2 text-[#008BC1] font-semibold text-xs">
                        ({c.code})
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.courseId && (
              <p className="text-xs text-destructive font-bold">{errors.courseId.message}</p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="rounded-xl font-bold">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Registrando...' : 'Matricular'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Enrollment row type ───────────────────────────────────────────────────────

type EnrollmentRow = Enrollment & {
  student?: {
    user?: { name: string };
    studentCode: string;
  };
  course?: {
    name: string;
    code: string;
    period: string;
  };
};

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function EnrollmentsPage() {
  const qc = useQueryClient();

  const [periodFilter, setPeriodFilter] = useState('2026-I');
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EnrollmentRow | null>(null);

  const prevFilters = useRef({ periodFilter, statusFilter, courseFilter });
  useEffect(() => {
    const prev = prevFilters.current;
    if (
      prev.periodFilter !== periodFilter ||
      prev.statusFilter !== statusFilter ||
      prev.courseFilter !== courseFilter
    ) {
      setPage(1);
      prevFilters.current = { periodFilter, statusFilter, courseFilter };
    }
  }, [periodFilter, statusFilter, courseFilter]);

  const { data, isLoading } = useQuery({
    queryKey: ['enrollments', periodFilter, statusFilter, courseFilter, page],
    queryFn: () =>
      enrollmentService.list({
        period:   periodFilter || undefined,
        status:   (statusFilter as Enrollment['status']) || undefined,
        courseId: courseFilter ? Number(courseFilter) : undefined,
        page,
        limit: 15,
      }),
    placeholderData: (prev) => prev,
  });

  // Courses for filter dropdown
  const { data: coursesForFilter } = useQuery({
    queryKey: ['courses-filter', periodFilter],
    queryFn: () => courseService.list({ period: periodFilter, limit: 100 }),
    enabled: /^\d{4}-(I|II)$/.test(periodFilter),
  });

  // Inline status change
  const handleStatusChange = useCallback(
    (id: number, status: Enrollment['status']) => {
      enrollmentService
        .updateStatus(id, status)
        .then(() => {
          toast.success('Estado actualizado');
          void qc.invalidateQueries({ queryKey: ['enrollments'] });
          void qc.invalidateQueries({ queryKey: ['courses'] });
          void qc.invalidateQueries({ queryKey: ['students'] });
        })
        .catch(() => toast.error('Error al actualizar el estado'));
    },
    [qc]
  );

  const deleteMutation = useMutation({
    mutationFn: (id: number) => enrollmentService.remove(id),
    onSuccess: () => {
      toast.success('Matrícula eliminada');
      void qc.invalidateQueries({ queryKey: ['enrollments'] });
      void qc.invalidateQueries({ queryKey: ['courses'] });
      void qc.invalidateQueries({ queryKey: ['students'] });
      setDeleteTarget(null);
    },
    onError: (err: unknown) => {
      let msg = 'No se puede eliminar: la matrícula tiene calificaciones registradas';
      if (axios.isAxiosError(err)) {
        msg = (err.response?.data as { error?: string })?.error ?? msg;
      }
      toast.error(msg);
    },
  });

  // Stats from current page data
  const total      = data?.total ?? 0;
  const activeCount    = data?.data.filter((e) => e.status === 'active').length ?? 0;
  const withdrawnCount = data?.data.filter((e) => e.status === 'withdrawn').length ?? 0;
  const completedCount = data?.data.filter((e) => e.status === 'completed').length ?? 0;

  const columns: Column<EnrollmentRow>[] = [
    {
      header: 'Estudiante',
      render: (e) => (
        <div>
          <p className="font-medium">{e.student?.user?.name ?? '—'}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {e.student?.studentCode ?? '—'}
          </p>
        </div>
      ),
    },
    {
      header: 'Curso',
      render: (e) => (
        <div>
          <p className="font-medium">{e.course?.name ?? '—'}</p>
          <p className="text-xs text-muted-foreground">{e.course?.code ?? '—'}</p>
        </div>
      ),
    },
    {
      header: 'Período',
      render: (e) => <span className="font-mono text-sm">{e.course?.period ?? e.period}</span>,
    },
    {
      header: 'Fecha matrícula',
      render: (e) => (
        <span className="text-sm text-muted-foreground">{formatDate(e.enrolledAt)}</span>
      ),
    },
    {
      header: 'Estado',
      render: (e) => {
        const meta = STATUS_META[e.status];
        return (
          <Select
            value={e.status}
            onValueChange={(v) => handleStatusChange(e.id, v as Enrollment['status'])}
          >
            <SelectTrigger className="h-8 w-36 border-0 shadow-none p-0 focus:ring-0">
              <Badge variant={meta?.variant ?? 'default'}>{meta?.label ?? e.status}</Badge>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activa</SelectItem>
              <SelectItem value="withdrawn">Retirada</SelectItem>
              <SelectItem value="completed">Completada</SelectItem>
            </SelectContent>
          </Select>
        );
      },
    },
    {
      header: '',
      className: 'w-12 text-right',
      render: (e) => (
        <Button
          variant="ghost"
          size="icon"
          title="Eliminar matrícula"
          onClick={() => setDeleteTarget(e)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Matrículas" description="Control de inscripciones por período académico">
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva matrícula
        </Button>
      </PageHeader>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          title="Total en página"
          value={total}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Activas"
          value={activeCount}
          icon={<BookOpen className="h-4 w-4" />}
        />
        <StatCard
          title="Retiradas"
          value={withdrawnCount}
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <StatCard
          title="Completadas"
          value={completedCount}
          icon={<CheckCircle className="h-4 w-4" />}
        />
      </div>

      {/* Filters */}
      <Card className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/60">
        <div className="flex flex-wrap items-center gap-4">
          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-700">Período</Label>
            <Input
              className="w-32 bg-white border-slate-200 text-slate-800 font-medium rounded-xl shadow-xs"
              placeholder="2026-I"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-700">Curso</Label>
            <Select
              value={courseFilter || 'all'}
              onValueChange={(v) => setCourseFilter(v === 'all' ? '' : v)}
            >
              <SelectTrigger className="w-56 bg-white border-slate-200 text-slate-800 font-bold rounded-xl shadow-xs">
                <SelectValue placeholder="Todos los cursos" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 rounded-xl shadow-2xl">
                <SelectItem value="all">Todos los cursos</SelectItem>
                {(coursesForFilter?.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-700">Estado</Label>
            <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-44 bg-white border-slate-200 text-slate-800 font-bold rounded-xl shadow-xs">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 rounded-xl shadow-2xl">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activa</SelectItem>
                <SelectItem value="withdrawn">Retirada</SelectItem>
                <SelectItem value="completed">Completada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>


      <DataTable
        columns={columns}
        data={(data?.data ?? []) as EnrollmentRow[]}
        isLoading={isLoading}
        emptyMessage="No se encontraron matrículas con los filtros aplicados"
        page={page}
        totalPages={data?.totalPages}
        onPageChange={setPage}
      />

      <EnrollFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={() => {
          void qc.invalidateQueries({ queryKey: ['enrollments'] });
          void qc.invalidateQueries({ queryKey: ['courses'] });
          void qc.invalidateQueries({ queryKey: ['students'] });
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        title="Eliminar matrícula"
        description={
          deleteTarget
            ? `¿Eliminar la matrícula de "${deleteTarget.student?.user?.name ?? 'este estudiante'}" en "${deleteTarget.course?.name ?? 'este curso'}"? Solo es posible si no tiene calificaciones registradas.`
            : ''
        }
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id); }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
