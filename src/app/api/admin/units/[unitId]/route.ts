import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ unitId: string }> }) {
  const session = await auth();
  if (!session || !["owner","admin"].includes(session?.user?.role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { unitId } = await params;
  const data = await req.json();

  const unit = await prisma.unit.update({
    where: { id: unitId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.order !== undefined && { order: data.order }),
    },
  });

  return NextResponse.json(unit);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ unitId: string }> }) {
  const session = await auth();
  if (!session || !["owner","admin"].includes(session?.user?.role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { unitId } = await params;
  await prisma.unit.delete({ where: { id: unitId } });
  return NextResponse.json({ ok: true });
}
