export type Phase = 'lobby' | 'trivia' | 'final';

export type ProfileKey = 'field' | 'stage' | 'style' | 'approach' | 'energizer';

export interface ProfileOption {
  id: string;
  label: string;
  emoji: string;
}

export interface ProfileQuestion {
  key: ProfileKey;
  prompt: string;
  options: ProfileOption[];
}

export const PROFILE_QUESTIONS: ProfileQuestion[] = [
  {
    key: 'field',
    prompt: 'What field are you in?',
    options: [
      { id: 'tech', label: 'Tech / Engineering', emoji: '💻' },
      { id: 'business', label: 'Business / Consulting', emoji: '💼' },
      { id: 'finance', label: 'Finance', emoji: '💰' },
      { id: 'healthcare', label: 'Healthcare', emoji: '🏥' },
      { id: 'creative', label: 'Creative / Design', emoji: '🎨' },
      { id: 'education', label: 'Education', emoji: '📚' },
      { id: 'marketing', label: 'Marketing / Sales', emoji: '📣' },
      { id: 'science', label: 'Science / Research', emoji: '🔬' }
    ]
  },
  {
    key: 'stage',
    prompt: 'Where are you in your career?',
    options: [
      { id: 'student', label: 'Student / Learning', emoji: '🌱' },
      { id: 'early', label: 'Early Career (0-2 yrs)', emoji: '🚀' },
      { id: 'mid', label: 'Mid-Career (3-7 yrs)', emoji: '📈' },
      { id: 'senior', label: 'Senior (8+ yrs)', emoji: '🏆' },
      { id: 'founder', label: 'Leader / Founder', emoji: '👑' }
    ]
  },
  {
    key: 'style',
    prompt: 'What is your working style?',
    options: [
      { id: 'collaborator', label: 'Collaborator — I thrive in teams', emoji: '🤝' },
      { id: 'strategist', label: 'Strategist — I love planning ahead', emoji: '🧠' },
      { id: 'doer', label: 'Doer — Just ship it', emoji: '⚡' },
      { id: 'specialist', label: 'Specialist — Deep expertise', emoji: '🎯' },
      { id: 'connector', label: 'Connector — I bridge teams', emoji: '🌐' }
    ]
  },
  {
    key: 'approach',
    prompt: 'How do you tackle problems?',
    options: [
      { id: 'data', label: 'Data-driven — Numbers tell the story', emoji: '📊' },
      { id: 'creative', label: 'Creative — Try wild ideas', emoji: '💡' },
      { id: 'iterative', label: 'Iterative — Test, learn, repeat', emoji: '🔄' },
      { id: 'analytical', label: 'Analytical — Break it down', emoji: '🤔' }
    ]
  },
  {
    key: 'energizer',
    prompt: 'What energizes you most at work?',
    options: [
      { id: 'building', label: 'Building things', emoji: '🛠️' },
      { id: 'helping', label: 'Helping people', emoji: '🤝' },
      { id: 'growing', label: 'Growing things', emoji: '📈' },
      { id: 'solving', label: 'Solving puzzles', emoji: '🧩' },
      { id: 'sharing', label: 'Sharing ideas', emoji: '🎤' }
    ]
  }
];

export interface Player {
  id: string;
  name: string;
  emoji: string;
  field?: string;
  stage?: string;
  style?: string;
  approach?: string;
  energizer?: string;
  score: number;
}

export interface TriviaQuestion {
  id: string;
  category: ProfileKey;
  prompt: string;
  correctPlayerId: string;
  options: string[]; // player IDs
  answers: Record<string, { playerId: string; answeredAt: number }>;
}

export interface Game {
  code: string;
  hostId: string;
  phase: Phase;
  players: Record<string, Player>;
  questions: TriviaQuestion[];
  currentQuestionIndex: number;
  questionStartedAt?: number;
  createdAt: number;
}

const games = new Map<string, Game>();

const EMOJIS = ['🍄', '⭐', '🪙', '🌸', '🍃', '👑', '🐢', '🦔', '🐲', '🍌', '🔥', '💎', '🎩', '🥾', '🪶', '🌟', '🌷', '🍀', '🐸', '🦕'];

const QUESTION_DURATION_MS = 20_000;
const MAX_BASE_POINTS = 1000;

export function generateGameCode(): string {
  const letters = 'BCDFGHJKLMNPQRSTVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  if (games.has(code)) return generateGameCode();
  return code;
}

export function generatePlayerId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function pickEmoji(usedEmojis: Set<string>): string {
  const available = EMOJIS.filter((e) => !usedEmojis.has(e));
  if (available.length === 0) return EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  return available[Math.floor(Math.random() * available.length)];
}

export function createGame(hostId: string): Game {
  const game: Game = {
    code: generateGameCode(),
    hostId,
    phase: 'lobby',
    players: {},
    questions: [],
    currentQuestionIndex: -1,
    createdAt: Date.now()
  };
  games.set(game.code, game);
  return game;
}

export function getGame(code: string): Game | undefined {
  return games.get(code.toUpperCase());
}

export function addPlayer(game: Game, name: string): Player {
  const id = generatePlayerId();
  const usedEmojis = new Set(Object.values(game.players).map((p) => p.emoji));
  const player: Player = {
    id,
    name: name.trim().slice(0, 20),
    emoji: pickEmoji(usedEmojis),
    score: 0
  };
  game.players[id] = player;
  return player;
}

export function setProfile(
  game: Game,
  playerId: string,
  data: { field: string; stage: string; style: string; approach: string; energizer: string }
) {
  const player = game.players[playerId];
  if (!player) throw new Error('Player not found');
  player.field = data.field;
  player.stage = data.stage;
  player.style = data.style;
  player.approach = data.approach;
  player.energizer = data.energizer;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function findOption(key: ProfileKey, id: string): ProfileOption | undefined {
  return PROFILE_QUESTIONS.find((q) => q.key === key)?.options.find((o) => o.id === id);
}

function profileLabel(key: ProfileKey, id?: string): string {
  if (!id) return '';
  const opt = findOption(key, id);
  return opt ? `${opt.emoji} ${opt.label}` : id;
}

export function buildTriviaQuestions(game: Game): TriviaQuestion[] {
  const players = Object.values(game.players).filter(
    (p) => p.field && p.stage && p.style && p.approach && p.energizer
  );
  if (players.length < 2) return [];

  // Cycle through all 5 categories so each category appears
  const order: ProfileKey[] = ['field', 'style', 'energizer', 'approach', 'stage'];
  const questions: TriviaQuestion[] = [];
  const usedPlayerIds = new Set<string>();

  for (let i = 0; i < Math.min(5, players.length * 2); i++) {
    const cat = order[i % order.length];
    let candidates = players.filter((p) => !usedPlayerIds.has(p.id));
    if (candidates.length === 0) {
      usedPlayerIds.clear();
      candidates = players;
    }
    const correct = candidates[Math.floor(Math.random() * candidates.length)];
    usedPlayerIds.add(correct.id);

    const distractorPool = players.filter((p) => p.id !== correct.id);
    const distractors = shuffle(distractorPool).slice(0, 3);
    const options = shuffle([correct.id, ...distractors.map((d) => d.id)]);

    const value = profileLabel(cat, (correct as any)[cat]);
    const prompts: Record<ProfileKey, string> = {
      field: `Who works in ${value}?`,
      stage: `Whose career stage is ${value}?`,
      style: `Whose working style is "${value}"?`,
      approach: `Who tackles problems with: ${value}?`,
      energizer: `Who is most energized by: ${value}?`
    };

    questions.push({
      id: `q${i}`,
      category: cat,
      prompt: prompts[cat],
      correctPlayerId: correct.id,
      options,
      answers: {}
    });
  }
  return questions;
}

export function startGame(game: Game) {
  const ready = Object.values(game.players).filter(
    (p) => p.field && p.stage && p.style && p.approach && p.energizer
  );
  if (ready.length < 2) throw new Error('Need at least 2 players with completed profiles');
  game.questions = buildTriviaQuestions(game);
  game.currentQuestionIndex = 0;
  game.phase = 'trivia';
  game.questionStartedAt = Date.now();
}

export function submitAnswer(game: Game, playerId: string, answerPlayerId: string) {
  if (game.phase !== 'trivia') throw new Error('Not in trivia phase');
  const q = game.questions[game.currentQuestionIndex];
  if (!q) throw new Error('No active question');
  if (q.answers[playerId]) return;
  q.answers[playerId] = { playerId: answerPlayerId, answeredAt: Date.now() };

  if (answerPlayerId === q.correctPlayerId) {
    const elapsed = Date.now() - (game.questionStartedAt || Date.now());
    const speedFactor = Math.max(0, 1 - elapsed / QUESTION_DURATION_MS);
    const points = Math.round(MAX_BASE_POINTS * (0.5 + 0.5 * speedFactor));
    game.players[playerId].score += points;
  }
}

export function nextQuestion(game: Game) {
  if (game.phase !== 'trivia') return;
  if (game.currentQuestionIndex < game.questions.length - 1) {
    game.currentQuestionIndex += 1;
    game.questionStartedAt = Date.now();
  } else {
    game.phase = 'final';
  }
}

export function finalizeGame(game: Game) {
  game.phase = 'final';
}

function alignmentMatches(player: Player, others: Player[]) {
  const keys: ProfileKey[] = ['field', 'stage', 'style', 'approach', 'energizer'];
  const matches: Array<{ name: string; emoji: string; sharedKeys: ProfileKey[] }> = [];
  for (const o of others) {
    const shared: ProfileKey[] = [];
    for (const k of keys) {
      if ((player as any)[k] && (player as any)[k] === (o as any)[k]) shared.push(k);
    }
    if (shared.length > 0) {
      matches.push({ name: o.name, emoji: o.emoji, sharedKeys: shared });
    }
  }
  return matches.sort((a, b) => b.sharedKeys.length - a.sharedKeys.length);
}

export function publicGameState(game: Game) {
  const currentQ = game.questions[game.currentQuestionIndex];
  const elapsedMs = game.questionStartedAt ? Date.now() - game.questionStartedAt : 0;
  const remainingMs = Math.max(0, QUESTION_DURATION_MS - elapsedMs);
  const allPlayers = Object.values(game.players);

  return {
    code: game.code,
    phase: game.phase,
    players: allPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      emoji: p.emoji,
      score: p.score,
      hasProfile: !!(p.field && p.stage && p.style && p.approach && p.energizer),
      profile: {
        field: p.field ? findOption('field', p.field) : null,
        stage: p.stage ? findOption('stage', p.stage) : null,
        style: p.style ? findOption('style', p.style) : null,
        approach: p.approach ? findOption('approach', p.approach) : null,
        energizer: p.energizer ? findOption('energizer', p.energizer) : null
      }
    })),
    currentQuestion: currentQ
      ? {
          id: currentQ.id,
          prompt: currentQ.prompt,
          options: currentQ.options.map((pid) => ({
            id: pid,
            name: game.players[pid].name,
            emoji: game.players[pid].emoji
          })),
          answeredCount: Object.keys(currentQ.answers).length,
          totalPlayers: Object.keys(game.players).length,
          remainingMs
        }
      : null,
    questionIndex: game.currentQuestionIndex,
    totalQuestions: game.questions.length
  };
}

export function lastQuestionResult(game: Game) {
  const q = game.questions[game.currentQuestionIndex];
  if (!q) return null;
  return {
    questionId: q.id,
    correctPlayerId: q.correctPlayerId,
    correctName: game.players[q.correctPlayerId].name,
    correctEmoji: game.players[q.correctPlayerId].emoji,
    answers: Object.entries(q.answers).map(([submitterId, a]) => ({
      submitterId,
      submitterName: game.players[submitterId]?.name,
      answerPlayerId: a.playerId,
      correct: a.playerId === q.correctPlayerId
    }))
  };
}

export function alignmentReport(game: Game, playerId: string) {
  const me = game.players[playerId];
  if (!me) return null;
  const others = Object.values(game.players).filter((p) => p.id !== playerId);
  return alignmentMatches(me, others);
}

export const constants = {
  QUESTION_DURATION_MS
};
