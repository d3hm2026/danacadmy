import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Check enrollment is approved
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: id } },
  });

  if (!enrollment || enrollment.status !== "approved") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  // Get course with all lessons
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      units: {
        include: {
          lessons: {
            include: {
              progress: { where: { userId: session.user.id } },
            },
          },
        },
      },
    },
  });

  if (!course) return NextResponse.json({ error: "الدورة غير موجودة" }, { status: 404 });

  // Check all lessons completed
  let total = 0;
  let done = 0;
  let completedAt: Date | null = null;

  for (const unit of course.units) {
    for (const lesson of unit.lessons) {
      total++;
      if (lesson.progress[0]?.completed) {
        done++;
        const lessonCompletedAt = lesson.progress[0].completedAt;
        if (lessonCompletedAt && (!completedAt || lessonCompletedAt > completedAt)) {
          completedAt = lessonCompletedAt;
        }
      }
    }
  }

  if (total === 0 || done < total) {
    return NextResponse.json({ eligible: false, done, total });
  }

  return NextResponse.json({
    eligible: true,
    studentName: session.user.name || session.user.phone,
    courseTitle: course.title,
    completedAt: completedAt ?? new Date(),
    done,
    total,
  });
}
