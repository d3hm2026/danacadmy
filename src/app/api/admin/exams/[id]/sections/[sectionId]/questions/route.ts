import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sectionId } = await params;
  const body = await req.json();

  const count = await prisma.question.count({ where: { sectionId } });

  const question = await prisma.question.create({
    data: {
      text: body.text,
      score: body.score || 1,
      order: count + 1,
      sectionId,
      choices: {
        create: body.choices.map((c: { text: string; percentage: number }) => ({
          text: c.text,
          percentage: c.percentage,
        })),
      },
    },
    include: { choices: true },
  });

  return NextResponse.json(question);
}
