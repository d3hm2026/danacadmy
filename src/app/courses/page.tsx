import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function CoursesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { units: true, enrollments: true } },
      units: { include: { _count: { select: { lessons: true } } } },
      enrollments: { where: { userId: session.user.id }, select: { id: true } },
    },
  });

  const totalLessons = (c: typeof courses[0]) =>
    c.units.reduce((s, u) => s + u._count.lessons, 0);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1a2e5a]">الدورات التدريبية</h1>
            <p className="text-gray-500 mt-1">اكتشف الدورات وابدأ رحلة التعلم</p>
          </div>
          <Link href="/student" className="text-sm text-gray-500 hover:text-[#1a2e5a]">
            ← الرئيسية
          </Link>
        </div>

        {courses.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center text-gray-400">
            لا توجد دورات منشورة حالياً
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => {
            const enrolled = course.enrollments.length > 0;
            const lessonsCount = totalLessons(course);

            return (
              <div key={course.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {/* Thumbnail placeholder */}
                <div className="h-36 bg-gradient-to-br from-[#1a2e5a] to-[#2d4a8a] flex items-center justify-center">
                  {course.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-4xl font-bold opacity-30">
                      {course.title.charAt(0)}
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <h2 className="font-bold text-gray-900 text-lg leading-snug mb-1">{course.title}</h2>
                  {course.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{course.description}</p>
                  )}

                  <div className="flex gap-3 text-xs text-gray-400 mb-4">
                    <span>📚 {course._count.units} وحدة</span>
                    <span>🎬 {lessonsCount} درس</span>
                  </div>

                  {enrolled ? (
                    <Link
                      href={`/courses/${course.id}`}
                      className="block w-full text-center bg-[#c4a052] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#b38e3f]"
                    >
                      متابعة التعلم
                    </Link>
                  ) : (
                    <Link
                      href={`/courses/${course.id}`}
                      className="block w-full text-center bg-[#1a2e5a] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#22397a]"
                    >
                      عرض الدورة
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
