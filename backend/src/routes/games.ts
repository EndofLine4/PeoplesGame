import { Router } from 'express';
import {
  createGame,
  getGame,
  addPlayer,
  setProfile,
  startGame,
  submitAnswer,
  nextQuestion,
  finalizeGame,
  publicGameState,
  lastQuestionResult,
  alignmentReport,
  generatePlayerId,
  PROFILE_QUESTIONS
} from '../store/gameStore.js';

const router = Router();

router.get('/profile-questions', (_req, res) => {
  res.json(PROFILE_QUESTIONS);
});

router.post('/', (req, res) => {
  const hostId = generatePlayerId();
  const game = createGame(hostId);
  res.json({ code: game.code, hostId });
});

router.get('/:code', (req, res) => {
  const game = getGame(req.params.code);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  res.json(publicGameState(game));
});

router.post('/:code/join', (req, res) => {
  const game = getGame(req.params.code);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  if (game.phase !== 'lobby') return res.status(400).json({ error: 'Game already started' });
  const { name } = req.body || {};
  if (!name || typeof name !== 'string') return res.status(400).json({ error: 'Name required' });
  const player = addPlayer(game, name);
  res.json({ playerId: player.id, name: player.name, emoji: player.emoji });
});

router.post('/:code/profile', (req, res) => {
  const game = getGame(req.params.code);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  const { playerId, field, stage, style, approach, energizer } = req.body || {};
  if (!playerId || !field || !stage || !style || !approach || !energizer) {
    return res.status(400).json({ error: 'All 5 profile answers required' });
  }
  try {
    setProfile(game, playerId, { field, stage, style, approach, energizer });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/:code/start', (req, res) => {
  const game = getGame(req.params.code);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  const { hostId } = req.body || {};
  if (hostId !== game.hostId) return res.status(403).json({ error: 'Not the host' });
  try {
    startGame(game);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/:code/answer', (req, res) => {
  const game = getGame(req.params.code);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  const { playerId, answerPlayerId } = req.body || {};
  if (!playerId || !answerPlayerId) return res.status(400).json({ error: 'Missing fields' });
  try {
    submitAnswer(game, playerId, answerPlayerId);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/:code/next', (req, res) => {
  const game = getGame(req.params.code);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  const { hostId } = req.body || {};
  if (hostId !== game.hostId) return res.status(403).json({ error: 'Not the host' });
  nextQuestion(game);
  res.json({ ok: true, phase: game.phase });
});

router.get('/:code/result', (req, res) => {
  const game = getGame(req.params.code);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  res.json(lastQuestionResult(game));
});

router.get('/:code/alignment/:playerId', (req, res) => {
  const game = getGame(req.params.code);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  res.json(alignmentReport(game, req.params.playerId) || []);
});

router.post('/:code/finalize', (req, res) => {
  const game = getGame(req.params.code);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  const { hostId } = req.body || {};
  if (hostId !== game.hostId) return res.status(403).json({ error: 'Not the host' });
  finalizeGame(game);
  res.json({ ok: true });
});

export default router;
