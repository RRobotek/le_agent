import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ events: [] });

  const upstream = `https://gamma-api.polymarket.com/public-search?q=${encodeURIComponent(q)}&limit_per_type=10&keep_closed_markets=0`;

  const res = await fetch(upstream, { next: { revalidate: 30 } });
  if (!res.ok) return NextResponse.json({ events: [] });

  const data = await res.json();
  return NextResponse.json(data);
}
