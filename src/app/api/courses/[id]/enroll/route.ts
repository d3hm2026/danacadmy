import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId } = await params;

  const course = await prisma.course.findUnique({ where: { id: courseId, isPublished: true } });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  });

  if (existing) return NextResponse.json(existing);

  const enrollment = await prisma.enrollment.create({
    data: { userId: session.user.id, courseId, status: "pending" },
  });

  return NextResponse.json(enrollment, { status: 201 });
}
