// Type definition for a debounced function
export type DebouncedFunction<T extends (...args: unknown[]) => unknown> = (...args: Parameters<T>) => void;

/**
 * Creates a debounced function that delays invoking `func` until after `delay` milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param func The function to debounce.
 * @param delay The number of milliseconds to delay.
 * @returns A new debounced function.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(func: T, delay: number): DebouncedFunction<T> {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}
