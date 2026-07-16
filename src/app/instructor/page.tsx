import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function InstructorDashboard() {
  const session = await auth();
  if (!session || !["instructor","admin","owner"].includes(session.user.role)) redirect("/login");

  const where = session.user.role === "instructor" ? { instructorId: session.user.id } : {};

  const [courses, enrollmentStats] = await Promise.all([
    prisma.course.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { enrollments: true } },
        ratings: { select: { rating: true } },
        enrollments: { where: { status: "pending" }, select: { id: true } },
      },
    }),
    prisma.enrollment.count({
      where: {
        status: "pending",
        course: where,
      },
    }),
  ]);

  const totalStudents = courses.reduce((s, c) => s + c._count.enrollments, 0);
  const pendingRequests = courses.reduce((s, c) => s + c.enrollments.length, 0);

  const allRatings = courses.flatMap((c) => c.ratings.map((r) => r.rating));
  const avgRating = allRatings.length > 0
    ? (allRatings.reduce((s, r) => s + r, 0) / allRatings.length).toFixed(1)
    : "—";

  return (
    <div dir="rtl">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-[#1a2e5a] to-[#2d4a8a] rounded-2xl p-6 text-white mb-6">
        <h1 className="text-2xl font-bold">مرحباً، {session.user.name} 👋</h1>
        <p className="text-white/70 mt-1">لوحة التحكم الخاصة بك كمعلم</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "عدد الدورات", value: courses.length, icon: "📚", color: "bg-blue-50 text-blue-700" },
          { label: "إجمالي الطلاب", value: totalStudents, icon: "👥", color: "bg-green-50 text-green-700" },
          { label: "متوسط التقييم", value: avgRating, icon: "⭐", color: "bg-yellow-50 text-yellow-700" },
          { label: "الطلبات المعلقة", value: pendingRequests, icon: "⏳", color: "bg-orange-50 text-orange-700" },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} rounded-2xl p-5`}>
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm font-medium mt-1 opacity-80">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Courses List */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#1a2e5a]">دوراتي</h2>
        <Link href="/instructor/courses/new"
          className="bg-[#1a2e5a] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#22397a]">
          + دورة جديدة
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <p className="text-gray-400 text-4xl mb-3">📚</p>
          <p className="text-gray-500 font-medium mb-2">لم تنشئ أي دورة بعد</p>
          <Link href="/instructor/courses/new"
            className="text-[#c4a052] hover:underline text-sm">
            ابدأ بإنشاء دورتك الأولى
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => {
            const pending = course.enrollments.length;
            return (
              <div key={course.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{course.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${course.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {course.isPublished ? "منشور" : "مسودة"}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>👥 {course._count.enrollments} طالب</span>
                    {pending > 0 && <span className="text-orange-600 font-medium">⏳ {pending} طلب معلق</span>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link href={`/instructor/courses/${course.id}/enrollments`}
                    className="text-xs bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-xl hover:bg-yellow-100">
                    الطلبات
                  </Link>
                  <Link href={`/instructor/courses/${course.id}/stats`}
                    className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl hover:bg-blue-100">
                    الإحصائيات
                  </Link>
                  <Link href={`/instructor/courses/${course.id}`}
                    className="text-xs bg-[#c4a052] text-white px-3 py-1.5 rounded-xl hover:bg-[#b38e3f]">
                    إدارة
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
