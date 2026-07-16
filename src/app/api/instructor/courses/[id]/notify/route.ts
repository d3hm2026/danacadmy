import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageCourse } from "@/lib/permissions";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["instructor","admin","owner"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManageCourse(session.user.role, course.instructorId, session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, body } = await req.json();
  if (!title || !body) return NextResponse.json({ error: "العنوان والنص مطلوبان" }, { status: 400 });

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: id, status: "approved" },
    select: { userId: true },
  });

  if (enrollments.length === 0) return NextResponse.json({ sent: 0 });

  await prisma.notification.createMany({
    data: enrollments.map((e) => ({ userId: e.userId, title, body, type: "info" })),
  });

  return NextResponse.json({ sent: enrollments.length });
}
