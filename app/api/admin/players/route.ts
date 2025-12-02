import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin";
import { generatePasscode } from "@/lib/utils";

export async function GET() {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const players = await prisma.player.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { responses: true },
        },
      },
    });

    return NextResponse.json({ players });
  } catch (error) {
    console.error("Players error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { count = 1, name } = await req.json();
    const numToCreate = Math.min(Math.max(1, count), 20); // Limit 1-20

    const players: { passcode: string; name: string | null }[] = [];

    for (let i = 0; i < numToCreate; i++) {
      let passcode: string;
      let exists = true;

      // Generate unique passcode
      while (exists) {
        passcode = generatePasscode();
        const existing = await prisma.player.findUnique({
          where: { passcode },
        });
        exists = !!existing;
      }

      const player = await prisma.player.create({
        data: { 
          passcode: passcode!,
          name: numToCreate === 1 ? name : null, // Only set name if creating single player
        },
      });

      players.push({ passcode: player.passcode, name: player.name });
    }

    // Keep backward compatibility by also returning passcodes array
    return NextResponse.json({ 
      players,
      passcodes: players.map(p => p.passcode),
    });
  } catch (error) {
    console.error("Create players error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

