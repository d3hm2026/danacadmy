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

  const comments = await prisma.lessonComment.findMany({
    where: { lessonId },
    include: { user: { select: { name: true, phone: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}

export async function POST(req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId } = await params;

  const allowed = await checkEnrollment(session.user.id, lessonId);
  if (!allowed) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const { text } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "النص مطلوب" }, { status: 400 });

  const comment = await prisma.lessonComment.create({
    data: {
      lessonId,
      userId: session.user.id,
      text: text.trim(),
    },
    include: { user: { select: { name: true, phone: true } } },
  });

  return NextResponse.json(comment);
}
