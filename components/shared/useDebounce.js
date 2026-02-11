/**
 * Shared debounce hook for search inputs.
 * Returns a value that trails the input by `delay` ms.
 */
const useDebounce = (value, delay = 150) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};
