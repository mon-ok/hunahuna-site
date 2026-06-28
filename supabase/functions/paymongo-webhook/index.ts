// =============================================================================
// paymongo-webhook  — server-to-server, deploy WITH `--no-verify-jwt`
// =============================================================================
// PayMongo calls this directly after a payment. It carries no Supabase JWT, so
// JWT verification MUST be off — instead we authenticate via the HMAC signature
// in the `Paymongo-Signature` header (shared secret PAYMONGO_WEBHOOK_SECRET).
//
// The webhook is the ONLY source of truth for "paid". On
// `checkout_session.payment.paid` it calls mark_booking_paid(), which is
// idempotent (PayMongo retries) and re-confirms even a swept-cancelled booking.
//
// Rules:
//   * Read the RAW body first — the signature is over "<t>.<rawBody>". Parsing
//     to JSON before hashing would break the comparison.
//   * Always return 200 once the signature is valid (even for event types we
//     don't handle) so PayMongo stops retrying. Only signature/parse failures
//     return non-200.
//
// Env / secrets:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (auto-injected)
//   PAYMONGO_WEBHOOK_SECRET                   (whsk_…)
// =============================================================================

import { createClient } from "jsr:@supabase/supabase-js@2";
import { verifyWebhookSignature } from "../_shared/paymongo.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("method_not_allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const webhookSecret = Deno.env.get("PAYMONGO_WEBHOOK_SECRET");
  if (!supabaseUrl || !serviceKey || !webhookSecret) {
    console.error("Missing required env var(s)");
    return new Response("server_misconfigured", { status: 500 });
  }

  // ---- 1. RAW body (needed for the signature) ---------------------------
  const rawBody = await req.text();

  // ---- 2. verify signature + replay guard -------------------------------
  const nowSeconds = Math.floor(Date.now() / 1000);
  const verdict = await verifyWebhookSignature(
    rawBody,
    req.headers.get("Paymongo-Signature"),
    webhookSecret,
    nowSeconds,
  );
  if (!verdict.ok) {
    console.warn("webhook signature rejected:", verdict.reason);
    return new Response("invalid_signature", { status: 401 });
  }

  // ---- 3. parse (only after verification) -------------------------------
  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("invalid_json", { status: 400 });
  }

  const type: string | undefined = event?.data?.attributes?.type;
  const resource = event?.data?.attributes?.data; // the checkout_session / payment

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    switch (type) {
      case "checkout_session.payment.paid": {
        const sessionId: string | undefined = resource?.id; // cs_...
        const attrs = resource?.attributes ?? {};
        const bookingRef: string | undefined = attrs?.reference_number;
        const payment = attrs?.payments?.[0];
        const paymentId: string | undefined = payment?.id; // pay_...
        const amountCentavos: number | undefined = payment?.attributes?.amount;

        if (!sessionId || !bookingRef || amountCentavos == null) {
          console.error("paid event missing fields", {
            sessionId,
            bookingRef,
            amountCentavos,
          });
          // Still 200 — retrying won't fix a malformed payload.
          return new Response("ok", { status: 200 });
        }

        const { error } = await supabase.rpc("mark_booking_paid", {
          p_booking_ref: bookingRef,
          p_checkout_session_id: sessionId,
          p_payment_id: paymentId ?? null,
          p_amount: amountCentavos / 100, // centavos -> pesos at the boundary
          p_currency: "PHP",
          p_raw: event,
        });
        if (error) {
          // Let PayMongo retry on a transient DB error.
          console.error("mark_booking_paid failed", error);
          return new Response("rpc_error", { status: 500 });
        }
        console.log(`booking ${bookingRef} marked paid (session ${sessionId})`);
        break;
      }

      case "payment.failed": {
        // No booking change. Best-effort: mark the matching payment row failed.
        const paymentId: string | undefined = resource?.id;
        if (paymentId) {
          await supabase
            .from("booking_payments")
            .update({ status: "failed", raw: event, updated_at: new Date().toISOString() })
            .eq("payment_id", paymentId);
        }
        console.log(`payment.failed received (payment ${paymentId ?? "?"})`);
        break;
      }

      default:
        console.log(`unhandled webhook type: ${type ?? "unknown"}`);
    }
  } catch (err) {
    console.error("webhook handler error", err);
    return new Response("handler_error", { status: 500 });
  }

  // Acknowledge receipt.
  return new Response("ok", { status: 200 });
});
