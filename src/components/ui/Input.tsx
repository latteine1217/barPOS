import React, { forwardRef } from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  info?: React.ReactNode | string; // small info icon/tooltip on the right of label
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ 
  label,
  error,
  helperText,
  variant = 'default',
  size = 'md',
  className = '',
  info,
  ...props
}, ref) => {
  const baseStyles = 'w-full rounded-lg border transition-colors focus:outline-none focus:ring-2 ring-[var(--color-accent)]';
  
  const variantStyles = {
    default:
      'bg-[var(--glass-elevated)] border-[var(--glass-elevated-border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--color-accent)]',
    filled:
      'bg-[var(--glass-surface)] border-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:bg-[var(--glass-elevated)]',
    outlined:
      'bg-[var(--glass-elevated)] border-[var(--glass-elevated-border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--color-accent)]',
  };
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg'
  };

  const errorStyles = error ? 'border-red-500 focus:ring-red-500' : '';

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            {label}
          </label>
          {info && (
            <span
              className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[var(--text-muted)]/20 text-[10px] text-[var(--text-secondary)] cursor-help select-none"
              title={typeof info === 'string' ? info : undefined}
            >
              {typeof info === 'string' ? 'i' : info}
            </span>
          )}
        </div>
      )}
      <input
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${errorStyles} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-[var(--text-muted)]">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
