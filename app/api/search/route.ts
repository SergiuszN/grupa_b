import { NextRequest } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:8080";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const lang = request.nextUrl.searchParams.get("lang") ?? "pl";

  if (query.length < 2) return Response.json({ data: null });

  const url = new URL(`${API_URL}/api/v1/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("lang", lang);
  url.searchParams.set("limit", "6");

  try {
    const response = await fetch(url, { next: { revalidate: 60 } });
    if (!response.ok) return Response.json({ data: null }, { status: response.status });
    return Response.json(await response.json());
  } catch {
    return Response.json({ data: null }, { status: 503 });
  }
}
