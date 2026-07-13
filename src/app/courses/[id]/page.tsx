"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Progress = { completed: boolean; watchedSeconds: number };
type Lesson = { id: string; title: string; type: string; order: number; isRequired: boolean; progress: Progress[] };
type Quiz = { id: string; title: string; passingScore: number };
type Unit = { id: string; title: string; order: number; lessons: Lesson[]; quiz: Quiz | null };
type Enrollment = { id: string; status: string };
type Course = {
  id: string;
  title: string;
  description: string | null;
  units: Unit[];
  enrollments: Enrollment[];
};

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

  const fetchCourse = async () => {
    const res = await fetch(`/api/courses/${id}`);
    if (!res.ok) { router.push("/courses"); return; }
    const data = await res.json();
    setCourse(data);
    setExpandedUnits(new Set(data.units.map((u: Unit) => u.id)));
    setLoading(false);
  };

  useEffect(() => { fetchCourse(); }, [id]);

  const enroll = async () => {
    setEnrolling(true);
    await fetch(`/api/courses/${id}/enroll`, { method: "POST" });
    await fetchCourse();
    setEnrolling(false);
  };

  const getNextLesson = async () => {
    const res = await fetch(`/api/courses/${id}/next-lesson`);
    const data = await res.json();
    if (data.lessonId) router.push(`/courses/${id}/learn/${data.lessonId}`);
  };

  if (loading) return <div dir="rtl" className="min-h-screen flex items-center justify-center text-gray-400">جارٍ التحميل...</div>;
  if (!course) return null;

  const enrollment = course.enrollments[0] ?? null;
  const enrollStatus = enrollment?.status ?? null;
  const isApproved = enrollStatus === "approved";
  const sortedUnits = [...course.units].sort((a, b) => a.order - b.order);

  const unitProgress = (unit: Unit) => {
    const done = unit.lessons.filter((l) => l.progress[0]?.completed).length;
    return { done, total: unit.lessons.length };
  };

  const lessonIcon = (lesson: Lesson) => {
    if (!isApproved) return "🔒";
    if (lesson.progress[0]?.completed) return "✅";
    if (lesson.type === "video") return "🎬";
    if (lesson.type === "pdf") return "📄";
    return "📝";
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1a2e5a] to-[#2d4a8a] text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/courses" className="text-white/60 text-sm hover:text-white mb-4 inline-block">← الدورات</Link>
          <h1 className="text-3xl font-bold mb-3">{course.title}</h1>
          {course.description && <p className="text-white/80 text-lg">{course.description}</p>}
          <div className="mt-6 flex gap-4 text-sm text-white/70">
            <span>📚 {sortedUnits.length} وحدة</span>
            <span>🎬 {sortedUnits.reduce((s, u) => s + u.lessons.length, 0)} درس</span>
          </div>

          <div className="mt-6">
            {/* Not enrolled yet */}
            {!enrollStatus && (
              <button onClick={enroll} disabled={enrolling}
                className="bg-white text-[#1a2e5a] hover:bg-gray-100 px-8 py-3 rounded-xl font-bold text-lg disabled:opacity-50">
                {enrolling ? "جارٍ الإرسال..." : "طلب الانتساب للدورة"}
              </button>
            )}

            {/* Pending */}
            {enrollStatus === "pending" && (
              <div className="inline-flex items-center gap-3 bg-yellow-400/20 border border-yellow-300/40 px-6 py-3 rounded-xl">
                <span className="text-xl">⏳</span>
                <div>
                  <p className="font-bold text-white">طلبك قيد المراجعة</p>
                  <p className="text-white/70 text-sm">سيتم تفعيل حسابك بعد موافقة المسؤول</p>
                </div>
              </div>
            )}

            {/* Rejected */}
            {enrollStatus === "rejected" && (
              <div className="inline-flex items-center gap-3 bg-red-400/20 border border-red-300/40 px-6 py-3 rounded-xl">
                <span className="text-xl">❌</span>
                <div>
                  <p className="font-bold text-white">تم رفض طلبك</p>
                  <p className="text-white/70 text-sm">يرجى التواصل مع الإدارة لمزيد من المعلومات</p>
                </div>
              </div>
            )}

            {/* Approved */}
            {enrollStatus === "approved" && (
              <button onClick={getNextLesson}
                className="bg-[#c4a052] hover:bg-[#b38e3f] text-white px-8 py-3 rounded-xl font-bold text-lg">
                متابعة التعلم ←
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <h2 className="text-xl font-bold text-[#1a2e5a]">محتوى الدورة</h2>

        {/* Locked banner for non-approved */}
        {!isApproved && enrollStatus !== null && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center text-amber-700 text-sm font-medium">
            🔒 محتوى الدورة متاح فقط بعد موافقة المسؤول على طلب انتسابك
          </div>
        )}
        {!enrollStatus && (
          <div className="bg-gray-100 border border-gray-200 rounded-2xl p-4 text-center text-gray-500 text-sm">
            🔒 سجّل في الدورة للوصول إلى المحتوى
          </div>
        )}

        {sortedUnits.map((unit, idx) => {
          const { done, total } = unitProgress(unit);
          const isExpanded = expandedUnits.has(unit.id);

          return (
            <div key={unit.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <button
                onClick={() => setExpandedUnits((prev) => {
                  const n = new Set(prev);
                  n.has(unit.id) ? n.delete(unit.id) : n.add(unit.id);
                  return n;
                })}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 text-right">
                  <span className="w-8 h-8 rounded-full bg-[#1a2e5a]/10 text-[#1a2e5a] text-sm font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">{unit.title}</p>
                    <p className="text-xs text-gray-400">{total} درس{unit.quiz ? " · اختبار" : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isApproved && total > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#c4a052] rounded-full" style={{ width: `${(done / total) * 100}%` }} />
                      </div>
                      <span className="text-xs text-gray-400">{done}/{total}</span>
                    </div>
                  )}
                  <span className="text-gray-400">{isExpanded ? "▾" : "▸"}</span>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-50 divide-y divide-gray-50">
                  {[...unit.lessons].sort((a, b) => a.order - b.order).map((lesson) => {
                    const isDone = isApproved && lesson.progress[0]?.completed;
                    return (
                      <div key={lesson.id}
                        className={`flex items-center gap-3 px-4 py-3 ${isApproved ? "hover:bg-gray-50" : "opacity-60"}`}>
                        <span className="text-lg w-6 text-center">{lessonIcon(lesson)}</span>
                        <span className={`flex-1 text-sm ${isDone ? "text-gray-400 line-through" : "text-gray-800"}`}>
                          {lesson.title}
                        </span>
                        <span className="text-xs text-gray-400">
                          {lesson.type === "video" ? "فيديو" : lesson.type === "pdf" ? "PDF" : "نص"}
                        </span>
                        {isApproved && (
                          <Link href={`/courses/${id}/learn/${lesson.id}`}
                            className="text-xs text-[#1a2e5a] font-medium hover:underline">
                            {isDone ? "إعادة" : "بدء"}
                          </Link>
                        )}
                      </div>
                    );
                  })}
                  {unit.quiz && (
                    <div className={`flex items-center gap-3 px-4 py-3 ${isApproved ? "bg-amber-50" : "bg-gray-50 opacity-60"}`}>
                      <span className="text-lg">{isApproved ? "📝" : "🔒"}</span>
                      <span className="flex-1 text-sm text-amber-800 font-medium">{unit.quiz.title}</span>
                      {isApproved && (
                        <Link href={`/courses/${id}/quiz/${unit.quiz.id}`} className="text-xs text-amber-700 hover:underline">
                          بدء الاختبار
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
