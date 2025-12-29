import React from 'react';

interface DislikeIconProps {
  size?: number;
  className?: string;
  isActive?: boolean;
}

export const DislikeIcon: React.FC<DislikeIconProps> = ({
  size = 22,
  className,
  isActive = false,
}) => {
  const uniqueId = React.useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 2 24 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.4))' }}
    >
      <defs>
        {/* Gradiente activo (rosa/rojo) */}
        <linearGradient id={`activeGradient-${uniqueId}`} x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF8BA7" />
          <stop offset="40%" stopColor="#F75990" />
          <stop offset="100%" stopColor="#C93D6E" />
        </linearGradient>

        {/* Gradiente inactivo (gris) */}
        <linearGradient id={`inactiveGradient-${uniqueId}`} x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7A7A7A" />
          <stop offset="40%" stopColor="#5A5A5A" />
          <stop offset="100%" stopColor="#3D3D3D" />
        </linearGradient>

        {/* Highlight superior para efecto 3D */}
        <linearGradient id={`highlight-${uniqueId}`} x1="12" y1="2" x2="12" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white" stopOpacity={isActive ? '0.4' : '0.25'} />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Capa base del corazón */}
      <path
        d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
        fill={isActive ? `url(#activeGradient-${uniqueId})` : `url(#inactiveGradient-${uniqueId})`}
      />

      {/* Highlight superior para efecto 3D */}
      <path
        d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
        fill={`url(#highlight-${uniqueId})`}
      />

      {/* Reflejo pequeño superior izquierdo */}
      <ellipse
        cx="7"
        cy="7"
        rx="2.5"
        ry="1.8"
        fill="white"
        opacity={isActive ? '0.35' : '0.2'}
      />
    </svg>
  );
};

export default DislikeIcon;