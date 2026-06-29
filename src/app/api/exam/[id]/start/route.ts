import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: examId } = await params;

  const allowed = await prisma.examStudent.findFirst({
    where: { examId, userId: session.user.id },
  });
  if (!allowed) return NextResponse.json({ error: "غير مصرح لك بهذا الاختبار" }, { status: 403 });

  const existing = await prisma.examSession.findFirst({
    where: { examId, userId: session.user.id, finishedAt: { not: null } },
  });
  if (existing) return NextResponse.json({ error: "أنهيت هذا الاختبار مسبقاً" }, { status: 409 });

  let sess = await prisma.examSession.findFirst({
    where: { examId, userId: session.user.id, finishedAt: null },
  });

  if (!sess) {
    sess = await prisma.examSession.create({
      data: { examId, userId: session.user.id },
    });
  }

  return NextResponse.json({ sessionId: sess.id, currentSection: sess.currentSection });
}
