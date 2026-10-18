import { NextRequest } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:8080";

export async function GET(request: NextRequest) {
  const taste = request.nextUrl.searchParams.get("taste") ?? "";
  const lang = request.nextUrl.searchParams.get("lang") ?? "pl";

  const url = new URL(`${API_URL}/api/v1/recommendations`);
  if (taste) url.searchParams.set("taste", taste);
  url.searchParams.set("lang", lang);
  url.searchParams.set("limit", "12");

  try {
    const response = await fetch(url, { next: { revalidate: 300 } });
    if (!response.ok) return Response.json({ data: null }, { status: response.status });
    return Response.json(await response.json());
  } catch {
    return Response.json({ data: null }, { status: 503 });
  }
}
