import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ courses: [], lessons: [] });
  }

  const [courses, lessons] = await Promise.all([
    prisma.course.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, description: true },
      take: 10,
    }),
    prisma.lesson.findMany({
      where: {
        title: { contains: q, mode: "insensitive" },
        unit: { course: { isPublished: true } },
      },
      select: {
        id: true,
        title: true,
        type: true,
        unit: {
          select: {
            courseId: true,
            course: { select: { title: true } },
          },
        },
      },
      take: 15,
    }),
  ]);

  return NextResponse.json({ courses, lessons });
}
