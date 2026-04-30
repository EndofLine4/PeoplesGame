export type Phase = 'lobby' | 'profiles' | 'trivia' | 'group' | 'final';

export interface Player {
  id: string;
  name: string;
  emoji: string;
  role?: string;
  hobby?: string;
  funFact?: string;
  score: number;
  groupId?: string;
}

export interface TriviaQuestion {
  id: string;
  category: 'role' | 'hobby' | 'funFact';
  prompt: string;
  correctPlayerId: string;
  options: string[]; // player IDs (4 of them)
  answers: Record<string, { playerId: string; answeredAt: number }>; // submitterId -> answer
}

export interface GroupChallenge {
  id: string;
  prompt: string;
  groups: Record<string, { memberIds: string[]; answer?: string; submittedAt?: number }>;
}

export interface Game {
  code: string;
  hostId: string;
  phase: Phase;
  players: Record<string, Player>;
  questions: TriviaQuestion[];
  currentQuestionIndex: number;
  questionStartedAt?: number;
  groupChallenge?: GroupChallenge;
  createdAt: number;
}

const games = new Map<string, Game>();

// Mario 3 themed avatars (mushroom, star, coin, fire flower, leaf, Tanooki, etc.)
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
  data: { role: string; hobby: string; funFact: string }
) {
  const player = game.players[playerId];
  if (!player) throw new Error('Player not found');
  player.role = data.role.trim().slice(0, 60);
  player.hobby = data.hobby.trim().slice(0, 60);
  player.funFact = data.funFact.trim().slice(0, 100);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildTriviaQuestions(game: Game): TriviaQuestion[] {
  const players = Object.values(game.players).filter(
    (p) => p.role && p.hobby && p.funFact
  );
  if (players.length < 2) return [];

  const categories: Array<'role' | 'hobby' | 'funFact'> = ['hobby', 'funFact', 'role', 'hobby', 'funFact'];
  const questions: TriviaQuestion[] = [];
  const usedPlayerIds = new Set<string>();

  for (let i = 0; i < Math.min(5, players.length * 2); i++) {
    const cat = categories[i % categories.length];
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

    const prompts = {
      hobby: `Whose hobby is "${correct.hobby}"?`,
      funFact: `Who shared this fun fact: "${correct.funFact}"?`,
      role: `Who works as a "${correct.role}"?`
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
  const ready = Object.values(game.players).filter((p) => p.role && p.hobby && p.funFact);
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
  if (q.answers[playerId]) return; // already answered, ignore
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
    startGroupChallenge(game);
  }
}

const GROUP_PROMPTS = [
  "BOWSER has stolen all your group's hobbies! Combine everyone's hobby into ONE Mario-style power-up. Name it and describe what it does.",
  "Your group must design a new World for Mario 3, themed after every team member's job/role. Name the World and describe one level.",
  "Pick ONE fun fact from each person in your group and weave them into a 3-sentence Mario adventure story.",
  "Your group has been turned into Koopalings. Each person picks a magic-wand power based on their hobby. Present them!",
  "Princess Peach is throwing a party. Plan the menu and entertainment using everyone's interests. Pitch the party in 30 seconds."
];

export function startGroupChallenge(game: Game) {
  const playerIds = Object.values(game.players)
    .filter((p) => p.role && p.hobby)
    .map((p) => p.id);
  const shuffled = shuffle(playerIds);
  const numGroups = Math.max(2, Math.min(3, Math.ceil(shuffled.length / 3)));
  const groups: Record<string, { memberIds: string[]; answer?: string }> = {};
  const groupNames = ['World 1: Grass Land', 'World 2: Desert Land', 'World 3: Water Land'];
  for (let i = 0; i < numGroups; i++) {
    groups[groupNames[i]] = { memberIds: [] };
  }
  shuffled.forEach((pid, idx) => {
    const groupName = groupNames[idx % numGroups];
    groups[groupName].memberIds.push(pid);
    game.players[pid].groupId = groupName;
  });

  const prompt = GROUP_PROMPTS[Math.floor(Math.random() * GROUP_PROMPTS.length)];
  game.groupChallenge = {
    id: 'g1',
    prompt,
    groups
  };
  game.phase = 'group';
}

export function submitGroupAnswer(game: Game, playerId: string, answer: string) {
  if (!game.groupChallenge) throw new Error('No group challenge');
  const player = game.players[playerId];
  if (!player?.groupId) throw new Error('No group assigned');
  const group = game.groupChallenge.groups[player.groupId];
  if (!group) throw new Error('Group not found');
  group.answer = answer.trim().slice(0, 500);
  group.submittedAt = Date.now();
  // bonus points for the whole group
  const BONUS = 500;
  group.memberIds.forEach((mid) => {
    game.players[mid].score += BONUS;
  });
}

export function finalizeGame(game: Game) {
  game.phase = 'final';
}

export function publicGameState(game: Game) {
  const currentQ = game.questions[game.currentQuestionIndex];
  const elapsedMs = game.questionStartedAt ? Date.now() - game.questionStartedAt : 0;
  const remainingMs = Math.max(0, QUESTION_DURATION_MS - elapsedMs);
  return {
    code: game.code,
    phase: game.phase,
    players: Object.values(game.players).map((p) => ({
      id: p.id,
      name: p.name,
      emoji: p.emoji,
      score: p.score,
      hasProfile: !!(p.role && p.hobby && p.funFact),
      groupId: p.groupId
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
    totalQuestions: game.questions.length,
    groupChallenge: game.groupChallenge
      ? {
          prompt: game.groupChallenge.prompt,
          groups: Object.entries(game.groupChallenge.groups).map(([name, g]) => ({
            name,
            members: g.memberIds.map((mid) => ({
              name: game.players[mid].name,
              emoji: game.players[mid].emoji
            })),
            submitted: !!g.answer,
            answer: g.answer
          }))
        }
      : null
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

export const constants = {
  QUESTION_DURATION_MS
};
