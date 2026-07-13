import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const BADGE_ICONS: Record<string, string> = {
  first_lesson: "🎓",
  first_course: "🏆",
  quiz_pass: "✅",
  perfect_score: "⭐",
  speed_learner: "⚡",
};

const BADGE_LABELS: Record<string, string> = {
  first_lesson: "أول درس",
  first_course: "أول دورة",
  quiz_pass: "اجتاز اختباراً",
  perfect_score: "علامة كاملة",
  speed_learner: "متعلم سريع",
};

export default async function StudentPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "admin") redirect("/admin");

  const [assignments, enrollments, userPoints, badges] = await Promise.all([
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
                  orderBy: { order: "asc" },
                },
              },
              orderBy: { order: "asc" },
            },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    }),
    prisma.userPoints.findUnique({ where: { userId: session.user.id } }),
    prisma.badge.findMany({ where: { userId: session.user.id } }),
  ]);

  const getCourseProgress = (course: (typeof enrollments)[0]["course"]) => {
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

  const getNextLesson = (course: (typeof enrollments)[0]["course"]) => {
    for (const unit of course.units) {
      for (const lesson of unit.lessons) {
        if (!lesson.progress[0]?.completed) return lesson.id;
      }
    }
    return null;
  };

  const statusBadge = (status: string) => {
    if (status === "approved") return <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">مقبول</span>;
    if (status === "rejected") return <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">مرفوض</span>;
    return <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">قيد الانتظار</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-lg mx-auto pt-6 space-y-6 pb-10">

        {/* Welcome banner */}
        <div className="bg-gradient-to-br from-[#1a2e5a] to-[#2d4a8a] rounded-2xl p-6 text-white">
          <h1 className="text-xl font-bold">
            مرحباً، {session.user.name || session.user.phone} 👋
          </h1>
          <p className="text-white/70 text-sm mt-1">لوحة التعلم الخاصة بك</p>

          <div className="flex items-center gap-4 mt-4">
            <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold text-[#c4a052]">{userPoints?.total ?? 0}</p>
              <p className="text-xs text-white/70">نقطة</p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold text-[#c4a052]">
                {enrollments.filter((e) => e.status === "approved").length}
              </p>
              <p className="text-xs text-white/70">دورة نشطة</p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold text-[#c4a052]">{badges.length}</p>
              <p className="text-xs text-white/70">شارة</p>
            </div>
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <section>
            <h2 className="font-bold text-[#1a2e5a] mb-3">شاراتي</h2>
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <div
                  key={b.id}
                  className="bg-white border border-gray-100 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm"
                  title={BADGE_LABELS[b.type] ?? b.type}
                >
                  <span className="text-xl">{BADGE_ICONS[b.type] ?? "🏅"}</span>
                  <span className="text-xs text-gray-700 font-medium">{BADGE_LABELS[b.type] ?? b.type}</span>
                </div>
              ))}
            </div>
          </section>
        )}

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
              {enrollments.map(({ course, status }) => {
                const prog = getCourseProgress(course);
                const nextLesson = status === "approved" ? getNextLesson(course) : null;
                const isComplete = status === "approved" && prog.total > 0 && prog.pct === 100;

                return (
                  <div key={course.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 flex-1 ml-2">{course.title}</h3>
                      {statusBadge(status)}
                    </div>

                    {status === "approved" && (
                      <>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#c4a052] rounded-full transition-all"
                              style={{ width: `${prog.pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-[#c4a052] font-bold w-10 text-left">{prog.pct}%</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-3">{prog.done} / {prog.total} درس مكتمل</p>
                      </>
                    )}

                    <div className="flex gap-2">
                      {status === "approved" && !isComplete && nextLesson && (
                        <Link
                          href={`/courses/${course.id}/learn/${nextLesson}`}
                          className="bg-[#1a2e5a] text-white text-xs px-4 py-2 rounded-xl hover:bg-[#22397a] font-medium"
                        >
                          متابعة ←
                        </Link>
                      )}
                      {status === "approved" && isComplete && (
                        <>
                          <Link
                            href={`/courses/${course.id}/certificate`}
                            className="bg-[#c4a052] text-white text-xs px-4 py-2 rounded-xl hover:bg-[#b38e3f] font-medium flex items-center gap-1"
                          >
                            🎓 الشهادة
                          </Link>
                          <Link
                            href={`/courses/${course.id}`}
                            className="bg-gray-100 text-gray-600 text-xs px-4 py-2 rounded-xl hover:bg-gray-200 font-medium"
                          >
                            الدورة
                          </Link>
                        </>
                      )}
                      {status !== "approved" && (
                        <Link
                          href={`/courses/${course.id}`}
                          className="bg-gray-100 text-gray-600 text-xs px-4 py-2 rounded-xl hover:bg-gray-200 font-medium"
                        >
                          عرض
                        </Link>
                      )}
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
          <button className="text-sm text-gray-400 hover:text-gray-600">تسجيل الخروج</button>
        </form>
      </div>
    </div>
  );
}
