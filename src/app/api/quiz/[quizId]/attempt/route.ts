import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function awardPoints(userId: string, points: number) {
  await prisma.userPoints.upsert({
    where: { userId },
    update: { total: { increment: points } },
    create: { userId, total: points },
  });
}

async function awardBadge(userId: string, type: string, courseId?: string) {
  const existing = await prisma.badge.findFirst({ where: { userId, type, courseId: courseId ?? null } });
  if (!existing) {
    await prisma.badge.create({ data: { userId, type, courseId } });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ quizId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { quizId } = await params;
  const { answers } = await req.json(); // { [questionId]: choiceId }

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { include: { choices: true } } },
  });

  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  let correct = 0;
  const total = quiz.questions.length;

  const results = quiz.questions.map((q) => {
    const selectedChoiceId = answers[q.id];
    const correctChoice = q.choices.find((c) => c.isCorrect);
    const isCorrect = selectedChoiceId === correctChoice?.id;
    if (isCorrect) correct++;
    return { questionId: q.id, selectedChoiceId, correctChoiceId: correctChoice?.id, isCorrect };
  });

  const score = total > 0 ? (correct / total) * 100 : 0;
  const passed = score >= quiz.passingScore;

  const attempt = await prisma.quizAttempt.create({
    data: { userId: session.user.id, quizId, score, passed },
  });

  // Award points and badges
  if (passed) {
    await awardPoints(session.user.id, 25);
    await awardBadge(session.user.id, "quiz_pass");
    if (score === 100) {
      await awardBadge(session.user.id, "perfect_score");
    }
  }

  return NextResponse.json({ attempt, score, passed, results });
}
