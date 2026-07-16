import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string; assignmentId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, assignmentId } = await params;
  const userId = session.user.id;

  // Check enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: id } },
  });
  if (!enrollment || enrollment.status !== "approved") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { fileUrl, fileName, comment } = body;

  const submission = await prisma.assignmentSubmission.upsert({
    where: { assignmentId_userId: { assignmentId, userId } },
    create: {
      assignmentId,
      userId,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      comment: comment || null,
    },
    update: {
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      comment: comment || null,
      submittedAt: new Date(),
      score: null,
      feedback: null,
      gradedAt: null,
    },
  });
  return NextResponse.json(submission, { status: 201 });
}
