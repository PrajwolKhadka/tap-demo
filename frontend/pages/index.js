import { useEffect, useState } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [latest, setLatest] = useState(null);
  const [connected, setConnected] = useState(true);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let lastId = null;

    const fetchData = async () => {
      try {
        const [sessionsRes, latestRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/sessions`),
          fetch(`${BACKEND_URL}/api/sessions/latest`)
        ]);
        const sessionsData = await sessionsRes.json();
        const latestData = await latestRes.json();

        if (latestData && latestData.id !== lastId) {
          if (lastId !== null) {
            setFlash(true);
            setTimeout(() => setFlash(false), 900);
          }
          lastId = latestData.id;
        }

        setSessions(sessionsData);
        setLatest(latestData);
        setConnected(true);
      } catch (err) {
        setConnected(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2500);
    return () => clearInterval(interval);
  }, []);

  const best = sessions.reduce((max, s) => (s.tapCount > max ? s.tapCount : max), 0);

  return (
    <div className="page">
      <div className="statusBar">
        <span className={`dot ${connected ? 'dot--live' : 'dot--down'}`} />
        <span>{connected ? 'Connected to backend' : `Can't reach ${BACKEND_URL}`}</span>
      </div>

      <header className="header">
        <p className="eyebrow">VR Tap Challenge</p>
        <h1>Scoreboard</h1>
      </header>

      <section className={`scoreCard ${flash ? 'scoreCard--flash' : ''}`}>
        <span className="scoreLabel">Latest run</span>
        <span className="scoreNumber">{latest ? latest.tapCount : '--'}</span>
        <span className="scoreMeta">
          {latest ? `${latest.playerName} · ${formatTime(latest.timestamp)}` : 'Waiting for a round to finish'}
        </span>
      </section>

      <section className="statsRow">
        <div className="statBox">
          <span className="statValue">{sessions.length}</span>
          <span className="statLabel">Rounds played</span>
        </div>
        <div className="statBox">
          <span className="statValue">{best}</span>
          <span className="statLabel">Best score</span>
        </div>
      </section>

      <section>
        <h2 className="historyTitle">History</h2>
        {sessions.length === 0 ? (
          <p className="empty">No rounds recorded yet. Finish a 40 second round in VR to see it here.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Taps</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className={s.id === (latest && latest.id) ? 'row--latest' : ''}>
                  <td>{s.playerName}</td>
                  <td className="tapsCell">{s.tapCount}</td>
                  <td>{formatTime(s.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
