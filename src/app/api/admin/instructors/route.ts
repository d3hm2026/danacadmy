import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || !["owner","admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const instructors = await prisma.user.findMany({
    where: { role: "instructor" },
    select: { id: true, name: true, phone: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(instructors);
}
