export type Run = { id: string; playerId: string; playerName: string; score: number; floors: number; perfectDrops: number; durationMs: number; createdAt: string; version: 1 };
export async function readRuns(): Promise<Run[]> {
  const response = await fetch('/api/runs');
  if (!response.ok) throw new Error('Cannot load scores');
  return response.json();
}
export async function saveRun(run: Run) {
  const response = await fetch('/api/runs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(run) });
  if (!response.ok) throw new Error('Cannot save score');
}
export function playerId() { let id = localStorage.getItem('tuek.playerId'); if (!id) { id = crypto.randomUUID(); localStorage.setItem('tuek.playerId', id); } return id; }
export function leaderboard(runs: Run[]) { const best = new Map<string, Run>(); for (const r of runs) { const key = r.playerId || r.playerName; if (!best.has(key) || best.get(key)!.score < r.score) best.set(key, r); } return [...best.values()].sort((a,b) => b.score-a.score || b.floors-a.floors || a.createdAt.localeCompare(b.createdAt)); }
