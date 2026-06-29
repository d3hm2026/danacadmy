import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function StudentPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "admin") redirect("/admin");

  const assignments = await prisma.examStudent.findMany({
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
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-teal-50 p-4" dir="rtl">
      <div className="max-w-lg mx-auto pt-8 space-y-5">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 rounded-xl mb-3">
            <span className="text-white text-xl font-bold">د</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            مرحباً {session.user.name || session.user.phone}
          </h1>
          <p className="text-sm text-gray-500 mt-1">اختباراتك المتاحة</p>
        </div>

        {assignments.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-gray-400">لا توجد اختبارات مخصصة لك حالياً</p>
          </div>
        )}

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

        <form action="/api/auth/signout" method="POST" className="text-center">
          <button className="text-sm text-gray-400 hover:text-gray-600">خروج</button>
        </form>
      </div>
    </div>
  );
}
