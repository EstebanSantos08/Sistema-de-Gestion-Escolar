import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ShieldCheck, GraduationCap, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { NiceKidsLogo } from '@/components/shared/NiceKidsLogo';

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
    color: 'bg-purple-50 text-[#7D5AA6] border-purple-200 hover:bg-[#7D5AA6] hover:text-white',
  },
  {
    label: 'Docente',
    email: 'garcia@escuela.com',
    password: 'Docente123!',
    icon: Users,
    color: 'bg-sky-50 text-[#008BC1] border-sky-200 hover:bg-[#008BC1] hover:text-white',
  },
  {
    label: 'Estudiante',
    email: 'juan@escuela.com',
    password: 'Alumno123!',
    icon: GraduationCap,
    color: 'bg-emerald-50 text-[#31B45A] border-emerald-200 hover:bg-[#31B45A] hover:text-white',
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
      toast.success('¡Bienvenido a NICE KIDS!');
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
    <div className="flex min-h-screen items-center justify-center bg-[#09A9C2] p-4 relative overflow-hidden font-sans">
      {/* Círculos decorativos de colores flotando en el fondo turquesa */}
      <div className="pointer-events-none fixed top-10 left-10 h-72 w-72 rounded-full bg-[#E84B5B]/30 blur-2xl animate-pulse" style={{ animationDuration: '5s' }} />
      <div className="pointer-events-none fixed bottom-10 right-10 h-80 w-80 rounded-full bg-[#F4B51B]/35 blur-2xl animate-pulse" style={{ animationDuration: '7s' }} />
      <div className="pointer-events-none fixed top-1/3 right-1/4 h-56 w-56 rounded-full bg-[#31B45A]/30 blur-2xl" />
      <div className="pointer-events-none fixed bottom-1/4 left-1/4 h-64 w-64 rounded-full bg-[#008BC1]/40 blur-2xl" />

      {/* Puntos flotantes nítidos estilo logo */}
      <div className="pointer-events-none fixed top-20 right-32 h-10 w-10 rounded-full bg-[#E84B5B] opacity-50 shadow-lg" />
      <div className="pointer-events-none fixed top-44 left-24 h-14 w-14 rounded-full bg-[#31B45A] opacity-45 shadow-lg" />
      <div className="pointer-events-none fixed bottom-28 right-20 h-12 w-12 rounded-full bg-[#F4B51B] opacity-50 shadow-lg" />
      <div className="pointer-events-none fixed bottom-20 left-40 h-8 w-8 rounded-full bg-[#008BC1] opacity-50 shadow-lg" />

      <Card className="w-full max-w-md shadow-2xl border-white/60 bg-white/95 backdrop-blur-md rounded-3xl z-10 overflow-hidden">
        <div className="pt-8 pb-4 px-6 text-center">
          <NiceKidsLogo size="lg" showSubtitle={true} />
          <p className="text-xs font-bold text-slate-500 mt-3">Ingresa tus credenciales para acceder al sistema</p>
        </div>

        <CardContent className="px-6 pb-6">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-slate-800 font-bold text-xs uppercase tracking-wider">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@escuela.com"
                autoComplete="email"
                className="bg-white border-slate-200 text-slate-800 font-medium rounded-xl shadow-xs"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs font-bold text-[#E84B5B]">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <Label htmlFor="password" className="text-slate-800 font-bold text-xs uppercase tracking-wider">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pr-10 bg-white border-slate-200 text-slate-800 font-medium rounded-xl shadow-xs"
                  {...register('password')}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs font-bold text-[#E84B5B]">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full bg-[#09A9C2] hover:bg-[#0896AC] text-white font-extrabold shadow-lg rounded-xl h-11 text-base transition-all hover:scale-[1.01]" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Ingresando...
                </span>
              ) : (
                'Ingresar al Sistema'
              )}
            </Button>
          </form>

          {/* Demo credentials — clickable */}
          <div className="mt-6 space-y-2 border-t border-slate-100 pt-4">
            <p className="text-[11px] font-black text-slate-400 text-center uppercase tracking-wider">
              Acceso rápido de prueba
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_CREDENTIALS.map((cred) => (
                <button
                  key={cred.email}
                  type="button"
                  onClick={() => fillCredentials(cred.email, cred.password)}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-xs font-extrabold transition-all shadow-xs ${cred.color}`}
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

