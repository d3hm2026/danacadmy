import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  return NextResponse.json({ attempt, score, passed, results });
}
