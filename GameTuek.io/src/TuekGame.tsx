import { useEffect, useRef, useState } from 'react';
import { createGame, type Result } from './game';
import './style.css';

/** Identity is supplied by the website's authenticated server, not by the game. */
export type GameResult = Result & { id: string; gameId: 'tuek'; createdAt: string; version: 1 };
export type TuekGameProps = {
  saveResult: (result: GameResult) => Promise<void>;
  onGameOver?: (result: GameResult) => void;
};

/** Drop-in game screen. The host website owns login, score storage and leaderboard. */
export function TuekGame({ saveResult, onGameOver }: TuekGameProps) {
  const host = useRef<HTMLDivElement>(null);
  const handlers = useRef({ saveResult, onGameOver });
  handlers.current = { saveResult, onGameOver };
  const generation = useRef(0);
  const retrying = useRef(false);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [floors, setFloors] = useState(0);
  const [perfect, setPerfect] = useState(false);
  const [result, setResult] = useState<GameResult | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  async function persist(finished: GameResult, token: number) {
    if (retrying.current) return;
    retrying.current = true;
    setSaveState('saving');
    try {
      await handlers.current.saveResult(finished);
      if (generation.current === token) setSaveState('saved');
    } catch {
      if (generation.current === token) setSaveState('error');
    } finally {
      if (generation.current === token) retrying.current = false;
    }
  }

  useEffect(() => {
    if (!host.current) return;
    const token = ++generation.current;
    retrying.current = false;
    const game = createGame(host.current, (points, count, isPerfect) => {
      setScore(points); setFloors(count); setPerfect(isPerfect);
    }, (finished) => {
      const entry: GameResult = { ...finished, id: crypto.randomUUID(), gameId: 'tuek',
        createdAt: new Date().toISOString(), version: 1 };
      setResult(entry);
      void persist(entry, token);
      handlers.current.onGameOver?.(entry);
    });
    return () => { generation.current++; game.destroy(true); };
  }, [round]);

  function restart() {
    setResult(null); setSaveState('idle'); setPerfect(false);
    setRound(value => value + 1);
  }

  return <main className="tuek-game" aria-label="เกมต่อตึก">
    <div className="game-host" ref={host} />
    <div className="hud" aria-label="คะแนน">
      <strong>{score.toLocaleString()}</strong><span>{floors} ชั้น</span>
    </div>
    {!result && perfect && <div className="perfect" key={`${round}-${floors}`}>PERFECT +150</div>}
    {!result && <p className="hint">คลิก / แตะ / Space เพื่อปล่อย</p>}
    {result && <div className="game-over">
      <h1>จบเกม</h1><strong>{result.score.toLocaleString()}</strong><p>{result.floors} ชั้น</p>
      <button autoFocus disabled={saveState === 'saving'} onClick={restart}>เล่นอีกครั้ง</button>
      {saveState === 'saving' && <small role="status">กำลังบันทึกคะแนน…</small>}
      {saveState === 'error' && <><small role="alert">บันทึกคะแนนไม่ได้</small><button className="retry" onClick={() => void persist(result, generation.current)}>ลองบันทึกอีกครั้ง</button></>}
    </div>}
  </main>;
}
