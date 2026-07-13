"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Progress = { completed: boolean; watchedSeconds: number };
type Lesson = { id: string; title: string; type: string; order: number; isRequired: boolean; progress: Progress[] };
type Quiz = { id: string; title: string; passingScore: number };
type Unit = { id: string; title: string; order: number; lessons: Lesson[]; quiz: Quiz | null };
type Course = {
  id: string;
  title: string;
  description: string | null;
  units: Unit[];
  enrollments: { id: string }[];
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
    // auto-expand all units
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
    if (data.lessonId) {
      router.push(`/courses/${id}/learn/${data.lessonId}`);
    }
  };

  if (loading) return <div dir="rtl" className="min-h-screen flex items-center justify-center text-gray-400">جارٍ التحميل...</div>;
  if (!course) return null;

  const enrolled = course.enrollments.length > 0;
  const sortedUnits = [...course.units].sort((a, b) => a.order - b.order);

  const unitProgress = (unit: Unit) => {
    const lessons = unit.lessons;
    const done = lessons.filter((l) => l.progress[0]?.completed).length;
    return { done, total: lessons.length };
  };

  const lessonIcon = (lesson: Lesson) => {
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
          <Link href="/courses" className="text-white/60 text-sm hover:text-white mb-4 inline-block">
            ← الدورات
          </Link>
          <h1 className="text-3xl font-bold mb-3">{course.title}</h1>
          {course.description && <p className="text-white/80 text-lg">{course.description}</p>}
          <div className="mt-6 flex gap-4 text-sm text-white/70">
            <span>📚 {sortedUnits.length} وحدة</span>
            <span>🎬 {sortedUnits.reduce((s, u) => s + u.lessons.length, 0)} درس</span>
          </div>

          <div className="mt-6">
            {enrolled ? (
              <button
                onClick={getNextLesson}
                className="bg-[#c4a052] hover:bg-[#b38e3f] text-white px-8 py-3 rounded-xl font-bold text-lg"
              >
                متابعة التعلم ←
              </button>
            ) : (
              <button
                onClick={enroll}
                disabled={enrolling}
                className="bg-white text-[#1a2e5a] hover:bg-gray-100 px-8 py-3 rounded-xl font-bold text-lg disabled:opacity-50"
              >
                {enrolling ? "جارٍ التسجيل..." : "التسجيل في الدورة"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <h2 className="text-xl font-bold text-[#1a2e5a]">محتوى الدورة</h2>

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
                  {enrolled && total > 0 && (
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
                    const isDone = lesson.progress[0]?.completed;
                    return (
                      <div key={lesson.id} className={`flex items-center gap-3 px-4 py-3 ${enrolled ? "hover:bg-gray-50" : ""}`}>
                        <span className="text-lg w-6 text-center">{lessonIcon(lesson)}</span>
                        <span className={`flex-1 text-sm ${isDone ? "text-gray-500 line-through" : "text-gray-800"}`}>
                          {lesson.title}
                        </span>
                        <span className="text-xs text-gray-400">
                          {lesson.type === "video" ? "فيديو" : lesson.type === "pdf" ? "PDF" : "نص"}
                        </span>
                        {enrolled && (
                          <Link
                            href={`/courses/${id}/learn/${lesson.id}`}
                            className="text-xs text-[#1a2e5a] hover:underline"
                          >
                            {isDone ? "إعادة" : "بدء"}
                          </Link>
                        )}
                      </div>
                    );
                  })}
                  {unit.quiz && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-amber-50">
                      <span className="text-lg">📝</span>
                      <span className="flex-1 text-sm text-amber-800 font-medium">{unit.quiz.title}</span>
                      {enrolled && (
                        <Link
                          href={`/courses/${id}/quiz/${unit.quiz.id}`}
                          className="text-xs text-amber-700 hover:underline"
                        >
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
