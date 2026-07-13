import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Must be approved enrolled student
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: id } },
  });
  if (!enrollment || enrollment.status !== "approved") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { rating, review } = await req.json();
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "التقييم يجب أن يكون بين 1 و 5" }, { status: 400 });
  }

  const courseRating = await prisma.courseRating.upsert({
    where: { courseId_userId: { courseId: id, userId: session.user.id } },
    update: { rating, review: review ?? null },
    create: { courseId: id, userId: session.user.id, rating, review: review ?? null },
  });

  return NextResponse.json(courseRating);
}
