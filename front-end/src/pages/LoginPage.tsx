import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, BookMarked, ShieldCheck, GraduationCap, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const schema = z.object({
  email: z.string().min(1, 'El correo es requerido').email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type FormValues = z.infer<typeof schema>;

const DEMO_CREDENTIALS = [
  {
    label: 'Administrador',
    email: 'admin@escuela.com',
    password: 'Admin123!',
    icon: ShieldCheck,
    color: 'bg-blue-500/10 text-blue-700 border-blue-200 hover:bg-blue-500/20',
  },
  {
    label: 'Docente',
    email: 'garcia@escuela.com',
    password: 'Docente123!',
    icon: Users,
    color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20',
  },
  {
    label: 'Estudiante',
    email: 'juan@escuela.com',
    password: 'Alumno123!',
    icon: GraduationCap,
    color: 'bg-amber-500/10 text-amber-700 border-amber-200 hover:bg-amber-500/20',
  },
];

function getRedirectPath(role: string): string {
  if (role === 'admin') return '/admin';
  if (role === 'teacher') return '/docente';
  return '/estudiante';
}

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (isAuthenticated && user) {
    return <Navigate to={getRedirectPath(user.role)} replace />;
  }

  const fillCredentials = (email: string, password: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
    toast.success('Credenciales cargadas, presiona Ingresar');
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await login(values.email, values.password);
      toast.success('¡Bienvenido!');
    } catch (err: unknown) {
      let message = 'Credenciales incorrectas';
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        message = err.response.data.error as string;
      }
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary">
            <BookMarked className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {import.meta.env.VITE_APP_NAME ?? 'Sistema Escolar'}
          </CardTitle>
          <CardDescription>Ingresa tus credenciales para continuar</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@escuela.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Ingresando...
                </span>
              ) : (
                'Ingresar'
              )}
            </Button>
          </form>

          {/* Demo credentials — clickable */}
          <div className="mt-5 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground text-center">
              Acceso rápido de prueba
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_CREDENTIALS.map((cred) => (
                <button
                  key={cred.email}
                  type="button"
                  onClick={() => fillCredentials(cred.email, cred.password)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-xs font-medium transition-all ${cred.color}`}
                >
                  <cred.icon className="h-5 w-5" />
                  {cred.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
