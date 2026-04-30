import { useEffect, useState, useRef } from 'preact/hooks';

export function usePoll<T>(fn: () => Promise<T>, intervalMs = 1500): T | null {
  const [data, setData] = useState<T | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let cancelled = false;
    let timer: any;

    const tick = async () => {
      try {
        const next = await fnRef.current();
        if (!cancelled) setData(next);
      } catch {
        // ignore transient errors
      }
      if (!cancelled) timer = setTimeout(tick, intervalMs);
    };

    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [intervalMs]);

  return data;
}
