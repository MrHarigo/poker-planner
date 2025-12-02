import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin";
import { generateGameCode } from "@/lib/utils";

export async function GET() {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const games = await prisma.game.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { responses: true },
        },
      },
    });

    return NextResponse.json({ games });
  } catch (error) {
    console.error("Games error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, rateOptions, daySchedules } = await req.json();

    if (!name || !rateOptions || !daySchedules || daySchedules.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate unique game code
    let gameCode: string;
    let exists = true;

    while (exists) {
      gameCode = generateGameCode();
      const existing = await prisma.game.findUnique({
        where: { gameCode },
      });
      exists = !!existing;
    }

    const game = await prisma.game.create({
      data: {
        gameCode: gameCode!,
        name,
        rateOptions: JSON.stringify(rateOptions),
        daySchedules: JSON.stringify(daySchedules),
      },
    });

    return NextResponse.json({ game });
  } catch (error) {
    console.error("Create game error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

