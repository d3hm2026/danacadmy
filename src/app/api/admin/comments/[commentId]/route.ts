import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: Promise<{ commentId: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { commentId } = await params;

  await prisma.lessonComment.delete({ where: { id: commentId } });

  return NextResponse.json({ success: true });
}
