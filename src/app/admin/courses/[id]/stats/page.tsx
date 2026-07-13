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

export default function CourseStatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/courses/${id}/stats`)
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); });
  }, [id]);

  if (loading) return <div className="text-center py-20 text-gray-400" dir="rtl">جاري تحميل الإحصائيات...</div>;
  if (!stats) return null;

  return (
    <div dir="rtl" className="space-y-6">
      {/* Nav */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href={`/admin/courses/${id}`} className="text-sm text-gray-500 hover:text-gray-700">← إدارة الدورة</Link>
        <span className="text-gray-300">|</span>
        <Link href={`/admin/courses/${id}/enrollments`} className="text-sm text-gray-500 hover:text-gray-700">طلبات الانتساب</Link>
        <Link href={`/admin/courses/${id}/stats`} className="text-sm font-semibold text-[#1a2e5a] border-b-2 border-[#1a2e5a] pb-0.5">الإحصائيات</Link>
      </div>

      <h1 className="text-xl font-bold text-gray-900">قياس الأثر التعليمي</h1>

      {/* KPI Cards */}
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

      {/* Student Progress Table */}
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
                <div className="text-xs text-gray-400 hidden md:block">
                  {s.completedLessons}/{s.totalLessons} درس
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lesson Completion */}
      {stats.lessonStats.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">معدل إتمام الدروس</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.lessonStats.map((l) => (
              <div key={l.lessonId} className="px-6 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{l.lessonTitle}</p>
                  <p className="text-xs text-gray-400">{l.unitTitle} · {l.type === "video" ? "فيديو" : l.type === "pdf" ? "ملف PDF" : "نص"}</p>
                </div>
                <div className="w-28 hidden sm:block">
                  <ProgressBar value={l.completionRate}
                    color={l.completionRate >= 80 ? "bg-green-500" : l.completionRate >= 50 ? "bg-[#c4a052]" : "bg-red-400"} />
                </div>
                <span className={`text-sm font-bold w-12 text-center ${
                  l.completionRate >= 80 ? "text-green-600" : l.completionRate >= 50 ? "text-yellow-600" : "text-red-500"
                }`}>
                  {l.completionRate}%
                </span>
                {l.type === "video" && l.avgWatchedSeconds > 0 && (
                  <span className="text-xs text-gray-400 hidden md:block">
                    متوسط المشاهدة: {Math.floor(l.avgWatchedSeconds / 60)}د
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quiz Stats */}
      {stats.quizStats.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">نتائج الاختبارات القصيرة</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.quizStats.map((q) => (
              <div key={q.quizId} className="px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{q.quizTitle}</p>
                    <p className="text-xs text-gray-400">{q.unitTitle} · درجة النجاح: {q.passingScore}%</p>
                  </div>
                  <div className="text-left" style={{ direction: "ltr" }}>
                    <p className="text-lg font-bold text-gray-900">{q.passRate}%</p>
                    <p className="text-xs text-gray-400">نسبة النجاح</p>
                  </div>
                </div>
                <div className="flex gap-6 text-sm text-gray-500 mt-1">
                  <span>📝 {q.totalAttempts} محاولة</span>
                  <span>📈 متوسط الدرجات: {q.avgScore}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
