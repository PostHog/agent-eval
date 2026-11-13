export function summarizeRun(sessions: { status: string }[]) {
  const counts = {
    queued: 0,
    running: 0,
    judging: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
  };

  for (const session of sessions) {
    for (const state of Object.keys(counts) as (keyof typeof counts)[]) {
      if (session.status === state) counts[state]++;
    }
  }

  const finished = counts.completed + counts.failed + counts.cancelled;

  return {
    counts,
    finished,
    total: sessions.length,
    active: counts.queued + counts.running + counts.judging > 0,
  };
}
