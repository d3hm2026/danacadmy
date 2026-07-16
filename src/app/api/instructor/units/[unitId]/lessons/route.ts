import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageCourse } from "@/lib/permissions";

export async function POST(req: Request, { params }: { params: Promise<{ unitId: string }> }) {
  const session = await auth();
  if (!session || !["instructor","admin","owner"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { unitId } = await params;
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: { course: true },
  });
  if (!unit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManageCourse(session.user.role, unit.course.instructorId, session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, type } = await req.json();
  const count = await prisma.lesson.count({ where: { unitId } });
  const lesson = await prisma.lesson.create({
    data: { title, type: type ?? "video", order: count + 1, unitId },
  });

  return NextResponse.json(lesson, { status: 201 });
}
