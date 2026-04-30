const KEY = 'peoplesgame.session';

export interface Session {
  code: string;
  playerId?: string;
  hostId?: string;
  name?: string;
  emoji?: string;
}

export function saveSession(s: Session) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

export function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}
