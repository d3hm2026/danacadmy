import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [course, ratingsAgg, userRating] = await Promise.all([
    prisma.course.findUnique({
      where: { id, isPublished: true },
      include: {
        instructor: { select: { id: true, name: true } },
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
    }),
    prisma.courseRating.aggregate({
      where: { courseId: id },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    prisma.courseRating.findUnique({
      where: { courseId_userId: { courseId: id, userId: session.user.id } },
    }),
  ]);

  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...course,
    avgRating: ratingsAgg._avg.rating ?? 0,
    ratingCount: ratingsAgg._count.rating,
    userRating: userRating?.rating ?? null,
  });
}
