import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token_id = req.nextUrl.searchParams.get("token_id");
  if (!token_id) return NextResponse.json(null);

  const res = await fetch(
    `https://gamma-api.polymarket.com/markets?clob_token_ids=${encodeURIComponent(token_id)}&limit=1`,
    { next: { revalidate: 300 } },
  );
  if (!res.ok) return NextResponse.json(null);

  const data = await res.json();
  const market = Array.isArray(data) ? data[0] : null;
  if (!market) return NextResponse.json(null);

  return NextResponse.json({
    question: market.question ?? null,
    image: market.image ?? null,
    lastTradePrice: market.lastTradePrice ?? null,
  });
}
