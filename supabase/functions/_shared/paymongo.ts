// Shared PayMongo helpers: HTTP Basic auth + webhook signature verification.
//
// AMOUNTS: PayMongo works in integer centavos (₱1,250.00 -> 125000). Our DB
// stores pesos. Convert only at this boundary.

const PAYMONGO_BASE = "https://api.paymongo.com/v1";

// HTTP Basic auth header: base64("<secret_key>:") — secret key as username,
// empty password.
export function basicAuthHeader(secretKey: string): string {
  return "Basic " + btoa(`${secretKey}:`);
}

export const toCentavos = (php: number): number => Math.round(php * 100);
export const toPesos = (centavos: number): number => centavos / 100;

// --- Webhook signature verification ------------------------------------------
//
// PayMongo sends:  Paymongo-Signature: t=<unix_ts>,te=<test_sig>,li=<live_sig>
// The signature is HMAC-SHA256(secret, "<t>.<rawBody>"), hex-encoded.
// IMPORTANT: pass the RAW request body text — never a re-serialized JSON object,
// or the bytes (and therefore the hash) won't match.

interface ParsedSig {
  t: string;
  te?: string;
  li?: string;
}

function parseSignatureHeader(header: string | null): ParsedSig | null {
  if (!header) return null;
  const parts: Record<string, string> = {};
  for (const segment of header.split(",")) {
    const [k, v] = segment.split("=");
    if (k && v) parts[k.trim()] = v.trim();
  }
  if (!parts.t) return null;
  return { t: parts.t, te: parts.te, li: parts.li };
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Constant-time string compare (avoids leaking match position via timing).
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export interface VerifyResult {
  ok: boolean;
  reason?: string;
}

// Verifies the signature and rejects stale timestamps (replay guard).
// `toleranceSeconds` is how far the event timestamp may differ from now.
export async function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
  nowSeconds: number,
  toleranceSeconds = 300,
): Promise<VerifyResult> {
  const parsed = parseSignatureHeader(signatureHeader);
  if (!parsed) return { ok: false, reason: "missing_or_malformed_signature" };

  const ts = Number(parsed.t);
  if (!Number.isFinite(ts)) return { ok: false, reason: "bad_timestamp" };
  if (Math.abs(nowSeconds - ts) > toleranceSeconds) {
    return { ok: false, reason: "stale_timestamp" };
  }

  const expected = await hmacHex(secret, `${parsed.t}.${rawBody}`);

  // Test keys sign `te`; live keys sign `li`. Accept whichever is present.
  const candidate = parsed.te ?? parsed.li;
  if (!candidate) return { ok: false, reason: "no_signature_value" };
  if (!timingSafeEqual(expected, candidate)) {
    return { ok: false, reason: "signature_mismatch" };
  }
  return { ok: true };
}

// --- Checkout session creation ----------------------------------------------

export interface CreateSessionArgs {
  secretKey: string;
  amountCentavos: number;
  lineItemName: string;
  description: string;
  bookingRef: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSession {
  id: string; // cs_...
  checkoutUrl: string;
  raw: unknown;
}

export async function createCheckoutSession(
  args: CreateSessionArgs,
): Promise<CheckoutSession> {
  const res = await fetch(`${PAYMONGO_BASE}/checkout_sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: basicAuthHeader(args.secretKey),
    },
    body: JSON.stringify({
      data: {
        attributes: {
          line_items: [
            {
              currency: "PHP",
              amount: args.amountCentavos,
              name: args.lineItemName,
              quantity: 1,
            },
          ],
          payment_method_types: ["gcash", "paymaya", "grab_pay", "card"],
          success_url: args.successUrl,
          cancel_url: args.cancelUrl,
          description: args.description,
          reference_number: args.bookingRef,
          send_email_receipt: true,
        },
      },
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    const detail = JSON.stringify(json?.errors ?? json);
    throw new Error(`PayMongo create session failed (${res.status}): ${detail}`);
  }

  const id = json?.data?.id as string | undefined;
  const checkoutUrl = json?.data?.attributes?.checkout_url as string | undefined;
  if (!id || !checkoutUrl) {
    throw new Error("PayMongo response missing id / checkout_url");
  }
  return { id, checkoutUrl, raw: json };
}
