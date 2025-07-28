// Webhook Processor function
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

serve(async (req: Request) => {
  return new Response(JSON.stringify({
    message: "Webhook Processor function",
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  }), {
    headers: { "Content-Type": "application/json" },
  })
})