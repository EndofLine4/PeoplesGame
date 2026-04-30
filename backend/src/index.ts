import express from 'express';
import cors from 'cors';
import gameRoutes from './routes/games.js';
import { getLocalIp } from './utils/networkInfo.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json({ limit: '256kb' }));

app.use('/api/games', gameRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.get('/api/server-info', (_req, res) => {
  res.json({ ip: getLocalIp(), port: PORT });
});

app.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIp();
  console.log(`\n🍄  People's Game backend running`);
  console.log(`   Local:    http://localhost:${PORT}`);
  console.log(`   Network:  http://${ip}:${PORT}`);
  console.log(`   Frontend (Vite): http://${ip}:5173\n`);
});
