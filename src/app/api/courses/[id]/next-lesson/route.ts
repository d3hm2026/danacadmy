import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      units: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: { progress: { where: { userId: session.user.id } } },
          },
        },
      },
    },
  });

  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  for (const unit of course.units) {
    for (const lesson of unit.lessons) {
      const done = lesson.progress[0]?.completed;
      if (!done) return NextResponse.json({ lessonId: lesson.id, unitId: unit.id });
    }
  }

  return NextResponse.json({ lessonId: null });
}
