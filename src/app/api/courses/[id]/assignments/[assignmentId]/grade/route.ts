import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; assignmentId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role;
  if (!["owner", "admin", "instructor"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { assignmentId } = await params;
  const body = await req.json();
  const { submissionId, score, feedback } = body;
  if (!submissionId) return NextResponse.json({ error: "submissionId required" }, { status: 400 });

  const submission = await prisma.assignmentSubmission.update({
    where: { id: submissionId },
    data: {
      score: score ?? null,
      feedback: feedback || null,
      gradedAt: new Date(),
    },
  });
  return NextResponse.json(submission);
}
