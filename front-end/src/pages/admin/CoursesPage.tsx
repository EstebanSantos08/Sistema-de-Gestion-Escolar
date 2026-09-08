import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Search, Users, BookOpen, LayoutGrid, Table as TableIcon, Sparkles, GraduationCap, User } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

import { courseService, type CoursePayload } from '@/services/course.service';
import { userService } from '@/services/user.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Card, CardContent } from '@/components/ui/card';
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

function getLevelBadge(name: string, code: string) {
  const text = `${name} ${code}`.toLowerCase();
  if (text.includes('inicial 1') || text.includes('parvularia')) {
    return <Badge variant="lime">Inicial 1 · Guardería</Badge>;
  }
  if (text.includes('inicial 2') || text.includes('kinder')) {
    return <Badge variant="secondary">Inicial 2 · Guardería</Badge>;
  }
  if (text.includes('inicial 3')) {
    return <Badge variant="purple">Inicial 3 · Guardería</Badge>;
  }
  if (text.includes('1ro') || text.includes('primero')) {
    return <Badge variant="warning">1º Grado · Primaria</Badge>;
  }
  return <Badge variant="default">Nivel Académico</Badge>;
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

      if (isEditing && course) {
        await courseService.update(course.id, payload);
        toast.success('Curso actualizado con éxito');
      } else {
        await courseService.create(payload);
        toast.success('Curso creado con éxito');
      }
      reset();
      onOpenChange(false);
      onSaved();
    } catch (err: unknown) {
      let msg = 'Error al guardar el curso';
      if (axios.isAxiosError(err)) msg = (err.response?.data as { error?: string })?.error ?? msg;
      toast.error(msg);
    }
  };

  const teachers = teachersData?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={(v) => { reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg bg-white rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-school-heading flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-school-primary" />
            {isEditing ? 'Editar Curso / Aula' : 'Nuevo Curso / Aula'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-sm font-semibold text-school-heading">Nombre del Curso / Nivel</Label>
            <Input {...register('name')} placeholder="Ej: Inicial 2 - Paralelo A" className="rounded-xl border-school-border" />
            {errors.name && <p className="text-xs text-school-error font-medium">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-school-heading">Código</Label>
            <Input {...register('code')} placeholder="Ej: INI-2A" className="rounded-xl border-school-border" />
            {errors.code && <p className="text-xs text-school-error font-medium">{errors.code.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-school-heading">Período Lectivo</Label>
            <Input {...register('period')} placeholder="2026-I" className="rounded-xl border-school-border" />
            {errors.period && <p className="text-xs text-school-error font-medium">{errors.period.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-school-heading">Créditos / Carga</Label>
            <Input type="number" min={1} max={10} {...register('credits')} className="rounded-xl border-school-border" />
            {errors.credits && <p className="text-xs text-school-error font-medium">{errors.credits.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-school-heading">Docente Guía Asignado</Label>
            <Select
              value={watch('teacherId') ? String(watch('teacherId')) : undefined}
              onValueChange={(v) => setValue('teacherId', Number(v))}
            >
              <SelectTrigger className="rounded-xl border-school-border">
                <SelectValue placeholder="Seleccionar Docente Guía" />
              </SelectTrigger>
              <SelectContent className="bg-white rounded-xl">
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.teacherId && <p className="text-xs text-school-error font-medium">{errors.teacherId.message}</p>}
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label className="text-sm font-semibold text-school-heading">Descripción / Detalles del Aula</Label>
            <Input {...register('description')} placeholder="Ej: Aula de Educación Inicial 4 años" className="rounded-xl border-school-border" />
          </div>

          <DialogFooter className="col-span-2 pt-3">
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false); }} className="rounded-xl font-medium">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-school-primary hover:bg-school-primary-hover text-white font-medium rounded-xl shadow-sm">
              {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar Curso' : 'Crear Curso'}
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
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
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

  const coursesList = data?.data ?? [];

  const columns: Column<Course>[] = [
    {
      header: 'Curso / Nivel',
      render: (c) => (
        <div>
          <p className="font-bold text-slate-800">{c.name}</p>
          <p className="text-xs text-slate-500 font-medium">{c.code}</p>
        </div>
      ),
    },
    { header: 'Período', key: 'period' },
    {
      header: 'Docente Guía',
      render: (c) => c.teacher?.user?.name ?? 'Sin asignar',
    },
    {
      header: 'Niños Matriculados',
      render: (c) => (
        <span className="font-extrabold text-slate-800">
          {(c as unknown as Record<string, unknown>).enrolledCount as number ?? c.enrollmentsCount ?? 0} estudiantes
        </span>
      ),
      className: 'text-center',
    },
    {
      header: 'Estado',
      render: (c) =>
        c.active ? (
          <Badge variant="success">Activo</Badge>
        ) : (
          <Badge variant="secondary">Inactivo</Badge>
        ),
    },
    {
      header: '',
      className: 'w-24 text-right',
      render: (c) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setEditCourse(c); setFormOpen(true); }}
            aria-label={`Editar curso ${c.name}`}
            className="text-[#087F79] hover:bg-[#E3F5F3]"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteId(c.id)}
            aria-label={`Eliminar curso ${c.name}`}
            className="text-[#B42335] hover:bg-[#FDF0F1]"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administración"
        title="Cursos Escolares"
        description="Gestión y asignación de aulas, niveles y docentes guía de Educación Inicial y Primer Grado"
      >
        <Button
          onClick={() => { setEditCourse(null); setFormOpen(true); }}
          className="h-10"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo curso
        </Button>
      </PageHeader>

      {/* Filter and view mode bar */}
      <div className="rounded-2xl border border-[#D6E5E3] bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5E7A77]" />
              <Input
                placeholder="Buscar curso por nombre o código..."
                className="pl-10"
                aria-label="Buscar curso"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Input
              placeholder="Período (ej: 2026-I)"
              className="w-full sm:w-44"
              aria-label="Filtrar por período"
              value={period}
              onChange={(e) => { setPeriod(e.target.value); setPage(1); }}
            />
          </div>

          {/* Toggle de Modo de Vista Tarjetas / Tabla */}
          <div className="flex items-center gap-1 rounded-xl border border-[#D6E5E3] bg-[#F4FAF9] p-1 self-start sm:self-auto">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setViewMode('cards')}
              className={`rounded-lg px-3 text-xs font-semibold ${
                viewMode === 'cards'
                  ? 'bg-white text-[#087F79] shadow-xs'
                  : 'text-[#5E7A77] hover:text-[#183B3A]'
              }`}
            >
              <LayoutGrid className="mr-1.5 h-4 w-4" /> Tarjetas
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setViewMode('table')}
              className={`rounded-lg px-3 text-xs font-semibold ${
                viewMode === 'table'
                  ? 'bg-white text-[#087F79] shadow-xs'
                  : 'text-[#5E7A77] hover:text-[#183B3A]'
              }`}
            >
              <TableIcon className="mr-1.5 h-4 w-4" /> Tabla
            </Button>
          </div>
        </div>
      </div>

      {/* Renderizado de Cursos: Tarjetas (Grid) o Tabla */}
      {viewMode === 'cards' ? (
        isLoading ? (
          <div className="flex justify-center py-16">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-[#087F79] border-t-transparent" />
          </div>
        ) : coursesList.length === 0 ? (
          <div className="rounded-2xl border border-[#D6E5E3] bg-white p-12 text-center shadow-xs">
            <BookOpen className="mx-auto h-10 w-10 text-[#5E7A77]/40 mb-3" />
            <p className="text-base font-semibold text-[#183B3A]">No se encontraron cursos</p>
            <p className="text-sm text-[#5E7A77] mt-1">Prueba cambiando los términos de búsqueda o el período seleccionado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {coursesList.map((c) => (
              <Card
                key={c.id}
                className="flex flex-col justify-between transition-all hover:border-[#41C4BD] hover:shadow-sm group"
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between border-b border-[#D6E5E3] pb-3 gap-2">
                    <div className="min-w-0">
                      <span className="text-xs font-mono font-semibold text-[#5E7A77]">
                        {c.code}
                      </span>
                      <h3 className="font-semibold text-[#183B3A] text-lg truncate group-hover:text-[#087F79] transition-colors mt-0.5">
                        {c.name}
                      </h3>
                    </div>
                    {getLevelBadge(c.name, c.code)}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between rounded-lg border border-[#D6E5E3] bg-[#F4FAF9]/50 p-2.5">
                      <span className="flex items-center gap-1.5 text-xs text-[#5E7A77]">
                        <User className="h-4 w-4 text-[#087F79]" />
                        Docente:
                      </span>
                      <span className="font-semibold text-xs text-[#183B3A] truncate max-w-[55%]">
                        {c.teacher?.user?.name ?? 'Sin asignar'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-[#BBE5E1] bg-[#E3F5F3]/50 p-2.5">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-[#087F79]">
                        <Users className="h-4 w-4 text-[#087F79]" />
                        Estudiantes matriculados:
                      </span>
                      <Badge variant="default" className="font-semibold">
                        {((c as unknown as Record<string, unknown>).enrolledCount as number) ??
                          c.enrollmentsCount ??
                          0}
                      </Badge>
                    </div>
                  </div>

                  {c.description && (
                    <p className="text-xs text-[#5E7A77] line-clamp-2 leading-relaxed bg-[#F4FAF9] p-2.5 rounded-lg border border-[#D6E5E3]">
                      {c.description}
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D6E5E3]">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setEditCourse(c); setFormOpen(true); }}
                      className="text-[#087F79] hover:bg-[#E3F5F3]"
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(c.id)}
                      className="text-[#B42335] hover:bg-[#FDF0F1]"
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        <DataTable
          columns={columns}
          data={coursesList}
          isLoading={isLoading}
          emptyMessage="No se encontraron cursos"
          page={page}
          totalPages={data?.totalPages}
          onPageChange={setPage}
        />
      )}

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
