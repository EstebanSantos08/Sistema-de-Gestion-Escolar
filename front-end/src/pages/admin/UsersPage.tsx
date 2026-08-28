import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Pencil, UserX, UserCheck, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

import { userService, type UserRow, type CreateUserPayload } from '@/services/user.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
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

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const passwordRule = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Debe tener al menos una mayúscula')
  .regex(/[0-9]/, 'Debe tener al menos un número');

const baseSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  password: passwordRule.or(z.literal('')),
  role: z.enum(['admin', 'teacher', 'student']),
});

const studentSchema = baseSchema.extend({
  role: z.literal('student'),
  studentCode: z.string().min(1, 'El código es requerido'),
  birthDate: z.string().min(1, 'La fecha es requerida'),
  phone: z.string().optional().default(''),
  address: z.string().optional().default(''),
  guardianName: z.string().min(1, 'El nombre del representante es requerido'),
  guardianPhone: z.string().optional().default(''),
});

const teacherSchema = baseSchema.extend({
  role: z.literal('teacher'),
  teacherCode: z.string().min(1, 'El código es requerido'),
  specialization: z.string().min(1, 'La especialización es requerida'),
  phone: z.string().optional().default(''),
});

const adminSchema = baseSchema.extend({ role: z.literal('admin') });

const formSchema = z.discriminatedUnion('role', [studentSchema, teacherSchema, adminSchema]);
type FormValues = z.infer<typeof formSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const roleLabel: Record<string, string> = {
  admin: 'Administrador',
  teacher: 'Docente',
  student: 'Estudiante',
};

const roleBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  teacher: 'secondary',
  student: 'outline',
};

function buildDefaultValues(user: UserRow | null): FormValues {
  if (!user) return { name: '', email: '', password: '', role: 'student' } as FormValues;

  const base = { name: user.name, email: user.email, password: '', role: user.role };

  if (user.role === 'student') {
    const p = user.studentProfile;
    return {
      ...base,
      role: 'student',
      studentCode: p?.studentCode ?? '',
      birthDate: p?.birthDate ?? '',
      phone: p?.phone ?? '',
      address: p?.address ?? '',
      guardianName: p?.guardianName ?? '',
      guardianPhone: p?.guardianPhone ?? '',
    } as FormValues;
  }

  if (user.role === 'teacher') {
    const p = user.teacherProfile;
    return {
      ...base,
      role: 'teacher',
      teacherCode: p?.teacherCode ?? '',
      specialization: p?.specialization ?? '',
      phone: p?.phone ?? '',
    } as FormValues;
  }

  return { ...base, role: 'admin' } as FormValues;
}

// ─── User form modal ──────────────────────────────────────────────────────────

interface UserFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user?: UserRow | null;
  onSaved: () => void;
}

function UserFormModal({ open, onOpenChange, user, onSaved }: UserFormProps) {
  const isEditing = !!user;
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: buildDefaultValues(user ?? null),
  });

  // Reset form whenever the target user changes or modal opens
  useEffect(() => {
    if (open) {
      reset(buildDefaultValues(user ?? null));
      setShowPassword(false);
    }
  }, [open, user, reset]);

  const role = watch('role');

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = { ...values } as CreateUserPayload;
      // Don't send empty password on update
      if (isEditing && !payload.password) {
        delete (payload as Partial<CreateUserPayload>).password;
      }
      if (isEditing) {
        await userService.update(user!.id, payload);
        toast.success('Usuario actualizado correctamente');
      } else {
        await userService.create(payload);
        toast.success('Usuario creado correctamente');
      }
      onSaved();
      onOpenChange(false);
    } catch (err: unknown) {
      let msg = 'Error al guardar el usuario';
      if (axios.isAxiosError(err)) {
        msg = (err.response?.data as { error?: string })?.error ?? msg;
      }
      toast.error(msg);
    }
  };

  const studentErrors = errors as {
    studentCode?: { message?: string };
    birthDate?: { message?: string };
    guardianName?: { message?: string };
  };
  const teacherErrors = errors as {
    teacherCode?: { message?: string };
    specialization?: { message?: string };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Base fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label htmlFor="u-name">Nombre completo *</Label>
              <Input id="u-name" placeholder="Ej: Juan Pérez" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="u-email">Correo electrónico *</Label>
              <Input id="u-email" type="email" placeholder="usuario@escuela.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="u-pass">
                {isEditing ? 'Nueva contraseña' : 'Contraseña *'}
              </Label>
              <div className="relative">
                <Input
                  id="u-pass"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isEditing ? 'Dejar vacío para no cambiar' : 'Mín. 8 chars, 1 mayús, 1 núm'}
                  className="pr-9"
                  {...register('password')}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Rol *</Label>
              <Select
                value={role}
                onValueChange={(v) => setValue('role', v as 'admin' | 'teacher' | 'student')}
                disabled={isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Estudiante</SelectItem>
                  <SelectItem value="teacher">Docente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
              {isEditing && (
                <p className="text-xs text-muted-foreground">El rol no se puede cambiar</p>
              )}
            </div>
          </div>

          {/* Student extra fields */}
          {role === 'student' && (
            <fieldset className="grid grid-cols-2 gap-4 rounded-md border p-4">
              <legend className="px-1 text-sm font-semibold text-muted-foreground">
                Datos del estudiante
              </legend>

              <div className="space-y-1">
                <Label>Código *</Label>
                <Input placeholder="EST-2026-001" {...register('studentCode')} />
                {studentErrors.studentCode && (
                  <p className="text-xs text-destructive">{studentErrors.studentCode.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label>Fecha de nacimiento *</Label>
                <Input type="date" {...register('birthDate')} />
                {studentErrors.birthDate && (
                  <p className="text-xs text-destructive">{studentErrors.birthDate.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label>Teléfono</Label>
                <Input placeholder="0991234567" {...register('phone')} />
              </div>

              <div className="space-y-1">
                <Label>Dirección</Label>
                <Input placeholder="Calle Principal 123" {...register('address')} />
              </div>

              <div className="space-y-1">
                <Label>Nombre del representante *</Label>
                <Input placeholder="María Pérez" {...register('guardianName')} />
                {studentErrors.guardianName && (
                  <p className="text-xs text-destructive">{studentErrors.guardianName.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label>Tel. representante</Label>
                <Input placeholder="0997654321" {...register('guardianPhone')} />
              </div>
            </fieldset>
          )}

          {/* Teacher extra fields */}
          {role === 'teacher' && (
            <fieldset className="grid grid-cols-2 gap-4 rounded-md border p-4">
              <legend className="px-1 text-sm font-semibold text-muted-foreground">
                Datos del docente
              </legend>

              <div className="space-y-1">
                <Label>Código *</Label>
                <Input placeholder="DOC-001" {...register('teacherCode')} />
                {teacherErrors.teacherCode && (
                  <p className="text-xs text-destructive">{teacherErrors.teacherCode.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label>Especialización *</Label>
                <Input placeholder="Matemáticas" {...register('specialization')} />
                {teacherErrors.specialization && (
                  <p className="text-xs text-destructive">{teacherErrors.specialization.message}</p>
                )}
              </div>

              <div className="col-span-2 space-y-1">
                <Label>Teléfono</Label>
                <Input placeholder="0991234567" {...register('phone')} />
              </div>
            </fieldset>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Guardando...'
                : isEditing
                  ? 'Guardar cambios'
                  : 'Crear usuario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── User detail drawer (read-only) ──────────────────────────────────────────

interface UserDetailProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: UserRow | null;
}

function UserDetailModal({ open, onOpenChange, user }: UserDetailProps) {
  if (!user) return null;

  const Row = ({ label, value }: { label: string; value: string | undefined }) =>
    value ? (
      <div className="flex justify-between py-1.5 border-b last:border-0 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-right max-w-[60%]">{value}</span>
      </div>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Perfil de usuario</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold text-lg">
              {user.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-lg">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="rounded-md border p-3">
            <Row label="Rol" value={roleLabel[user.role]} />
            <Row label="Estado" value={user.active ? 'Activo' : 'Inactivo'} />

            {user.studentProfile && (
              <>
                <Row label="Código" value={user.studentProfile.studentCode} />
                <Row label="Fecha de nac." value={user.studentProfile.birthDate} />
                <Row label="Teléfono" value={user.studentProfile.phone} />
                <Row label="Dirección" value={user.studentProfile.address} />
                <Row label="Representante" value={user.studentProfile.guardianName} />
                <Row label="Tel. representante" value={user.studentProfile.guardianPhone} />
              </>
            )}

            {user.teacherProfile && (
              <>
                <Row label="Código docente" value={user.teacherProfile.teacherCode} />
                <Row label="Especialización" value={user.teacherProfile.specialization} />
                <Row label="Teléfono" value={user.teacherProfile.phone} />
              </>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function UsersPage() {
  const qc = useQueryClient();

  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 400);

  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [detailUser, setDetailUser] = useState<UserRow | null>(null);

  const [toggleTarget, setToggleTarget] = useState<UserRow | null>(null);

  // Reset page when filters change
  const prevSearch = useRef(search);
  useEffect(() => {
    if (prevSearch.current !== search) { setPage(1); prevSearch.current = search; }
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['users', search, roleFilter, page],
    queryFn: () =>
      userService.list({ search: search || undefined, role: roleFilter || undefined, page, limit: 15 }),
    placeholderData: (prev) => prev,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (u: UserRow) =>
      u.active ? userService.deactivate(u.id) : userService.activate(u.id),
    onSuccess: (_data, u) => {
      toast.success(u.active ? 'Usuario desactivado' : 'Usuario activado');
      void qc.invalidateQueries({ queryKey: ['users'] });
      setToggleTarget(null);
    },
    onError: () => toast.error('No se pudo cambiar el estado del usuario'),
  });

  const openEdit = useCallback((u: UserRow) => {
    setEditUser(u);
    setFormOpen(true);
  }, []);

  const openCreate = useCallback(() => {
    setEditUser(null);
    setFormOpen(true);
  }, []);

  const columns: Column<UserRow>[] = [
    {
      header: 'Usuario',
      render: (u) => (
        <div>
          <p className="font-medium">{u.name}</p>
          <p className="text-xs text-muted-foreground">{u.email}</p>
        </div>
      ),
    },
    {
      header: 'Código / Info',
      render: (u) => {
        if (u.role === 'student' && u.studentProfile)
          return <span className="text-sm font-mono">{u.studentProfile.studentCode}</span>;
        if (u.role === 'teacher' && u.teacherProfile)
          return (
            <div>
              <p className="text-sm font-mono">{u.teacherProfile.teacherCode}</p>
              <p className="text-xs text-muted-foreground">{u.teacherProfile.specialization}</p>
            </div>
          );
        return <span className="text-muted-foreground text-xs">—</span>;
      },
    },
    {
      header: 'Rol',
      render: (u) => <Badge variant={roleBadgeVariant[u.role]}>{roleLabel[u.role]}</Badge>,
    },
    {
      header: 'Estado',
      render: (u) =>
        u.active ? (
          <Badge variant="success">Activo</Badge>
        ) : (
          <Badge variant="destructive">Inactivo</Badge>
        ),
    },
    {
      header: '',
      className: 'w-28 text-right',
      render: (u) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            title="Ver perfil"
            onClick={() => setDetailUser(u)}
          >
            <Eye className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Editar"
            onClick={() => openEdit(u)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={u.active ? 'Desactivar' : 'Activar'}
            onClick={() => setToggleTarget(u)}
          >
            {u.active ? (
              <UserX className="h-4 w-4 text-destructive" />
            ) : (
              <UserCheck className="h-4 w-4 text-green-600" />
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Usuarios" description="Gestión de cuentas del sistema">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo usuario
        </Button>
      </PageHeader>

      {/* Filters */}
      <Card className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/60">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por nombre o correo..."
              className="pl-9 bg-white border-slate-200 text-slate-800 font-medium rounded-xl shadow-xs"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Select
            value={roleFilter || 'all'}
            onValueChange={(v) => { setRoleFilter(v === 'all' ? '' : v); setPage(1); }}
          >
            <SelectTrigger className="w-full sm:w-48 bg-white border-slate-200 text-slate-800 font-bold rounded-xl shadow-xs">
              <SelectValue placeholder="Todos los roles" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 rounded-xl shadow-2xl">
              <SelectItem value="all">Todos los roles</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="teacher">Docente</SelectItem>
              <SelectItem value="student">Estudiante</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>


      {/* Summary */}
      {data && (
        <p className="text-sm text-muted-foreground">
          {data.total} usuario{data.total !== 1 ? 's' : ''} encontrado{data.total !== 1 ? 's' : ''}
        </p>
      )}

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        emptyMessage="No se encontraron usuarios"
        page={page}
        totalPages={data?.totalPages}
        onPageChange={setPage}
      />

      {/* Create / Edit modal */}
      <UserFormModal
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setEditUser(null);
        }}
        user={editUser}
        onSaved={() => void qc.invalidateQueries({ queryKey: ['users'] })}
      />

      {/* Detail modal */}
      <UserDetailModal
        open={detailUser !== null}
        onOpenChange={(v) => { if (!v) setDetailUser(null); }}
        user={detailUser}
      />

      {/* Toggle active confirm */}
      <ConfirmDialog
        open={toggleTarget !== null}
        onOpenChange={(v) => { if (!v) setToggleTarget(null); }}
        title={toggleTarget?.active ? 'Desactivar usuario' : 'Activar usuario'}
        description={
          toggleTarget?.active
            ? `"${toggleTarget.name}" no podrá iniciar sesión. ¿Continuar?`
            : `¿Deseas reactivar la cuenta de "${toggleTarget?.name}"?`
        }
        confirmLabel={toggleTarget?.active ? 'Desactivar' : 'Activar'}
        variant={toggleTarget?.active ? 'destructive' : 'default'}
        onConfirm={() => { if (toggleTarget) toggleActiveMutation.mutate(toggleTarget); }}
        isLoading={toggleActiveMutation.isPending}
      />
    </div>
  );
}
