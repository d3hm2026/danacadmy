import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; enrollmentId: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { enrollmentId } = await params;
  const { status } = await req.json(); // approved | rejected

  const enrollment = await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { status },
    include: {
      user: { select: { name: true, phone: true } },
      course: { select: { title: true } },
    },
  });

  // Send notification to user
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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; enrollmentId: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { enrollmentId } = await params;
  await prisma.enrollment.delete({ where: { id: enrollmentId } });
  return NextResponse.json({ success: true });
}
