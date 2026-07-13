"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Choice = { id: string; text: string; isCorrect: boolean };
type QuizQuestion = { id: string; text: string; order: number; choices: Choice[] };
type Quiz = { id: string; title: string; passingScore: number; questions: QuizQuestion[] };
type Lesson = { id: string; title: string; type: string; order: number };
type Unit = { id: string; title: string; order: number; lessons: Lesson[]; quiz: Quiz | null };
type Course = { id: string; title: string; description: string | null; isPublished: boolean; units: Unit[] };

export default function CourseManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState("");
  const [descVal, setDescVal] = useState("");
  const [newUnitTitle, setNewUnitTitle] = useState("");
  const [addingUnit, setAddingUnit] = useState(false);
  const [newLessonTitles, setNewLessonTitles] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchCourse = async () => {
    const res = await fetch(`/api/admin/courses/${id}`);
    const data = await res.json();
    setCourse(data);
    setTitleVal(data.title);
    setDescVal(data.description ?? "");
    setLoading(false);
  };

  useEffect(() => { fetchCourse(); }, [id]);

  const saveInfo = async () => {
    setSaving(true);
    await fetch(`/api/admin/courses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: titleVal, description: descVal }),
    });
    setSaving(false);
    setEditingTitle(false);
    fetchCourse();
  };

  const togglePublish = async () => {
    await fetch(`/api/admin/courses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !course?.isPublished }),
    });
    fetchCourse();
  };

  const addUnit = async () => {
    if (!newUnitTitle.trim()) return;
    setAddingUnit(true);
    await fetch(`/api/admin/courses/${id}/units`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newUnitTitle.trim() }),
    });
    setNewUnitTitle("");
    setAddingUnit(false);
    fetchCourse();
  };

  const deleteUnit = async (unitId: string) => {
    if (!confirm("هل تريد حذف هذه الوحدة؟")) return;
    await fetch(`/api/admin/units/${unitId}`, { method: "DELETE" });
    fetchCourse();
  };

  const moveUnit = async (unitId: string, dir: "up" | "down") => {
    if (!course) return;
    const sorted = [...course.units].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((u) => u.id === unitId);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const a = sorted[idx];
    const b = sorted[swapIdx];
    await Promise.all([
      fetch(`/api/admin/units/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: b.order }) }),
      fetch(`/api/admin/units/${b.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: a.order }) }),
    ]);
    fetchCourse();
  };

  const addLesson = async (unitId: string) => {
    const t = newLessonTitles[unitId]?.trim();
    if (!t) return;
    await fetch(`/api/admin/units/${unitId}/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: t, type: "video" }),
    });
    setNewLessonTitles((prev) => ({ ...prev, [unitId]: "" }));
    fetchCourse();
  };

  const deleteLesson = async (lessonId: string) => {
    if (!confirm("هل تريد حذف هذا الدرس؟")) return;
    await fetch(`/api/admin/lessons/${lessonId}`, { method: "DELETE" });
    fetchCourse();
  };

  const deleteCourse = async () => {
    if (!confirm("هل تريد حذف هذه الدورة بالكامل؟")) return;
    await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
    router.push("/admin/courses");
  };

  const toggleUnit = (unitId: string) => {
    setExpandedUnits((prev) => {
      const n = new Set(prev);
      n.has(unitId) ? n.delete(unitId) : n.add(unitId);
      return n;
    });
  };

  if (loading) return <div dir="rtl" className="text-center py-16 text-gray-400">جارٍ التحميل...</div>;
  if (!course) return <div dir="rtl" className="text-center py-16 text-red-400">لم يتم العثور على الدورة</div>;

  const sortedUnits = [...course.units].sort((a, b) => a.order - b.order);

  const typeLabel = (t: string) => ({ video: "فيديو", pdf: "PDF", text: "نص" }[t] ?? t);

  return (
    <div dir="rtl" className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/courses" className="hover:text-[#1a2e5a]">الدورات</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium truncate">{course.title}</span>
      </div>

      {/* Course Info Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        {editingTitle ? (
          <div className="space-y-3">
            <input
              value={titleVal}
              onChange={(e) => setTitleVal(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]"
            />
            <textarea
              value={descVal}
              onChange={(e) => setDescVal(e.target.value)}
              rows={3}
              placeholder="الوصف..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] resize-none"
            />
            <div className="flex gap-2">
              <button onClick={saveInfo} disabled={saving} className="bg-[#1a2e5a] text-white px-4 py-2 rounded-xl text-sm disabled:opacity-50">
                {saving ? "حفظ..." : "حفظ"}
              </button>
              <button onClick={() => setEditingTitle(false)} className="border border-gray-200 px-4 py-2 rounded-xl text-sm text-gray-600">إلغاء</button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[#1a2e5a]">{course.title}</h1>
              {course.description && <p className="text-gray-500 mt-1 text-sm">{course.description}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setEditingTitle(true)}
                className="border border-gray-200 px-3 py-1.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                تعديل
              </button>
              <button
                onClick={togglePublish}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium ${course.isPublished ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
              >
                {course.isPublished ? "منشور ✓" : "نشر"}
              </button>
              <button onClick={deleteCourse} className="text-red-400 hover:text-red-600 text-sm px-2">حذف</button>
            </div>
          </div>
        )}
      </div>

      {/* Units */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-[#1a2e5a]">الوحدات ({sortedUnits.length})</h2>

        {sortedUnits.map((unit, idx) => (
          <div key={unit.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* Unit Header */}
            <div className="flex items-center gap-3 p-4">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveUnit(unit.id, "up")}
                  disabled={idx === 0}
                  className="text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs leading-none"
                >▲</button>
                <button
                  onClick={() => moveUnit(unit.id, "down")}
                  disabled={idx === sortedUnits.length - 1}
                  className="text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs leading-none"
                >▼</button>
              </div>
              <button
                onClick={() => toggleUnit(unit.id)}
                className="flex-1 text-right font-semibold text-gray-800 hover:text-[#1a2e5a]"
              >
                <span className="text-gray-400 text-sm ml-2">{idx + 1}.</span>
                {unit.title}
                <span className="text-xs text-gray-400 font-normal mr-2">
                  ({unit.lessons.length} درس{unit.quiz ? " · اختبار" : ""})
                </span>
              </button>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => toggleUnit(unit.id)}
                  className="text-gray-400 text-xs px-2"
                >
                  {expandedUnits.has(unit.id) ? "▾" : "▸"}
                </button>
                <button onClick={() => deleteUnit(unit.id)} className="text-red-300 hover:text-red-500 text-xs">حذف</button>
              </div>
            </div>

            {/* Unit Content */}
            {expandedUnits.has(unit.id) && (
              <div className="border-t border-gray-50 px-4 pb-4 pt-3 space-y-3">
                {/* Lessons list */}
                {unit.lessons.length > 0 && (
                  <div className="space-y-1.5">
                    {[...unit.lessons].sort((a, b) => a.order - b.order).map((lesson) => (
                      <div key={lesson.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
                        <span className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded-lg text-gray-500">
                          {typeLabel(lesson.type)}
                        </span>
                        <span className="flex-1 text-sm text-gray-800">{lesson.title}</span>
                        <Link
                          href={`/admin/courses/${id}/units/${unit.id}/lessons/${lesson.id}`}
                          className="text-xs text-[#1a2e5a] hover:underline"
                        >
                          تعديل
                        </Link>
                        <button onClick={() => deleteLesson(lesson.id)} className="text-red-300 hover:text-red-500 text-xs">×</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add lesson */}
                <div className="flex gap-2">
                  <input
                    value={newLessonTitles[unit.id] ?? ""}
                    onChange={(e) => setNewLessonTitles((p) => ({ ...p, [unit.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addLesson(unit.id)}
                    placeholder="عنوان الدرس الجديد..."
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]"
                  />
                  <button
                    onClick={() => addLesson(unit.id)}
                    className="bg-[#1a2e5a] text-white px-3 py-2 rounded-xl text-sm"
                  >
                    + درس
                  </button>
                </div>

                {/* Quiz */}
                <div className="flex items-center justify-between pt-1">
                  {unit.quiz ? (
                    <Link
                      href={`/admin/courses/${id}/units/${unit.id}/quiz`}
                      className="text-sm text-[#c4a052] hover:underline flex items-center gap-1"
                    >
                      📝 اختبار الوحدة: {unit.quiz.title}
                    </Link>
                  ) : (
                    <Link
                      href={`/admin/courses/${id}/units/${unit.id}/quiz`}
                      className="text-sm text-gray-400 hover:text-[#c4a052]"
                    >
                      + إضافة اختبار للوحدة
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add Unit */}
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-4">
          <div className="flex gap-2">
            <input
              value={newUnitTitle}
              onChange={(e) => setNewUnitTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addUnit()}
              placeholder="عنوان الوحدة الجديدة..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]"
            />
            <button
              onClick={addUnit}
              disabled={addingUnit}
              className="bg-[#c4a052] text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
            >
              {addingUnit ? "..." : "+ وحدة"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
