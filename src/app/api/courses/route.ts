import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { units: true, enrollments: true } },
      units: {
        include: { _count: { select: { lessons: true } } },
      },
      enrollments: {
        where: { userId: session.user.id },
        select: { id: true },
      },
      ratings: {
        select: { rating: true },
      },
    },
  });

  const coursesWithRatings = courses.map((c) => {
    const ratings = c.ratings;
    const avgRating = ratings.length > 0
      ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length
      : 0;
    const { ratings: _r, ...rest } = c;
    void _r;
    return { ...rest, avgRating, ratingCount: ratings.length };
  });

  return NextResponse.json(coursesWithRatings);
}
