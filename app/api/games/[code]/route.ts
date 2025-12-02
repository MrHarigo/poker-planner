import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const passcode = req.headers.get("x-passcode");

    if (!passcode) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Get player's existing response
    const response = await prisma.gameResponse.findUnique({
      where: {
        gameId_playerId: {
          gameId: game.id,
          playerId: player.id,
        },
      },
    });

    return NextResponse.json({
      game: {
        id: game.id,
        gameCode: game.gameCode,
        name: game.name,
        rateOptions: JSON.parse(game.rateOptions),
        daySchedules: JSON.parse(game.daySchedules),
      },
      player: {
        id: player.id,
        nickname: player.nickname,
      },
      response: response
        ? {
            ratePreferences: JSON.parse(response.ratePreferences),
            timeSlots: JSON.parse(response.timeSlots),
          }
        : null,
    });
  } catch (error) {
    console.error("Get game error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

