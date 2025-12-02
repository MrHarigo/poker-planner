import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        responses: {
          include: {
            player: {
              select: {
                id: true,
                nickname: true,
                passcode: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json({
      game: {
        id: game.id,
        gameCode: game.gameCode,
        name: game.name,
        rateOptions: JSON.parse(game.rateOptions),
        daySchedules: JSON.parse(game.daySchedules),
        isVisible: game.isVisible,
      },
      responses: game.responses,
    });
  } catch (error) {
    console.error("Get game error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const game = await prisma.game.update({
      where: { id },
      data: {
        ...(body.isVisible !== undefined && { isVisible: body.isVisible }),
        ...(body.name && { name: body.name }),
      },
    });

    return NextResponse.json({ game });
  } catch (error) {
    console.error("Update game error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.game.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete game error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

