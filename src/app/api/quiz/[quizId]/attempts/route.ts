import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ quizId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { quizId } = await params;

  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId, userId: session.user.id },
    orderBy: { completedAt: "desc" },
  });

  return NextResponse.json(attempts);
}
