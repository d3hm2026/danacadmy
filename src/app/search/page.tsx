"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type CourseResult = { id: string; title: string; description: string | null };
type LessonResult = {
  id: string;
  title: string;
  type: string;
  unit: { courseId: string; course: { title: string } };
};

const typeLabel: Record<string, string> = {
  video: "فيديو",
  pdf: "PDF",
  text: "نص",
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [courses, setCourses] = useState<CourseResult[]>([]);
  const [lessons, setLessons] = useState<LessonResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const router = useRouter();

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setCourses([]); setLessons([]); setSearched(false); return; }
    setLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
    const data = await res.json();
    setCourses(data.courses ?? []);
    setLessons(data.lessons ?? []);
    setLoading(false);
    setSearched(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(query);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1a2e5a] text-white py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => router.back()} className="text-white/60 text-sm hover:text-white mb-4 block">
            ← رجوع
          </button>
          <h1 className="text-2xl font-bold mb-5">البحث في المحتوى</h1>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); if (e.target.value.length >= 2) search(e.target.value); }}
              placeholder="ابحث عن دورة أو درس..."
              className="flex-1 px-4 py-3 rounded-xl text-gray-900 text-base outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="bg-[#c4a052] px-6 py-3 rounded-xl font-medium hover:bg-[#b38e3f] transition-colors"
            >
              بحث
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {loading && (
          <p className="text-center text-gray-400">جارٍ البحث...</p>
        )}

        {!loading && searched && courses.length === 0 && lessons.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-500">لا توجد نتائج لـ &quot;{query}&quot;</p>
          </div>
        )}

        {/* Courses results */}
        {courses.length > 0 && (
          <section>
            <h2 className="font-bold text-[#1a2e5a] mb-3 flex items-center gap-2">
              <span>📚</span> الدورات ({courses.length})
            </h2>
            <div className="space-y-2">
              {courses.map((c) => (
                <Link
                  key={c.id}
                  href={`/courses/${c.id}`}
                  className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-[#c4a052] hover:shadow-sm transition-all block"
                >
                  <h3 className="font-semibold text-gray-900">{c.title}</h3>
                  {c.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{c.description}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Lessons results */}
        {lessons.length > 0 && (
          <section>
            <h2 className="font-bold text-[#1a2e5a] mb-3 flex items-center gap-2">
              <span>🎬</span> الدروس ({lessons.length})
            </h2>
            <div className="space-y-2">
              {lessons.map((l) => (
                <Link
                  key={l.id}
                  href={`/courses/${l.unit.courseId}/learn/${l.id}`}
                  className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-[#c4a052] hover:shadow-sm transition-all flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">{l.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{l.unit.course.title}</p>
                  </div>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-lg text-gray-600">
                    {typeLabel[l.type] ?? l.type}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
