import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session || !["owner", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;
  const { role } = await req.json();

  // Get target user
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Cannot change your own role
  if (target.id === session.user.id) {
    return NextResponse.json({ error: "لا يمكنك تغيير دورك الخاص" }, { status: 400 });
  }

  if (session.user.role === "admin") {
    // Admin cannot change owner or other admins
    if (target.role === "owner" || target.role === "admin") {
      return NextResponse.json({ error: "لا تملك صلاحية تغيير دور هذا المستخدم" }, { status: 403 });
    }
    // Admin can only set instructor or student
    if (!["instructor", "student"].includes(role)) {
      return NextResponse.json({ error: "لا يمكنك تعيين هذا الدور" }, { status: 403 });
    }
  }

  if (session.user.role === "owner") {
    // Owner cannot change another owner's role
    if (target.role === "owner" && target.id !== session.user.id) {
      return NextResponse.json({ error: "لا يمكن تغيير دور صاحب المنصة" }, { status: 403 });
    }
    if (!["owner", "admin", "instructor", "student"].includes(role)) {
      return NextResponse.json({ error: "دور غير صالح" }, { status: 400 });
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, phone: true, role: true },
  });

  return NextResponse.json(updated);
}
