import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ unitId: string }> }) {
  const session = await auth();
  if (!session || !["owner","admin"].includes(session?.user?.role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { unitId } = await params;
  const { title, type } = await req.json();
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const lastLesson = await prisma.lesson.findFirst({
    where: { unitId },
    orderBy: { order: "desc" },
  });

  const lesson = await prisma.lesson.create({
    data: { title, type: type ?? "video", unitId, order: (lastLesson?.order ?? 0) + 1 },
  });

  return NextResponse.json(lesson, { status: 201 });
}
