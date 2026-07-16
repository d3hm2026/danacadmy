import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageCourse } from "@/lib/permissions";

async function getLessonCourse(lessonId: string) {
  return prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { unit: { include: { course: true } } },
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const session = await auth();
  if (!session || !["instructor","admin","owner"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await params;
  const lesson = await getLessonCourse(lessonId);
  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManageCourse(session.user.role, lesson.unit.course.instructorId, session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await req.json();
  const updated = await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
      ...(data.fileUrl !== undefined && { fileUrl: data.fileUrl }),
      ...(data.textContent !== undefined && { textContent: data.textContent }),
      ...(data.duration !== undefined && { duration: data.duration }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const session = await auth();
  if (!session || !["instructor","admin","owner"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await params;
  const lesson = await getLessonCourse(lessonId);
  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManageCourse(session.user.role, lesson.unit.course.instructorId, session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.lesson.delete({ where: { id: lessonId } });
  return NextResponse.json({ ok: true });
}
