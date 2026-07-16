import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const role = session.user.role;

  const url = new URL(req.url);
  const year = parseInt(url.searchParams.get("year") ?? String(new Date().getFullYear()));
  const month = parseInt(url.searchParams.get("month") ?? String(new Date().getMonth() + 1));

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  let courseFilter: { courseId: { in: string[] } } | object = {};

  if (!["owner", "admin"].includes(role)) {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId, status: "approved" },
      select: { courseId: true },
    });
    const courseIds = enrollments.map((e) => e.courseId);
    courseFilter = { OR: [{ courseId: null }, { courseId: { in: courseIds } }] };
  }

  const events = await prisma.calendarEvent.findMany({
    where: {
      ...courseFilter,
      startDate: { gte: startDate, lte: endDate },
    },
    include: {
      course: { select: { id: true, title: true } },
      creator: { select: { id: true, name: true } },
    },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json(events);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role;
  if (!["owner", "admin", "instructor"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, eventType, startDate, endDate, color, courseId } = body;
  if (!title || !startDate) {
    return NextResponse.json({ error: "title and startDate required" }, { status: 400 });
  }

  const event = await prisma.calendarEvent.create({
    data: {
      title,
      description: description || null,
      eventType: eventType || "general",
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      color: color || null,
      courseId: courseId || null,
      createdBy: session.user.id,
    },
  });
  return NextResponse.json(event, { status: 201 });
}
