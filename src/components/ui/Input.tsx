import React, { useId } from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string | undefined;
  helperText?: string;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  info?: React.ReactNode | string; // small info icon/tooltip on the right of label
  ref?: React.Ref<HTMLInputElement>;
}

const Input = ({
  label,
  error,
  helperText,
  variant = 'default',
  size = 'md',
  className = '',
  info,
  ref,
  id,
  ...props
}: InputProps) => {
  // 自動生成 input id 並讓 label htmlFor 對應，達成 a11y 關聯
  // 與 SR 朗讀正確的 error / helperText。caller 仍可顯式傳入 id 覆寫。
  const reactId = useId();
  const inputId = id ?? reactId;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText && !error ? `${inputId}-helper` : undefined;
  const describedBy = errorId ?? helperId;
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
          <label htmlFor={inputId} className="block text-sm font-medium text-[var(--text-secondary)]">
            {label}
          </label>
          {info && (
            <span
              className="inline-flex items-center justify-center size-4 rounded-full bg-[var(--text-muted)]/20 text-[10px] text-[var(--text-secondary)] cursor-help select-none"
              title={typeof info === 'string' ? info : undefined}
            >
              {typeof info === 'string' ? 'i' : info}
            </span>
          )}
        </div>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${errorStyles} ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p id={helperId} className="mt-1 text-sm text-[var(--text-muted)]">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
