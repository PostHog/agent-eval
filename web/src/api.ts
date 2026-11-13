import { useCallback, useEffect, useRef, useState } from "react";

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const result: unknown = await response.json();

  if (!response.ok)
    throw new Error(
      result && typeof result === "object" && "message" in result
        ? String(result.message)
        : "The request failed.",
    );

  return result as T;
}

// Each screen owns its request. Abort previous requests when navigation changes the resource.
export function useApi<T>(path: string, poll = false) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const previousPath = useRef(path);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let pending = false;

    setLoading(true);

    if (previousPath.current !== path) setData(undefined);

    previousPath.current = path;

    const load = async () => {
      if (pending) return;

      pending = true;

      try {
        const value = await api<T>(
          `${path}${path.includes("?") ? "&" : "?"}refresh=${revision}`,
          { signal: controller.signal, cache: "no-store" },
        );
        if (!controller.signal.aborted) {
          setData(value);
          setError("");
        }
      } catch (error) {
        if (!controller.signal.aborted) setError(String(error));
      } finally {
        pending = false;

        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void load();

    const timer = poll ? setInterval(() => void load(), 2000) : undefined;

    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [path, poll, revision]);

  return { data, error, refresh, loading };
}
