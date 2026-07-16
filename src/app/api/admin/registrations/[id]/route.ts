import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["owner","admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { action } = await req.json(); // "approve" | "reject"

  const request = await prisma.registrationRequest.findUnique({ where: { id } });
  if (!request) {
    return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  }

  if (action === "approve") {
    await prisma.user.create({
      data: {
        phone: request.phone,
        name: request.name,
        password: request.password,
        role: "student",
      },
    });
    await prisma.registrationRequest.update({
      where: { id },
      data: { status: "approved" },
    });
  } else if (action === "reject") {
    await prisma.registrationRequest.update({
      where: { id },
      data: { status: "rejected" },
    });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["owner","admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.registrationRequest.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
