// Magic-link auth against Supabase GoTrue, plain fetch, no SDK.
// The access token lives in localStorage and is sent only to this project's REST
// endpoint. Profile rows are RLS-locked to the owner, so a token is the only way
// to read or write a bankroll, and no other user can see it.

const PROJECT = "https://rvrlgldszskywgoptnjq.supabase.co";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2cmxnbGRzenNreXdnb3B0bmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMjQ4ODUsImV4cCI6MjEwMTYwMDg4NX0.D4zOJ9QphnJWpUAc_xhi3igE7ZAIKEnj_8qSdPD6HtM";

const KEY = "tailscore.session";

export interface Session {
  accessToken: string;
  userId: string;
  email: string | null;
  expiresAt: number; // epoch seconds
}

interface JwtClaims {
  sub?: string;
  email?: string;
  exp?: number;
}

function decodeClaims(token: string): JwtClaims | null {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}

function store(session: Session | null) {
  try {
    if (session) localStorage.setItem(KEY, JSON.stringify(session));
    else localStorage.removeItem(KEY);
  } catch {
    // private browsing or storage disabled: the session simply stays in memory
  }
}

function fromToken(token: string): Session | null {
  const claims = decodeClaims(token);
  if (!claims?.sub) return null;
  return {
    accessToken: token,
    userId: claims.sub,
    email: claims.email ?? null,
    expiresAt: claims.exp ?? 0,
  };
}

/** Reads the session left in the URL hash after a magic-link click, once. */
export function consumeHashSession(): Session | null {
  if (typeof window === "undefined" || !window.location.hash) return null;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const token = params.get("access_token");
  if (!token) return null;
  const session = fromToken(token);
  if (session) store(session);
  // clear the token out of the address bar so it is not shared or bookmarked
  history.replaceState(null, "", window.location.pathname + window.location.search);
  return session;
}

export function getSession(): Session | null {
  const hashed = consumeHashSession();
  if (hashed) return hashed;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    // expired tokens are dropped: the user signs in again with a fresh link
    if (session.expiresAt && session.expiresAt * 1000 < Date.now()) {
      store(null);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function signOut() {
  store(null);
}

/** Sends a magic link. Resolves to an error string, or null on success. */
export async function signIn(email: string): Promise<string | null> {
  const redirect = typeof window !== "undefined"
    ? window.location.origin + window.location.pathname
    : undefined;
  try {
    const res = await fetch(`${PROJECT}/auth/v1/otp`, {
      method: "POST",
      headers: { apikey: ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ email, create_user: true, options: { email_redirect_to: redirect } }),
    });
    if (res.ok) return null;
    const body = (await res.json().catch(() => ({}))) as { msg?: string; error_description?: string };
    return body.msg || body.error_description || `sign in failed (${res.status})`;
  } catch {
    return "network error, try again";
  }
}

export interface Profile {
  books: string[];
  bankroll: number | null;
}

async function authedFetch(session: Session, path: string, init: RequestInit = {}) {
  return fetch(`${PROJECT}/rest/v1${path}`, {
    ...init,
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

export async function loadProfile(session: Session): Promise<Profile | null> {
  try {
    const res = await authedFetch(session, `/user_profiles?select=books,bankroll&id=eq.${session.userId}`);
    if (!res.ok) return null;
    const rows = (await res.json()) as Profile[];
    return rows[0] ?? { books: [], bankroll: null };
  } catch {
    return null;
  }
}

export async function saveProfile(session: Session, profile: Profile): Promise<boolean> {
  try {
    const res = await authedFetch(session, "/user_profiles", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({
        id: session.userId,
        books: profile.books,
        bankroll: profile.bankroll,
        updated_at: new Date().toISOString(),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
