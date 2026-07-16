import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isInstructor(role: string) {
  return ["instructor", "admin", "owner"].includes(role);
}

export async function GET() {
  const session = await auth();
  if (!session || !isInstructor(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const where =
    session.user.role === "instructor"
      ? { instructorId: session.user.id }
      : {};

  const courses = await prisma.course.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { units: true, enrollments: true } },
      units: { include: { _count: { select: { lessons: true } } } },
      instructor: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(courses);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !isInstructor(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description } = await req.json();
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const course = await prisma.course.create({
    data: {
      title,
      description,
      instructorId: session.user.id,
    },
  });

  return NextResponse.json(course, { status: 201 });
}
