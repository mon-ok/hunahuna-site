// =============================================================================
// create-checkout-session  — browser-invoked, deploy WITH default JWT verify
// =============================================================================
// Called by the website (supabase.functions.invoke) when a guest clicks "Pay
// deposit". Creates a PayMongo checkout session for 50% of the server-computed
// total and returns its checkout_url for a browser redirect.
//
// SECURITY:
//   * Deploy with default JWT verification ON — the website sends the anon key,
//     which passes anon-role verification; unauthenticated callers are rejected.
//   * The amount is computed HERE from bookings.total_amount. The client never
//     sends an amount.
//   * The secret key lives only in Edge Function secrets, never in the bundle.
//
// Env / secrets:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (auto-injected)
//   PAYMONGO_SECRET_KEY                       (sk_test_… / sk_live_…)
//   PUBLIC_SITE_URL                           (e.g. https://hunahuna.example)
// =============================================================================

import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { createCheckoutSession, toCentavos } from "../_shared/paymongo.ts";

const DEPOSIT_FRACTION = 0.5; // 50% deposit (locked business rule)

Deno.serve(async (req) => {
  // CORS preflight.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  // ---- env --------------------------------------------------------------
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const paymongoKey = Deno.env.get("PAYMONGO_SECRET_KEY");
  const siteUrl = Deno.env.get("PUBLIC_SITE_URL");
  if (!supabaseUrl || !serviceKey || !paymongoKey || !siteUrl) {
    console.error("Missing required env var(s)");
    return jsonResponse({ error: "server_misconfigured" }, 500);
  }

  // ---- input ------------------------------------------------------------
  let bookingRef: string | undefined;
  let email: string | undefined;
  try {
    const body = await req.json();
    bookingRef = typeof body?.booking_ref === "string"
      ? body.booking_ref.trim()
      : undefined;
    email = typeof body?.email === "string" ? body.email.trim() : undefined;
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }
  if (!bookingRef || !email) {
    return jsonResponse({ error: "booking_ref_and_email_required" }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ---- fetch + validate the booking ------------------------------------
  // Service role bypasses RLS. We must still verify the email matches so a
  // stranger can't open a checkout against someone else's booking_ref.
  const { data: booking, error: fetchErr } = await supabase
    .from("bookings")
    .select(
      "id, booking_ref, status, total_amount, hold_expires_at, room_id, guest:guests(email), room:rooms(room_type)",
    )
    .eq("booking_ref", bookingRef)
    .maybeSingle();

  if (fetchErr) {
    console.error("booking fetch failed", fetchErr);
    return jsonResponse({ error: "lookup_failed" }, 500);
  }
  if (!booking) {
    return jsonResponse({ error: "booking_not_found" }, 404);
  }

  const guestEmail = (booking.guest as { email?: string } | null)?.email ?? "";
  if (guestEmail.toLowerCase() !== email.toLowerCase()) {
    // Same generic 404 as "not found" — don't reveal that the ref exists.
    return jsonResponse({ error: "booking_not_found" }, 404);
  }
  if (booking.status !== "pending") {
    return jsonResponse(
      { error: "not_payable", status: booking.status },
      409,
    );
  }
  const holdExpiry = booking.hold_expires_at
    ? new Date(booking.hold_expires_at as string).getTime()
    : 0;
  if (!holdExpiry || holdExpiry <= Date.now()) {
    return jsonResponse({ error: "hold_expired" }, 410);
  }

  const total = Number(booking.total_amount);
  if (!Number.isFinite(total) || total <= 0) {
    console.error("booking has no usable total_amount", booking.total_amount);
    return jsonResponse({ error: "invalid_total" }, 500);
  }

  // ---- amount (server-computed deposit) --------------------------------
  const depositPhp = total * DEPOSIT_FRACTION;
  const depositCentavos = toCentavos(depositPhp);
  const roomType =
    (booking.room as { room_type?: string } | null)?.room_type ?? "Room";

  // ---- create the PayMongo session -------------------------------------
  const successUrl =
    `${siteUrl}/booking/confirmed?ref=${encodeURIComponent(bookingRef)}&status=success`;
  const cancelUrl =
    `${siteUrl}/booking/confirmed?ref=${encodeURIComponent(bookingRef)}&status=cancel`;

  let session;
  try {
    session = await createCheckoutSession({
      secretKey: paymongoKey,
      amountCentavos: depositCentavos,
      lineItemName: `Deposit — ${roomType} (${bookingRef})`,
      description: `50% deposit for booking ${bookingRef}`,
      bookingRef,
      successUrl,
      cancelUrl,
    });
  } catch (err) {
    console.error("PayMongo session creation failed", err);
    return jsonResponse({ error: "payment_provider_error" }, 502);
  }

  // ---- record the pending payment row ----------------------------------
  // One row per checkout session. The webhook flips the actually-paid one to
  // 'paid'; abandoned sessions just stay 'pending'. amount is stored in PESOS.
  const { error: insertErr } = await supabase.from("booking_payments").insert({
    booking_id: booking.id,
    booking_ref: bookingRef,
    provider: "paymongo",
    checkout_session_id: session.id,
    amount: depositPhp,
    currency: "PHP",
    status: "pending",
    raw: session.raw,
  });
  if (insertErr) {
    // Non-fatal for the guest's payment, but log loudly — the audit row is how
    // the admin app correlates the eventual webhook.
    console.error("booking_payments insert failed", insertErr);
  }

  return jsonResponse({ checkout_url: session.checkoutUrl });
});
