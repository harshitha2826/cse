import React from 'react';

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'cyan' | 'teal' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const GlowButton: React.FC<GlowButtonProps> = ({
  children,
  variant = 'cyan',
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-4 py-2 text-xs rounded-lg',
    md: 'px-6 py-3 text-sm rounded-xl',
    lg: 'px-8 py-4 text-base rounded-xl',
  };

  const variantClasses = {
    cyan: 'btn-glow-cyan',
    teal: 'btn-glow-teal',
    amber: 'btn-glow-amber',
  };

  return (
    <button
      className={`font-extrabold uppercase tracking-wider transition-all duration-500 cursor-pointer shadow-lg active:scale-92 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default GlowButton;
