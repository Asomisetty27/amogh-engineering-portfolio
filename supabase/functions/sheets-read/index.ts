// Read-only proxy for Google Sheets.
// - Tab allowlist enforced server-side (no arbitrary range enumeration).
// - Sensitive tabs require a valid Supabase session.
// - API key and service identity never leave the server.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const API_KEY = Deno.env.get("GOOGLE_SHEETS_API_KEY") ?? "";
const SHEET_ID = Deno.env.get("SPREADSHEET_ID") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

// Tabs safe to expose to anyone (research telemetry + public timeline/wiki).
const PUBLIC_TABS = new Set<string>([
  "📡 Measurements",
  "📡 Measurements_Raw",
  "📊 Experiment_Summary",
  "🧠 Findings",
  "🗓 Master Timeline",
  "Wiki Summary",
]);

// Tabs that contain internal/PII data; require an authenticated session.
const PROTECTED_TABS = new Set<string>([
  "📬 Outreach",
  "📋 Today Plan",
  "🏆 Evidence Board",
  "Command Center",
]);

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Extract the tab name from an A1-notation range like `'📬 Outreach'!A4:I200`
function extractTab(range: string): string | null {
  const m = range.match(/^'([^']+)'!/) || range.match(/^([^!]+)!/);
  return m ? m[1] : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!API_KEY || !SHEET_ID) {
      return jsonResponse({ error: "missing_config", demo: true }, 200);
    }

    const url = new URL(req.url);
    const range = url.searchParams.get("range");
    if (!range) return jsonResponse({ error: "range_required" }, 400);

    const tab = extractTab(range);
    if (!tab) return jsonResponse({ error: "invalid_range" }, 400);

    const isPublic = PUBLIC_TABS.has(tab);
    const isProtected = PROTECTED_TABS.has(tab);
    if (!isPublic && !isProtected) {
      return jsonResponse({ error: "tab_not_allowed" }, 403);
    }

    if (isProtected) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ") || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return jsonResponse({ error: "unauthorized" }, 401);
      }
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const token = authHeader.replace("Bearer ", "");
      const { data, error } = await supabase.auth.getClaims(token);
      if (error || !data?.claims) {
        return jsonResponse({ error: "unauthorized" }, 401);
      }
    }

    const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
    const res = await fetch(apiUrl);
    if (!res.ok) {
      console.error("Sheets API error:", res.status, await res.text());
      return jsonResponse({ error: "upstream_error" }, 502);
    }
    const body = await res.text();
    return new Response(body, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sheets-read unhandled error:", e);
    return jsonResponse({ error: "internal_error" }, 500);
  }
});
