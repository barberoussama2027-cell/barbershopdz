import React from 'react';

interface BarberLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BarberLogo: React.FC<BarberLogoProps> = ({ size = 'md', className = '' }) => {
  const dimensions =
    size === 'lg'
      ? 'w-20 h-20 rounded-3xl'
      : size === 'sm'
      ? 'w-9 h-9 rounded-xl'
      : 'w-11 h-11 rounded-2xl';

  const svgSize = size === 'lg' ? 'w-12 h-12' : size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';

  return (
    <div
      className={`${dimensions} bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 p-[1.5px] shadow-xl shadow-amber-500/20 shrink-0 ${className}`}
    >
      <div className="w-full h-full rounded-[inherit] bg-slate-950/95 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/15 via-transparent to-amber-300/10 pointer-events-none" />
        {/* Modern minimalist gentleman with sculpted hair & classic mustache */}
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${svgSize} relative z-10`}
          aria-hidden="true"
        >
          {/* Sculpted Hair / Pompadour */}
          <path
            d="M17 26C16.5 16.5 23 10 32.5 10C41.5 10 47.5 15.5 47 25.5C45 20 40.5 18.5 34.5 19C27.5 19.5 21 20.5 17 26Z"
            fill="url(#goldGrad)"
          />
          {/* Face contour */}
          <path
            d="M19 26V33C19 42.5 24.8 49.5 32 49.5C39.2 49.5 45 42.5 45 33V26"
            stroke="url(#goldGrad)"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          {/* Subtle eyebrows / eyes */}
          <path
            d="M24.5 29.5H28.5M35.5 29.5H39.5"
            stroke="#FDE68A"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Iconic Handlebar Mustache */}
          <path
            d="M32 37.5C29.5 35.5 26 35.5 23.5 37.5C21.5 39 19 38.8 18.2 37C19.8 40.8 23.5 42 27.2 40.5C29.2 39.7 30.8 39 32 38.8C33.2 39 34.8 39.7 36.8 40.5C40.5 42 44.2 40.8 45.8 37C45 38.8 42.5 39 40.5 37.5C38 35.5 34.5 35.5 32 37.5Z"
            fill="url(#goldGrad)"
          />
          {/* Sharp Goatee / Beard accent */}
          <path
            d="M26 46.5C28.2 48.3 30 49 32 49C34 49 35.8 48.3 38 46.5"
            stroke="#F59E0B"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="goldGrad" x1="16" y1="10" x2="48" y2="52" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE68A" />
              <stop offset="0.5" stopColor="#F59E0B" />
              <stop offset="1" stopColor="#B45309" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};
