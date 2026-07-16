import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const userId = session.user.id;
  const role = session.user.role;

  // Check access
  if (!["owner", "admin", "instructor"].includes(role)) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: id } },
    });
    if (!enrollment || enrollment.status !== "approved") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const assignments = await prisma.assignment.findMany({
    where: { courseId: id },
    orderBy: { createdAt: "desc" },
    include: {
      submissions: {
        where: { userId },
        select: { id: true, score: true, feedback: true, submittedAt: true, fileUrl: true, fileName: true, comment: true, gradedAt: true },
      },
    },
  });

  return NextResponse.json(assignments);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role;
  if (!["owner", "admin", "instructor"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const { title, description, dueDate, maxScore } = body;
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const assignment = await prisma.assignment.create({
    data: {
      courseId: id,
      title,
      description: description || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      maxScore: maxScore ?? 100,
    },
  });
  return NextResponse.json(assignment, { status: 201 });
}
