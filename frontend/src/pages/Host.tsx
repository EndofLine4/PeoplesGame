import { useEffect, useState } from 'preact/hooks';
import QRCode from 'qrcode';
import { api, apiBase } from '../utils/api';
import { saveSession, loadSession } from '../utils/storage';
import { usePoll } from '../utils/usePoll';
import { Clouds } from '../components/Clouds';

export function Host() {
  const [code, setCode] = useState<string | null>(null);
  const [hostId, setHostId] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existing = loadSession();
    if (existing?.code && existing.hostId) {
      setCode(existing.code);
      setHostId(existing.hostId);
      return;
    }
    api.createGame()
      .then((g) => {
        setCode(g.code);
        setHostId(g.hostId);
        saveSession({ code: g.code, hostId: g.hostId });
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!code) return;
    const playUrl = `${window.location.origin}/play?code=${code}`;
    QRCode.toDataURL(playUrl, { width: 280, margin: 2, color: { dark: '#1F1F4A', light: '#FFFFFF' } })
      .then(setQrUrl)
      .catch(() => {});
  }, [code]);

  const game = usePoll(() => (code ? api.getGame(code) : Promise.resolve(null)), 1500);

  if (error) {
    return (
      <div class="min-h-screen flex items-center justify-center p-6">
        <div class="card p-6 max-w-md text-center">
          <div class="text-5xl mb-3">⚠️</div>
          <p class="text-red-700 font-bold">{error}</p>
        </div>
      </div>
    );
  }

  if (!code || !game) {
    return (
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-white text-3xl pixel">LOADING...</div>
      </div>
    );
  }

  if (game.phase === 'lobby') return <HostLobby game={game} qrUrl={qrUrl} hostId={hostId!} />;
  if (game.phase === 'trivia') return <HostTrivia game={game} hostId={hostId!} />;
  if (game.phase === 'group') return <HostGroup game={game} hostId={hostId!} />;
  if (game.phase === 'final') return <HostFinal game={game} />;
  return null;
}

function HostLobby({ game, qrUrl, hostId }: any) {
  const [starting, setStarting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const playUrl = `${window.location.origin}/play?code=${game.code}`;

  const start = async () => {
    setStarting(true);
    setErr(null);
    try {
      await api.startGame(game.code, hostId);
    } catch (e: any) {
      setErr(e.message);
      setStarting(false);
    }
  };

  const ready = game.players.filter((p: any) => p.hasProfile);

  return (
    <div class="relative min-h-screen overflow-hidden">
      <Clouds />
      <div class="relative z-10 max-w-5xl mx-auto px-6 py-8">
        <div class="text-center mb-6">
          <h1 class="pixel text-2xl md:text-4xl text-white mb-2" style={{ textShadow: '4px 4px 0 #000' }}>
            🍄 PEOPLE'S GAME 🍄
          </h1>
          <p class="pixel text-yellow-300 text-xs" style={{ textShadow: '2px 2px 0 #000' }}>
            WORLD 1: THE ICEBREAKER
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-6">
          <div class="card p-6 text-center">
            <p class="text-sm font-bold text-gray-600 mb-2">JOIN AT</p>
            <p class="pixel text-lg text-brand-dark mb-4 break-all">{playUrl}</p>
            <p class="text-sm font-bold text-gray-600 mb-2">CODE</p>
            <div class="pixel text-6xl coin-glow mb-4">{game.code}</div>
            {qrUrl && (
              <img src={qrUrl} alt="QR code" class="mx-auto rounded-lg border-4 border-brand-dark" />
            )}
          </div>

          <div class="card p-6 flex flex-col">
            <h2 class="pixel text-lg text-brand-dark mb-4">
              PLAYERS ({game.players.length})
            </h2>
            <div class="flex-1 overflow-y-auto space-y-2 mb-4 max-h-96">
              {game.players.length === 0 && (
                <p class="text-center text-gray-500 italic py-8">
                  Waiting for players to join...
                </p>
              )}
              {game.players.map((p: any) => (
                <div
                  key={p.id}
                  class={`flex items-center justify-between p-3 rounded-lg border-2 ${
                    p.hasProfile ? 'bg-green-50 border-green-400' : 'bg-yellow-50 border-yellow-400'
                  }`}
                >
                  <div class="flex items-center gap-3">
                    <span class="text-3xl">{p.emoji}</span>
                    <span class="font-bold">{p.name}</span>
                  </div>
                  <span class="pixel text-xs">
                    {p.hasProfile ? '✓ READY' : '...PROFILE'}
                  </span>
                </div>
              ))}
            </div>
            {err && <p class="text-red-600 text-sm mb-2">{err}</p>}
            <button
              class="btn-mario w-full"
              onClick={start}
              disabled={starting || ready.length < 2}
            >
              {starting ? 'STARTING...' : ready.length < 2 ? `NEED ${2 - ready.length} MORE READY` : '▶ START GAME'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HostTrivia({ game, hostId }: any) {
  const q = game.currentQuestion;
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<any>(null);
  const allAnswered = q && q.answeredCount >= q.totalPlayers;

  useEffect(() => {
    setShowResult(false);
    setResult(null);
  }, [q?.id]);

  useEffect(() => {
    if (allAnswered && !showResult) {
      api.getResult(game.code).then((r) => {
        setResult(r);
        setShowResult(true);
      }).catch(() => {});
    }
  }, [allAnswered, showResult, game.code]);

  const next = async () => {
    await api.nextQuestion(game.code, hostId);
  };

  if (!q) return null;

  const seconds = Math.ceil((q.remainingMs || 0) / 1000);

  return (
    <div class="relative min-h-screen overflow-hidden">
      <Clouds />
      <div class="relative z-10 max-w-5xl mx-auto px-6 py-6">
        <div class="flex items-center justify-between mb-6">
          <span class="pixel text-white text-sm" style={{ textShadow: '2px 2px 0 #000' }}>
            QUESTION {game.questionIndex + 1} / {game.totalQuestions}
          </span>
          <span class="pixel text-yellow-300 text-2xl coin-glow">
            🪙 {q.answeredCount}/{q.totalPlayers}
          </span>
          {!showResult && (
            <span class="pixel text-white text-2xl" style={{ textShadow: '2px 2px 0 #000' }}>
              ⏱ {seconds}s
            </span>
          )}
        </div>

        <div class="card p-8 mb-6 text-center">
          <h2 class="text-2xl md:text-3xl font-bold text-brand-dark mb-2">{q.prompt}</h2>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-6">
          {q.options.map((o: any, idx: number) => {
            const colors = ['btn-mario', 'btn-blue', 'btn-yellow', 'btn-green'];
            const correct = showResult && result?.correctPlayerId === o.id;
            return (
              <div
                key={o.id}
                class={`btn-mario ${colors[idx]} text-center text-lg md:text-2xl py-8 ${correct ? 'pulse-glow' : ''}`}
                style={{ opacity: showResult && !correct ? 0.5 : 1 }}
              >
                <div class="text-4xl mb-2">{o.emoji}</div>
                <div>{o.name}</div>
                {correct && <div class="pixel text-xs mt-2">★ CORRECT ★</div>}
              </div>
            );
          })}
        </div>

        {showResult && (
          <div class="text-center">
            <button class="btn-mario btn-green text-xl" onClick={next}>
              {game.questionIndex + 1 < game.totalQuestions ? '▶ NEXT QUESTION' : '🚩 GROUP CHALLENGE'}
            </button>
          </div>
        )}

        <Leaderboard players={game.players} />
      </div>
    </div>
  );
}

function HostGroup({ game, hostId }: any) {
  const gc = game.groupChallenge;
  const allDone = gc?.groups.every((g: any) => g.submitted);

  const finalize = async () => {
    await api.finalize(game.code, hostId);
  };

  if (!gc) return null;

  return (
    <div class="relative min-h-screen overflow-hidden">
      <Clouds />
      <div class="relative z-10 max-w-5xl mx-auto px-6 py-6">
        <h1 class="pixel text-2xl md:text-3xl text-yellow-300 text-center mb-6" style={{ textShadow: '4px 4px 0 #000' }}>
          🚩 BOWSER'S GROUP CHALLENGE 🚩
        </h1>

        <div class="card p-6 mb-6">
          <p class="pixel text-xs text-gray-600 mb-2">MISSION:</p>
          <p class="text-xl md:text-2xl text-brand-dark font-bold">{gc.prompt}</p>
        </div>

        <div class="grid md:grid-cols-3 gap-4 mb-6">
          {gc.groups.map((g: any) => (
            <div key={g.name} class="card p-4">
              <h3 class="pixel text-sm text-brand-dark mb-3 text-center">{g.name}</h3>
              <div class="space-y-2 mb-3">
                {g.members.map((m: any, i: number) => (
                  <div key={i} class="flex items-center gap-2 text-sm">
                    <span class="text-2xl">{m.emoji}</span>
                    <span class="font-bold">{m.name}</span>
                  </div>
                ))}
              </div>
              {g.submitted ? (
                <div class="bg-green-100 border-2 border-green-500 rounded p-2 text-sm">
                  <p class="pixel text-xs text-green-700 mb-1">✓ SUBMITTED</p>
                  <p class="text-gray-800">{g.answer}</p>
                </div>
              ) : (
                <p class="text-center pixel text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
                  WORKING...
                </p>
              )}
            </div>
          ))}
        </div>

        {allDone && (
          <div class="text-center">
            <button class="btn-mario btn-yellow text-xl" onClick={finalize}>
              ⭐ SHOW FINAL SCORES ⭐
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function HostFinal({ game }: any) {
  const sorted = [...game.players].sort((a, b) => b.score - a.score);
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div class="relative min-h-screen overflow-hidden">
      <Clouds />
      <div class="relative z-10 max-w-3xl mx-auto px-6 py-8">
        <div class="text-center mb-8">
          <div class="text-7xl float mb-4">🏰</div>
          <h1 class="pixel text-3xl md:text-4xl text-yellow-300 mb-2" style={{ textShadow: '4px 4px 0 #000' }}>
            ★ COURSE CLEAR! ★
          </h1>
          <p class="pixel text-white text-sm" style={{ textShadow: '2px 2px 0 #000' }}>
            FINAL LEADERBOARD
          </p>
        </div>

        <div class="card p-6 space-y-3">
          {sorted.map((p: any, i: number) => (
            <div
              key={p.id}
              class={`flex items-center gap-4 p-4 rounded-lg border-4 ${
                i === 0 ? 'border-yellow-500 bg-yellow-50' :
                i === 1 ? 'border-gray-400 bg-gray-50' :
                i === 2 ? 'border-orange-500 bg-orange-50' :
                'border-gray-200 bg-white'
              }`}
            >
              <span class="text-4xl">{medals[i] || `${i + 1}.`}</span>
              <span class="text-4xl">{p.emoji}</span>
              <span class="flex-1 font-bold text-xl text-brand-dark">{p.name}</span>
              <span class="pixel text-2xl coin-glow">🪙 {p.score}</span>
            </div>
          ))}
        </div>

        <p class="text-center text-white pixel text-xs mt-8 opacity-80" style={{ textShadow: '2px 2px 0 #000' }}>
          THANK YOU FOR PLAYING!
        </p>
      </div>
    </div>
  );
}

function Leaderboard({ players }: any) {
  const sorted = [...players].sort((a, b) => b.score - a.score).slice(0, 5);
  return (
    <div class="card p-4 mt-6">
      <h3 class="pixel text-sm text-brand-dark mb-3">🏆 TOP 5</h3>
      <div class="space-y-2">
        {sorted.map((p: any, i: number) => (
          <div key={p.id} class="flex items-center gap-3 text-sm">
            <span class="pixel text-xs w-6">#{i + 1}</span>
            <span class="text-2xl">{p.emoji}</span>
            <span class="flex-1 font-bold">{p.name}</span>
            <span class="pixel text-yellow-700">🪙 {p.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
