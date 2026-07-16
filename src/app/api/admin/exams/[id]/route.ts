import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["owner","admin"].includes(session?.user?.role ?? ""))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          questions: {
            orderBy: { order: "asc" },
            include: { choices: true },
          },
        },
      },
      students: { include: { user: true } },
    },
  });

  if (!exam) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(exam);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["owner","admin"].includes(session?.user?.role ?? ""))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const exam = await prisma.exam.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      totalScore: body.totalScore,
      isActive: body.isActive,
    },
  });

  return NextResponse.json(exam);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["owner","admin"].includes(session?.user?.role ?? ""))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.exam.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
