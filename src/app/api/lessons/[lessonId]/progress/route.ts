import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkEnrollment(userId: string, lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { unit: { include: { course: true } } },
  });
  if (!lesson) return false;
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: lesson.unit.courseId } },
  });
  return enrollment?.status === "approved";
}

export async function GET(_req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId } = await params;
  const progress = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
  });
  return NextResponse.json(progress ?? { watchedSeconds: 0, completed: false });
}

export async function POST(req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId } = await params;

  const allowed = await checkEnrollment(session.user.id, lessonId);
  if (!allowed) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const { watchedSeconds, completed } = await req.json();

  const progress = await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
    update: {
      ...(watchedSeconds !== undefined && { watchedSeconds }),
      ...(completed !== undefined && { completed }),
      ...(completed === true && { completedAt: new Date() }),
    },
    create: {
      userId: session.user.id,
      lessonId,
      watchedSeconds: watchedSeconds ?? 0,
      completed: completed ?? false,
      completedAt: completed ? new Date() : null,
    },
  });

  return NextResponse.json(progress);
}
