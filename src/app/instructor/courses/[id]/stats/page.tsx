"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";

type LessonStat = {
  lessonId: string; lessonTitle: string; unitTitle: string;
  type: string; completedCount: number; totalStudents: number;
  completionRate: number; avgWatchedSeconds: number;
};
type QuizStat = {
  quizId: string; quizTitle: string; unitTitle: string;
  passingScore: number; totalAttempts: number; passRate: number; avgScore: number;
};
type StudentProgress = {
  userId: string; name: string | null; phone: string;
  completedLessons: number; totalLessons: number; progressPct: number;
};
type Stats = {
  totalStudents: number; pendingCount: number;
  avgCompletion: number; fullyCompleted: number; totalLessons: number;
  lessonStats: LessonStat[]; quizStats: QuizStat[];
  studentProgress: StudentProgress[];
};

function ProgressBar({ value, color = "bg-[#1a2e5a]" }: { value: number; color?: string }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${value}%` }} />
    </div>
  );
}

export default function InstructorCourseStatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/instructor/courses/${id}/stats`)
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); });
  }, [id]);

  if (loading) return <div className="text-center py-20 text-gray-400" dir="rtl">جاري تحميل الإحصائيات...</div>;
  if (!stats) return null;

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href={`/instructor/courses/${id}`} className="text-sm text-gray-500 hover:text-gray-700">← إدارة الدورة</Link>
        <span className="text-gray-300">|</span>
        <Link href={`/instructor/courses/${id}/enrollments`} className="text-sm text-gray-500 hover:text-gray-700">طلبات الانتساب</Link>
        <span className="text-sm font-semibold text-[#1a2e5a] border-b-2 border-[#1a2e5a] pb-0.5">الإحصائيات</span>
      </div>

      <h1 className="text-xl font-bold text-gray-900">قياس الأثر التعليمي</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الطلاب", value: stats.totalStudents, icon: "👥", color: "bg-blue-50 text-blue-700" },
          { label: "متوسط الإتمام", value: `${stats.avgCompletion}%`, icon: "📊", color: "bg-purple-50 text-purple-700" },
          { label: "أتموا الدورة", value: stats.fullyCompleted, icon: "🏆", color: "bg-green-50 text-green-700" },
          { label: "طلبات معلقة", value: stats.pendingCount, icon: "⏳", color: "bg-yellow-50 text-yellow-700" },
        ].map((kpi) => (
          <div key={kpi.label} className={`rounded-2xl p-5 ${kpi.color}`}>
            <div className="text-2xl mb-2">{kpi.icon}</div>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <div className="text-sm font-medium mt-1 opacity-80">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">تقدم الطلاب</h2>
        </div>
        {stats.studentProgress.length === 0 ? (
          <div className="p-10 text-center text-gray-400">لا يوجد طلاب مسجلون بعد</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {stats.studentProgress.map((s) => (
              <div key={s.userId} className="px-6 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{s.name || "—"}</p>
                  <p className="text-sm text-gray-400">{s.phone}</p>
                </div>
                <div className="w-32 hidden sm:block">
                  <ProgressBar value={s.progressPct} color={s.progressPct === 100 ? "bg-green-500" : "bg-[#1a2e5a]"} />
                </div>
                <div className="text-sm font-bold w-16 text-left" style={{ direction: "ltr" }}>
                  <span className={s.progressPct === 100 ? "text-green-600" : "text-gray-700"}>
                    {s.progressPct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
