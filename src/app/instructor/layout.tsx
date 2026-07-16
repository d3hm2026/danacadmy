import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DarkModeToggle } from "@/components/DarkModeToggle";

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) redirect("/login");
  if (session.user.role === "student") redirect("/student");
  if (!["instructor", "admin", "owner"].includes(session.user.role)) redirect("/login");

  const roleLabel: Record<string, string> = {
    owner: "صاحب المنصة",
    admin: "مشرف",
    instructor: "معلم",
  };

  const roleBadge: Record<string, string> = {
    owner: "bg-purple-100 text-purple-700",
    admin: "bg-blue-100 text-blue-700",
    instructor: "bg-green-100 text-green-700",
  };

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
              <Link href="/instructor" className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 text-gray-700">
                لوحتي
              </Link>
              <Link href="/instructor/courses" className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 text-gray-700">
                دوراتي
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700 font-medium">{session.user.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge[session.user.role] ?? "bg-gray-100 text-gray-600"}`}>
              {roleLabel[session.user.role] ?? session.user.role}
            </span>
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
