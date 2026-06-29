import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: examId } = await params;
  const body = await req.json();
  const { sessionId, sectionId, answers, timeSpent } = body;

  const examSession = await prisma.examSession.findFirst({
    where: { id: sessionId, userId: session.user.id, examId },
  });
  if (!examSession) return NextResponse.json({ error: "Invalid session" }, { status: 403 });

  for (const ans of answers as { questionId: string; choiceId: string | null }[]) {
    let score = 0;
    if (ans.choiceId) {
      const choice = await prisma.choice.findUnique({ where: { id: ans.choiceId } });
      const question = await prisma.question.findUnique({ where: { id: ans.questionId } });
      if (choice && question) {
        score = (choice.percentage / 100) * question.score;
      }
    }

    await prisma.answer.upsert({
      where: { sessionId_questionId: { sessionId, questionId: ans.questionId } },
      update: { choiceId: ans.choiceId, score, sectionId },
      create: { sessionId, questionId: ans.questionId, choiceId: ans.choiceId, sectionId, score },
    });
  }

  await prisma.sectionTime.create({
    data: { sessionId, sectionId, timeSpent },
  });

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { sections: true },
  });

  const nextSection = examSession.currentSection + 1;
  const isLast = nextSection >= (exam?.sections.length || 0);

  if (isLast) {
    const allAnswers = await prisma.answer.findMany({ where: { sessionId } });
    const totalScore = allAnswers.reduce((sum, a) => sum + a.score, 0);

    const maxRaw = await prisma.question.findMany({
      where: { section: { examId } },
      select: { score: true },
    });
    const maxScore = maxRaw.reduce((sum, q) => sum + q.score, 0);
    const finalScore = maxScore > 0 ? (totalScore / maxScore) * (exam?.totalScore || 100) : 0;

    await prisma.examSession.update({
      where: { id: sessionId },
      data: { currentSection: nextSection, finishedAt: new Date(), totalScore: Math.round(finalScore * 100) / 100 },
    });

    return NextResponse.json({ finished: true, sessionId });
  }

  await prisma.examSession.update({
    where: { id: sessionId },
    data: { currentSection: nextSection },
  });

  return NextResponse.json({ finished: false, nextSection });
}
