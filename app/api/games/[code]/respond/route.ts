import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const passcode = req.headers.get("x-passcode");

    if (!passcode) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { nickname, ratePreferences, timeSlots } = await req.json();

    // Verify player
    const player = await prisma.player.findUnique({
      where: { passcode: passcode.toUpperCase() },
    });

    if (!player) {
      return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
    }

    // Get game
    const game = await prisma.game.findUnique({
      where: { gameCode: code.toUpperCase() },
    });

    if (!game || !game.isVisible) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Update player nickname if provided
    if (nickname && nickname !== player.nickname) {
      await prisma.player.update({
        where: { id: player.id },
        data: { nickname },
      });
    }

    // Upsert response
    const response = await prisma.gameResponse.upsert({
      where: {
        gameId_playerId: {
          gameId: game.id,
          playerId: player.id,
        },
      },
      create: {
        gameId: game.id,
        playerId: player.id,
        ratePreferences: JSON.stringify(ratePreferences),
        timeSlots: JSON.stringify(timeSlots),
      },
      update: {
        ratePreferences: JSON.stringify(ratePreferences),
        timeSlots: JSON.stringify(timeSlots),
      },
    });

    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error("Respond error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

