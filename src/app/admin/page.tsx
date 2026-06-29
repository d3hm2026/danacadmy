import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboard() {
  const [exams, students, sessions] = await Promise.all([
    prisma.exam.count(),
    prisma.user.count({ where: { role: "student" } }),
    prisma.examSession.count({ where: { finishedAt: { not: null } } }),
  ]);

  const recentSessions = await prisma.examSession.findMany({
    where: { finishedAt: { not: null } },
    orderBy: { finishedAt: "desc" },
    take: 10,
    include: {
      user: { select: { name: true, phone: true } },
      exam: { select: { title: true, totalScore: true } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">لوحة التحكم</h1>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "الاختبارات", value: exams, color: "purple" },
          { label: "الطلاب", value: students, color: "teal" },
          { label: "اختبارات مكتملة", value: sessions, color: "amber" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-medium text-gray-900">آخر النتائج</h2>
        </div>
        {recentSessions.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">لا توجد نتائج بعد</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentSessions.map((s) => (
              <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {s.user.name || s.user.phone}
                  </p>
                  <p className="text-xs text-gray-400">{s.exam.title}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-purple-700">
                    {s.totalScore?.toFixed(1)} / {s.exam.totalScore}
                  </span>
                  <Link
                    href={`/admin/results/${s.id}`}
                    className="text-xs text-purple-600 hover:underline"
                  >
                    تفاصيل
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
