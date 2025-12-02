import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin";

export async function GET() {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [games, players] = await Promise.all([
      prisma.game.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { responses: true },
          },
        },
      }),
      prisma.player.findMany({
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ games, players });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

