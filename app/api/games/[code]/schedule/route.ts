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

    // Get game with responses
    const game = await prisma.game.findUnique({
      where: { gameCode: code.toUpperCase() },
      include: {
        responses: true,
      },
    });

    if (!game || !game.isVisible) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Aggregate time slot availability (anonymous)
    const slotCounts: Record<string, { can: number; maybe: number }> = {};

    for (const response of game.responses) {
      const timeSlots = JSON.parse(response.timeSlots) as Record<string, string>;

      for (const [slot, status] of Object.entries(timeSlots)) {
        if (!slotCounts[slot]) {
          slotCounts[slot] = { can: 0, maybe: 0 };
        }

        if (status === "can") {
          slotCounts[slot].can++;
        } else if (status === "maybe") {
          slotCounts[slot].maybe++;
        }
      }
    }

    // Aggregate rate preferences (anonymous)
    const rateCounts: Record<string, { preferred: number; playable: number }> = {};

    for (const response of game.responses) {
      const ratePrefs = JSON.parse(response.ratePreferences) as Record<string, string>;

      for (const [rate, pref] of Object.entries(ratePrefs)) {
        if (!rateCounts[rate]) {
          rateCounts[rate] = { preferred: 0, playable: 0 };
        }

        if (pref === "preferred") {
          rateCounts[rate].preferred++;
        } else if (pref === "playable") {
          rateCounts[rate].playable++;
        }
      }
    }

    return NextResponse.json({
      game: {
        name: game.name,
        daySchedules: JSON.parse(game.daySchedules),
        rateOptions: JSON.parse(game.rateOptions),
      },
      totalResponses: game.responses.length,
      slotCounts,
      rateCounts,
    });
  } catch (error) {
    console.error("Schedule error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

