import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DarkModeToggle } from "@/components/DarkModeToggle";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || !["owner", "admin"].includes(session.user.role)) redirect("/login");

  const pendingCount = await prisma.registrationRequest.count({ where: { status: "pending" } });

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="أكاديمية دان" width={32} height={32} className="rounded" />
              <span className="font-bold text-[#1a2e5a] text-lg">أكاديمية دان</span>
            </div>
            <div className="flex gap-1">
              <Link href="/admin" className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 text-gray-700">
                الرئيسية
              </Link>
              <Link href="/admin/exams" className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 text-gray-700">
                الاختبارات
              </Link>
              <Link href="/admin/students" className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 text-gray-700">
                الطلاب
              </Link>
              <Link href="/admin/courses" className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 text-gray-700">
                الدورات
              </Link>
              <Link href="/admin/registrations" className="relative px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 text-gray-700">
                طلبات التسجيل
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -left-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {pendingCount}
                  </span>
                )}
              </Link>
              <Link href="/admin/instructors" className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 text-gray-700">
                المستخدمون
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 font-medium">{session.user.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                session.user.role === "owner" ? "bg-purple-100 text-purple-700" :
                session.user.role === "admin" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
              }`}>
                {session.user.role === "owner" ? "صاحب المنصة" : "مشرف"}
              </span>
            </div>
            <DarkModeToggle />
            <form action="/api/auth/signout" method="POST">
              <button className="text-sm text-gray-500 hover:text-gray-700">خروج</button>
            </form>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
