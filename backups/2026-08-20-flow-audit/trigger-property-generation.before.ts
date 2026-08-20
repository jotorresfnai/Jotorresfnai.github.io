// BACKUP — 2026-08-20
// Supabase Edge Function: trigger-property-generation
// Version: 2
// verify_jwt: false
// No secrets are stored in this backup.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GITHUB_TOKEN = Deno.env.get("GITHUB_ACTIONS_TOKEN") ?? "";
const GITHUB_OWNER = "jotorresfnai";
const GITHUB_REPO = "jotorresfnai.github.io";
const GITHUB_WORKFLOW = "generate-properties.yml";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  if (!GITHUB_TOKEN) return new Response(JSON.stringify({ ok: false, error: "GITHUB_ACTIONS_TOKEN não configurado" }), { status: 503, headers: { "content-type": "application/json" } });

  const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${GITHUB_WORKFLOW}/dispatches`, {
    method: "POST",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ref: "main" }),
  });

  if (!response.ok) return new Response(JSON.stringify({ ok: false, error: `GitHub dispatch ${response.status}`, detail: await response.text() }), { status: 502, headers: { "content-type": "application/json" } });
  return new Response(JSON.stringify({ ok: true }), { status: 202, headers: { "content-type": "application/json" } });
});
