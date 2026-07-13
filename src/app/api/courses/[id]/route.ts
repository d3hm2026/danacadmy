import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id, isPublished: true },
    include: {
      enrollments: { where: { userId: session.user.id } },
      units: {
        orderBy: { order: "asc" },
        include: {
          quiz: { select: { id: true, title: true, passingScore: true } },
          lessons: {
            orderBy: { order: "asc" },
            include: {
              progress: { where: { userId: session.user.id } },
            },
          },
        },
      },
    },
  });

  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(course);
}
