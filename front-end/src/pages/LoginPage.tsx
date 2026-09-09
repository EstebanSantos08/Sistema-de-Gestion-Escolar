import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ShieldCheck, GraduationCap, Users, Sparkles, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CloudDivider, FloatingCloud, SparkleStar, PlayfulDotsPattern } from '@/components/ui/CloudDecoration';
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
    color: 'bg-surface-violet text-brand-violet border-brand-lilac hover:bg-brand-violet hover:text-white',
    badgeColor: 'bg-brand-violet',
  },
  {
    label: 'Docente',
    email: 'garcia@escuela.com',
    password: 'Docente123!',
    icon: Users,
    color: 'bg-school-subtle text-ink-turquoise border-brand-turquoise hover:bg-brand-turquoise hover:text-white',
    badgeColor: 'bg-brand-turquoise',
  },
  {
    label: 'Estudiante',
    email: 'juan@escuela.com',
    password: 'Alumno123!',
    icon: GraduationCap,
    color: 'bg-surface-lime text-ink-lime border-brand-lime hover:bg-brand-lime hover:text-white',
    badgeColor: 'bg-brand-lime',
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
    toast.success('✨ Credenciales cargadas, presiona Ingresar');
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await login(values.email, values.password);
      toast.success('🎉 ¡Bienvenido a NICE KIDS!');
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
    <div className="flex min-h-screen items-center justify-center bg-school-bg p-4 font-sans relative overflow-hidden">
      {/* Decorative background clouds & dots */}
      <PlayfulDotsPattern />
      <FloatingCloud size="lg" color="#FFFFFF" className="absolute top-8 left-8" />
      <FloatingCloud size="md" color="#FFFFFF" delayed className="absolute bottom-12 right-12" />
      <FloatingCloud size="sm" color="#E3F5F3" className="absolute top-1/4 right-20" />
      <FloatingCloud size="sm" color="#FDF0F6" delayed className="absolute bottom-1/3 left-16" />

      <SparkleStar color="#F2C700" size={28} className="absolute top-16 right-1/4" />
      <SparkleStar color="#FF5DA0" size={24} className="absolute bottom-20 left-1/3" />
      <SparkleStar color="#41C4BD" size={20} className="absolute top-1/3 left-12" />

      {/* Main card */}
      <div className="w-full max-w-md rounded-3xl border-2 border-line-turquoise bg-surface-turquoise shadow-xl z-10 overflow-hidden transition-[color,background-color,border-color,box-shadow,transform] duration-300">
        
        {/* Top playful colored header with wave divider */}
        <div className="bg-gradient-to-r from-brand-turquoise via-brand-lightblue to-brand-pink pt-7 pb-4 px-6 text-center text-white relative">
          <div className="flex flex-col items-center justify-center mb-1">
            <NiceKidsLogo
              size="lg"
              showSubtitle={false}
              showBar={false}
              className="bg-white/95 backdrop-blur-sm px-4 py-2.5 rounded-2xl shadow-sm border border-white/50"
            />
          </div>

          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-school-heading uppercase tracking-widest bg-white/90 backdrop-blur-xs px-3.5 py-1 rounded-full shadow-xs mt-2">
            <span className="w-2 h-2 rounded-full bg-brand-turquoise animate-pulse" />
            Centro de educación infantil
          </span>

          <CloudDivider fillColor="#FFFFFF" className="-mb-4 mt-3" />
        </div>

        <div className="p-6 sm:p-8 pt-3">
          <div className="text-center pb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-school-heading">
              ¡Hola de nuevo! 🎈
            </h2>
            <p className="text-xs sm:text-sm text-school-muted-readable mt-1">
              Ingresa al portal institucional escolar
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs sm:text-sm font-semibold text-school-heading">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@escuela.com"
                autoComplete="email"
                className="rounded-2xl border-school-border focus:border-brand-turquoise focus:ring-2 focus:ring-brand-turquoise/20 h-11 text-sm bg-school-bg/50"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs font-semibold text-school-error mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs sm:text-sm font-semibold text-school-heading">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="rounded-2xl border-school-border focus:border-brand-turquoise focus:ring-2 focus:ring-brand-turquoise/20 h-11 text-sm bg-school-bg/50 pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-school-muted-readable hover:text-school-heading p-1 rounded-lg focus:outline-none"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs font-semibold text-school-error mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-bold rounded-2xl bg-brand-turquoise hover:bg-school-primary-hover text-white shadow-lg shadow-brand-turquoise/25 hover:-translate-y-0.5 transition-[color,background-color,border-color,box-shadow,transform] duration-200 mt-3"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Ingresando...
                </span>
              ) : (
                '🚀 Ingresar al Sistema'
              )}
            </Button>
          </form>

          {/* Demo credentials — clickable */}
          <div className="mt-7 pt-5 border-t border-school-border">
            <p className="text-xs font-semibold text-school-muted-readable text-center mb-3 flex items-center justify-center gap-1">
              <span>Acceso rápido demo:</span>
            </p>
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {DEMO_CREDENTIALS.map((cred) => (
                <button
                  key={cred.email}
                  type="button"
                  onClick={() => fillCredentials(cred.email, cred.password)}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-2.5 text-xs font-bold transition-[color,background-color,border-color,box-shadow,transform] shadow-xs hover:-translate-y-0.5 active:translate-y-0 ${cred.color}`}
                >
                  <cred.icon className="h-5 w-5" />
                  <span className="truncate max-w-full">{cred.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
