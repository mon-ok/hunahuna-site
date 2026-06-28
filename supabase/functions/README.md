# Edge Functions — PayMongo (Phase 2)

Two Deno functions. They use the auto-injected `SUPABASE_URL` +
`SUPABASE_SERVICE_ROLE_KEY` for a service-role client.

| Function | Caller | JWT verification |
|---|---|---|
| `create-checkout-session` | the website (`supabase.functions.invoke`) | **ON** (default) — the anon key passes anon-role verification |
| `paymongo-webhook` | PayMongo servers | **OFF** (`--no-verify-jwt`) — authenticated by HMAC signature instead |

## Secrets

```bash
supabase secrets set PAYMONGO_SECRET_KEY=<your-sk_test_-key>          # both phases: TEST keys only
supabase secrets set PAYMONGO_WEBHOOK_SECRET=<your-whsk_-secret>      # from the webhook you register (step below)
supabase secrets set PUBLIC_SITE_URL= # used for success/cancel redirect URLs
```

`PUBLIC_SITE_URL` must be the deployed site origin (no trailing slash). Locally
you can point it at your dev origin, but the **webhook** can only be tested
against a publicly reachable URL (PayMongo can't call localhost).

## Deploy

```bash
supabase functions deploy create-checkout-session
supabase functions deploy paymongo-webhook --no-verify-jwt   # <-- required
```

## Register the webhook (test mode)

PayMongo dashboard → Developers → Webhooks → add the deployed `paymongo-webhook`
URL, subscribe to `checkout_session.payment.paid` (and `payment.failed`). Copy
the returned `whsk_…` secret into `PAYMONGO_WEBHOOK_SECRET` (above), then
redeploy the webhook if it was already running.

## Notes

- Amounts to PayMongo are integer **centavos**; `booking_payments.amount` is
  **pesos**. Conversion happens only in `_shared/paymongo.ts`.
- The webhook reads the **raw** body before parsing — the signature is computed
  over `"<t>.<rawBody>"`, so re-serializing JSON first would break verification.
- `mark_booking_paid` is idempotent, so duplicate/retried webhook deliveries are
  safe and never double-count `amount_paid`.
