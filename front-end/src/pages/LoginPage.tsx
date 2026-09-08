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
    color: 'bg-[#F6EDF8] text-[#9731AC] border-[#E6CAED] hover:bg-[#9731AC] hover:text-white',
  },
  {
    label: 'Docente',
    email: 'garcia@escuela.com',
    password: 'Docente123!',
    icon: Users,
    color: 'bg-[#EFF7FC] text-[#1E7BB5] border-[#C7E5F6] hover:bg-[#1E7BB5] hover:text-white',
  },
  {
    label: 'Estudiante',
    email: 'juan@escuela.com',
    password: 'Alumno123!',
    icon: GraduationCap,
    color: 'bg-[#F4FBE8] text-[#557D07] border-[#D6F09F] hover:bg-[#557D07] hover:text-white',
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
    <div className="flex min-h-screen items-center justify-center bg-[#F4FAF9] p-4 font-sans relative overflow-hidden">
      {/* Formas sutiles de fondo institucional */}
      <div className="pointer-events-none fixed -top-32 -left-32 h-96 w-96 rounded-full bg-[#E3F5F3] blur-3xl opacity-80" />
      <div className="pointer-events-none fixed -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#E3F5F3] blur-3xl opacity-80" />

      <div className="w-full max-w-md rounded-3xl border border-[#D6E5E3] bg-white p-6 sm:p-8 shadow-md z-10">
        <div className="text-center pb-5">
          <div className="inline-block mb-3">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#183B3A]">
              NICE KIDS
            </h1>
            <span className="text-xs font-bold text-[#087F79] uppercase tracking-widest mt-1 inline-block bg-[#E3F5F3] px-3.5 py-0.5 rounded-full border border-[#BBE5E1]">
              Centro de Desarrollo Infantil
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#183B3A] mt-2">
            Portal Institucional
          </h2>
          <p className="text-sm text-[#5E7A77] mt-1">
            Ingresa tus credenciales para acceder al sistema escolar
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-[#183B3A]">
              Correo electrónico
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@escuela.com"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs font-semibold text-[#B42335] mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium text-[#183B3A]">
              Contraseña
            </Label>
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
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5E7A77] hover:text-[#183B3A] p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-[#087F79]"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs font-semibold text-[#B42335] mt-1">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-base font-medium rounded-xl shadow-xs mt-2"
            disabled={isSubmitting}
          >
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
        <div className="mt-8 pt-6 border-t border-[#D6E5E3]">
          <p className="text-xs font-medium text-[#5E7A77] text-center mb-3">
            Acceso rápido de prueba:
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {DEMO_CREDENTIALS.map((cred) => (
              <button
                key={cred.email}
                type="button"
                onClick={() => fillCredentials(cred.email, cred.password)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition-all shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F79] ${cred.color}`}
              >
                <cred.icon className="h-5 w-5" />
                <span>{cred.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
