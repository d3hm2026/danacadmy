import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["owner","admin"].includes(session.user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      units: {
        include: {
          lessons: { include: { progress: true } },
          quiz: { include: { attempts: true } },
        },
        orderBy: { order: "asc" },
      },
      enrollments: {
        include: { user: { select: { id: true, name: true, phone: true } } },
      },
    },
  });

  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const approvedEnrollments = course.enrollments.filter((e) => e.status === "approved");
  const totalStudents = approvedEnrollments.length;
  const totalLessons = course.units.flatMap((u) => u.lessons).length;

  // Per-student progress
  const studentProgress = approvedEnrollments.map((enrollment) => {
    const userId = enrollment.userId;
    const allLessons = course.units.flatMap((u) => u.lessons);
    const completedLessons = allLessons.filter((l) =>
      l.progress.some((p) => p.userId === userId && p.completed)
    ).length;
    const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    return {
      userId,
      name: enrollment.user.name,
      phone: enrollment.user.phone,
      completedLessons,
      totalLessons,
      progressPct,
    };
  });

  // Completion rate overall
  const avgCompletion = studentProgress.length > 0
    ? Math.round(studentProgress.reduce((s, p) => s + p.progressPct, 0) / studentProgress.length)
    : 0;

  const fullyCompleted = studentProgress.filter((p) => p.progressPct === 100).length;

  // Per-lesson stats
  const lessonStats = course.units.flatMap((unit) =>
    unit.lessons.map((lesson) => ({
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      unitTitle: unit.title,
      type: lesson.type,
      completedCount: lesson.progress.filter((p) => p.completed).length,
      totalStudents,
      completionRate: totalStudents > 0
        ? Math.round((lesson.progress.filter((p) => p.completed).length / totalStudents) * 100)
        : 0,
      avgWatchedSeconds: lesson.progress.length > 0
        ? Math.round(lesson.progress.reduce((s, p) => s + p.watchedSeconds, 0) / lesson.progress.length)
        : 0,
    }))
  );

  // Per-unit quiz stats
  const quizStats = course.units
    .filter((u) => u.quiz)
    .map((unit) => {
      const quiz = unit.quiz!;
      const attempts = quiz.attempts;
      const passedAttempts = attempts.filter((a) => a.passed);
      const uniqueStudentsPassed = new Set(passedAttempts.map((a) => a.userId)).size;
      const avgScore = attempts.length > 0
        ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length)
        : 0;
      return {
        quizId: quiz.id,
        quizTitle: quiz.title,
        unitTitle: unit.title,
        passingScore: quiz.passingScore,
        totalAttempts: attempts.length,
        passRate: totalStudents > 0 ? Math.round((uniqueStudentsPassed / totalStudents) * 100) : 0,
        avgScore,
      };
    });

  return NextResponse.json({
    totalStudents,
    pendingCount: course.enrollments.filter((e) => e.status === "pending").length,
    avgCompletion,
    fullyCompleted,
    totalLessons,
    lessonStats,
    quizStats,
    studentProgress,
  });
}
