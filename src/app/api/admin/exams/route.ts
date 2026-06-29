import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const exams = await prisma.exam.findMany({
    include: {
      sections: { include: { questions: true } },
      students: { include: { user: true } },
      sessions: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(exams);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const exam = await prisma.exam.create({
    data: {
      title: body.title,
      description: body.description,
      totalScore: body.totalScore || 100,
    },
  });

  return NextResponse.json(exam);
}
