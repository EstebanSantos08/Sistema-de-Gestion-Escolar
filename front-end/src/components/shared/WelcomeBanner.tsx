import React from 'react';
import { SparkleStar, FloatingCloud, CloudDivider } from '@/components/ui/CloudDecoration';
import { Sparkles, Heart } from 'lucide-react';

interface WelcomeBannerProps {
  userName?: string;
  roleLabel?: string;
  period?: string;
  description?: string;
  variant?: 'turquoise' | 'violet' | 'pink' | 'lime';
}

const variantGradients: Record<string, string> = {
  turquoise: 'from-[#41C4BD] via-[#64B6E5] to-[#41C4BD]',
  violet: 'from-[#9731AC] via-[#EE7DCC] to-[#41C4BD]',
  pink: 'from-[#FF5DA0] via-[#EE7DCC] to-[#F2C700]',
  lime: 'from-[#9DD31B] via-[#41C4BD] to-[#64B6E5]',
};

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  userName = 'Usuario',
  roleLabel = 'Portal Escolar',
  period = '2026-I',
  description = 'Resumen de actividades y gestión educativa institucional',
  variant = 'turquoise',
}) => {
  const gradient = variantGradients[variant] ?? variantGradients.turquoise;

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${gradient} text-white shadow-xl mb-6`}>
      {/* Decorative stars and clouds */}
      <SparkleStar color="#F2C700" size={24} className="absolute top-4 right-12 z-10" />
      <SparkleStar color="#FFFFFF" size={20} className="absolute bottom-10 left-10 z-10" />
      <FloatingCloud size="sm" color="#FFFFFF" className="absolute -top-2 right-1/4 opacity-40 z-0" />
      <FloatingCloud size="md" color="#FFFFFF" delayed className="absolute bottom-2 right-8 opacity-30 z-0" />

      <div className="relative z-10 p-6 sm:p-8 pb-10">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-xs px-3.5 py-1 text-xs font-bold text-[#183B3A] shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-[#F2C700] fill-[#F2C700]" />
            {roleLabel}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-xs px-3 py-1 text-xs font-bold text-white">
            Período: {period}
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm flex items-center gap-2">
          <span>¡Hola, {userName.split(' ')[0]}!</span>
          <Heart className="h-6 w-6 text-[#FF5DA0] fill-[#FF5DA0] animate-bounce-soft hidden xs:inline-block" />
        </h1>

        <p className="text-sm sm:text-base text-white/90 max-w-2xl font-medium mt-1">
          {description}
        </p>
      </div>

      <CloudDivider fillColor="#F4FAF9" className="-mb-1" />
    </div>
  );
};
