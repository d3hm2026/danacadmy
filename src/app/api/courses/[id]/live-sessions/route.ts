import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const sessions = await prisma.liveSession.findMany({
    where: { courseId: id },
    orderBy: { scheduledAt: "asc" },
  });
  return NextResponse.json(sessions);
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
  const { title, description, meetingUrl, scheduledAt, duration } = body;
  if (!title || !meetingUrl || !scheduledAt) {
    return NextResponse.json({ error: "title, meetingUrl, scheduledAt required" }, { status: 400 });
  }
  const liveSession = await prisma.liveSession.create({
    data: {
      courseId: id,
      title,
      description: description || null,
      meetingUrl,
      scheduledAt: new Date(scheduledAt),
      duration: duration ?? 60,
    },
  });
  return NextResponse.json(liveSession, { status: 201 });
}
