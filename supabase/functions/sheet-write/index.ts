// Authenticated write proxy for Google Sheets.
// Service-account JSON stays server-side. Caller's Supabase session validated
// against advisor_allowlist for role-based write scope enforcement.
//
// REQUIRED ENV VARS (set in Supabase dashboard > Edge Functions > Secrets):
//   GOOGLE_SERVICE_ACCOUNT_JSON  — entire service account JSON as a single string
//   SPREADSHEET_ID               — same sheet ID used by sheets-read
//   SUPABASE_URL                 — auto-provided by Supabase
//   SUPABASE_ANON_KEY            — auto-provided by Supabase
//
// Write scopes:
//   admin    -> can write any allowed tab
//   research -> can only write to advisor_questions (answer fields)
//   else     -> 403

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Allowed tab whitelist ────────────────────────────────────────────────────

const ADMIN_TABS = new Set([
  "📡 Measurements",
  "🗓 Master Timeline",
  "📬 Outreach",
  "🏆 Evidence Board",
  "📋 Today Plan",
  "🎯 Roadmap",
  "Tasks",
  "Decision Log",
  "Open Questions",
]);

// ─── JWT signing for Google service account ──────────────────────────────────

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const cleaned = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(cleaned), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    "pkcs8",
    der.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

function b64url(input: ArrayBuffer | string): string {
  const bytes =
    typeof input === "string"
      ? new TextEncoder().encode(input)
      : new Uint8Array(input);
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function getAccessToken(saJson: string): Promise<string> {
  const sa = JSON.parse(saJson);
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(
    JSON.stringify(claims),
  )}`;
  const key = await importPrivateKey(sa.private_key);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput),
  );
  const jwt = `${signingInput}.${b64url(signature)}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(`Token exchange failed: ${tokenRes.status} ${await tokenRes.text()}`);
  }

  const tokenJson = await tokenRes.json();
  return tokenJson.access_token as string;
}

// ─── Sheets API helpers ──────────────────────────────────────────────────────

async function appendRow(
  accessToken: string,
  sheetId: string,
  tab: string,
  values: unknown[],
): Promise<unknown> {
  const range = `'${tab}'!A:Z`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
    range,
  )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [values] }),
  });

  const body = await res.text();
  if (!res.ok) throw new Error(`Sheets append failed: ${res.status} ${body}`);
  return JSON.parse(body);
}

// ─── Main handler ────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SA_JSON = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
    const SHEET_ID = Deno.env.get("SPREADSHEET_ID");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!SA_JSON || !SHEET_ID || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return new Response(
        JSON.stringify({ error: "missing_config" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validate caller's Supabase session
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user?.email) {
      return new Response(JSON.stringify({ error: "invalid_session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine role. For now: anyone on advisor_allowlist is "admin".
    // Tighten by adding a `role` column to advisor_allowlist (admin/research) and reading it here.
    const { data: allow } = await supabase
      .from("advisor_allowlist")
      .select("email")
      .eq("email", user.email)
      .maybeSingle();

    if (!allow) {
      return new Response(JSON.stringify({ error: "not_allowlisted" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const role: "admin" | "research" = "admin"; // TODO: read from allowlist.role column

    // Parse payload
    const payload = await req.json().catch(() => null);
    if (!payload || typeof payload !== "object") {
      return new Response(JSON.stringify({ error: "invalid_payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { tab, values } = payload as { tab?: string; values?: unknown[] };

    if (!tab || !Array.isArray(values)) {
      return new Response(JSON.stringify({ error: "tab_and_values_required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Enforce write scope
    if (role !== "admin" || !ADMIN_TABS.has(tab)) {
      return new Response(JSON.stringify({ error: "tab_not_allowed", tab }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stamp source + ISO timestamp on rows by appending columns
    const stamped = [...values, "Site entry", new Date().toISOString(), user.email];

    const accessToken = await getAccessToken(SA_JSON);
    const result = await appendRow(accessToken, SHEET_ID, tab, stamped);

    return new Response(JSON.stringify({ ok: true, result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
