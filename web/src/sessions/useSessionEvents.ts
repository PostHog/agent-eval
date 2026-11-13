import { useEffect, useState } from "react";
import { api } from "../api.js";
import type { EventRow } from "../types.js";

export function useSessionEvents(id: string, active: boolean) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [error, setError] = useState("");
  // The cursor prevents duplicate events as an active session adds evidence to SQLite.
  useEffect(() => {
    let cancelled = false;
    let cursor = 0;
    let loading = false;

    const load = async () => {
      if (loading) return;

      loading = true;

      try {
        let batch: EventRow[];

        do {
          batch = await api<EventRow[]>(
            `/sessions/${id}/events?after=${cursor}`,
          );

          if (cancelled) return;
          if (batch.length) {
            cursor = batch[batch.length - 1]?.sequence ?? cursor;
            setEvents((current) => [...current, ...batch]);
          }
        } while (batch.length === 500);
      } catch (error) {
        if (!cancelled) setError(String(error));
      } finally {
        loading = false;
      }
    };

    setEvents([]);
    void load();

    const timer = active ? setInterval(() => void load(), 2000) : undefined;

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [id, active]);

  return { events, error };
}
