import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["owner","admin"].includes(session?.user?.role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: courseId } = await params;
  const { title } = await req.json();
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const lastUnit = await prisma.unit.findFirst({
    where: { courseId },
    orderBy: { order: "desc" },
  });

  const unit = await prisma.unit.create({
    data: { title, courseId, order: (lastUnit?.order ?? 0) + 1 },
  });

  return NextResponse.json(unit, { status: 201 });
}
