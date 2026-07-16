import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageCourse } from "@/lib/permissions";

async function getUnitCourse(unitId: string) {
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: { course: true },
  });
  return unit;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ unitId: string }> }) {
  const session = await auth();
  if (!session || !["instructor","admin","owner"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { unitId } = await params;
  const unit = await getUnitCourse(unitId);
  if (!unit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManageCourse(session.user.role, unit.course.instructorId, session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await req.json();
  const updated = await prisma.unit.update({
    where: { id: unitId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.order !== undefined && { order: data.order }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ unitId: string }> }) {
  const session = await auth();
  if (!session || !["instructor","admin","owner"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { unitId } = await params;
  const unit = await getUnitCourse(unitId);
  if (!unit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManageCourse(session.user.role, unit.course.instructorId, session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.unit.delete({ where: { id: unitId } });
  return NextResponse.json({ ok: true });
}
