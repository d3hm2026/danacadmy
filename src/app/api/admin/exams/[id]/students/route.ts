import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: examId } = await params;
  const body = await req.json();

  const user = await prisma.user.findUnique({ where: { phone: body.phone } });
  if (!user) return NextResponse.json({ error: "الطالب غير موجود" }, { status: 404 });

  const existing = await prisma.examStudent.findUnique({
    where: { examId_userId: { examId, userId: user.id } },
  });
  if (existing) return NextResponse.json({ error: "الطالب مضاف مسبقاً" }, { status: 409 });

  const es = await prisma.examStudent.create({
    data: { examId, userId: user.id },
    include: { user: true },
  });

  return NextResponse.json(es);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: examId } = await params;
  const { userId } = await req.json();

  await prisma.examStudent.deleteMany({ where: { examId, userId } });
  return NextResponse.json({ ok: true });
}
