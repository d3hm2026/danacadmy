import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const session = await auth();
  if (!session || !["owner","admin"].includes(session?.user?.role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await params;
  const data = await req.json();

  const lesson = await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
      ...(data.fileUrl !== undefined && { fileUrl: data.fileUrl }),
      ...(data.fileTitle !== undefined && { fileTitle: data.fileTitle }),
      ...(data.textContent !== undefined && { textContent: data.textContent }),
      ...(data.duration !== undefined && { duration: data.duration }),
      ...(data.isRequired !== undefined && { isRequired: data.isRequired }),
      ...(data.order !== undefined && { order: data.order }),
    },
  });

  return NextResponse.json(lesson);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const session = await auth();
  if (!session || !["owner","admin"].includes(session?.user?.role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await params;
  await prisma.lesson.delete({ where: { id: lessonId } });
  return NextResponse.json({ ok: true });
}
