// Live push updates from the pipeline. Supabase Realtime speaks Phoenix channels
// over a plain WebSocket, so this subscribes with no SDK and no new dependencies.
// Polling stays in place as the fallback: if the socket never connects, or the
// browser drops it, the page still refreshes on its interval.

const REF = "rvrlgldszskywgoptnjq";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2cmxnbGRzenNreXdnb3B0bmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMjQ4ODUsImV4cCI6MjEwMTYwMDg4NX0.D4zOJ9QphnJWpUAc_xhi3igE7ZAIKEnj_8qSdPD6HtM";

const TABLES = ["board_live", "capper_board", "site_meta", "portfolio_today"];
const HEARTBEAT_MS = 25_000;
const RECONNECT_MS = 8_000;

export type LiveStatus = "connecting" | "live" | "polling";

/**
 * Calls onChange() whenever the pipeline writes new data, and onStatus() as the
 * connection state moves. Returns an unsubscribe function. Every failure path is
 * silent by design: a dead socket degrades to polling, it never surfaces an error.
 */
export function subscribeLive(
  onChange: () => void,
  onStatus: (s: LiveStatus) => void,
): () => void {
  let socket: WebSocket | null = null;
  let heartbeat: number | undefined;
  let reconnect: number | undefined;
  let refCounter = 0;
  let closed = false;

  const clearTimers = () => {
    if (heartbeat) window.clearInterval(heartbeat);
    if (reconnect) window.clearTimeout(reconnect);
    heartbeat = undefined;
    reconnect = undefined;
  };

  const scheduleReconnect = () => {
    if (closed || reconnect) return;
    onStatus("polling");
    reconnect = window.setTimeout(() => {
      reconnect = undefined;
      connect();
    }, RECONNECT_MS);
  };

  const connect = () => {
    if (closed) return;
    onStatus("connecting");
    let ws: WebSocket;
    try {
      ws = new WebSocket(
        `wss://${REF}.supabase.co/realtime/v1/websocket?apikey=${ANON}&vsn=1.0.0`,
      );
    } catch {
      scheduleReconnect();
      return;
    }
    socket = ws;

    ws.onopen = () => {
      if (closed) return;
      onStatus("live");
      for (const table of TABLES) {
        ws.send(
          JSON.stringify({
            topic: `realtime:public:${table}`,
            event: "phx_join",
            payload: {
              config: {
                postgres_changes: [{ event: "*", schema: "public", table }],
              },
            },
            ref: String(++refCounter),
          }),
        );
      }
      heartbeat = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              topic: "phoenix",
              event: "heartbeat",
              payload: {},
              ref: String(++refCounter),
            }),
          );
        }
      }, HEARTBEAT_MS);
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(String(ev.data));
        if (msg?.event === "postgres_changes") onChange();
      } catch {
        // malformed frame: ignore, the next one will do
      }
    };

    ws.onerror = () => {
      // handled by onclose; swallowed so a flaky socket never logs to the console
    };

    ws.onclose = () => {
      clearTimers();
      socket = null;
      scheduleReconnect();
    };
  };

  connect();

  return () => {
    closed = true;
    clearTimers();
    try {
      socket?.close();
    } catch {
      // already gone
    }
  };
}
