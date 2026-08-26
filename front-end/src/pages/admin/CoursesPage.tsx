import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

import { courseService, type CoursePayload } from '@/services/course.service';
import { userService } from '@/services/user.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
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
import type { Course } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Requerido'),
  code: z.string().min(2, 'Requerido'),
  description: z.string().optional(),
  credits: z.coerce.number().min(1).max(10),
  period: z.string().min(1, 'Requerido').regex(/^\d{4}-(I|II)$/, 'Formato: YYYY-I o YYYY-II'),
  teacherId: z.coerce.number().min(1, 'Selecciona un docente'),
});
type FormValues = z.infer<typeof schema>;

interface CourseFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  course?: Course | null;
  onSaved: () => void;
}

function CourseFormModal({ open, onOpenChange, course, onSaved }: CourseFormProps) {
  const { data: teachersData } = useQuery({
    queryKey: ['users', 'teacher'],
    queryFn: () => userService.list({ role: 'teacher', active: true, limit: 100 }),
  });

  const isEditing = !!course;
  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: course
      ? {
          name: course.name,
          code: course.code,
          description: course.description,
          credits: course.credits,
          period: course.period,
          teacherId: course.teacherId,
        }
      : { credits: 3, period: '2026-I' },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const payload: CoursePayload = {
        name: values.name,
        code: values.code,
        description: values.description ?? '',
        credits: values.credits,
        period: values.period,
        teacherId: values.teacherId,
      };
      if (isEditing) {
        await courseService.update(course!.id, payload);
        toast.success('Curso actualizado');
      } else {
        await courseService.create(payload);
        toast.success('Curso creado');
      }
      reset();
      onSaved();
      onOpenChange(false);
    } catch (err: unknown) {
      let msg = 'Error al guardar';
      if (axios.isAxiosError(err)) msg = (err.response?.data as { error?: string })?.error ?? msg;
      toast.error(msg);
    }
  };

  const teachers = teachersData?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={(v) => { reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar curso' : 'Nuevo curso'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1">
            <Label>Nombre</Label>
            <Input {...register('name')} placeholder="Matemáticas I" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Código</Label>
            <Input {...register('code')} placeholder="MAT-101" />
            {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Período</Label>
            <Input {...register('period')} placeholder="2026-I" />
            {errors.period && <p className="text-xs text-destructive">{errors.period.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Créditos</Label>
            <Input type="number" min={1} max={10} {...register('credits')} />
            {errors.credits && <p className="text-xs text-destructive">{errors.credits.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Docente</Label>
            <Select
              value={watch('teacherId') ? String(watch('teacherId')) : undefined}
              onValueChange={(v) => setValue('teacherId', Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar docente" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.teacherId && <p className="text-xs text-destructive">{errors.teacherId.message}</p>}
          </div>
          <div className="col-span-2 space-y-1">
            <Label>Descripción</Label>
            <Input {...register('description')} placeholder="Descripción del curso" />
          </div>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false); }}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear curso'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CoursesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('2026-I');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['courses', search, period, page],
    queryFn: () => courseService.list({ search: search || undefined, period: period || undefined, page, limit: 15 }),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => courseService.remove(id),
    onSuccess: () => {
      toast.success('Curso eliminado');
      void qc.invalidateQueries({ queryKey: ['courses'] });
      setDeleteId(null);
    },
    onError: (err: unknown) => {
      let msg = 'No se pudo eliminar el curso';
      if (axios.isAxiosError(err)) msg = (err.response?.data as { error?: string })?.error ?? msg;
      toast.error(msg);
    },
  });

  const columns: Column<Course>[] = [
    {
      header: 'Nombre',
      render: (c) => (
        <div>
          <p className="font-medium">{c.name}</p>
          <p className="text-xs text-muted-foreground">{c.code}</p>
        </div>
      ),
    },
    { header: 'Período', key: 'period' },
    {
      header: 'Docente',
      render: (c) => c.teacher?.user?.name ?? '—',
    },
    { header: 'Créditos', key: 'credits', className: 'text-center' },
    {
      header: 'Matriculados',
      render: (c) => (
        <span className="font-medium">{(c as unknown as Record<string, unknown>).enrolledCount as number ?? c.enrollmentsCount ?? 0}</span>
      ),
      className: 'text-center',
    },
    {
      header: 'Estado',
      render: (c) =>
        c.active ? <Badge variant="success">Activo</Badge> : <Badge variant="secondary">Inactivo</Badge>,
    },
    {
      header: '',
      className: 'w-24 text-right',
      render: (c) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => { setEditCourse(c); setFormOpen(true); }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Cursos" description="Gestión de materias por período">
        <Button onClick={() => { setEditCourse(null); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo curso
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar curso..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Input
          placeholder="Período (ej: 2026-I)"
          className="w-36"
          value={period}
          onChange={(e) => { setPeriod(e.target.value); setPage(1); }}
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        emptyMessage="No se encontraron cursos"
        page={page}
        totalPages={data?.totalPages}
        onPageChange={setPage}
      />

      <CourseFormModal
        open={formOpen}
        onOpenChange={(v) => { if (!v) setEditCourse(null); setFormOpen(v); }}
        course={editCourse}
        onSaved={() => void qc.invalidateQueries({ queryKey: ['courses'] })}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(v) => { if (!v) setDeleteId(null); }}
        title="Eliminar curso"
        description="¿Estás seguro? Esta acción no se puede deshacer. Solo se permite si el curso no tiene matrículas activas."
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
