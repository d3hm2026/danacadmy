import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session || !["owner","admin"].includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const students = await prisma.user.findMany({
    where: { role: "student" },
    orderBy: { createdAt: "desc" },
    select: { id: true, phone: true, name: true, createdAt: true, exams: { select: { examId: true } } },
  });

  return NextResponse.json(students);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["owner","admin"].includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const hashed = await bcrypt.hash(body.password, 10);

  const user = await prisma.user.create({
    data: {
      phone: body.phone,
      name: body.name,
      password: hashed,
      role: "student",
    },
  });

  return NextResponse.json({ id: user.id, phone: user.phone, name: user.name });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || !["owner","admin"].includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

