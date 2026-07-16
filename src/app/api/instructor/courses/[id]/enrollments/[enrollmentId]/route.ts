import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageCourse } from "@/lib/permissions";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; enrollmentId: string }> }) {
  const session = await auth();
  if (!session || !["instructor","admin","owner"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, enrollmentId } = await params;
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManageCourse(session.user.role, course.instructorId, session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { status } = await req.json();
  const enrollment = await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { status },
    include: {
      user: { select: { name: true } },
      course: { select: { title: true } },
    },
  });

  if (status === "approved") {
    await prisma.notification.create({
      data: {
        userId: enrollment.userId,
        title: "تم قبول انتسابك",
        body: `تم قبول طلب انتسابك في دورة ${enrollment.course.title}. يمكنك البدء الآن.`,
        type: "success",
      },
    });
  } else if (status === "rejected") {
    await prisma.notification.create({
      data: {
        userId: enrollment.userId,
        title: "بشأن طلب انتسابك",
        body: `نعتذر، تم رفض طلب انتسابك في دورة ${enrollment.course.title}.`,
        type: "warning",
      },
    });
  }

  return NextResponse.json(enrollment);
}
