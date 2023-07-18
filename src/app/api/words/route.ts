import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const page = request.nextUrl.searchParams.get("page") ?? 1;
  const size = request.nextUrl.searchParams.get("size") ?? 20;
  const dict = request.nextUrl.searchParams.get("dictId");

  if (!dict) {
    return NextResponse.json({ msg: "dict id is required!" }, { status: 400 });
  } else {
    try {
      const wordIds = await prisma.wordDict.findMany({
        where: { dictId: Number(dict) },
        select: { wordId: true },
        skip: (Number(page) - 1) * Number(size),
        take: Number(size),
      });

      const words = await prisma.word.findMany({
        where: { id: { in: wordIds.map((item) => item.wordId) } },
        select: {
          id: true,
          name: true,
          trans: true,
          ukphone: true,
          usphone: true,
          notation: true,
        },
      });

      return NextResponse.json({ msg: "ok", data: words });
    } catch (e) {
      console.log(e);
      return NextResponse.json({ msg: "error" }, { status: 500 });
    }
  }
}
