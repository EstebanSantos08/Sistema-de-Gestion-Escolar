import React from 'react';

interface CloudDividerProps {
  fillColor?: string;
  className?: string;
  flip?: boolean;
}

export const CloudDivider: React.FC<CloudDividerProps> = ({
  fillColor = '#F4FAF9',
  className = '',
  flip = false,
}) => {
  return (
    <div className={`w-full overflow-hidden leading-none ${flip ? 'rotate-180' : ''} ${className}`}>
      <svg
        className="relative block w-full h-8 sm:h-12 md:h-16"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
      >
        <path
          d="M0,0 C150,90 350,-40 500,45 C650,130 900,-20 1200,40 L1200,120 L0,120 Z"
          fill={fillColor}
        />
      </svg>
    </div>
  );
};

export const SoftWaveDivider: React.FC<CloudDividerProps> = ({
  fillColor = '#FFFFFF',
  className = '',
  flip = false,
}) => {
  return (
    <div className={`w-full overflow-hidden leading-none ${flip ? 'rotate-180' : ''} ${className}`}>
      <svg
        className="relative block w-full h-10 sm:h-16"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        <path
          d="M0,32L48,42.7C96,53,192,75,288,80C384,85,480,75,576,64C672,53,768,43,864,48C960,53,1056,75,1152,80C1248,85,1344,75,1392,69.3L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
          fill={fillColor}
        />
      </svg>
    </div>
  );
};

interface FloatingCloudProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  delayed?: boolean;
}

export const FloatingCloud: React.FC<FloatingCloudProps> = ({
  className = '',
  size = 'md',
  color = '#FFFFFF',
  delayed = false,
}) => {
  const sizeMap = {
    sm: 'w-16 h-10',
    md: 'w-28 h-16',
    lg: 'w-40 h-24',
  };

  return (
    <div
      className={`inline-block opacity-80 ${delayed ? 'animate-float-delayed' : 'animate-float'} ${className}`}
    >
      <svg
        className={sizeMap[size]}
        viewBox="0 0 100 60"
        fill={color}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M20 45 C10 45 5 35 12 25 C15 15 30 10 40 18 C48 8 68 8 75 20 C85 18 95 28 90 38 C95 48 85 55 75 52 C65 55 25 55 20 45 Z" />
      </svg>
    </div>
  );
};

interface SparkleStarProps {
  className?: string;
  color?: string;
  size?: number;
}

export const SparkleStar: React.FC<SparkleStarProps> = ({
  className = '',
  color = '#F2C700',
  size = 24,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-pulse-soft ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 0C12 6.62742 6.62742 12 0 12C6.62742 12 12 17.3726 12 24C12 17.3726 17.3726 12 24 12C17.3726 12 12 6.62742 12 0Z"
        fill={color}
      />
    </svg>
  );
};

export const PlayfulDotsPattern: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden opacity-30 ${className}`}>
      <div className="absolute top-10 left-10 w-4 h-4 rounded-full bg-[#FF5DA0] animate-float" />
      <div className="absolute top-20 right-16 w-6 h-6 rounded-full bg-[#41C4BD] animate-float-delayed" />
      <div className="absolute bottom-16 left-1/4 w-5 h-5 rounded-full bg-[#9DD31B] animate-bounce-soft" />
      <div className="absolute bottom-24 right-1/3 w-3 h-3 rounded-full bg-[#F2C700] animate-float" />
      <div className="absolute top-1/3 left-1/2 w-4 h-4 rounded-full bg-[#64B6E5] animate-float-delayed" />
      <div className="absolute top-2/3 right-10 w-5 h-5 rounded-full bg-[#EE7DCC] animate-float" />
    </div>
  );
};
