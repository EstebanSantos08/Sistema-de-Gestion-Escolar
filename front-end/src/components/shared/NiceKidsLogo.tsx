interface NiceKidsLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export function NiceKidsLogo({ size = 'md', showSubtitle = true, className = '' }: NiceKidsLogoProps) {
  const sizeClasses = {
    sm: 'text-xl gap-0.5',
    md: 'text-2xl gap-1',
    lg: 'text-4xl gap-1.5',
  };

  const circleSizes = {
    sm: 'h-12 w-12 -left-2 -top-0.5',
    md: 'h-16 w-16 -left-3 -top-1',
    lg: 'h-24 w-24 -left-4 -top-2',
  };

  const dotSizes = {
    sm: 'h-4 w-4 left-3 -top-2',
    md: 'h-6 w-6 left-4 -top-3',
    lg: 'h-8 w-8 left-6 -top-4',
  };

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* Círculo turquesa con el punto rojo superior */}
      <div className="relative flex items-center justify-center my-1">
        {/* Círculo de fondo Turquesa NICE */}
        <div className={`absolute rounded-full bg-[#09A9C2] -z-10 shadow-lg ${circleSizes[size]}`} />
        {/* Punto rojo superior */}
        <div className={`absolute rounded-full bg-[#E84B5B] -z-10 shadow-md border-2 border-white ${dotSizes[size]}`} />

        {/* Letras 3D NICE KIDS en fuente Fredoka ExtraBold con borde blanco grueso y segunda sombra */}
        <div className={`flex items-center font-nice font-black tracking-wider py-1 px-2 ${sizeClasses[size]}`}>
          {/* NICE */}
          <span className="bubbly-letter-3d text-[#E84B5B]">N</span>
          <span className="bubbly-letter-3d text-[#008BC1]">I</span>
          <span className="bubbly-letter-3d text-[#F4B51B]">C</span>
          <span className="bubbly-letter-3d text-[#31B45A]">E</span>

          <span className="w-2 md:w-3" />

          {/* KIDS */}
          <span className="bubbly-letter-3d text-[#E8798A]">K</span>
          <span className="bubbly-letter-3d text-[#008BC1]">I</span>
          <span className="bubbly-letter-3d text-[#F4B51B]">D</span>
          <span className="bubbly-letter-3d text-[#31B45A]">S</span>
        </div>
      </div>

      {showSubtitle && (
        <span className="text-[9px] md:text-[10px] font-nice font-black text-teal-800 uppercase tracking-widest mt-1 bg-teal-100/90 px-3 py-1 rounded-full shadow-xs border border-teal-200/50">
          Centro de Desarrollo Infantil Inclusivo
        </span>
      )}
    </div>
  );
}
