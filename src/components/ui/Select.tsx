import React, { forwardRef } from 'react';

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string | undefined;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  info?: React.ReactNode | string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ 
  label,
  error,
  helperText,
  options,
  placeholder,
  variant = 'default',
  size = 'md',
  className = '',
  info,
  ...props
}, ref) => {
  const baseStyles = 'w-full rounded-lg border transition-colors focus:outline-none focus:ring-2 ring-[var(--color-accent)] cursor-pointer';
  
  const variantStyles = {
    default:
      'bg-[var(--glass-elevated)] border-[var(--glass-elevated-border)] text-[var(--text-primary)] focus:border-[var(--color-accent)]',
    filled:
      'bg-[var(--glass-surface)] border-transparent text-[var(--text-primary)] focus:bg-[var(--glass-elevated)]',
    outlined:
      'bg-[var(--glass-elevated)] border-[var(--glass-elevated-border)] text-[var(--text-primary)] focus:border-[var(--color-accent)]',
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
      <select
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${errorStyles} ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
            className="bg-[var(--glass-elevated)] text-[var(--text-primary)] dark:bg-gray-800 dark:text-gray-100"
          >
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-[var(--text-muted)]">{helperText}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
