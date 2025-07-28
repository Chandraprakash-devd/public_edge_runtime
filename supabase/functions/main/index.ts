// Main entry point for Edge Runtime
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

console.log("Main function starting...")

// Use PORT environment variable if available (Railway sets this), otherwise use 9000
const port = parseInt(Deno.env.get("PORT") || "9000")
// Use HOST environment variable for IPv6 support
const hostname = Deno.env.get("HOST") || "0.0.0.0"

// Dynamic import for edge functions
async function handleHealthCheck(req: Request) {
  const module = await import("../health-check/index.ts")
  return module.default(req)
}


serve(async (req: Request) => {
  const url = new URL(req.url)
  const path = url.pathname

  console.log(`Received request: ${req.method} ${path}`)

  // Route to different functions based on path
  try {
    if (path === "/" || path === "/main") {
      return new Response("Edge Runtime is running!", {
        headers: { "Content-Type": "text/plain" },
      })
    } else if (path === "/health" || path === "/health-check") {
      // Delegate to health check function
      return await handleHealthCheck(req)
    } else if (path.startsWith("/api-handler")) {
      // Here you would normally delegate to the api-handler function
      // For now, return a placeholder response
      return new Response(JSON.stringify({ 
        message: "API Handler endpoint",
        path: path,
        method: req.method
      }), {
        headers: { "Content-Type": "application/json" },
      })
    } else if (path.startsWith("/webhook-processor")) {
      // Here you would normally delegate to the webhook-processor function
      // For now, return a placeholder response
      return new Response(JSON.stringify({ 
        message: "Webhook Processor endpoint",
        path: path,
        method: req.method
      }), {
        headers: { "Content-Type": "application/json" },
      })
    } else {
      return new Response("Not Found", { status: 404 })
    }
  } catch (error) {
    console.error("Error handling request:", error)
    return new Response(JSON.stringify({ error: error.toString() }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}, { port, hostname })

console.log(`Server running on ${hostname}:${port}`)