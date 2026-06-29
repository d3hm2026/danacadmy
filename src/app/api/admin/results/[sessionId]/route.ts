import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;

  const examSession = await prisma.examSession.findUnique({
    where: { id: sessionId },
    include: {
      user: { select: { name: true, phone: true } },
      exam: { select: { title: true, totalScore: true } },
      answers: {
        include: {
          question: { include: { choices: true } },
          choice: true,
          section: { select: { title: true, order: true } },
        },
      },
      sectionTimes: true,
    },
  });

  if (!examSession) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(examSession);
}
