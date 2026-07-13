import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ unitId: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { unitId } = await params;
  const quiz = await prisma.quiz.findUnique({
    where: { unitId },
    include: { questions: { orderBy: { order: "asc" }, include: { choices: true } } },
  });

  return NextResponse.json(quiz);
}

export async function POST(req: Request, { params }: { params: Promise<{ unitId: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { unitId } = await params;
  const { title, passingScore, questions } = await req.json();

  // Delete existing quiz for this unit if exists
  const existing = await prisma.quiz.findUnique({ where: { unitId } });
  if (existing) {
    await prisma.quiz.delete({ where: { unitId } });
  }

  const quiz = await prisma.quiz.create({
    data: {
      unitId,
      title: title ?? "اختبار الوحدة",
      passingScore: passingScore ?? 70,
      questions: {
        create: (questions ?? []).map((q: { text: string; order: number; choices: { text: string; isCorrect: boolean }[] }, i: number) => ({
          text: q.text,
          order: q.order ?? i,
          choices: { create: q.choices ?? [] },
        })),
      },
    },
    include: { questions: { include: { choices: true } } },
  });

  return NextResponse.json(quiz, { status: 201 });
}
