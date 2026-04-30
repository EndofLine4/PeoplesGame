const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  createGame: () => request<{ code: string; hostId: string }>('/api/games', { method: 'POST' }),
  getGame: (code: string) => request<any>(`/api/games/${code}`),
  joinGame: (code: string, name: string) =>
    request<{ playerId: string; name: string; emoji: string }>(`/api/games/${code}/join`, {
      method: 'POST',
      body: JSON.stringify({ name })
    }),
  setProfile: (code: string, payload: { playerId: string; role: string; hobby: string; funFact: string }) =>
    request<{ ok: boolean }>(`/api/games/${code}/profile`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  startGame: (code: string, hostId: string) =>
    request<{ ok: boolean }>(`/api/games/${code}/start`, {
      method: 'POST',
      body: JSON.stringify({ hostId })
    }),
  submitAnswer: (code: string, playerId: string, answerPlayerId: string) =>
    request<{ ok: boolean }>(`/api/games/${code}/answer`, {
      method: 'POST',
      body: JSON.stringify({ playerId, answerPlayerId })
    }),
  nextQuestion: (code: string, hostId: string) =>
    request<{ ok: boolean; phase: string }>(`/api/games/${code}/next`, {
      method: 'POST',
      body: JSON.stringify({ hostId })
    }),
  getResult: (code: string) => request<any>(`/api/games/${code}/result`),
  submitGroupAnswer: (code: string, playerId: string, answer: string) =>
    request<{ ok: boolean }>(`/api/games/${code}/group-answer`, {
      method: 'POST',
      body: JSON.stringify({ playerId, answer })
    }),
  finalize: (code: string, hostId: string) =>
    request<{ ok: boolean }>(`/api/games/${code}/finalize`, {
      method: 'POST',
      body: JSON.stringify({ hostId })
    })
};

export const apiBase = API_BASE;
