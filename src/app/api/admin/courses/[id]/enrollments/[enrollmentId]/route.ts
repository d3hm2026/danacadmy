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
    include: { user: { select: { name: true, phone: true } } },
  });

  return NextResponse.json(enrollment);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; enrollmentId: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { enrollmentId } = await params;
  await prisma.enrollment.delete({ where: { id: enrollmentId } });
  return NextResponse.json({ success: true });
}
