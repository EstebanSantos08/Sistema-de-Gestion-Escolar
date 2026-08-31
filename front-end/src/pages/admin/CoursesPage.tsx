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
    return <Badge className="bg-emerald-500 text-white font-black text-xs">Inicial 1 · Guardería</Badge>;
  }
  if (text.includes('inicial 2') || text.includes('kinder')) {
    return <Badge className="bg-sky-600 text-white font-black text-xs">Inicial 2 · Guardería</Badge>;
  }
  if (text.includes('inicial 3')) {
    return <Badge className="bg-purple-600 text-white font-black text-xs">Inicial 3 · Guardería</Badge>;
  }
  if (text.includes('1ro') || text.includes('primero')) {
    return <Badge className="bg-amber-500 text-white font-black text-xs">1º Grado · Primaria</Badge>;
  }
  return <Badge className="bg-[#008BC1] text-white font-black text-xs">Nivel Académico</Badge>;
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
          <DialogTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-[#008BC1]" />
            {isEditing ? 'Editar Curso / Aula' : 'Nuevo Curso / Aula'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1">
            <Label className="text-xs font-bold text-slate-700">Nombre del Curso / Nivel</Label>
            <Input {...register('name')} placeholder="Ej: Inicial 2 - Paralelo A" className="rounded-xl border-slate-200" />
            {errors.name && <p className="text-xs text-destructive font-bold">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-700">Código</Label>
            <Input {...register('code')} placeholder="Ej: INI-2A" className="rounded-xl border-slate-200" />
            {errors.code && <p className="text-xs text-destructive font-bold">{errors.code.message}</p>}
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-700">Período Lectivo</Label>
            <Input {...register('period')} placeholder="2026-I" className="rounded-xl border-slate-200" />
            {errors.period && <p className="text-xs text-destructive font-bold">{errors.period.message}</p>}
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-700">Créditos / Carga</Label>
            <Input type="number" min={1} max={10} {...register('credits')} className="rounded-xl border-slate-200" />
            {errors.credits && <p className="text-xs text-destructive font-bold">{errors.credits.message}</p>}
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-700">Docente Guía Asignado</Label>
            <Select
              value={watch('teacherId') ? String(watch('teacherId')) : undefined}
              onValueChange={(v) => setValue('teacherId', Number(v))}
            >
              <SelectTrigger className="rounded-xl border-slate-200">
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
            {errors.teacherId && <p className="text-xs text-destructive font-bold">{errors.teacherId.message}</p>}
          </div>

          <div className="col-span-2 space-y-1">
            <Label className="text-xs font-bold text-slate-700">Descripción / Detalles del Aula</Label>
            <Input {...register('description')} placeholder="Ej: Aula de Educación Inicial 4 años" className="rounded-xl border-slate-200" />
          </div>

          <DialogFooter className="col-span-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false); }} className="rounded-xl font-bold">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#008BC1] hover:bg-[#0073A0] text-white font-bold rounded-xl shadow-md">
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
        c.active ? <Badge className="bg-[#31B45A] text-white font-bold">Activo</Badge> : <Badge variant="secondary">Inactivo</Badge>,
    },
    {
      header: '',
      className: 'w-24 text-right',
      render: (c) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => { setEditCourse(c); setFormOpen(true); }} className="hover:bg-sky-50 text-[#008BC1]">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)} className="hover:bg-rose-50 text-rose-600">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Gestión de Cursos y Aulas" description="Administración de cursos en Educación Inicial y Primer Grado">
        <Button onClick={() => { setEditCourse(null); setFormOpen(true); }} className="bg-[#008BC1] hover:bg-[#0073A0] text-white font-bold shadow-md rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo curso
        </Button>
      </PageHeader>

      <Card className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar curso o nivel..."
                className="pl-9 bg-white border-slate-200 text-slate-800 font-medium rounded-xl shadow-xs"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Input
              placeholder="Período (ej: 2026-I)"
              className="w-full sm:w-44 bg-white border-slate-200 text-slate-800 font-bold rounded-xl shadow-xs"
              value={period}
              onChange={(e) => { setPeriod(e.target.value); setPage(1); }}
            />
          </div>

          {/* Toggle de Modo de Vista Tarjetas / Tabla */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <Button
              size="sm"
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              onClick={() => setViewMode('cards')}
              className={viewMode === 'cards' ? 'bg-white text-slate-800 font-bold shadow-xs rounded-lg' : 'text-slate-500'}
            >
              <LayoutGrid className="mr-1.5 h-4 w-4 text-[#008BC1]" /> Tarjetas
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              onClick={() => setViewMode('table')}
              className={viewMode === 'table' ? 'bg-white text-slate-800 font-bold shadow-xs rounded-lg' : 'text-slate-500'}
            >
              <TableIcon className="mr-1.5 h-4 w-4 text-[#008BC1]" /> Tabla
            </Button>
          </div>
        </div>
      </Card>

      {/* Renderizado de Cursos: Tarjetas (Grid) o Tabla */}
      {viewMode === 'cards' ? (
        isLoading ? (
          <div className="flex justify-center py-16">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-[#008BC1] border-t-transparent" />
          </div>
        ) : coursesList.length === 0 ? (
          <p className="text-center text-slate-400 py-10 font-bold text-sm">No se encontraron cursos registrados.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {coursesList.map((c) => (
              <Card key={c.id} className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col justify-between group">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles className="h-3.5 w-3.5 text-[#F4B51B]" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{c.code}</span>
                      </div>
                      <h3 className="font-black text-slate-800 text-lg group-hover:text-[#008BC1] transition-colors">
                        {c.name}
                      </h3>
                    </div>
                    {getLevelBadge(c.name, c.code)}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                      <User className="h-4 w-4 text-[#008BC1]" />
                      <span className="font-bold text-slate-700">Docente Guía:</span>
                      <span className="font-extrabold text-slate-900 ml-auto">{c.teacher?.user?.name ?? 'Sin Asignar'}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600 bg-teal-50/60 p-2.5 rounded-xl border border-teal-100">
                      <span className="flex items-center gap-1.5 text-teal-800">
                        <Users className="h-4 w-4 text-[#31B45A]" />
                        Niños Matriculados
                      </span>
                      <Badge className="bg-[#31B45A] text-white font-bold">
                        {(c as unknown as Record<string, unknown>).enrolledCount as number ?? c.enrollmentsCount ?? 0}
                      </Badge>
                    </div>
                  </div>

                  {c.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/40 p-2 rounded-lg border border-slate-100/60">
                      {c.description}
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button variant="outline" size="sm" onClick={() => { setEditCourse(c); setFormOpen(true); }} className="rounded-xl border-slate-200 text-[#008BC1] font-bold hover:bg-sky-50">
                      <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleteId(c.id)} className="rounded-xl border-rose-200 text-rose-600 font-bold hover:bg-rose-50">
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
