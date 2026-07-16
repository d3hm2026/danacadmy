import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string; assignmentId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { assignmentId } = await params;
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      submissions: {
        include: {
          user: { select: { id: true, name: true, phone: true } },
        },
      },
    },
  });
  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(assignment);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; assignmentId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role;
  if (!["owner", "admin", "instructor"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { assignmentId } = await params;
  const body = await req.json();
  const assignment = await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
      ...(body.maxScore !== undefined && { maxScore: body.maxScore }),
    },
  });
  return NextResponse.json(assignment);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; assignmentId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role;
  if (!["owner", "admin", "instructor"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { assignmentId } = await params;
  await prisma.assignment.delete({ where: { id: assignmentId } });
  return NextResponse.json({ success: true });
}
