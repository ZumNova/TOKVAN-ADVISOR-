import React from 'react';

interface TokvanLogoProps {
  className?: string;
  variant?: 'full' | 'standard' | 'mark-only' | 'image-asset';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const TokvanLogo: React.FC<TokvanLogoProps> = ({
  className = '',
  variant = 'standard',
  size = 'md',
  showSubtitle = true,
}) => {
  // If explicitly requested to show the original uploaded asset
  if (variant === 'image-asset') {
    return (
      <div className={`relative flex flex-col items-center justify-center overflow-hidden rounded-xl bg-[#0B0D12] border border-[#273246] p-4 ${className}`}>
        <img
          src="/assets/aistudio/17f06f1e-7042-4115-b9d1-1f0c7e1f0d50_f7aafaaa.jpg"
          alt="TOKVAN Consultoría y tokenización - Identidad Institucional"
          className="max-h-72 w-auto object-contain rounded-lg shadow-2xl"
          referrerPolicy="no-referrer"
        />
        <div className="mt-3 text-center">
          <p className="text-xs font-semibold text-white tracking-widest uppercase">Identidad Oficial Certificada</p>
          <p className="text-[11px] text-[#9BA6BD]">Paraguay · Visión Global</p>
        </div>
      </div>
    );
  }

  const sizeClasses = {
    sm: {
      mark: 'w-6 h-6',
      title: 'text-base',
      desc: 'text-[9px]',
      global: 'text-[8px]',
      gap: 'gap-2',
    },
    md: {
      mark: 'w-8 h-8',
      title: 'text-xl',
      desc: 'text-[11px]',
      global: 'text-[9px]',
      gap: 'gap-3',
    },
    lg: {
      mark: 'w-11 h-11',
      title: 'text-2xl',
      desc: 'text-xs',
      global: 'text-[10px]',
      gap: 'gap-3.5',
    },
    xl: {
      mark: 'w-16 h-16',
      title: 'text-4xl',
      desc: 'text-sm',
      global: 'text-xs',
      gap: 'gap-4',
    },
  }[size];

  // Pure SVG Isotype respecting the exact geometry of the two parallel blue lozenges/parallelograms
  const IsotypeMark = (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClasses.mark} shrink-0`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="tokvanBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4A85FF" />
          <stop offset="100%" stopColor="#2458E6" />
        </linearGradient>
      </defs>
      {/* Upper parallelogram tile */}
      <path
        d="M48 20 L84 20 C90 20 94 24 92 29 L72 54 C70 57 66 59 62 59 L26 59 C20 59 16 55 18 50 L38 25 C40 22 44 20 48 20 Z"
        fill="url(#tokvanBlueGrad)"
      />
      {/* Lower parallel parallelogram tile */}
      <path
        d="M62 64 L98 64 C104 64 108 68 106 73 L86 98 C84 101 80 103 76 103 L40 103 C34 103 30 99 32 94 L52 69 C54 66 58 64 62 64 Z"
        fill="url(#tokvanBlueGrad)"
      />
    </svg>
  );

  if (variant === 'mark-only') {
    return <div className={`inline-flex items-center ${className}`}>{IsotypeMark}</div>;
  }

  return (
    <div className={`inline-flex items-center ${sizeClasses.gap} ${className}`}>
      {IsotypeMark}
      <div className="flex flex-col justify-center leading-tight">
        <div className="flex items-baseline gap-1.5">
          <span className={`font-extrabold tracking-tight text-white font-display ${sizeClasses.title}`}>
            tokvant
          </span>
          <span className="text-[10px] font-semibold text-[#7096FF] uppercase tracking-wider hidden sm:inline">
            EVM
          </span>
        </div>
        {showSubtitle && (
          <span className={`font-medium text-[#9BA6BD] tracking-normal ${sizeClasses.desc}`}>
            Consultoría y tokenización
          </span>
        )}
        {variant === 'full' && (
          <span className={`mt-0.5 tracking-widest text-[#7096FF] uppercase font-semibold ${sizeClasses.global}`}>
            Paraguay · Visión Global
          </span>
        )}
      </div>
    </div>
  );
};
