import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: examId } = await params;
  const body = await req.json();

  const count = await prisma.section.count({ where: { examId } });

  const section = await prisma.section.create({
    data: {
      title: body.title,
      timeLimit: body.timeLimit,
      order: count + 1,
      examId,
    },
  });

  return NextResponse.json(section);
}
