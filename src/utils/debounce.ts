/**
 * Debounce utility — delays function execution until `ms` milliseconds
 * after the last invocation. Used across all calculator input listeners
 * to prevent wasteful re-simulations on every keystroke.
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  ms = 300
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
