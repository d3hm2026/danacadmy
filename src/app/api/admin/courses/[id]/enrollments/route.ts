import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: id },
    include: { user: { select: { id: true, name: true, phone: true } } },
    orderBy: { enrolledAt: "desc" },
  });

  return NextResponse.json(enrollments);
}
