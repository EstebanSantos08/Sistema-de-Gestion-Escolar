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
  period:    z.string().min(1).regex(/^\d{4}-(I|II)$/, 'Formato: YYYY-I o YYYY-II'),
});
type FormValues = z.infer<typeof schema>;

interface EnrollFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}

function EnrollFormModal({ open, onOpenChange, onSaved }: EnrollFormProps) {
  const [studentInput, setStudentInput] = useState('');
  const studentSearch = useDebounce(studentInput, 350);
  const [period, setPeriod] = useState('2026-I');
  const periodDebounced = useDebounce(period, 500);

  const { data: studentsData, isFetching: fetchingStudents } = useQuery({
    queryKey: ['students-modal-search', studentSearch],
    queryFn: () => studentService.list({ search: studentSearch, limit: 20 }),
    enabled: studentSearch.length >= 2,
  });

  const { data: coursesData } = useQuery({
    queryKey: ['courses-modal', periodDebounced],
    queryFn: () => courseService.list({ period: periodDebounced, limit: 100 }),
    enabled: /^\d{4}-(I|II)$/.test(periodDebounced),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { period: '2026-I' },
  });

  // Sync period field with local state
  const watchedPeriod = watch('period');
  useEffect(() => { setPeriod(watchedPeriod ?? '2026-I'); }, [watchedPeriod]);

  const handleClose = () => {
    reset({ period: '2026-I' });
    setStudentInput('');
    onOpenChange(false);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await enrollmentService.create(values);
      toast.success('Matrícula registrada correctamente');
      reset({ period: '2026-I' });
      setStudentInput('');
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
  const courses  = coursesData?.data ?? [];
  const selectedStudentId = watch('studentId');
  const selectedCourseId  = watch('courseId');

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva matrícula</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Period */}
          <div className="space-y-1">
            <Label htmlFor="enroll-period">Período académico *</Label>
            <Input
              id="enroll-period"
              placeholder="2026-I"
              {...register('period')}
            />
            {errors.period && (
              <p className="text-xs text-destructive">{errors.period.message}</p>
            )}
          </div>

          {/* Student search */}
          <div className="space-y-2">
            <Label>Estudiante *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Escribe nombre o código (mín. 2 caracteres)..."
                value={studentInput}
                onChange={(e) => setStudentInput(e.target.value)}
              />
              {fetchingStudents && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              )}
            </div>

            {students.length > 0 && (
              <Select
                value={selectedStudentId ? String(selectedStudentId) : undefined}
                onValueChange={(v) => setValue('studentId', Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estudiante" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      <span className="font-medium">{s.name}</span>
                      <span className="ml-2 text-muted-foreground text-xs">
                        ({s.studentProfile?.studentCode ?? '—'})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {studentInput.length >= 2 && students.length === 0 && !fetchingStudents && (
              <p className="text-xs text-muted-foreground">
                No se encontraron estudiantes con ese nombre o código.
              </p>
            )}
            {errors.studentId && (
              <p className="text-xs text-destructive">{errors.studentId.message}</p>
            )}
          </div>

          {/* Course */}
          <div className="space-y-1">
            <Label>Curso *</Label>
            {!/^\d{4}-(I|II)$/.test(watchedPeriod ?? '') ? (
              <p className="text-xs text-muted-foreground">
                Ingresa un período válido para ver los cursos disponibles.
              </p>
            ) : courses.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No hay cursos para el período <strong>{watchedPeriod}</strong>.
              </p>
            ) : (
              <Select
                value={selectedCourseId ? String(selectedCourseId) : undefined}
                onValueChange={(v) => setValue('courseId', Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      <span className="font-medium">{c.name}</span>
                      <span className="ml-2 text-muted-foreground text-xs">({c.code})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.courseId && (
              <p className="text-xs text-destructive">{errors.courseId.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
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
      <div className="flex flex-wrap gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Período</Label>
          <Input
            className="w-32"
            placeholder="2026-I"
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Curso</Label>
          <Select
            value={courseFilter || 'all'}
            onValueChange={(v) => setCourseFilter(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Todos los cursos" />
            </SelectTrigger>
            <SelectContent>
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
          <Label className="text-xs">Estado</Label>
          <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activa</SelectItem>
              <SelectItem value="withdrawn">Retirada</SelectItem>
              <SelectItem value="completed">Completada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
        onSaved={() => void qc.invalidateQueries({ queryKey: ['enrollments'] })}
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
