import { useCallback, useEffect, useRef, useState } from 'react';

export function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const alive = useRef(0);
  const run = useCallback(() => {
    const id = ++alive.current;
    setState((s) => ({ ...s, loading: true, error: '' }));
    Promise.resolve()
      .then(fn)
      .then((data) => { if (id === alive.current) setState({ data, loading: false, error: '' }); })
      .catch((e) => { if (id === alive.current) setState({ data: null, loading: false, error: e.message }); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { run(); return () => { alive.current += 1; }; }, [run]);
  return { ...state, reload: run };
}

export function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}
