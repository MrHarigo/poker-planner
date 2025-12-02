import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { gameCode, passcode } = await req.json();

    if (!gameCode || !passcode) {
      return NextResponse.json(
        { error: "Game code and passcode are required" },
        { status: 400 }
      );
    }

    // Find the player by passcode
    const player = await prisma.player.findUnique({
      where: { passcode: passcode.toUpperCase() },
    });

    if (!player) {
      return NextResponse.json(
        { error: "Invalid passcode" },
        { status: 401 }
      );
    }

    // Find the game by code
    const game = await prisma.game.findUnique({
      where: { gameCode: gameCode.toUpperCase() },
    });

    if (!game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    if (!game.isVisible) {
      return NextResponse.json(
        { error: "This game is no longer available" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      playerId: player.id,
      gameCode: game.gameCode,
      gameName: game.name,
    });
  } catch (error) {
    console.error("Join error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

