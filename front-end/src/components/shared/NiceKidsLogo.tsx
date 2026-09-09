import React from 'react';
import { cn } from '@/lib/utils';

interface NiceKidsLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  subtitleText?: string;
  showBar?: boolean;
  className?: string;
}

const LETTER_STYLES = [
  // NICE
  { char: 'N', color: '#E879F9', hoverColor: '#D946EF', delay: '0ms', rotate: '-3deg' },
  { char: 'I', color: '#38BDF8', hoverColor: '#0EA5E9', delay: '40ms', rotate: '2deg' },
  { char: 'C', color: '#FACC15', hoverColor: '#EAB308', delay: '80ms', rotate: '-2deg' },
  { char: 'E', color: '#A3E635', hoverColor: '#84CC16', delay: '120ms', rotate: '3deg' },
  // space / separator
  { char: ' ', color: 'transparent', hoverColor: 'transparent', delay: '0ms', rotate: '0deg' },
  // KIDS
  { char: 'K', color: '#F472B6', hoverColor: '#EC4899', delay: '160ms', rotate: '-3deg' },
  { char: 'I', color: '#38BDF8', hoverColor: '#0EA5E9', delay: '200ms', rotate: '2deg' },
  { char: 'D', color: '#FB923C', hoverColor: '#F97316', delay: '240ms', rotate: '-2deg' },
  { char: 'S', color: '#A3E635', hoverColor: '#84CC16', delay: '280ms', rotate: '3deg' },
];

export function NiceKidsLogo({
  size = 'md',
  showSubtitle = true,
  subtitleText = 'Centro de educación infantil',
  showBar = true,
  className,
}: NiceKidsLogoProps) {
  const sizeConfig = {
    sm: {
      badge: 'w-7 h-7',
      textSize: 'text-lg',
      subSize: 'text-[11px]',
      gap: 'gap-2',
      barWidth: 'w-16',
      liftPx: '-translate-y-1',
    },
    md: {
      badge: 'w-11 h-11',
      textSize: 'text-2xl',
      subSize: 'text-xs',
      gap: 'gap-3',
      barWidth: 'w-24',
      liftPx: '-translate-y-1.5',
    },
    lg: {
      badge: 'w-14 h-14',
      textSize: 'text-3xl',
      subSize: 'text-sm',
      gap: 'gap-3.5',
      barWidth: 'w-28',
      liftPx: '-translate-y-2',
    },
    xl: {
      badge: 'w-16 h-16',
      textSize: 'text-4xl',
      subSize: 'text-base',
      gap: 'gap-4',
      barWidth: 'w-36',
      liftPx: '-translate-y-2.5',
    },
  }[size];

  return (
    <div className={cn('group/logo inline-flex items-center select-none cursor-pointer', sizeConfig.gap, className)}>
      {/* Circular Emblem from reference - pristine turquoise without dark borders */}
      <div className="relative shrink-0 transition-transform duration-300 ease-out group-hover/logo:scale-105 group-hover/logo:rotate-3">
        <div className={cn(
          'relative rounded-full overflow-hidden shadow-xs ring-2 ring-brand-turquoise/20',
          sizeConfig.badge
        )}>
          <img
            src="/logo-nicekids-2x.png"
            alt="NICE KIDS"
            className="h-full w-full object-cover select-none pointer-events-none"
            loading="eager"
          />
        </div>
      </div>

      {/* Typography and Subtitle */}
      <div className="flex flex-col justify-center min-w-0">
        <div className={cn('flex items-baseline font-black tracking-tight leading-none', sizeConfig.textSize)}>
          {LETTER_STYLES.map((item, idx) => {
            if (item.char === ' ') {
              return <span key={idx} className="inline-block w-1.5" aria-hidden="true" />;
            }
            return (
              <span
                key={idx}
                style={{
                  color: item.color,
                  textShadow: '0 1px 2px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.08)',
                  transitionDelay: item.delay,
                }}
                className={cn(
                  'inline-block font-black transition-all duration-300 ease-out transform-gpu',
                  'group-hover/logo:-translate-y-1.5 group-hover/logo:scale-110'
                )}
              >
                {item.char}
              </span>
            );
          })}
        </div>

        {showSubtitle && (
          <p className={cn('font-medium text-school-body tracking-normal mt-0.5 leading-snug', sizeConfig.subSize)}>
            {subtitleText}
          </p>
        )}

        {showBar && (
          <div
            className={cn(
              'mt-1.5 h-1 rounded-full transition-all duration-300 ease-out group-hover/logo:scale-x-105',
              sizeConfig.barWidth
            )}
            style={{
              background: 'linear-gradient(90deg, #41C4BD 0% 25%, #F2C700 25% 45%, #FF5DA0 45% 65%, #92CF00 65% 85%, #66B5E8 85% 100%)',
            }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}
