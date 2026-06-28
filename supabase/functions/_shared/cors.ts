// Shared CORS headers for browser-invoked Edge Functions.
//
// `create-checkout-session` is called from the website via
// `supabase.functions.invoke`, so the browser sends a CORS preflight (OPTIONS)
// first. Return these headers on every response (including the preflight) or the
// real request never fires.
//
// The webhook is server-to-server (PayMongo) and does NOT need CORS — only the
// browser-facing function imports this.

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Convenience JSON responder that always includes the CORS headers.
export function jsonResponse(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });
}
