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
    color: 'bg-[#F6EDF8] text-[#9731AC] border-[#EE7DCC] hover:bg-[#9731AC] hover:text-white',
    badgeColor: 'bg-[#9731AC]',
  },
  {
    label: 'Docente',
    email: 'garcia@escuela.com',
    password: 'Docente123!',
    icon: Users,
    color: 'bg-[#E3F5F3] text-[#087F79] border-[#41C4BD] hover:bg-[#41C4BD] hover:text-white',
    badgeColor: 'bg-[#41C4BD]',
  },
  {
    label: 'Estudiante',
    email: 'juan@escuela.com',
    password: 'Alumno123!',
    icon: GraduationCap,
    color: 'bg-[#F4FBE8] text-[#557D07] border-[#9DD31B] hover:bg-[#9DD31B] hover:text-white',
    badgeColor: 'bg-[#9DD31B]',
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
    <div className="flex min-h-screen items-center justify-center bg-[#F4FAF9] p-4 font-sans relative overflow-hidden">
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
      <div className="w-full max-w-md rounded-3xl border-2 border-[#D6E5E3] bg-white shadow-xl z-10 overflow-hidden transition-all duration-300">
        
        {/* Top playful colored header with wave divider */}
        <div className="bg-gradient-to-r from-[#41C4BD] via-[#64B6E5] to-[#FF5DA0] pt-7 pb-4 px-6 text-center text-white relative">
          <div className="flex items-center justify-center gap-1.5 mb-1 animate-bounce-soft">
            <Sparkles className="w-6 h-6 text-[#F2C700] fill-[#F2C700]" />
            <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-white drop-shadow-md">
              <span className="text-[#FFFFFF]">N</span>
              <span className="text-[#F2C700]">I</span>
              <span className="text-[#FF5DA0]">C</span>
              <span className="text-[#9DD31B]">E</span>
              <span className="text-white ml-2">KIDS</span>
            </h1>
            <Heart className="w-5 h-5 text-[#FF5DA0] fill-[#FF5DA0] ml-1" />
          </div>

          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#183B3A] uppercase tracking-widest bg-white/90 backdrop-blur-xs px-3.5 py-1 rounded-full shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#41C4BD] animate-pulse" />
            Centro de Desarrollo Infantil
          </span>

          <CloudDivider fillColor="#FFFFFF" className="-mb-4 mt-3" />
        </div>

        <div className="p-6 sm:p-8 pt-3">
          <div className="text-center pb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-[#183B3A]">
              ¡Hola de nuevo! 🎈
            </h2>
            <p className="text-xs sm:text-sm text-[#5E7A77] mt-1">
              Ingresa al portal institucional escolar
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs sm:text-sm font-semibold text-[#183B3A]">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@escuela.com"
                autoComplete="email"
                className="rounded-2xl border-[#D6E5E3] focus:border-[#41C4BD] focus:ring-2 focus:ring-[#41C4BD]/20 h-11 text-sm bg-[#F4FAF9]/50"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs font-semibold text-[#B42335] mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs sm:text-sm font-semibold text-[#183B3A]">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="rounded-2xl border-[#D6E5E3] focus:border-[#41C4BD] focus:ring-2 focus:ring-[#41C4BD]/20 h-11 text-sm bg-[#F4FAF9]/50 pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5E7A77] hover:text-[#183B3A] p-1 rounded-lg focus:outline-none"
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
              className="w-full h-12 text-base font-bold rounded-2xl bg-[#41C4BD] hover:bg-[#3AA8A2] text-white shadow-lg shadow-[#41C4BD]/25 hover:-translate-y-0.5 transition-all duration-200 mt-3"
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
          <div className="mt-7 pt-5 border-t border-[#D6E5E3]">
            <p className="text-xs font-semibold text-[#5E7A77] text-center mb-3 flex items-center justify-center gap-1">
              <span>Acceso rápido demo:</span>
            </p>
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {DEMO_CREDENTIALS.map((cred) => (
                <button
                  key={cred.email}
                  type="button"
                  onClick={() => fillCredentials(cred.email, cred.password)}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-2.5 text-xs font-bold transition-all shadow-xs hover:-translate-y-0.5 active:translate-y-0 ${cred.color}`}
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
