import { Session } from "@/lib/types";

const API_KEY_STORAGE = "pc_api_key";
const SESSIONS_STORAGE = "pc_sessions";
const LAST_SESSION_STORAGE = "pc_last_session_id";

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function loadApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(API_KEY_STORAGE);
}

export function saveApiKey(key: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(API_KEY_STORAGE, key);
}

export function clearApiKey() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(API_KEY_STORAGE);
}

export function loadSessions(): Session[] {
  if (typeof window === "undefined") return [];
  return safeParse<Session[]>(localStorage.getItem(SESSIONS_STORAGE), []);
}

export function saveSessions(sessions: Session[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSIONS_STORAGE, JSON.stringify(sessions));
}

export function upsertSession(session: Session): Session[] {
  const sessions = loadSessions();
  const index = sessions.findIndex((item) => item.id === session.id);
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.unshift(session);
  }
  saveSessions(sessions);
  saveLastSessionId(session.id);
  return sessions;
}

export function loadLastSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_SESSION_STORAGE);
}

export function saveLastSessionId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_SESSION_STORAGE, id);
}

export function loadLastSession(): Session | null {
  const lastId = loadLastSessionId();
  if (!lastId) return null;
  const sessions = loadSessions();
  return sessions.find((session) => session.id === lastId) ?? null;
}

export function clearSessions() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSIONS_STORAGE);
  localStorage.removeItem(LAST_SESSION_STORAGE);
}

export function deleteSession(id: string): Session[] {
  if (typeof window === "undefined") return [];
  const sessions = loadSessions().filter((session) => session.id !== id);
  saveSessions(sessions);
  const lastId = loadLastSessionId();
  if (lastId === id) {
    const next = sessions[0]?.id ?? null;
    if (next) {
      saveLastSessionId(next);
    } else {
      localStorage.removeItem(LAST_SESSION_STORAGE);
    }
  }
  return sessions;
}
