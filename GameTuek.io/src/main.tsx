import { createRoot } from 'react-dom/client';
import { TuekGame } from './TuekGame';
import { playerId, saveRun } from './storage';
import './standalone.css';

// Local demo adapter only. The website supplies its own saveResult callback.
createRoot(document.getElementById('root')!).render(<TuekGame saveResult={async result => {
  await saveRun({ ...result, playerId: playerId(),
    playerName: localStorage.getItem('tuek.name')?.trim() || 'Guest' });
}} />);
