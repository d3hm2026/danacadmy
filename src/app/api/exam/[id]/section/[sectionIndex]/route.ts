import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string; sectionIndex: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: examId, sectionIndex } = await params;
  const idx = parseInt(sectionIndex);

  const allowed = await prisma.examStudent.findFirst({
    where: { examId, userId: session.user.id },
  });
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const section = await prisma.section.findFirst({
    where: { examId, order: idx + 1 },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { choices: { select: { id: true, text: true } } },
      },
    },
  });

  if (!section) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(section);
}
