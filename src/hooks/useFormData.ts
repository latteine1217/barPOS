import { useState, useCallback, useMemo } from 'react';

// 定義表單值的類型
type FormFieldValue = string | number | boolean | null | undefined | string[] | number[];

export interface UseFormDataReturn<T> {
  data: T;
  updateField: (field: keyof T, value: FormFieldValue) => void;
  updateData: (updates: Partial<T>) => void;
  resetData: () => void;
  isDirty: boolean;
  errors: Record<string, string>;
  setError: (field: keyof T, error: string) => void;
  clearError: (field: keyof T) => void;
  clearAllErrors: () => void;
  hasErrors: boolean;
}

export const useFormData = <T extends Record<string, FormFieldValue>>(
  initialData: T
): UseFormDataReturn<T> => {
  const [data, setData] = useState<T>(initialData);
  const [originalData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ 修復：使用 useMemo 計算 isDirty 狀態，避免無限循環
  const isDirty = useMemo(() => {
    return Object.keys(data).some(key => 
      data[key] !== originalData[key]
    ) || Object.keys(originalData).some(key =>
      !(key in data)
    );
  }, [data, originalData]);

  const updateField = useCallback((field: keyof T, value: FormFieldValue): void => {
    setData(prev => ({
      ...prev,
      [field]: value,
    }));

    // 清除該欄位的錯誤
    setErrors(prev => {
      if (prev[field as string]) {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      }
      return prev;
    });
  }, []);

  const updateData = useCallback((updates: Partial<T>): void => {
    setData(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const resetData = useCallback((): void => {
    setData(initialData);
    setErrors({});
  }, [initialData]);

  const setError = useCallback((field: keyof T, error: string): void => {
    setErrors(prev => ({
      ...prev,
      [field as string]: error,
    }));
  }, []);

  const clearError = useCallback((field: keyof T): void => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback((): void => {
    setErrors({});
  }, []);

  const hasErrors = Object.keys(errors).length > 0;

  return {
    data,
    updateField,
    updateData,
    resetData,
    isDirty,
    errors,
    setError,
    clearError,
    clearAllErrors,
    hasErrors,
  };
};