import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function StudentPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "admin") redirect("/admin");

  const [assignments, enrollments] = await Promise.all([
    prisma.examStudent.findMany({
      where: { userId: session.user.id },
      include: {
        exam: {
          include: {
            sections: { select: { id: true } },
            sessions: {
              where: { userId: session.user.id },
              select: { id: true, finishedAt: true, totalScore: true },
            },
          },
        },
      },
    }),
    prisma.enrollment.findMany({
      where: { userId: session.user.id },
      include: {
        course: {
          include: {
            units: {
              include: {
                lessons: {
                  include: {
                    progress: { where: { userId: session.user.id } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    }),
  ]);

  const getCourseProgress = (course: typeof enrollments[0]["course"]) => {
    let total = 0;
    let done = 0;
    for (const unit of course.units) {
      for (const lesson of unit.lessons) {
        total++;
        if (lesson.progress[0]?.completed) done++;
      }
    }
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-lg mx-auto pt-8 space-y-6">
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#1a2e5a] rounded-2xl mb-3">
            <span className="text-white text-2xl font-bold">د</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            مرحباً {session.user.name || session.user.phone}
          </h1>
          <p className="text-sm text-gray-500 mt-1">لوحة التعلم</p>
        </div>

        {/* Courses Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[#1a2e5a]">دوراتي التدريبية</h2>
            <Link href="/courses" className="text-sm text-[#c4a052] hover:underline">
              استكشاف الدورات
            </Link>
          </div>

          {enrollments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <p className="text-gray-400 mb-3">لم تسجل في أي دورة بعد</p>
              <Link
                href="/courses"
                className="bg-[#1a2e5a] text-white px-5 py-2 rounded-xl text-sm font-medium inline-block"
              >
                استكشاف الدورات
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {enrollments.map(({ course }) => {
                const prog = getCourseProgress(course);
                return (
                  <div key={course.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{course.title}</h3>
                      <span className="text-xs text-[#c4a052] font-bold">{prog.pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full mb-3">
                      <div
                        className="h-full bg-[#c4a052] rounded-full transition-all"
                        style={{ width: `${prog.pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{prog.done} / {prog.total} درس مكتمل</span>
                      <Link
                        href={`/courses/${course.id}`}
                        className="bg-[#1a2e5a] text-white text-xs px-4 py-1.5 rounded-xl hover:bg-[#22397a]"
                      >
                        متابعة التعلم
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Exams Section */}
        <section>
          <h2 className="font-bold text-[#1a2e5a] mb-3">اختباراتي</h2>

          {assignments.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <p className="text-gray-400">لا توجد اختبارات مخصصة لك حالياً</p>
            </div>
          )}

          <div className="space-y-3">
            {assignments.map(({ exam }) => {
              const done = exam.sessions.find((s) => s.finishedAt);
              const inProgress = exam.sessions.find((s) => !s.finishedAt);
              const canStart = exam.isActive && !done;

              return (
                <div key={exam.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="font-semibold text-gray-900">{exam.title}</h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {exam.sections.length} قسم · الدرجة الكاملة: {exam.totalScore}
                      </p>
                    </div>
                    {done && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                        مكتمل
                      </span>
                    )}
                    {!done && !exam.isActive && (
                      <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">
                        غير مفعّل
                      </span>
                    )}
                  </div>

                  {done && (
                    <div className="bg-purple-50 rounded-xl p-3 mb-3">
                      <p className="text-sm text-purple-800">
                        درجتك: <span className="font-bold text-lg">{done.totalScore?.toFixed(1)}</span> / {exam.totalScore}
                      </p>
                    </div>
                  )}

                  {canStart && (
                    <Link
                      href={`/exam/${exam.id}`}
                      className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-xl text-sm"
                    >
                      {inProgress ? "متابعة الاختبار" : "بدء الاختبار"}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <form action="/api/auth/signout" method="POST" className="text-center pb-4">
          <button className="text-sm text-gray-400 hover:text-gray-600">خروج</button>
        </form>
      </div>
    </div>
  );
}
