import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { phone, name, school, password } = await req.json();

  if (!phone || !name || !school || !password) {
    return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { phone } });
  if (existingUser) {
    return NextResponse.json({ error: "رقم الجوال مسجل مسبقاً" }, { status: 400 });
  }

  const existingRequest = await prisma.registrationRequest.findUnique({ where: { phone } });
  if (existingRequest) {
    return NextResponse.json({ error: "يوجد طلب تسجيل بهذا الرقم بالفعل" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);

  await prisma.registrationRequest.create({
    data: { phone, name, school, password: hashed },
  });

  return NextResponse.json({ success: true });
}
