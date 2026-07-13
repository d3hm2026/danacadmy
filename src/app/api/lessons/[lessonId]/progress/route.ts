import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkEnrollment(userId: string, lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { unit: { include: { course: true } } },
  });
  if (!lesson) return { allowed: false, courseId: null };
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: lesson.unit.courseId } },
  });
  return { allowed: enrollment?.status === "approved", courseId: lesson.unit.courseId };
}

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

  const { allowed, courseId } = await checkEnrollment(session.user.id, lessonId);
  if (!allowed) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const { watchedSeconds, completed } = await req.json();

  // Check if was already completed before this update
  const existingProgress = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
  });
  const wasAlreadyCompleted = existingProgress?.completed ?? false;

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

  // Award points/badges only when newly completed
  if (completed === true && !wasAlreadyCompleted) {
    await awardPoints(session.user.id, 10);

    // Check first_lesson badge
    const completedCount = await prisma.lessonProgress.count({
      where: { userId: session.user.id, completed: true },
    });
    if (completedCount === 1) {
      await awardBadge(session.user.id, "first_lesson");
    }

    // Check if course is now complete
    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          units: {
            include: {
              lessons: {
                include: { progress: { where: { userId: session.user.id } } },
              },
            },
          },
        },
      });

      if (course) {
        let totalLessons = 0;
        let doneLessons = 0;
        for (const unit of course.units) {
          for (const lesson of unit.lessons) {
            totalLessons++;
            if (lesson.progress[0]?.completed) doneLessons++;
          }
        }

        if (totalLessons > 0 && doneLessons === totalLessons) {
          await awardPoints(session.user.id, 100);
          await awardBadge(session.user.id, "first_course", courseId);
        }
      }
    }
  }

  return NextResponse.json(progress);
}
