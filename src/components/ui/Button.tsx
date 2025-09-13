import React, { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ring-[var(--color-accent)] focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary:
      'bg-[var(--color-accent)] hover:brightness-95 active:brightness-90 text-white border-[var(--color-accent)]',
    secondary:
      'bg-[var(--glass-elevated)] hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-primary)] border-[var(--glass-elevated-border)]',
    success:
      'bg-[var(--color-success)] hover:brightness-95 active:brightness-90 text-white border-[var(--color-success)]',
    danger:
      'bg-[var(--color-error)] hover:brightness-95 active:brightness-90 text-white border-[var(--color-error)]',
    warning:
      'bg-[var(--color-warning)] hover:brightness-95 active:brightness-90 text-white border-[var(--color-warning)]',
    info:
      'bg-[color:var(--color-accent)]/10 text-[var(--color-accent)] border-[color:var(--color-accent)]/30 hover:bg-[color:var(--color-accent)]/15',
    ghost:
      'bg-transparent hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-primary)] border-[var(--glass-elevated-border)]',
  } as const;

  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-2.5 text-base',
    xl: 'px-8 py-3 text-lg',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};
