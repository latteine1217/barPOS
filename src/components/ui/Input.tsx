import React, { forwardRef } from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ 
  label,
  error,
  helperText,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const baseStyles = 'w-full rounded-lg border transition-colors focus:outline-none focus:ring-2';
  
  const variantStyles = {
    default: 'bg-white/10 border-white/20 text-white placeholder-white/60 focus:ring-blue-500 focus:border-blue-500',
    filled: 'bg-gray-100 border-transparent text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:bg-white',
    outlined: 'bg-transparent border-white/40 text-white placeholder-white/60 focus:ring-blue-500 focus:border-blue-500'
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
        <label className="block text-sm font-medium text-white/80 mb-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${errorStyles} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-white/60">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;