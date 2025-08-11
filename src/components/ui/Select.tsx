import React, { forwardRef } from 'react';

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
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
  ...props
}, ref) => {
  const baseStyles = 'w-full rounded-lg border transition-colors focus:outline-none focus:ring-2 cursor-pointer';
  
  const variantStyles = {
     default: 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500',    filled: 'bg-gray-100 border-transparent text-gray-900 focus:ring-blue-500 focus:bg-white',
     outlined: 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'  };
  
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
             className="bg-white text-gray-900"          >
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-white/60">{helperText}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;