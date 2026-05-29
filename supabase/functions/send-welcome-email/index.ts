// Supabase Edge Function (Deno). Sends the welcome email via Resend.
// STUB — implement per Master Framework. Triggered after email
// verification (or from the auth callback).
//
// deno-lint-ignore-file
Deno.serve(async (_req: Request) => {
  // TODO: parse payload, call Resend, return 200
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
