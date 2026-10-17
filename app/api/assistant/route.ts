// Same-origin proxy to the Go assistant endpoint. The browser cannot reach the
// API container directly, and the reply is a Server-Sent Events stream that
// must be passed through untouched.
const API_URL = process.env.API_URL ?? "http://localhost:8080";

export async function POST(request: Request) {
  let upstream: Response;

  try {
    upstream = await fetch(`${API_URL}/api/v1/assistant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": request.headers.get("accept-language") ?? "",
      },
      body: await request.text(),
      signal: request.signal,
    });
  } catch {
    return Response.json(
      { error: { code: "unavailable", message: "assistant API unreachable" } },
      { status: 502 },
    );
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
