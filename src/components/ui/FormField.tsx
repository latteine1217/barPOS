import React, { forwardRef, useId } from 'react';

type CommonProps = {
  label: React.ReactNode;
  /** 顯示在 input 下方的輔助說明（也會綁到 aria-describedby） */
  hint?: React.ReactNode;
  /** 顯示為錯誤訊息（aria-invalid + aria-describedby + role=alert） */
  error?: React.ReactNode;
  /** 必填標記（顯示星號 + aria-required） */
  required?: boolean;
  /** 隱藏視覺 label（仍綁定給螢幕閱讀器） */
  visuallyHiddenLabel?: boolean;
  /** label 與 control 並排（適用於水平表單） */
  inline?: boolean;
  className?: string;
};

const baseInputCls =
  'w-full px-3 py-2 rounded-lg border bg-[var(--glass-elevated)] border-[var(--glass-elevated-border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 disabled:opacity-60';

const labelCls = (hidden?: boolean) =>
  hidden
    ? 'sr-only'
    : 'block text-xs font-medium text-[var(--text-secondary)] mb-1';

// ----------------------------------------------------------------------------
// FormField (Input)
// ----------------------------------------------------------------------------

type InputFieldProps = CommonProps &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> & {
    inputClassName?: string;
  };

export const FormField = forwardRef<HTMLInputElement, InputFieldProps>(function FormField(
  {
    label,
    hint,
    error,
    required,
    visuallyHiddenLabel,
    inline,
    className,
    inputClassName,
    id,
    ...inputProps
  },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`${inline ? 'flex items-center gap-3' : ''} ${className ?? ''}`}>
      <label htmlFor={inputId} className={labelCls(visuallyHiddenLabel)}>
        {label}
        {required && <span className="text-rose-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <div className={inline ? 'flex-1' : ''}>
        <input
          {...inputProps}
          ref={ref}
          id={inputId}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${baseInputCls} ${error ? 'border-rose-500 focus:ring-rose-400/40' : ''} ${inputClassName ?? ''}`}
        />
        {hint && !error && (
          <p id={hintId} className="mt-1 text-xs text-[var(--text-muted)]">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}
      </div>
    </div>
  );
});

// ----------------------------------------------------------------------------
// FormSelectField
// ----------------------------------------------------------------------------

type SelectFieldProps = CommonProps &
  Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className'> & {
    selectClassName?: string;
    children: React.ReactNode;
  };

export const FormSelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function FormSelectField(
  {
    label,
    hint,
    error,
    required,
    visuallyHiddenLabel,
    inline,
    className,
    selectClassName,
    id,
    children,
    ...selectProps
  },
  ref,
) {
  const reactId = useId();
  const selectId = id ?? reactId;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`${inline ? 'flex items-center gap-3' : ''} ${className ?? ''}`}>
      <label htmlFor={selectId} className={labelCls(visuallyHiddenLabel)}>
        {label}
        {required && <span className="text-rose-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <div className={inline ? 'flex-1' : ''}>
        <select
          {...selectProps}
          ref={ref}
          id={selectId}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${baseInputCls} ${error ? 'border-rose-500 focus:ring-rose-400/40' : ''} ${selectClassName ?? ''}`}
        >
          {children}
        </select>
        {hint && !error && (
          <p id={hintId} className="mt-1 text-xs text-[var(--text-muted)]">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}
      </div>
    </div>
  );
});

// ----------------------------------------------------------------------------
// FormTextareaField
// ----------------------------------------------------------------------------

type TextareaFieldProps = CommonProps &
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> & {
    textareaClassName?: string;
  };

export const FormTextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(function FormTextareaField(
  {
    label,
    hint,
    error,
    required,
    visuallyHiddenLabel,
    inline,
    className,
    textareaClassName,
    id,
    ...textareaProps
  },
  ref,
) {
  const reactId = useId();
  const textareaId = id ?? reactId;
  const hintId = hint ? `${textareaId}-hint` : undefined;
  const errorId = error ? `${textareaId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`${inline ? 'flex items-center gap-3' : ''} ${className ?? ''}`}>
      <label htmlFor={textareaId} className={labelCls(visuallyHiddenLabel)}>
        {label}
        {required && <span className="text-rose-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <div className={inline ? 'flex-1' : ''}>
        <textarea
          {...textareaProps}
          ref={ref}
          id={textareaId}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${baseInputCls} ${error ? 'border-rose-500 focus:ring-rose-400/40' : ''} ${textareaClassName ?? ''}`}
        />
        {hint && !error && (
          <p id={hintId} className="mt-1 text-xs text-[var(--text-muted)]">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}
      </div>
    </div>
  );
});

export default FormField;
