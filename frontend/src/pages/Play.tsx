import { useEffect, useState } from 'preact/hooks';
import { api, ProfileQuestion } from '../utils/api';
import { saveSession, loadSession } from '../utils/storage';
import { usePoll } from '../utils/usePoll';
import { Clouds } from '../components/Clouds';

export function Play() {
  const params = new URLSearchParams(window.location.search);
  const codeFromUrl = (params.get('code') || '').toUpperCase();

  const [code, setCode] = useState(codeFromUrl);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');

  useEffect(() => {
    const sess = loadSession();
    if (sess?.code === code && sess.playerId) {
      setPlayerId(sess.playerId);
      setName(sess.name || '');
      setEmoji(sess.emoji || '');
    }
  }, [code]);

  const game = usePoll(() => (code && playerId ? api.getGame(code) : Promise.resolve(null)), 1500);

  if (!playerId) {
    return (
      <JoinForm
        code={code}
        setCode={setCode}
        onJoin={(p: string, n: string, e: string) => {
          setPlayerId(p);
          setName(n);
          setEmoji(e);
          saveSession({ code, playerId: p, name: n, emoji: e });
        }}
      />
    );
  }

  if (!game) return <Loading />;

  const me = game.players.find((p: any) => p.id === playerId);

  if (game.phase === 'lobby') return <ProfileForm game={game} playerId={playerId} me={me} />;
  if (game.phase === 'trivia') return <TriviaPlay game={game} playerId={playerId} />;
  if (game.phase === 'final') return <FinalPlay game={game} me={me} code={code} playerId={playerId} />;
  return null;
}

function Loading() {
  return (
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-white pixel text-xl">LOADING...</div>
    </div>
  );
}

function JoinForm({ code, setCode, onJoin }: any) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: Event) => {
    e.preventDefault();
    if (!code || code.length !== 4 || !name.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const result = await api.joinGame(code, name);
      onJoin(result.playerId, result.name, result.emoji);
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <div class="relative min-h-screen overflow-hidden">
      <Clouds />
      <div class="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        <div class="text-6xl float mb-4">🍄</div>
        <h1 class="pixel text-2xl text-white mb-6" style={{ textShadow: '3px 3px 0 #000' }}>
          JOIN GAME
        </h1>
        <form onSubmit={submit} class="card p-6 w-full max-w-sm space-y-4">
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">Game Code</label>
            <input
              class="input-mario text-center pixel text-2xl uppercase tracking-widest"
              placeholder="XXXX"
              maxLength={4}
              value={code}
              onInput={(e: any) => setCode(e.target.value.toUpperCase())}
            />
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">Your Name</label>
            <input
              class="input-mario"
              placeholder="e.g. Manny"
              maxLength={20}
              value={name}
              onInput={(e: any) => setName(e.target.value)}
            />
          </div>
          {err && <p class="text-red-600 text-sm">{err}</p>}
          <button
            type="submit"
            class="btn-mario btn-green w-full"
            disabled={busy || code.length !== 4 || !name.trim()}
          >
            {busy ? '...' : '▶ JOIN'}
          </button>
        </form>
      </div>
    </div>
  );
}

function ProfileForm({ game, playerId, me }: any) {
  const [questions, setQuestions] = useState<ProfileQuestion[] | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.getProfileQuestions().then(setQuestions).catch((e) => setErr(e.message));
  }, []);

  useEffect(() => {
    if (me?.hasProfile) setSubmitted(true);
  }, [me?.hasProfile]);

  const pickOption = (key: string, optionId: string) => {
    const next = { ...answers, [key]: optionId };
    setAnswers(next);
    if (questions && step < questions.length - 1) {
      setStep(step + 1);
    } else if (questions) {
      submit(next);
    }
  };

  const submit = async (final: Record<string, string>) => {
    setBusy(true);
    setErr(null);
    try {
      await api.setProfile(game.code, {
        playerId,
        field: final.field,
        stage: final.stage,
        style: final.style,
        approach: final.approach,
        energizer: final.energizer
      });
      setSubmitted(true);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    return (
      <div class="relative min-h-screen overflow-hidden">
        <Clouds />
        <div class="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
          <div class="card p-6 max-w-sm text-center">
            <div class="text-6xl mb-3 float">{me?.emoji}</div>
            <h2 class="pixel text-lg text-brand-dark mb-2">{me?.name}</h2>
            <p class="pixel text-sm text-green-700 mb-4">✓ READY!</p>
            <p class="text-gray-600">
              Waiting for host to start the game...
            </p>
            <p class="pixel text-xs text-gray-500 mt-4">
              {game.players.length} PLAYER{game.players.length !== 1 ? 'S' : ''} JOINED
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!questions) return <Loading />;

  const q = questions[step];
  const colors = ['btn-mario', 'btn-blue', 'btn-yellow', 'btn-green'];

  return (
    <div class="relative min-h-screen overflow-hidden">
      <Clouds />
      <div class="relative z-10 px-4 py-6 max-w-md mx-auto">
        <div class="text-center mb-3">
          <div class="text-4xl">{me?.emoji}</div>
          <p class="pixel text-xs text-white" style={{ textShadow: '2px 2px 0 #000' }}>
            {me?.name?.toUpperCase()} · STEP {step + 1}/{questions.length}
          </p>
        </div>

        <div class="card p-5 mb-4">
          <p class="text-base font-bold text-brand-dark text-center">{q.prompt}</p>
        </div>

        <div class="grid grid-cols-1 gap-3">
          {q.options.map((opt, idx) => (
            <button
              key={opt.id}
              type="button"
              class={`btn-mario ${colors[idx % colors.length]} text-left flex items-center gap-3`}
              onClick={() => pickOption(q.key, opt.id)}
              disabled={busy}
            >
              <span class="text-3xl">{opt.emoji}</span>
              <span class="text-sm">{opt.label}</span>
            </button>
          ))}
        </div>

        {err && <p class="text-red-200 text-sm mt-3 text-center" style={{ textShadow: '1px 1px 0 #000' }}>{err}</p>}

        {step > 0 && (
          <div class="text-center mt-4">
            <button
              class="text-white pixel text-xs underline opacity-80"
              onClick={() => setStep(step - 1)}
              style={{ textShadow: '1px 1px 0 #000' }}
            >
              ← BACK
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TriviaPlay({ game, playerId }: any) {
  const q = game.currentQuestion;
  const [answered, setAnswered] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setAnswered(null);
  }, [q?.id]);

  const pick = async (optionId: string) => {
    if (answered || busy) return;
    setBusy(true);
    setAnswered(optionId);
    try {
      await api.submitAnswer(game.code, playerId, optionId);
    } catch {
      setAnswered(null);
    } finally {
      setBusy(false);
    }
  };

  if (!q) return <Loading />;

  const seconds = Math.ceil((q.remainingMs || 0) / 1000);

  return (
    <div class="relative min-h-screen overflow-hidden">
      <Clouds />
      <div class="relative z-10 px-4 py-6 max-w-md mx-auto">
        <div class="flex justify-between items-center mb-3 text-white pixel text-xs" style={{ textShadow: '2px 2px 0 #000' }}>
          <span>Q {game.questionIndex + 1}/{game.totalQuestions}</span>
          <span>⏱ {seconds}s</span>
        </div>

        <div class="card p-4 mb-5 text-center">
          <p class="text-base md:text-lg font-bold text-brand-dark">{q.prompt}</p>
        </div>

        {answered ? (
          <div class="card p-6 text-center">
            <div class="text-5xl mb-3 float">⭐</div>
            <p class="pixel text-base text-green-700 mb-2">ANSWER LOCKED IN!</p>
            <p class="text-gray-600">Waiting for others...</p>
            <p class="pixel text-xs text-gray-500 mt-3">
              {q.answeredCount}/{q.totalPlayers} ANSWERED
            </p>
          </div>
        ) : (
          <div class="grid grid-cols-2 gap-3">
            {q.options.map((o: any, idx: number) => {
              const colors = ['btn-mario', 'btn-blue', 'btn-yellow', 'btn-green'];
              return (
                <button
                  key={o.id}
                  type="button"
                  class={`btn-mario ${colors[idx]} py-6`}
                  onClick={() => pick(o.id)}
                >
                  <div class="text-3xl mb-1">{o.emoji}</div>
                  <div class="text-sm">{o.name}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FinalPlay({ game, me, code, playerId }: any) {
  const sorted = [...game.players].sort((a, b) => b.score - a.score);
  const myRank = sorted.findIndex((p: any) => p.id === me?.id) + 1;
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    api.getAlignment(code, playerId).then(setMatches).catch(() => {});
  }, [code, playerId]);

  const labelFor = (k: string) => ({
    field: 'Field',
    stage: 'Career stage',
    style: 'Working style',
    approach: 'Problem approach',
    energizer: 'What energizes us'
  } as any)[k] || k;

  return (
    <div class="relative min-h-screen overflow-hidden">
      <Clouds />
      <div class="relative z-10 px-4 py-6 max-w-md mx-auto space-y-4">
        <div class="text-center">
          <div class="text-6xl float mb-2">{myRank === 1 ? '👑' : '🍄'}</div>
          <h1 class="pixel text-xl text-yellow-300 mb-1" style={{ textShadow: '3px 3px 0 #000' }}>
            COURSE CLEAR!
          </h1>
          <p class="pixel text-sm text-white" style={{ textShadow: '2px 2px 0 #000' }}>
            YOU FINISHED #{myRank}
          </p>
        </div>

        <div class="card p-5 text-center">
          <div class="text-5xl mb-2">{me?.emoji}</div>
          <p class="text-2xl font-bold mb-1">{me?.name}</p>
          <p class="pixel text-2xl coin-glow">🪙 {me?.score}</p>
        </div>

        {matches.length > 0 && (
          <div class="card p-4">
            <h3 class="pixel text-sm text-brand-dark mb-3 text-center">🤝 YOUR PEOPLE</h3>
            <div class="space-y-2">
              {matches.slice(0, 5).map((m, i) => (
                <div key={i} class="border-2 border-blue-300 bg-blue-50 rounded p-2">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-2xl">{m.emoji}</span>
                    <span class="font-bold text-sm flex-1">{m.name}</span>
                    <span class="pixel text-xs text-blue-700">{m.sharedKeys.length} match{m.sharedKeys.length !== 1 ? 'es' : ''}</span>
                  </div>
                  <p class="text-xs text-gray-700 ml-9">
                    Shared: {m.sharedKeys.map(labelFor).join(' · ')}
                  </p>
                </div>
              ))}
            </div>
            <p class="text-center text-xs text-gray-500 italic mt-3">
              Go say hi! 👋
            </p>
          </div>
        )}

        <div class="card p-4">
          <h3 class="pixel text-sm text-brand-dark mb-3 text-center">FINAL STANDINGS</h3>
          <div class="space-y-2">
            {sorted.map((p: any, i: number) => (
              <div
                key={p.id}
                class={`flex items-center gap-2 p-2 rounded ${
                  p.id === me?.id ? 'bg-yellow-100 border-2 border-yellow-500' : ''
                }`}
              >
                <span class="pixel text-xs w-5">#{i + 1}</span>
                <span class="text-2xl">{p.emoji}</span>
                <span class="flex-1 font-bold text-sm">{p.name}</span>
                <span class="pixel text-xs">🪙 {p.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
